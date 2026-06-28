/**
 * Optional BullMQ workers + intake polling — requires REDIS_URL.
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { envBootstrapStatus } from "../loadEnv.js";
import { logger } from "../observability/telemetry.js";
import { IntakeWorker, PROVIDER_CONFIGS } from "../bc1/intakeWorker.js";
import { QualificationWorker } from "../bc2/qualificationWorker.js";
import { PredictionWorker } from "../bc3/predictionWorker.js";
import { createWorker, getPredictionQueue, getQualificationQueue } from "../infra/queues.js";
import { hasRedisConfig, redis } from "../infra/redis.js";
import { STREAM_KEYS } from "../events/types.js";
import type {
  MatchResultLockedEvent,
  QualificationChangedEvent,
  EntityUpdatedEvent,
} from "../events/types.js";

export function shouldStartWorkers(): boolean {
  if (process.env.ENABLE_WORKERS === "false") return false;
  if (process.env.ENABLE_WORKERS === "true") return hasRedisConfig();
  return hasRedisConfig();
}

export async function startWorkersIfEnabled(): Promise<void> {
  if (!shouldStartWorkers()) {
    const status = envBootstrapStatus();
    logger.info("workers_skipped", {
      reason: hasRedisConfig() ? "ENABLE_WORKERS=false" : "REDIS_URL unset",
      envRoot: status.root,
      hasEnvLocal: existsSync(resolve(status.root, ".env.local")),
      hasDatabaseUrl: status.hasDatabaseUrl,
      hasRedisUrl: status.hasRedisUrl,
      enableWorkers: status.enableWorkers,
    });
    return;
  }

  const qualWorker = new QualificationWorker();
  const predWorker = new PredictionWorker();
  const intakeWorker = new IntakeWorker();
  const qualificationQueue = getQualificationQueue();
  const predictionQueue = getPredictionQueue();

  createWorker<{ event: MatchResultLockedEvent }>(
    "qualification",
    async (job) => {
      logger.info("qual_job_start", { jobId: job.id });
      await qualWorker.processMatchLocked(job.data.event);
      logger.info("qual_job_done", { jobId: job.id });
    },
    { concurrency: 2 }
  );

  createWorker<{ event: QualificationChangedEvent | EntityUpdatedEvent }>(
    "prediction",
    async (job) => {
      logger.info("pred_job_start", { jobId: job.id });
      const { event } = job.data;
      if (event.type === "QualificationChangedEvent") {
        await predWorker.processQualificationChanged(event);
      } else if (event.type === "EntityUpdatedEvent") {
        await predWorker.processEntityUpdated(event);
      }
      logger.info("pred_job_done", { jobId: job.id });
    },
    { concurrency: 3 }
  );

  void runEventRouter(qualificationQueue, predictionQueue);
  scheduleIntakePolling(intakeWorker);
  logger.info("workers_started");
}

async function runEventRouter(
  qualificationQueue: ReturnType<typeof getQualificationQueue>,
  predictionQueue: ReturnType<typeof getPredictionQueue>
): Promise<void> {
  let lastId = "$";
  logger.info("event_router_start");

  while (true) {
    try {
      const results = await redis.xread(
        "COUNT",
        20,
        "BLOCK",
        2000,
        "STREAMS",
        STREAM_KEYS.intake,
        lastId
      );

      if (!results) continue;

      for (const [, entries] of results) {
        for (const [id, fieldValues] of entries) {
          lastId = id;

          const fields: Record<string, string> = {};
          for (let i = 0; i < fieldValues.length; i += 2) {
            fields[fieldValues[i]] = fieldValues[i + 1];
          }

          const eventType = fields.type;

          if (eventType === "MatchResultLockedEvent") {
            const event: MatchResultLockedEvent = JSON.parse(fields.payload ?? "{}");
            await qualificationQueue.add("process-match-locked", { event }, { priority: 1 });
            await predictionQueue.add("qual-changed-cascade", { event }, { priority: 2 });
          }

          if (eventType === "QualificationChangedEvent") {
            const event: QualificationChangedEvent = JSON.parse(fields.payload ?? "{}");
            await predictionQueue.add("qual-changed", { event }, { priority: 1 });
          }

          if (eventType === "EntityUpdatedEvent") {
            const event: EntityUpdatedEvent = JSON.parse(fields.payload ?? "{}");
            if (["odds", "recentForm"].some((f) => (event.changedFields ?? []).includes(f))) {
              await predictionQueue.add("entity-updated", { event }, { priority: 3 });
            }
          }
        }
      }
    } catch (err) {
      logger.error("event_router_error", { error: String(err) });
      await sleep(1000);
    }
  }
}

function scheduleIntakePolling(intakeWorker: IntakeWorker): void {
  for (const config of PROVIDER_CONFIGS) {
    const poll = async () => {
      const result = await intakeWorker.poll(config);
      if (!result.success) {
        logger.warn("intake_poll_failed", {
          providerId: config.id,
          error: result.error,
          durationMs: result.durationMs,
        });
      } else {
        logger.info("intake_poll_success", {
          providerId: config.id,
          rawEventId: result.rawEventId,
          durationMs: result.durationMs,
        });
      }
    };

    void poll();
    setInterval(() => {
      void poll();
    }, config.pollIntervalMs);
    logger.info("intake_scheduled", { providerId: config.id, intervalMs: config.pollIntervalMs });
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
