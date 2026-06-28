import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { requireAdminToken, verifyAdminAuth } from "./adminAuth";
import type { VercelRequest, VercelResponse } from "@vercel/node";

vi.mock("@clerk/backend", () => ({
  verifyToken: vi.fn(async (token: string) => {
    if (token === "valid-clerk-jwt") return { sub: "user_123" };
    throw new Error("invalid");
  }),
}));

function mockRes() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res as VercelResponse & { statusCode: number; body: unknown };
}

describe("requireAdminToken", () => {
  const original = process.env.DEV_ADMIN_TOKEN;
  const clerkOriginal = process.env.CLERK_SECRET_KEY;

  beforeEach(() => {
    process.env.DEV_ADMIN_TOKEN = "test-admin-token";
    delete process.env.CLERK_SECRET_KEY;
  });

  afterEach(() => {
    process.env.DEV_ADMIN_TOKEN = original;
    if (clerkOriginal) process.env.CLERK_SECRET_KEY = clerkOriginal;
    else delete process.env.CLERK_SECRET_KEY;
  });

  it("rejects requests without a token", () => {
    const req = { headers: {} } as VercelRequest;
    const res = mockRes();

    expect(requireAdminToken(req, res)).toBe(false);
    expect(res.statusCode).toBe(401);
  });

  it("accepts Bearer token", () => {
    const req = {
      headers: { authorization: "Bearer test-admin-token" },
    } as VercelRequest;
    const res = mockRes();

    expect(requireAdminToken(req, res)).toBe(true);
  });

  it("accepts x-admin-token header", () => {
    const req = {
      headers: { "x-admin-token": "test-admin-token" },
    } as VercelRequest;
    const res = mockRes();

    expect(requireAdminToken(req, res)).toBe(true);
  });

  it("returns 503 when DEV_ADMIN_TOKEN is unset", () => {
    delete process.env.DEV_ADMIN_TOKEN;
    const req = { headers: { authorization: "Bearer anything" } } as VercelRequest;
    const res = mockRes();

    expect(requireAdminToken(req, res)).toBe(false);
    expect(res.statusCode).toBe(503);
  });
});

describe("verifyAdminAuth", () => {
  const original = process.env.DEV_ADMIN_TOKEN;
  const clerkOriginal = process.env.CLERK_SECRET_KEY;

  afterEach(() => {
    process.env.DEV_ADMIN_TOKEN = original;
    if (clerkOriginal) process.env.CLERK_SECRET_KEY = clerkOriginal;
    else delete process.env.CLERK_SECRET_KEY;
  });

  it("accepts Clerk JWT when CLERK_SECRET_KEY is set", async () => {
    process.env.CLERK_SECRET_KEY = "sk_test";
    delete process.env.DEV_ADMIN_TOKEN;

    const result = await verifyAdminAuth({
      authorization: "Bearer valid-clerk-jwt",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.method).toBe("clerk");
      expect(result.userId).toBe("user_123");
    }
  });

  it("falls back to dev token when Clerk unset", async () => {
    delete process.env.CLERK_SECRET_KEY;
    process.env.DEV_ADMIN_TOKEN = "dev-only";

    const result = await verifyAdminAuth({
      authorization: "Bearer dev-only",
    });

    expect(result).toEqual({ ok: true, method: "dev_token" });
  });
});
