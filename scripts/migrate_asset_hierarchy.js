
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function migrate() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Add area_id to activos
    await client.query(`
      ALTER TABLE activos 
      ADD COLUMN IF NOT EXISTS area_id UUID REFERENCES areas(id) ON DELETE SET NULL;
    `);
    console.log('Added area_id column to activos table');

    // Update existing records: if an asset has a ubicacion_id, 
    // we can find its area_id and sede_id to populate the redundant columns.
    await client.query(`
      UPDATE activos a
      SET 
        area_id = u.area_id,
        sede_id = ar.sede_id
      FROM ubicaciones u
      JOIN areas ar ON u.area_id = ar.id
      WHERE a.ubicacion_id = u.id;
    `);
    console.log('Updated existing asset localization hierarchy');

  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

migrate();
