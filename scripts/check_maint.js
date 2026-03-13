const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/mantto',
});

async function check() {
  const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'mantenimientos' AND column_name LIKE '%at%'");
  console.table(res.rows);
  pool.end();
}
check();
