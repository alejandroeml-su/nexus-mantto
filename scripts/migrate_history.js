const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/mantto',
});

async function migrate() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS historial_cambios (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        mantenimiento_id UUID REFERENCES mantenimientos(id) ON DELETE CASCADE,
        campo TEXT NOT NULL,
        valor_anterior TEXT,
        valor_nuevo TEXT,
        usuario_rol TEXT,
        fecha_cambio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Migration completed successfully');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    pool.end();
  }
}
migrate();
