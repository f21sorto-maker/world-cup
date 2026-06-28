import { describe, expect, it } from "vitest";
import { hasRedisConfig } from "./infra/redis.js";
import { shouldStartWorkers } from "./workers/startWorkers.js";

describe("server bootstrap", () => {
  it("hasRedisConfig is false without env", () => {
    const original = process.env.REDIS_URL;
    delete process.env.REDIS_URL;
    delete process.env.UPSTASH_REDIS_URL;
    expect(hasRedisConfig()).toBe(false);
    if (original) process.env.REDIS_URL = original;
  });

  it("shouldStartWorkers is false without Redis", () => {
    const redis = process.env.REDIS_URL;
    const upstash = process.env.UPSTASH_REDIS_URL;
    const workers = process.env.ENABLE_WORKERS;
    delete process.env.REDIS_URL;
    delete process.env.UPSTASH_REDIS_URL;
    delete process.env.ENABLE_WORKERS;
    expect(shouldStartWorkers()).toBe(false);
    if (redis) process.env.REDIS_URL = redis;
    if (upstash) process.env.UPSTASH_REDIS_URL = upstash;
    if (workers) process.env.ENABLE_WORKERS = workers;
  });
});
