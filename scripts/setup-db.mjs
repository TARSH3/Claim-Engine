// node --env-file=.env.local scripts/setup-db.mjs   (runs sql/*.sql in order)
import pg from "pg";
import { readFileSync, readdirSync } from "node:fs";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
for (const f of readdirSync("sql").filter((x) => x.endsWith(".sql")).sort()) {
  await pool.query(readFileSync(`sql/${f}`, "utf8"));
  console.log("ran", f);
}
await pool.end();
