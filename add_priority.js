const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/mantto'
});

async function run() {
  try {
    await pool.query("ALTER TABLE mantenimientos ADD COLUMN IF NOT EXISTS prioridad VARCHAR(20) DEFAULT 'Media';");
    console.log('Column prioridad added successfully');
  } catch (err) {
    console.error('Error adding column:', err);
  } finally {
    await pool.end();
  }
}

run();
