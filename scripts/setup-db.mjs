// node --env-file=.env.local scripts/setup-db.mjs
import pg from "pg";
import { readFileSync } from "node:fs";

const pool = new pg.Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.PG_HOST || "localhost",
        port: parseInt(process.env.PG_PORT || "5432", 10),
        database: process.env.PG_DATABASE || "claims_engine",
        user: process.env.PG_USER || "postgres",
        password: process.env.PG_PASSWORD,
      }
);

try {
  console.log("Applying master schema to database...");
  const sql = readFileSync("sql/master_schema.sql", "utf8");
  await pool.query(sql);
  console.log("✓ Successfully initialized PostgreSQL master schema, tables, triggers, views, and seed data.");
} catch (err) {
  console.error("Database setup error:", err);
} finally {
  await pool.end();
}
