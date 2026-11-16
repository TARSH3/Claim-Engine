import { Pool } from "pg";

const g = globalThis as unknown as { _pgPool?: Pool };
export const pool =
  g._pgPool ?? (g._pgPool = new Pool({ connectionString: process.env.DATABASE_URL }));
