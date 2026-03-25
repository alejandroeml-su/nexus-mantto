const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function check() {
  try {
    const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('Tables:', res.rows.map(r => r.table_name).join(', '));
    
    if (res.rows.find(r => r.table_name === 'paises')) {
        const columns = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'paises'");
        console.log('Columns in "paises":', columns.rows);
    } else {
        console.log('Table "paises" MISSING!');
    }
  } catch (err) {
    console.error('Check failed:', err);
  } finally {
    pool.end();
  }
}

check();
