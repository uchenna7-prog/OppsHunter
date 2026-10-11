import { Pool } from "pg";
import pg from "pg";
import { env } from "../config/env.js";

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});


pool.on("error", (err) => {
  console.error("Unexpected error on idle database client", err);
  process.exit(1);
});


pg.types.setTypeParser(1082, (value: string) => value);
pg.types.setTypeParser(20, (value: string) => Number(value));