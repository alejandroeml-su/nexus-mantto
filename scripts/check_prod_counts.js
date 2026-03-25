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

async function check() {
  try {
    const res = await pool.query("SELECT COUNT(*) FROM paises");
    console.log('Production Paises Count:', res.rows[0].count);
    
    const resSedes = await pool.query("SELECT COUNT(*) FROM sedes");
    console.log('Production Sedes Count:', resSedes.rows[0].count);
  } catch (err) {
    console.error('Check failed:', err);
  } finally {
    pool.end();
  }
}

check();
