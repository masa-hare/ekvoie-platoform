import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { apiLimiter, adminLoginLimiter } from "../rateLimit";
import { verifyAdminPassword, ADMIN_OPEN_ID } from "../adminAuth";
import { sdk } from "./sdk";
import { getSessionCookieOptions } from "./cookies";
import { COOKIE_NAME } from "@shared/const";
import { validateEnv } from "./env";
import { addSseClient } from "../sse";
import { migrate } from "drizzle-orm/mysql2/migrator";
import { getDb } from "../db";
import path from "path";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  validateEnv();

  // Run DB migrations automatically on startup
  const db = await getDb();
  if (db) {
    try {
      const migrationsFolder = path.resolve(import.meta.dirname, "../drizzle");
      await migrate(db, { migrationsFolder });
      console.log("[DB] Migrations applied successfully");
    } catch (err) {
      console.error("[DB] Migration error (continuing):", err);
    }
  }

  const app = express();
  const server = createServer(app);

  app.set("trust proxy", 1);

  const isDevelopment = process.env.NODE_ENV === "development";

  app.use(
    helmet({
      contentSecurityPolicy: isDevelopment ? false : {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https:"],
          mediaSrc: ["'self'", "https:"],
          workerSrc: ["'self'"],
          childSrc: ["'self'"],
          frameAncestors: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: isDevelopment ? false : { policy: "credentialless" },
      crossOriginOpenerPolicy: isDevelopment ? false : { policy: "same-origin" },
      crossOriginResourcePolicy: isDevelopment ? false : { policy: "same-origin" },
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      xContentTypeOptions: true,
      xDnsPrefetchControl: { allow: false },
      xDownloadOptions: true,
      xFrameOptions: isDevelopment ? false : { action: "sameorigin" },
      xPermittedCrossDomainPolicies: { permittedPolicies: "none" },
      xXssProtection: true,
    })
  );

  app.use(cookieParser());
  app.use(express.json({ limit: "50kb" }));
  app.use(express.urlencoded({ limit: "50kb", extended: true }));

  // Admin login endpoint — password-based, no personal info required
  app.post("/api/admin/login", adminLoginLimiter, async (req, res) => {
    const { password } = req.body ?? {};
    if (!password || typeof password !== "string") {
      res.status(400).json({ error: "Password required" });
      return;
    }

    if (!verifyAdminPassword(password)) {
      // Delay response to slow brute-force attempts
      await new Promise(r => setTimeout(r, 500));
      res.status(401).json({ error: "Invalid password" });
      return;
    }

    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const sessionToken = await sdk.createSessionToken(ADMIN_OPEN_ID, {
      name: "Administrator",
      expiresInMs: SEVEN_DAYS_MS,
    });

    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: SEVEN_DAYS_MS });
    res.json({ success: true });
  });

  // Admin logout
  app.post("/api/admin/logout", (req, res) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.json({ success: true });
  });

  // SSE endpoint — real-time opinion change notifications for user views
  app.get("/api/events", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // disable nginx buffering
    res.flushHeaders();

    res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);
    addSseClient(res);

    // Heartbeat every 25 seconds to prevent proxy timeouts
    const heartbeat = setInterval(() => {
      res.write(": heartbeat\n\n");
    }, 25_000);
    res.on("close", () => clearInterval(heartbeat));
  });

  // tRPC API
  app.use(
    "/api/trpc",
    apiLimiter,
    createExpressMiddleware({
      router: appRouter,
      createContext,
      onError: ({ path, error }) => {
        console.error(`[tRPC] ${path}:`, error.message, error.cause);
      },
    })
  );

  if (isDevelopment) {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
