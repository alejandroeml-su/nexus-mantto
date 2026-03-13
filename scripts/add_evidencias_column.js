const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/mantto',
});

async function migrate() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS evidencias (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        mantenimiento_id UUID REFERENCES mantenimientos(id) ON DELETE CASCADE,
        tipo TEXT,
        url TEXT NOT NULL,
        nombre TEXT,
        descripcion TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Check if column exists, if not add it
    const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'evidencias' AND column_name = 'nombre'");
    if (res.rows.length === 0) {
        await pool.query("ALTER TABLE evidencias ADD COLUMN nombre TEXT");
    }

    console.log('Migration completed successfully');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    pool.end();
  }
}
migrate();
