// src/app/api/cards/db.ts
import { Pool } from 'pg';

export const db = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DATABASE,
  password: String(process.env.POSTGRES_PASSWORD),//mdp
  port: Number(process.env.POSTGRES_PORT),
});
