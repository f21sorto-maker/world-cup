/**
 * Hono QueryAPI routes — mirrors Vercel api/* handlers for local server:dev.
 */

import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { getGroupQualification } from "./qualification.js";
import { getCatalogQualificationFallback } from "./qualificationCatalogFallback.js";
import { getHealth } from "./health.js";
import { pushBroadcaster } from "../push/pushService.js";

export function createQueryApiRoutes(): Hono {
  const api = new Hono();

  api.get("/health", async (c) => {
    try {
      const health = await getHealth();
      return c.json(health, health.status === "critical" ? 503 : 200);
    } catch {
      return c.json(
        {
          status: "degraded",
          timestamp: new Date().toISOString(),
          providers: [],
          quarantineDepth: 0,
          redisConnected: false,
          dbConnected: false,
        },
        200
      );
    }
  });

  api.get("/qualification/:groupId", async (c) => {
    const groupId = c.req.param("groupId");
    const asOf = c.req.query("asOf");

    try {
      const result = await getGroupQualification(groupId, asOf);
      if (result) {
        c.header("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");
        return c.json(result);
      }
    } catch {
      // fall through to catalog
    }

    const fallback = getCatalogQualificationFallback(groupId);
    if (!fallback) {
      return c.json({ error: `No qualification data for group ${groupId}` }, 404);
    }
    c.header("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");
    return c.json(fallback);
  });

  api.get("/events", (c) => {
    const filterParam = c.req.query("filter");
    const allowedTypes = filterParam
      ? filterParam.split(",").map((s) => s.trim())
      : null;

    return streamSSE(c, async (stream) => {
      await stream.writeSSE({
        data: JSON.stringify({ type: "connected", timestamp: new Date().toISOString() }),
      });

      const unsubscribe = pushBroadcaster.subscribe(async (msg) => {
        if (allowedTypes && !allowedTypes.includes(msg.type)) return;
        await stream.writeSSE({ data: JSON.stringify(msg) });
      });

      const heartbeat = setInterval(() => {
        void stream.writeSSE({
          data: JSON.stringify({ type: "heartbeat", timestamp: new Date().toISOString() }),
        });
      }, 15_000);

      await new Promise<void>((resolve) => {
        stream.onAbort(() => {
          clearInterval(heartbeat);
          unsubscribe();
          resolve();
        });
      });
    });
  });

  return api;
}
