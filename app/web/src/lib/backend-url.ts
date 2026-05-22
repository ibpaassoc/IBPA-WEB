export function getServerBackendUrl() {
  const raw =
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "";

  return raw.replace(/\/+$/, "");
}
