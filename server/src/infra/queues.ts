import type { Queue, Worker, WorkerOptions, JobsOptions } from "bullmq";
import { Queue as BullQueue, Worker as BullWorker, QueueEvents } from "bullmq";
import { QUEUE_NAMES } from "../events/types.js";
import { hasRedisConfig } from "./redis.js";

const DEFAULT_JOB_OPTIONS: JobsOptions = {
  attempts: 5,
  backoff: { type: "exponential", delay: 1000 },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 50 },
};

function connection() {
  const url = process.env.UPSTASH_REDIS_URL ?? process.env.REDIS_URL;
  if (!url) {
    throw new Error(
      "UPSTASH_REDIS_URL or REDIS_URL environment variable is required for BullMQ"
    );
  }
  return { url };
}

let intakeQueuesCache: Record<string, Queue> | null = null;
let qualificationQueueCache: Queue | null = null;
let predictionQueueCache: Queue | null = null;
let reconciliationQueueCache: Queue | null = null;

function ensureRedis(): void {
  if (!hasRedisConfig()) {
    throw new Error("Redis is required for BullMQ workers");
  }
}

export function getIntakeQueues(): Record<string, Queue> {
  ensureRedis();
  if (!intakeQueuesCache) {
    intakeQueuesCache = {
      [QUEUE_NAMES.intakeEspn]: new BullQueue(QUEUE_NAMES.intakeEspn, {
        connection: connection(),
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      }),
      [QUEUE_NAMES.intakeWcLive]: new BullQueue(QUEUE_NAMES.intakeWcLive, {
        connection: connection(),
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      }),
      [QUEUE_NAMES.intakeSofascore]: new BullQueue(QUEUE_NAMES.intakeSofascore, {
        connection: connection(),
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      }),
      [QUEUE_NAMES.intakeZafronix]: new BullQueue(QUEUE_NAMES.intakeZafronix, {
        connection: connection(),
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      }),
      [QUEUE_NAMES.intakeClubElo]: new BullQueue(QUEUE_NAMES.intakeClubElo, {
        connection: connection(),
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      }),
    };
  }
  return intakeQueuesCache;
}

export function getQualificationQueue(): Queue {
  ensureRedis();
  if (!qualificationQueueCache) {
    qualificationQueueCache = new BullQueue(QUEUE_NAMES.qualification, {
      connection: connection(),
      defaultJobOptions: DEFAULT_JOB_OPTIONS,
    });
  }
  return qualificationQueueCache;
}

export function getPredictionQueue(): Queue {
  ensureRedis();
  if (!predictionQueueCache) {
    predictionQueueCache = new BullQueue(QUEUE_NAMES.prediction, {
      connection: connection(),
      defaultJobOptions: DEFAULT_JOB_OPTIONS,
    });
  }
  return predictionQueueCache;
}

export function getReconciliationQueue(): Queue {
  ensureRedis();
  if (!reconciliationQueueCache) {
    reconciliationQueueCache = new BullQueue(QUEUE_NAMES.reconciliation, {
      connection: connection(),
      defaultJobOptions: DEFAULT_JOB_OPTIONS,
    });
  }
  return reconciliationQueueCache;
}

/** @deprecated Use getQualificationQueue() — lazy init */
export const qualificationQueue = new Proxy({} as Queue, {
  get(_t, prop) {
    const q = getQualificationQueue();
    const value = Reflect.get(q, prop, q);
    return typeof value === "function" ? value.bind(q) : value;
  },
});

export const predictionQueue = new Proxy({} as Queue, {
  get(_t, prop) {
    const q = getPredictionQueue();
    const value = Reflect.get(q, prop, q);
    return typeof value === "function" ? value.bind(q) : value;
  },
});

export const reconciliationQueue = new Proxy({} as Queue, {
  get(_t, prop) {
    const q = getReconciliationQueue();
    const value = Reflect.get(q, prop, q);
    return typeof value === "function" ? value.bind(q) : value;
  },
});

export const intakeQueues = new Proxy({} as Record<string, Queue>, {
  get(_t, prop) {
    return getIntakeQueues()[prop as string];
  },
});

export function createWorker<T>(
  queueName: string,
  processor: (job: { id: string | undefined; name: string; data: T }) => Promise<void>,
  options: Partial<WorkerOptions> = {}
): Worker {
  ensureRedis();
  return new BullWorker<T>(
    queueName,
    async (job) => {
      await processor({ id: job.id, name: job.name, data: job.data });
    },
    {
      connection: connection(),
      concurrency: 3,
      ...options,
    }
  );
}

export async function moveToDLQ(
  queueName: string,
  jobId: string,
  reason: string
): Promise<void> {
  const dlqKey = `wc2026:dlq:${queueName}`;
  const { redis } = await import("./redis.js");
  await redis.lpush(
    dlqKey,
    JSON.stringify({ jobId, reason, failedAt: new Date().toISOString() })
  );
  await redis.ltrim(dlqKey, 0, 499);
}

export function createQueueEvents(queueName: string): QueueEvents {
  ensureRedis();
  return new QueueEvents(queueName, { connection: connection() });
}
