const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://postgres.ljqwwjmqzvmiketkhrri:V5UVbplLOgbAikGz@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x',
});

async function fixSchema() {
  try {
    console.log('Fixing schema in production...');
    await pool.query('ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS password VARCHAR(255);');
    await pool.query('ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);');
    await pool.query('ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP WITH TIME ZONE;');
    
    // Drop the old constraint if it exists
    await pool.query('ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;');
    
    // Add the new constraint
    await pool.query("ALTER TABLE usuarios ADD CONSTRAINT usuarios_rol_check CHECK (rol IN ('Super Admin', 'Admin', 'Jefe', 'Técnico'));");
    
    console.log('Production schema fixed successfully.');
  } catch (err) {
    console.error('Error fixing schema:', err);
  } finally {
    pool.end();
  }
}

fixSchema();
