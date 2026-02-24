import type { CookieOptions, Request } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string) {
  // Basic IPv4 check and IPv6 presence detection.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

/**
 * Check if the request is from a cross-origin context (e.g., iframe embed)
 * In such cases, SameSite=None is required for cookies to work
 */
function isCrossOriginRequest(req: Request): boolean {
  const origin = req.headers.origin;
  const host = req.headers.host;
  
  // If there's an origin header and it doesn't match the host, it's cross-origin
  if (origin && host) {
    try {
      const originUrl = new URL(origin);
      return originUrl.host !== host;
    } catch {
      return false;
    }
  }
  
  // Check for Sec-Fetch-Site header (modern browsers)
  const secFetchSite = req.headers["sec-fetch-site"];
  if (secFetchSite === "cross-site" || secFetchSite === "same-site") {
    return true;
  }
  
  return false;
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  const isSecure = isSecureRequest(req);
  const isCrossOrigin = isCrossOriginRequest(req);
  
  // Use SameSite=None for cross-origin requests (iframe embeds, etc.)
  // Use SameSite=Lax for same-origin requests (better CSRF protection)
  // Note: SameSite=None requires Secure=true
  const sameSite: "lax" | "none" = isCrossOrigin && isSecure ? "none" : "lax";

  return {
    httpOnly: true,
    path: "/",
    sameSite,
    secure: isSecure,
  };
}

/**
 * Get cookie options specifically for anonymous user tracking
 * Uses Lax by default for CSRF protection, but allows None for cross-origin contexts
 */
export function getAnonymousCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure" | "maxAge"> {
  const baseOptions = getSessionCookieOptions(req);
  
  return {
    ...baseOptions,
    // 30日に短縮: 1年保持は追跡性が強く、学内用途で説明コストが上がるため、
    // 最低限のプライバシー改善として30日に設定。期限切れ後は新しい匿名IDが発行される。
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  };
}
