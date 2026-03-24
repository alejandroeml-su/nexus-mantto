import { Pool } from 'pg';

// Forzar la desactivación de la validación estricta de SSL en Vercel
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

let connString = process.env.DATABASE_URL || 'postgres://postgres.ljqwwjmqzvmiketkhrri:V5UVbplLOgbAikGz@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x';

// Asegurar que si la URL de Vercel tiene sslmode=require, no entre en conflicto
if (connString.includes('sslmode=require')) {
  connString = connString.replace('?sslmode=require', '?sslmode=no-verify');
  connString = connString.replace('&sslmode=require', '&sslmode=no-verify');
}

const pool = new Pool({
  connectionString: connString,
  ssl: {
    rejectUnauthorized: false
  }
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export default pool;
