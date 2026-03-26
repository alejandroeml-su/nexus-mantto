
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkSchema() {
  try {
    await client.connect();
    console.log('Connected to database');

    const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'activos';
    `);
    
    console.log('Columns in activos table:');
    res.rows.forEach(row => console.log(`- ${row.column_name}`));

    // Also check if 'area_id' exists
    const hasAreaId = res.rows.some(row => row.column_name === 'area_id');
    console.log(`\nHas area_id: ${hasAreaId}`);

    if (!hasAreaId) {
      console.log('Re-attempting migration...');
      await client.query(`ALTER TABLE activos ADD COLUMN IF NOT EXISTS area_id UUID REFERENCES areas(id) ON DELETE SET NULL;`);
      console.log('Migration successful.');
    }

  } catch (err) {
    console.error('Check failed:', err);
  } finally {
    await client.end();
  }
}

checkSchema();
