/**
 * Lazy Redis client — does not connect until first use.
 * Workers require REDIS_URL; HTTP-only server:dev runs without it.
 */

import { Redis } from "ioredis";

declare global {
  // eslint-disable-next-line no-var
  var __redis: Redis | undefined;
  // eslint-disable-next-line no-var
  var __redisSub: Redis | undefined;
}

export function redisUrl(): string | undefined {
  return process.env.UPSTASH_REDIS_URL ?? process.env.REDIS_URL;
}

export function hasRedisConfig(): boolean {
  return Boolean(redisUrl());
}

function createRedis(lazyConnect = false): Redis {
  const url = redisUrl();
  if (!url) {
    throw new Error(
      "UPSTASH_REDIS_URL or REDIS_URL environment variable is required"
    );
  }
  return new Redis(url, {
    lazyConnect,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    retryStrategy: (times) => Math.min(times * 100, 3000),
  });
}

function getOrCreateRedis(lazyConnect = false): Redis {
  if (!hasRedisConfig()) {
    throw new Error("Redis is not configured");
  }
  if (lazyConnect) {
    if (!globalThis.__redisSub) {
      globalThis.__redisSub = createRedis(true);
    }
    return globalThis.__redisSub;
  }
  if (!globalThis.__redis) {
    globalThis.__redis = createRedis(false);
  }
  return globalThis.__redis;
}

/** Main Redis client — lazy; throws if REDIS_URL unset. */
export const redis: Redis = new Proxy({} as Redis, {
  get(_target, prop, receiver) {
    const client = getOrCreateRedis(false);
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

/** Dedicated subscriber client — lazy. */
export const redisSub: Redis = new Proxy({} as Redis, {
  get(_target, prop, receiver) {
    const client = getOrCreateRedis(true);
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export const CACHE_TTL = {
  liveMatch: 10,
  standings: 30,
  predictions: 300,
  qualification: 60,
  health: 15,
} as const;

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!hasRedisConfig()) return null;
  const raw = await redis.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<void> {
  if (!hasRedisConfig()) return;
  await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
}

export function cacheKey(...parts: string[]): string {
  return `wc2026:cache:${parts.join(":")}`;
}

export async function streamPublish(
  streamKey: string,
  event: Record<string, string>
): Promise<string | null> {
  if (!hasRedisConfig()) return null;
  return redis.xadd(streamKey, "*", ...Object.entries(event).flat()) as Promise<string>;
}

export async function streamRead(
  streamKey: string,
  lastId: string,
  count = 10
): Promise<Array<{ id: string; fields: Record<string, string> }>> {
  if (!hasRedisConfig()) return [];
  const results = await redis.xread("COUNT", count, "STREAMS", streamKey, lastId);
  if (!results) return [];
  const [, entries] = results[0];
  return entries.map(([id, fieldValues]) => {
    const fields: Record<string, string> = {};
    for (let i = 0; i < fieldValues.length; i += 2) {
      fields[fieldValues[i]] = fieldValues[i + 1];
    }
    return { id, fields };
  });
}
