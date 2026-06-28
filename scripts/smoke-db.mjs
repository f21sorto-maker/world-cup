#!/usr/bin/env node
/**
 * DB-backed smoke — identity aliases + optional qualification snapshot count.
 * Skips cleanly when DATABASE_URL is unset or Prisma client is not generated.
 */

import { strict as assert } from "node:assert";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const url = process.env.DATABASE_URL;

if (!url) {
  console.log("smoke:db — DATABASE_URL unset, skipping");
  process.exit(0);
}

let PrismaClient;
try {
  const mod = await import("../generated/prisma/client.js");
  PrismaClient = mod.PrismaClient;
} catch {
  console.log("smoke:db — generated Prisma client missing, run pnpm db:generate");
  process.exit(0);
}

const pool = new pg.Pool({ connectionString: url });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

try {
  await prisma.$queryRaw`SELECT 1`;

  const aliasCount = await prisma.identityAlias.count();
  console.log(`smoke:db — identity aliases: ${aliasCount}`);

  const bra = await prisma.identityAlias.findFirst({
    where: { canonicalId: "bra", providerId: "espn" },
  });
  if (bra) {
    assert.equal(bra.quarantined, false);
    console.log("  ✓ ESPN alias for bra present");
  } else {
    console.log("  ⚠ no ESPN bra alias — run pnpm db:seed");
  }

  const snapshotCount = await prisma.qualificationSnapshot.count();
  console.log(`smoke:db — qualification snapshots: ${snapshotCount}`);
  console.log("\nsmoke:db PASSED");
} catch (err) {
  console.error("smoke:db FAILED", err instanceof Error ? err.message : err);
  process.exit(1);
} finally {
  await prisma.$disconnect();
  await pool.end();
}
