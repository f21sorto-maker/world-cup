/**
 * Lazy Prisma 7 client — driver adapter + generated client.
 * HTTP-only server:dev works without DATABASE_URL; workers require db:generate.
 */

import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

type PrismaClientModule = typeof import("../../../generated/prisma/client.js");
type PrismaClientType = PrismaClientModule["PrismaClient"];

declare global {
  // eslint-disable-next-line no-var
  var __prisma: InstanceType<PrismaClientType> | undefined;
}

let clientPromise: Promise<InstanceType<PrismaClientType> | null> | null = null;
let clientInstance: InstanceType<PrismaClientType> | undefined;

export function hasDatabaseConfig(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

function createPrismaClient(PrismaClient: PrismaClientType): InstanceType<PrismaClientType> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required for Prisma");
  }
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

async function loadPrismaClient(): Promise<InstanceType<PrismaClientType> | null> {
  if (!hasDatabaseConfig()) return null;
  if (clientInstance) return clientInstance;
  if (globalThis.__prisma) {
    clientInstance = globalThis.__prisma;
    return clientInstance;
  }

  try {
    const mod = await import("../../../generated/prisma/client.js");
    clientInstance = createPrismaClient(mod.PrismaClient);
    if (process.env.NODE_ENV !== "production") {
      globalThis.__prisma = clientInstance;
    }
    return clientInstance;
  } catch {
    return null;
  }
}

/** Preferred entry for HTTP handlers — returns null when DB unavailable. */
export async function getPrisma(): Promise<InstanceType<PrismaClientType> | null> {
  if (!clientPromise) {
    clientPromise = loadPrismaClient();
  }
  return clientPromise;
}

/**
 * Sync proxy for worker modules (Redis + DATABASE_URL expected).
 * Methods throw until the client is loaded via getPrisma().
 */
export const prisma = new Proxy({} as InstanceType<PrismaClientType>, {
  get(_target, prop, receiver) {
    if (!clientInstance) {
      throw new Error(
        "Prisma not initialized. Ensure DATABASE_URL is set and run pnpm db:generate."
      );
    }
    const value = Reflect.get(clientInstance, prop, receiver);
    return typeof value === "function" ? value.bind(clientInstance) : value;
  },
});

if (hasDatabaseConfig()) {
  void getPrisma().then((client) => {
    if (client) clientInstance = client;
  });
}

export type { PrismaClientType };
