const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/mantto',
});

async function check() {
  const res = await pool.query("SELECT DISTINCT rol FROM usuarios");
  console.log('Roles in DB:', res.rows);
  const constraintRes = await pool.query("SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'usuarios'::regclass");
  console.log('Constraints on usuarios:', constraintRes.rows);
  pool.end();
}
check();
