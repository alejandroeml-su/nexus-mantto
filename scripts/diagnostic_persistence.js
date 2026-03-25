const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function diagnostic() {
  try {
    console.log('--- Testing Pais Insert ---');
    const resPais = await pool.query("INSERT INTO paises (nombre, codigo) VALUES ($1, $2) RETURNING id", ['Test Pais ' + Date.now(), 'TEST']);
    console.log('Inserted Pais ID:', resPais.rows[0].id);

    console.log('--- Testing Sede Insert ---');
    const resSede = await pool.query("INSERT INTO sedes (nombre, direccion, pais_id) VALUES ($1, $2, $3) RETURNING id", ['Test Sede ' + Date.now(), 'Test Dir', resPais.rows[0].id]);
    console.log('Inserted Sede ID:', resSede.rows[0].id);

    console.log('--- Current Counts ---');
    const counts = await pool.query(`
        SELECT 
            (SELECT COUNT(*) FROM paises) as paises_count,
            (SELECT COUNT(*) FROM sedes) as sedes_count
    `);
    console.log('Counts:', counts.rows[0]);

    // Clean up test data
    await pool.query("DELETE FROM sedes WHERE id = $1", [resSede.rows[0].id]);
    await pool.query("DELETE FROM paises WHERE id = $1", [resPais.rows[0].id]);
    console.log('Test cleanup complete.');

  } catch (err) {
    console.error('DIAGNOSTIC FAILED:', err);
  } finally {
    pool.end();
  }
}

diagnostic();
