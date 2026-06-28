import "dotenv/config";
import { defineConfig } from "prisma/config";

/** Dummy URL for `prisma generate` when DATABASE_URL is unset (no connection needed). */
const datasourceUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/world_cup_engine";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: datasourceUrl,
  },
});
