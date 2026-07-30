const defaultLandingOrigin =
  process.env.NODE_ENV === "production" ? "https://ibpassociations.org" : "http://localhost:3000";
const defaultDashboardOrigin =
  process.env.NODE_ENV === "production" ? "https://ibpassociations.org" : "http://localhost:3001";
const defaultBackendOrigin =
  process.env.NODE_ENV === "production" ? "https://ibpassociations.org" : "http://localhost:3003";

function requireEnvVar(name: string, fallback: string | null = null): string {
  const value = process.env[name];
  if (value?.trim()) return value.trim().replace(/\/+$/, "");
  if (fallback !== null) return fallback.replace(/\/+$/, "");
  if (process.env.NODE_ENV !== "production") {
    console.warn(`Environment variable ${name} is missing.`);
  }
  return "";
}

function joinOriginPath(origin: string, path: string) {
  if (!path) {
    return origin;
  }
  return `${origin}/${path.replace(/^\/+/, "")}`;
}

export function getLandingOrigin() {
  return requireEnvVar("NEXT_PUBLIC_SITE_URL", defaultLandingOrigin);
}

export function getBackendUrl(path = "") {
  const baseUrl = requireEnvVar("NEXT_PUBLIC_API_URL", requireEnvVar("NEXT_PUBLIC_BACKEND_URL", defaultBackendOrigin));
  return joinOriginPath(baseUrl, path);
}

export function getDashboardUrl(path = "") {
  const baseUrl = requireEnvVar("NEXT_PUBLIC_DASHBOARD_URL", defaultDashboardOrigin);
  return joinOriginPath(baseUrl, path);
}
