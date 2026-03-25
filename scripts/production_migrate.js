const { Pool } = require('pg');

// PRODUCTION CONNECTION STRING FROM db.ts
let connString = 'postgres://postgres.ljqwwjmqzvmiketkhrri:V5UVbplLOgbAikGz@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x';

// Sanitize as in db.ts
if (connString.includes('sslmode=require')) {
  connString = connString.replace('?sslmode=require', '?sslmode=no-verify');
  connString = connString.replace('&sslmode=require', '&sslmode=no-verify');
}

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const pool = new Pool({
  connectionString: connString,
  ssl: { rejectUnauthorized: false }
});

async function runProductionMigrations() {
  console.log('Starting PRODUCTION Migrations...');
  try {
    // 1. Create Paises
    await pool.query(`
      CREATE TABLE IF NOT EXISTS paises (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          nombre VARCHAR(100) NOT NULL UNIQUE,
          codigo VARCHAR(10)
      );
    `);
    console.log('Table "paises" ensured on production.');

    // 2. Link Sedes to Paises
    await pool.query(`
      ALTER TABLE sedes ADD COLUMN IF NOT EXISTS pais_id UUID REFERENCES paises(id);
    `);
    console.log('Column "pais_id" added to "sedes" on production.');

    // 3. Add Sede_id to Activos
    await pool.query(`
      ALTER TABLE activos ADD COLUMN IF NOT EXISTS sede_id UUID REFERENCES sedes(id);
    `);
    console.log('Column "sede_id" added to "activos" on production.');

    // 4. Data Migration (Sede -> Activo)
    await pool.query(`
      UPDATE activos a
      SET sede_id = ar.sede_id
      FROM ubicaciones u, areas ar
      WHERE a.ubicacion_id = u.id AND u.area_id = ar.id AND a.sede_id IS NULL;
    `);
    console.log('Data migration complete on production.');

    console.log('--- ALL PRODUCTION MIGRATIONS SUCCESSFUL ---');
  } catch (err) {
    console.error('PRODUCTION MIGRATION FAILED:', err);
  } finally {
    pool.end();
  }
}

runProductionMigrations();
