import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Missing environment variable: DATABASE_URL");
}

const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);

declare global {
  // eslint-disable-next-line no-var
  var __pgPoolSrc__: Pool | undefined;
}

export const pool: Pool =
  globalThis.__pgPoolSrc__ ??
  new Pool({
    connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__pgPoolSrc__ = pool;
}

export const query = (text: string, params?: any[]) => pool.query(text, params);

export default pool;
