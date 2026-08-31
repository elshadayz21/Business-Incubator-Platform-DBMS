/** Backend base URL — empty when admin is served from same Express host */
export const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

/** Login page path — Vercel SPA vs Express-hosted admin */
export const LOGIN_PATH = API_BASE ? "/" : "/v1/auth/login";

export function apiUrl(path) {
  if (!path.startsWith("/")) path = `/${path}`;
  return `${API_BASE}${path}`;
}

export function apiFetch(path, options = {}) {
  return fetch(apiUrl(path), {
    credentials: "include",
    ...options,
  });
}
