import { Pool } from 'pg';

const g = globalThis as unknown as { _pgPool?: Pool };

export const pool =
  g._pgPool ??
  (g._pgPool = new Pool(
    process.env.DATABASE_URL
      ? { connectionString: process.env.DATABASE_URL }
      : {
          host: process.env.PG_HOST || 'localhost',
          port: parseInt(process.env.PG_PORT || '5432', 10),
          database: process.env.PG_DATABASE || 'claims_engine',
          user: process.env.PG_USER || 'postgres',
          password: process.env.PG_PASSWORD,
          max: 10,
        }
  ));

export default pool;
