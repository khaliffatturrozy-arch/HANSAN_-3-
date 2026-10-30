import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

let pool: Pool | null = null;

export function getPool(): Pool {
  if (pool) return pool;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  pool = new Pool({ connectionString: url, max: 10 });
  return pool;
}

export function getDb() {
  return drizzle(getPool(), { schema });
}

export async function closeDb() {
  if (pool) { await pool.end(); pool = null; }
}
