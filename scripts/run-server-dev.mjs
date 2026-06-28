#!/usr/bin/env node
/**
 * Local dev server launcher — loads .env.local from repo root and applies
 * Docker Compose defaults (same pattern as smoke-stack.mjs).
 */

import { spawn } from "node:child_process";
import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envLocal = resolve(ROOT, ".env.local");
const envFile = resolve(ROOT, ".env");

config({ path: envFile });
config({ path: envLocal, override: true });

const workers = process.argv.includes("--workers");

const env = {
  ...process.env,
  DATABASE_URL:
    process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5432/world_cup_engine",
  REDIS_URL:
    process.env.REDIS_URL ??
    process.env.UPSTASH_REDIS_URL ??
    "redis://localhost:6379",
  ...(workers ? { ENABLE_WORKERS: "true" } : {}),
};

if (!existsSync(envLocal)) {
  console.warn(
    "[server] .env.local not found — using local Docker defaults.\n" +
      "  Run: cp .env.example .env.local\n"
  );
}

const tsxBin = resolve(ROOT, "node_modules/.bin/tsx");
const child = spawn(tsxBin, ["server/src/index.ts"], {
  cwd: ROOT,
  env,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.exit(128);
  }
  process.exit(code ?? 0);
});
