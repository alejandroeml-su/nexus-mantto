const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/mantto',
});

async function checkTable() {
  try {
    const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'evidencias'");
    console.log('Columns in table evidencias:');
    console.table(res.rows);
  } catch (err) {
    console.error('Error checking table:', err);
  } finally {
    pool.end();
  }
}
checkTable();
