#!/usr/bin/env node
/**
 * Preflight: Postgres reachable via DATABASE_URL (optional for CI).
 */

import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const url = process.env.DATABASE_URL;

if (!url) {
  console.log("verify:db — DATABASE_URL unset, skipping");
  process.exit(0);
}

let PrismaClient;
try {
  const mod = await import("../generated/prisma/client.js");
  PrismaClient = mod.PrismaClient;
} catch {
  console.error("verify:db FAILED — run pnpm db:generate");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: url });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

try {
  await prisma.$queryRaw`SELECT 1`;
  const aliasCount = await prisma.identityAlias.count();
  console.log(`verify:db OK — identity aliases: ${aliasCount}`);
  process.exit(0);
} catch (err) {
  console.error("verify:db FAILED", err instanceof Error ? err.message : err);
  process.exit(1);
} finally {
  await prisma.$disconnect();
  await pool.end();
}
