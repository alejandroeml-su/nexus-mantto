const { Pool } = require('pg');

let connString = 'postgres://postgres.ljqwwjmqzvmiketkhrri:V5UVbplLOgbAikGz@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x';
if (connString.includes('sslmode=require')) {
  connString = connString.replace('?sslmode=require', '?sslmode=no-verify');
  connString = connString.replace('&sslmode=require', '&sslmode=no-verify');
}
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const pool = new Pool({
  connectionString: connString,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  console.log('Starting migration for hierarchy status (Areas & Ubicaciones)...');
  try {
    await pool.query(`
      ALTER TABLE areas ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;
      ALTER TABLE ubicaciones ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;
    `);
    console.log('Added "activo" column to "areas" and "ubicaciones".');
    console.log('Migration successful on production!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    pool.end();
  }
}

migrate();
