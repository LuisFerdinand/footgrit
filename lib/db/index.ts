import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Add it to .env.local");
}

// Only the stateless HTTP client is reused across dev hot reloads. The drizzle
// instance is rebuilt per module evaluation so it always carries the current
// schema — caching it kept stale relations after schema edits ("not enough
// information to infer relation …").
const globalForDb = globalThis as unknown as {
  neonSql?: ReturnType<typeof neon>;
};

const sql = globalForDb.neonSql ?? neon(connectionString);
if (process.env.NODE_ENV !== "production") globalForDb.neonSql = sql;

export const db = drizzle(sql, { schema });

export * as schema from "./schema";
