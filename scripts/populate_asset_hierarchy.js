
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const dbUrlMatch = envContent.match(/DATABASE_URL=(.*)/);
const dbUrl = dbUrlMatch ? dbUrlMatch[1].trim() : null;

const client = new Client({
  connectionString: dbUrl,
  ssl: dbUrl.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function updateHierarchy() {
  try {
    await client.connect();
    console.log('Connected to database');

    const res = await client.query(`
      UPDATE activos a
      SET 
        area_id = u.area_id,
        sede_id = ar.sede_id
      FROM ubicaciones u
      JOIN areas ar ON u.area_id = ar.id
      WHERE a.ubicacion_id = u.id;
    `);
    
    console.log(`Updated hierarchy for ${res.rowCount} assets.`);

  } catch (err) {
    console.error('Update failed:', err);
  } finally {
    await client.end();
  }
}

updateHierarchy();
