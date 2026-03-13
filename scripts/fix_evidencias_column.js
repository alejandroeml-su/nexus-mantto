const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/mantto',
});

async function fixColumn() {
  try {
    // Rename created_at to creado_at if created_at exists
    const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'evidencias' AND column_name = 'created_at'");
    if (res.rows.length > 0) {
        await pool.query("ALTER TABLE evidencias RENAME COLUMN created_at TO creado_at");
        console.log('Column renamed to creado_at');
    } else {
        console.log('Column created_at not found, maybe already renamed or doesnt exist');
    }
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    pool.end();
  }
}
fixColumn();
