const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: 'postgres://postgres.ljqwwjmqzvmiketkhrri:V5UVbplLOgbAikGz@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x',
});

async function runSchema() {
  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, '../src/db/schema.sql'), 'utf-8');
    console.log('Running schema...');
    await pool.query(schemaSql);
    console.log('Schema created successfully');
  } catch (err) {
    console.error('Error running schema:', err);
  } finally {
    pool.end();
  }
}

runSchema();
