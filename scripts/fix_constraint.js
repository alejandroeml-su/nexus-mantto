const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/mantto',
});

async function fix() {
  try {
    console.log('Fixing usuarios_rol_check constraint...');
    await pool.query("ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check");
    await pool.query("ALTER TABLE usuarios ADD CONSTRAINT usuarios_rol_check CHECK (rol IN ('SuperAdmin', 'Admin', 'Jefe', 'Técnico'))");
    console.log('Constraint fixed!');
  } catch (err) {
    console.error('Error fixing constraint:', err);
  } finally {
    pool.end();
  }
}
fix();
