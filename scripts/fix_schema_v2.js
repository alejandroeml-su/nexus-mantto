
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const dbUrlMatch = envContent.match(/DATABASE_URL=(.*)/);
const dbUrl = dbUrlMatch ? dbUrlMatch[1].trim() : null;

if (!dbUrl) {
  console.error('DATABASE_URL not found in .env.local');
  process.exit(1);
}

const client = new Client({
  connectionString: dbUrl,
  ssl: dbUrl.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function fix() {
  try {
    await client.connect();
    console.log('Connected to database');

    await client.query(`
      ALTER TABLE activos 
      ADD COLUMN IF NOT EXISTS area_id UUID REFERENCES areas(id) ON DELETE SET NULL;
    `);
    console.log('Added area_id column to activos');

    // Also verify columns
    const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'activos';
    `);
    console.log('Current columns in activos:');
    res.rows.forEach(r => console.log(`- ${r.column_name}`));

  } catch (err) {
    console.error('Fix failed:', err);
  } finally {
    await client.end();
  }
}

fix();
