/**
 * Admin API client — attaches DEV_ADMIN_TOKEN for write routes in local dev.
 * Set VITE_DEV_ADMIN_TOKEN in apps/admin/.env.local (mirror DEV_ADMIN_TOKEN from root).
 */

const ADMIN_TOKEN = import.meta.env.VITE_DEV_ADMIN_TOKEN as string | undefined;

export function adminAuthHeaders(extra: HeadersInit = {}): HeadersInit {
  const headers = new Headers(extra);
  if (ADMIN_TOKEN) {
    headers.set("Authorization", `Bearer ${ADMIN_TOKEN}`);
    headers.set("x-admin-token", ADMIN_TOKEN);
  }
  return headers;
}

export async function adminFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const headers = adminAuthHeaders(init.headers);
  return fetch(input, { ...init, headers });
}

export function isAdminTokenConfigured(): boolean {
  return Boolean(ADMIN_TOKEN?.trim());
}
