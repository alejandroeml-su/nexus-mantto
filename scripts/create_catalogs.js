const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/mantto',
});

async function migrate() {
  try {
    console.log('Running catalogs migration...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tipos_activo (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nombre TEXT UNIQUE NOT NULL
      );

      CREATE TABLE IF NOT EXISTS marcas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nombre TEXT UNIQUE NOT NULL
      );

      CREATE TABLE IF NOT EXISTS modelos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nombre TEXT UNIQUE NOT NULL
      );

      CREATE TABLE IF NOT EXISTS estados_activo (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nombre TEXT UNIQUE NOT NULL
      );
    `);

    // Initial Data
    await pool.query(`
      INSERT INTO tipos_activo (nombre) VALUES ('General'), ('HVAC'), ('Elevación'), ('Generador'), ('Seguridad'), ('Mobiliario') ON CONFLICT DO NOTHING;
      INSERT INTO marcas (nombre) VALUES ('Carrier'), ('Otis'), ('Caterpillar'), ('Samsung'), ('Generic') ON CONFLICT DO NOTHING;
      INSERT INTO modelos (nombre) VALUES ('CAT-22'), ('Gen2'), ('X-500'), ('S-100') ON CONFLICT DO NOTHING;
      INSERT INTO estados_activo (nombre) VALUES ('Operativo'), ('En Mantenimiento'), ('Fuera de Servicio'), ('Baja') ON CONFLICT DO NOTHING;
    `);

    console.log('Catalogs migration completed');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    pool.end();
  }
}
migrate();
