#!/usr/bin/env node
/**
 * Wait until Docker Postgres + Redis accept connections (after stack:up).
 * Exits 0 when ready; skips cleanly when Docker unavailable.
 */

import { execSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const COMPOSE_FILE = resolve(ROOT, "infra/local/docker-compose.yml");

function hasDockerDaemon() {
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

async function main() {
  if (!hasDockerDaemon()) {
    console.log("stack:wait — Docker not running, skipping");
    return;
  }

  console.log("stack:wait — waiting for postgres + redis");
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
      console.log("stack:wait — ready");
      return;
    } catch {
      await sleep(2000);
    }
  }

  console.error("stack:wait — timed out after 60s");
  process.exit(1);
}

await main();
