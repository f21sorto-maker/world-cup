/**
 * Load .env.local / .env from repo root before any infra reads process.env.
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("../..", import.meta.url)));
config({ path: resolve(ROOT, ".env") });
config({ path: resolve(ROOT, ".env.local"), override: true });

export function envBootstrapStatus(): {
  root: string;
  hasDatabaseUrl: boolean;
  hasRedisUrl: boolean;
  enableWorkers: string | undefined;
} {
  return {
    root: ROOT,
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    hasRedisUrl: Boolean(process.env.REDIS_URL ?? process.env.UPSTASH_REDIS_URL),
    enableWorkers: process.env.ENABLE_WORKERS,
  };
}
