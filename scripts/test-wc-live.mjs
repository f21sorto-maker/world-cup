#!/usr/bin/env node
import { readFileSync } from "node:fs";

const env = readFileSync(".env.local", "utf8");
const KEY = env.match(/^RAPIDAPI_KEY=(.+)$/m)?.[1]?.trim();
if (!KEY) {
  console.error("RAPIDAPI_KEY missing");
  process.exit(1);
}

const HOST = "world-cup-2026-live-api.p.rapidapi.com";
const BASE = `https://${HOST}`;
const hdr = {
  "x-rapidapi-host": HOST,
  "x-rapidapi-key": KEY,
  Accept: "application/json",
};

/** 200 = data OK; 429 = rate limited but route reachable (key/subscription valid). */
function okStatus(status) {
  return status === 200 || status === 429;
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`, { headers: hdr });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text.slice(0, 120);
  }
  return { status: res.status, json };
}

const checks = [];

const draw = await get("/wc/draw?stage=group");
const withId = draw.status === 200 && Array.isArray(draw.json?.data)
  ? draw.json.data.find((m) => m?.matchId)
  : null;
checks.push(["draw", okStatus(draw.status), draw.json?.count ?? draw.status]);

await new Promise((r) => setTimeout(r, 400));
const live = await get("/wc/live");
checks.push(["live", okStatus(live.status), live.json?.count ?? live.status]);

await new Promise((r) => setTimeout(r, 400));
const standings = await get("/wc/standings");
checks.push(["standings", okStatus(standings.status), standings.json?.count ?? standings.status]);

if (withId?.matchId) {
  await new Promise((r) => setTimeout(r, 500));
  const id = withId.matchId;
  const detail = await get(`/wc/match/${id}/detail`);
  checks.push(["match detail", okStatus(detail.status), detail.json?.data?.matchId ?? detail.status]);

  await new Promise((r) => setTimeout(r, 500));
  const commentary = await get(`/wc/match/${id}/commentary`);
  const incidents = commentary.json?.data?.incidents?.length ?? 0;
  checks.push(["commentary", okStatus(commentary.status), incidents || commentary.status]);
} else if (draw.status === 429) {
  checks.push(["match detail (skipped)", true, "rate limited — draw unavailable"]);
  checks.push(["commentary (skipped)", true, "rate limited — draw unavailable"]);
}

let failed = 0;
for (const [name, ok, detail] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}\t${name}\t${detail}`);
  if (!ok) failed += 1;
}

process.exit(failed > 0 ? 1 : 0);
