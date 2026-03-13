const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/mantto',
});

async function resetDB() {
  try {
    console.log('Resetting 4NF database...');
    await pool.query(`
      DROP TABLE IF EXISTS historial_cambios CASCADE;
      DROP TABLE IF EXISTS evidencias CASCADE;
      DROP TABLE IF EXISTS mantenimiento_items CASCADE;
      DROP TABLE IF EXISTS mantenimiento_actividades CASCADE;
      DROP TABLE IF EXISTS mantenimiento_tecnicos CASCADE;
      DROP TABLE IF EXISTS mantenimientos CASCADE;
      DROP TABLE IF EXISTS activos CASCADE;
      DROP TABLE IF EXISTS usuarios CASCADE;
      DROP TABLE IF EXISTS modelos CASCADE;
      DROP TABLE IF EXISTS ubicaciones CASCADE;
      DROP TABLE IF EXISTS areas CASCADE;
      DROP TABLE IF EXISTS estados_mantenimiento CASCADE;
      DROP TABLE IF EXISTS prioridades CASCADE;
      DROP TABLE IF EXISTS tipos_mantenimiento CASCADE;
      DROP TABLE IF EXISTS estados_activo CASCADE;
      DROP TABLE IF EXISTS marcas CASCADE;
      DROP TABLE IF EXISTS tipos_activo CASCADE;
      DROP TABLE IF EXISTS departamentos CASCADE;
      DROP TABLE IF EXISTS sedes CASCADE;
    `);

    const schema = fs.readFileSync(path.join(__dirname, '../src/db/schema.sql'), 'utf8');
    await pool.query(schema);
    console.log('Database reset and clean 4NF schema applied.');
  } catch (err) {
    console.error('Error resetting database:', err);
  } finally {
    pool.end();
  }
}

resetDB();
