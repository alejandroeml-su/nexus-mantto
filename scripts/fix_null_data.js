const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/mantto',
});

async function fixData() {
  try {
    console.log('Checking for null states...');
    const res = await pool.query("UPDATE mantenimientos SET estado = 'Programado' WHERE estado IS NULL RETURNING id");
    console.log(`Updated ${res.rowCount} rows with null state.`);
    
    // Also check if any other required fields are null
    const res2 = await pool.query("UPDATE mantenimientos SET tipo = 'Preventivo' WHERE tipo IS NULL RETURNING id");
    console.log(`Updated ${res2.rowCount} rows with null tipo.`);
    
    const res3 = await pool.query("UPDATE mantenimientos SET prioridad = 'Media' WHERE prioridad IS NULL RETURNING id");
    console.log(`Updated ${res3.rowCount} rows with null prioridad.`);

  } catch (err) {
    console.error('Error fixing data:', err);
  } finally {
    pool.end();
  }
}

fixData();
