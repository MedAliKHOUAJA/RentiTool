import { Pool, QueryResult } from 'pg';

let pool: Pool | null = null;

/**
 * Obtenir le pool PostgreSQL (singleton)
 */
export function getPool(): Pool {
  if (!pool) {
    // Vérifier que les variables sont présentes
    if (!process.env.POSTGRES_USER || 
        !process.env.POSTGRES_HOST || 
        !process.env.POSTGRES_DATABASE || 
        !process.env.POSTGRES_PASSWORD) {
      throw new Error('Missing PostgreSQL configuration. Required: POSTGRES_USER, POSTGRES_HOST, POSTGRES_DATABASE, POSTGRES_PASSWORD');
    }

    const config = {
      user: process.env.POSTGRES_USER,
      host: process.env.POSTGRES_HOST,
      database: process.env.POSTGRES_DATABASE,
      password: process.env.POSTGRES_PASSWORD,
      port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
    };

    console.log('🗄️ [Database] Creating PostgreSQL pool', {
      host: config.host,
      database: config.database,
      port: config.port,
      ssl: !!config.ssl,
    });

    pool = new Pool(config);

    pool.on('error', (err) => {
      console.error('❌ [Database] Unexpected pool error:', err);
    });

    pool.on('connect', () => {
      console.log('✅ [Database] New client connected to pool');
    });
  }

  return pool;
}

/**
 * Exécuter une requête SQL
 */
export async function query(text: string, params?: any[]): Promise<QueryResult<any>> {
  const pool = getPool();
  const start = Date.now();

  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    console.log('🗄️ [Database] Query executed', {
      duration: `${duration}ms`,
      rows: result.rowCount || 0,
    });

    return result;
  } catch (error: any) {
    console.error('❌ [Database] Query error:', error.message);
    throw error;
  }
}

/**
 * Fermer le pool (pour cleanup)
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('🛑 [Database] Pool closed');
  }
}