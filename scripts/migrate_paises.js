const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function migrate() {
  console.log('Starting migration for Países...');
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS paises (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          nombre VARCHAR(100) NOT NULL UNIQUE,
          codigo VARCHAR(10)
      );
    `);
    console.log('Table "paises" created or already exists.');

    // Since 'sedes' table exists, add column 'pais_id' 
    await pool.query(`
      ALTER TABLE sedes ADD COLUMN IF NOT EXISTS pais_id UUID REFERENCES paises(id);
    `);
    console.log('Added "pais_id" to "sedes".');

    console.log('Migration successful!');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    pool.end();
  }
}

migrate();
