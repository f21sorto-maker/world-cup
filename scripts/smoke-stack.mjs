#!/usr/bin/env node
/**
 * Full-stack smoke — Docker Postgres + Redis + server workers + HTTP probes.
 * Skips cleanly when Docker daemon is unavailable.
 */

import { spawn, execSync } from "node:child_process";
import { strict as assert } from "node:assert";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const COMPOSE_FILE = path.join(ROOT, "infra/local/docker-compose.yml");
const SERVER_PORT = process.env.SMOKE_SERVER_PORT ?? "3099";

function hasCommand(cmd) {
  try {
    execSync(`command -v ${cmd}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/** Docker CLI may exist while the daemon is stopped (Docker Desktop not running). */
function isDockerDaemonReady() {
  if (!hasCommand("docker")) return false;
  try {
    execSync("docker info", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForHttp(url, attempts = 30) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 503) return res;
    } catch {
      // retry
    }
    await sleep(1000);
  }
  throw new Error(`Timeout waiting for ${url}`);
}

async function main() {
  if (!hasCommand("docker")) {
    console.log("smoke:stack — docker CLI not found, skipping");
    process.exit(0);
  }

  if (!isDockerDaemonReady()) {
    console.log("smoke:stack — Docker daemon not running (start Docker Desktop), skipping");
    process.exit(0);
  }

  const env = {
    ...process.env,
    DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/world_cup_engine",
    REDIS_URL: process.env.REDIS_URL ?? "redis://localhost:6379",
    ENABLE_WORKERS: "true",
    PORT: SERVER_PORT,
  };

  console.log("smoke:stack — starting docker compose");
  try {
    execSync(`docker compose -f "${COMPOSE_FILE}" up -d`, { stdio: "inherit", cwd: ROOT });
  } catch {
    console.error("smoke:stack — docker compose failed. Is Docker Desktop running?");
    process.exit(1);
  }

  console.log("smoke:stack — waiting for postgres/redis");
  for (let i = 0; i < 30; i++) {
    try {
      execSync(`docker compose -f "${COMPOSE_FILE}" exec -T postgres pg_isready -U postgres -d world_cup_engine`, {
        stdio: "ignore",
        cwd: ROOT,
      });
      execSync(`docker compose -f "${COMPOSE_FILE}" exec -T redis redis-cli ping`, {
        stdio: "ignore",
        cwd: ROOT,
      });
      break;
    } catch {
      await sleep(2000);
    }
  }

  console.log("smoke:stack — db:generate + db:push");
  execSync("pnpm db:generate", { stdio: "inherit", cwd: ROOT, env });
  execSync("pnpm db:push", { stdio: "inherit", cwd: ROOT, env });

  console.log("smoke:stack — db:seed");
  try {
    execSync("pnpm db:seed", { stdio: "inherit", cwd: ROOT, env });
  } catch {
    console.log("  ⚠ db:seed failed — continuing with empty identity graph");
  }

  console.log("smoke:stack — starting server with workers");
  const server = spawn("tsx", ["server/src/index.ts"], {
    cwd: ROOT,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  let serverLog = "";
  server.stdout?.on("data", (d) => { serverLog += d.toString(); });
  server.stderr?.on("data", (d) => { serverLog += d.toString(); });

  try {
    const healthRes = await waitForHttp(`http://127.0.0.1:${SERVER_PORT}/health`);
    const health = await healthRes.json();
    assert.equal(health.status, "ok");
    console.log("  ✓ /health ok");

    const apiHealth = await (await waitForHttp(`http://127.0.0.1:${SERVER_PORT}/api/health`)).json();
    assert.ok(apiHealth.dbConnected === true, "expected dbConnected true");
    assert.ok(apiHealth.redisConnected === true, "expected redisConnected true");
    console.log("  ✓ /api/health db+redis connected");

    const qualRes = await fetch(`http://127.0.0.1:${SERVER_PORT}/api/qualification/A`);
    assert.ok(qualRes.ok, `qualification status ${qualRes.status}`);
    const qual = await qualRes.json();
    assert.ok(Array.isArray(qual.teams) && qual.teams.length > 0);
    console.log(`  ✓ /api/qualification/A (${qual.teams.length} teams)`);

    console.log("\nsmoke:stack PASSED");
  } catch (err) {
    console.error("smoke:stack FAILED", err instanceof Error ? err.message : err);
    if (serverLog) console.error(serverLog.slice(-2000));
    process.exitCode = 1;
  } finally {
    server.kill("SIGTERM");
    await sleep(500);
  }
}

main();
