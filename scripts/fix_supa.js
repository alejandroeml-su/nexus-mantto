
const { Client } = require('pg');

// USE THE SUPABASE URL FROM db.ts
const supaUrl = 'postgres://postgres.ljqwwjmqzvmiketkhrri:V5UVbplLOgbAikGz@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x';
// Replace for supa-verify
const dbUrl = supaUrl.replace('?sslmode=require', '?sslmode=no-verify');

const client = new Client({
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

async function fixSupa() {
  try {
    await client.connect();
    console.log('Connected to SUPABASE');

    await client.query(`
      ALTER TABLE activos 
      ADD COLUMN IF NOT EXISTS area_id UUID REFERENCES areas(id) ON DELETE SET NULL;
    `);
    console.log('Added area_id column to activos on Supabase');

    // Also populate hierarchy for existing assets on Supabase
    await client.query(`
      UPDATE activos a
      SET 
        area_id = u.area_id,
        sede_id = ar.sede_id
      FROM ubicaciones u
      JOIN areas ar ON u.area_id = ar.id
      WHERE a.ubicacion_id = u.id;
    `);
    console.log('Updated hierarchy on Supabase');

  } catch (err) {
    console.error('Supa fix failed:', err);
  } finally {
    await client.end();
  }
}

fixSupa();
