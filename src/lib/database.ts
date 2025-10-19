import { Pool } from 'pg';

const {
  DATABASE_URL,
  POSTGRES_USER,
  POSTGRES_HOST,
  POSTGRES_PORT,
  POSTGRES_PASSWORD,
  POSTGRES_DATABASE,
  NODE_ENV
} = process.env;

const connectionString =
  DATABASE_URL ||
  (POSTGRES_USER && POSTGRES_HOST && POSTGRES_PORT && POSTGRES_PASSWORD && POSTGRES_DATABASE
    ? `postgresql://${encodeURIComponent(POSTGRES_USER)}:${encodeURIComponent(POSTGRES_PASSWORD)}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DATABASE}`
    : undefined);

if (!connectionString) {
  console.warn('⚠️ Aucun connection string PostgreSQL détecté (DATABASE_URL ou POSTGRES_*)');
}

const pool = new Pool({
  connectionString,
  ssl: NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
  pool,
};

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