const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function migrate() {
  console.log('Starting migration for direct sede_id in activos...');
  try {
    // Add sede_id to activos
    await pool.query(`
      ALTER TABLE activos ADD COLUMN IF NOT EXISTS sede_id UUID REFERENCES sedes(id);
    `);
    console.log('Added "sede_id" to "activos".');

    // Attempt to migrate existing data for activos through the hierarchy:
    // activos -> ubicaciones -> areas -> sedes
    await pool.query(`
      UPDATE activos a
      SET sede_id = ar.sede_id
      FROM ubicaciones u, areas ar
      WHERE a.ubicacion_id = u.id AND u.area_id = ar.id AND a.sede_id IS NULL;
    `);
    console.log('Migrated existing data to new "sede_id" column.');

    console.log('Migration successful!');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    pool.end();
  }
}

migrate();
