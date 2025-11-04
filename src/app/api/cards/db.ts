// src/app/api/cards/db.ts
import { Pool } from 'pg';

export const db = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: String(process.env.DB_PASSWORD), // Conv to string mdp mtei numbers khw :)
  port: Number(process.env.DB_PORT),
});