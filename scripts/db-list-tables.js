#!/usr/bin/env node
// Lists non-system tables to help determine the exact tools table name
const fs = require("fs");
const path = require("path");
let dotenv;
try {
  dotenv = require("dotenv");
} catch {}
const localEnv = path.join(process.cwd(), ".env.local");
if (dotenv && fs.existsSync(localEnv)) {
  dotenv.config({ path: localEnv });
  console.log(`[db-tables] Loaded env from ${path.basename(localEnv)}`);
}
const { Client } = require("pg");

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("[db-tables] Missing DATABASE_URL in .env.local");
  process.exit(1);
}

const isLocal = /localhost|127\.0\.0\.1/.test(url);
const client = new Client({
  connectionString: url,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

async function main() {
  try {
    await client.connect();
    const sql = `
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_type = 'BASE TABLE'
        AND table_schema NOT IN ('pg_catalog','information_schema')
      ORDER BY table_schema, table_name
    `;
    const res = await client.query(sql);
    if (!res.rows.length) {
      console.log("[db-tables] No user tables found.");
    } else {
      console.table(res.rows);
    }
  } catch (e) {
    console.error("[db-tables] Error:", e.message || e);
    process.exit(2);
  } finally {
    try {
      await client.end();
    } catch {}
  }
}

main();
