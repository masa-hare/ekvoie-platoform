import { defineConfig } from "vitest/config";
import path from "path";

const templateRoot = path.resolve(import.meta.dirname);

export default defineConfig({
  root: templateRoot,
  resolve: {
    alias: {
      "@": path.resolve(templateRoot, "client", "src"),
      "@shared": path.resolve(templateRoot, "shared"),
      "@assets": path.resolve(templateRoot, "attached_assets"),
    },
  },
  test: {
    environment: "node",
    include: ["server/**/*.test.ts", "server/**/*.spec.ts", "shared/**/*.test.ts"],
    env: {
      NODE_ENV: "test",
      // Secrets used only inside the test process — not real credentials.
      JWT_SECRET: "vitest-secret-0123456789abcdef0123456789abcdef",
      ADMIN_PASSWORD: "vitest-admin-password",
      SITE_ACCESS_PASSWORD: "vitest-gate-password",
    },
  },
});
