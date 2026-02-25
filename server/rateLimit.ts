import rateLimit from "express-rate-limit";
import type { Request } from "express";

/**
 * Generate a composite key from IP and anonymous cookie
 * This provides better rate limiting by combining both identifiers
 */
function getCompositeKey(req: Request): string {
  const cookies = (req as any).cookies || {};
  const anonymousId = cookies["anonymous_user_id"] || "";
  const ip = req.ip ?? req.socket?.remoteAddress ?? "unknown";
  return `${ip}:${anonymousId}`;
}

/**
 * Rate limiter for opinion submission
 * Limit: 1 submission per minute per anonymous user
 */
export const opinionSubmitLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1, // 1 request per window
  message: { error: "Too many submissions. Please wait 1 minute before submitting again." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getCompositeKey,
  validate: { xForwardedForHeader: false, keyGeneratorIpFallback: false },
});

/**
 * Rate limiter for voting
 * Limit: 6 votes per minute per anonymous user (10 seconds per vote)
 */
export const voteLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 6, // 6 requests per window (1 every 10 seconds)
  message: { error: "Too many votes. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getCompositeKey,
  validate: { xForwardedForHeader: false, keyGeneratorIpFallback: false },
});

/**
 * General API rate limiter
 * Limit: 100 requests per 15 minutes
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { error: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getCompositeKey,
  validate: { xForwardedForHeader: false, keyGeneratorIpFallback: false },
});

/**
 * Admin login rate limiter — strict: 10 attempts per 15 minutes per IP
 * Combined with 500ms per-attempt delay this makes brute-force impractical.
 */
export const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: "Too many login attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip ?? req.socket?.remoteAddress ?? "unknown",
  validate: { xForwardedForHeader: false, keyGeneratorIpFallback: false },
});
