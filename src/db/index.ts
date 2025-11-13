import { Pool } from "pg";

let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  const { POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DATABASE } = process.env;
  if (POSTGRES_USER && POSTGRES_PASSWORD && POSTGRES_HOST && POSTGRES_PORT && POSTGRES_DATABASE) {
    connectionString = `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DATABASE}`;
  } else {
    throw new Error("Missing environment variable: DATABASE_URL or individual POSTGRES_* variables.");
  }
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

export async function testConnection(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Connexion DB OK');
    return true;
  } catch (err) {
    console.error('❌ Échec connexion DB:', err);
    throw err;
  }


}

/**
 * Fermer le pool (utile pour les tests ou shutdown)
 */
export async function closePool(): Promise<void> {
  try {
    await pool.end();
    console.log('🛑 [Database] Pool closed');
  } catch (error: any) {
    console.error('❌ [Database] Error closing pool:', error.message);
  }
}