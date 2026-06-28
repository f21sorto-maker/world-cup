/**
 * Admin API client — Clerk session token when configured, else DEV_ADMIN_TOKEN.
 */

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;
const ADMIN_TOKEN = import.meta.env.VITE_DEV_ADMIN_TOKEN as string | undefined;

let clerkGetToken: (() => Promise<string | null>) | null = null;

/** Register Clerk getToken from useAuth() in AdminShell. */
export function registerClerkTokenGetter(getToken: () => Promise<string | null>): void {
  clerkGetToken = getToken;
}

async function resolveAuthToken(): Promise<string | undefined> {
  if (clerkGetToken) {
    const token = await clerkGetToken();
    if (token) return token;
  }
  return ADMIN_TOKEN?.trim() || undefined;
}

export async function adminAuthHeaders(extra: HeadersInit = {}): Promise<HeadersInit> {
  const headers = new Headers(extra);
  const token = await resolveAuthToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
    headers.set("x-admin-token", token);
  }
  return headers;
}

export async function adminFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const headers = await adminAuthHeaders(init.headers);
  return fetch(input, { ...init, headers });
}

export function isAdminTokenConfigured(): boolean {
  return Boolean(CLERK_KEY?.trim() || ADMIN_TOKEN?.trim());
}

export function isClerkEnabled(): boolean {
  return Boolean(CLERK_KEY?.trim());
}
