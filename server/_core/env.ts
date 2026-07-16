export const ENV = {
  appId: process.env.VITE_APP_ID ?? "svp",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  adminPassword: process.env.ADMIN_PASSWORD ?? "",
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH ?? "",
  siteAccessPassword: process.env.SITE_ACCESS_PASSWORD ?? "",
  siteAccessPasswordHash: process.env.SITE_ACCESS_PASSWORD_HASH ?? "",
  isProduction: process.env.NODE_ENV === "production",
};

/** Throw at startup if required env vars are missing in production. */
export function validateEnv(): void {
  if (!ENV.isProduction) return;
  const missing: string[] = [];
  if (!ENV.cookieSecret) missing.push("JWT_SECRET");
  if (!ENV.databaseUrl) missing.push("DATABASE_URL");
  if (!ENV.adminPassword && !ENV.adminPasswordHash) missing.push("ADMIN_PASSWORD_HASH");
  if (!ENV.siteAccessPassword && !ENV.siteAccessPasswordHash) missing.push("SITE_ACCESS_PASSWORD_HASH");
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}
