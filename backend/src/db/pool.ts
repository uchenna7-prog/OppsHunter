import { Pool } from "pg";
import { env } from "../config/env.js";

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle database client", err);
  process.exit(1);
});