import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Add it to .env.local");
}

const globalForDb = globalThis as unknown as {
  db?: ReturnType<typeof createDb>;
};

function createDb() {
  const sql = neon(connectionString!);
  return drizzle(sql, { schema });
}

export const db = globalForDb.db ?? createDb();
if (process.env.NODE_ENV !== "production") globalForDb.db = db;

export * as schema from "./schema";
