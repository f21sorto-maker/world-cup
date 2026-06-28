/**
 * WC2026 Backend Server — Hono app.
 * HTTP QueryAPI always available; BullMQ workers start when REDIS_URL is set.
 */

import "./loadEnv.js";
import { Hono } from "hono";
import { createAdaptorServer } from "@hono/node-server";
import { initTelemetry, logger } from "./observability/telemetry.js";
import { createQueryApiRoutes } from "./api/honoRoutes.js";
import { startWorkersIfEnabled, shouldStartWorkers } from "./workers/startWorkers.js";
import { hasRedisConfig } from "./infra/redis.js";

initTelemetry();

const app = new Hono();

app.get("/health", (c) =>
  c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    workers: shouldStartWorkers(),
    redis: hasRedisConfig(),
  })
);

app.route("/api", createQueryApiRoutes());

const PORT = parseInt(process.env.PORT ?? "3001", 10);

void startWorkersIfEnabled();

const server = createAdaptorServer({
  fetch: app.fetch,
  port: PORT,
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    logger.error("port_in_use", {
      port: PORT,
      hint: `Port ${PORT} is already in use. Run: pnpm server:stop  OR  PORT=${PORT + 1} pnpm server:dev`,
    });
    console.error(
      `\n[server] Port ${PORT} is already in use (likely a previous server:dev still running).\n` +
        `  Fix: pnpm server:stop\n` +
        `  Or:  PORT=${PORT + 1} pnpm server:dev\n`
    );
    process.exit(1);
  }

  logger.error("server_listen_error", { error: String(err) });
  process.exit(1);
});

server.listen(PORT, () => {
  logger.info("server_started", {
    port: PORT,
    workers: shouldStartWorkers(),
    redis: hasRedisConfig(),
  });

  console.log(
    `\n[server] Running on http://127.0.0.1:${PORT} — leave this terminal open.\n` +
      `  Open a NEW terminal for: pnpm web:dev  →  http://127.0.0.1:5173/#live\n`
  );
});

export default app;
