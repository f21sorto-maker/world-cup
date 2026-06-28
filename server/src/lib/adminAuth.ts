/**
 * Admin auth — Clerk JWT when configured, DEV_ADMIN_TOKEN fallback for local dev.
 */

import { verifyToken } from "@clerk/backend";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export type AdminAuthResult =
  | { ok: true; method: "clerk" | "dev_token"; userId?: string }
  | { ok: false; status: number; error: string };

function extractBearerToken(req: VercelRequest): string | undefined {
  const header = req.headers.authorization;
  if (typeof header === "string" && header.startsWith("Bearer ")) {
    return header.slice("Bearer ".length);
  }
  return req.headers["x-admin-token"] as string | undefined;
}

/** Framework-agnostic admin verification. */
export async function verifyAdminAuth(headers: Headers | Record<string, string | string[] | undefined>): Promise<AdminAuthResult> {
  const get = (key: string): string | undefined => {
    if (headers instanceof Headers) {
      return headers.get(key) ?? undefined;
    }
    const value = headers[key] ?? headers[key.toLowerCase()];
    if (Array.isArray(value)) return value[0];
    return value;
  };

  const authHeader = get("authorization");
  const token =
    authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : get("x-admin-token");

  const clerkSecret = process.env.CLERK_SECRET_KEY;
  if (clerkSecret && token) {
    try {
      const payload = await verifyToken(token, { secretKey: clerkSecret });
      return { ok: true, method: "clerk", userId: payload.sub };
    } catch {
      return { ok: false, status: 401, error: "Unauthorized" };
    }
  }

  const expected = process.env.DEV_ADMIN_TOKEN;
  if (!expected) {
    return {
      ok: false,
      status: 503,
      error: "Admin writes disabled — set CLERK_SECRET_KEY or DEV_ADMIN_TOKEN",
    };
  }

  if (!token || token !== expected) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  return { ok: true, method: "dev_token" };
}

export async function requireAdminTokenAsync(
  req: VercelRequest,
  res: VercelResponse
): Promise<boolean> {
  const result = await verifyAdminAuth(req.headers as Record<string, string | string[] | undefined>);
  if (!result.ok) {
    res.status(result.status).json({ error: result.error });
    return false;
  }
  return true;
}

/** @deprecated Use requireAdminTokenAsync for Clerk support. */
export function requireAdminToken(req: VercelRequest, res: VercelResponse): boolean {
  const expected = process.env.DEV_ADMIN_TOKEN;
  if (!expected) {
    res.status(503).json({
      error: "Admin writes disabled — set DEV_ADMIN_TOKEN or CLERK_SECRET_KEY",
    });
    return false;
  }

  const token = extractBearerToken(req);
  if (!token || token !== expected) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }

  return true;
}

export async function requireAdminOrClerk(
  req: VercelRequest,
  res: VercelResponse
): Promise<boolean> {
  if (process.env.CLERK_SECRET_KEY) {
    return requireAdminTokenAsync(req, res);
  }
  return requireAdminToken(req, res);
}
