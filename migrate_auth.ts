import { query } from './src/lib/db';

async function migrate() {
  try {
    console.log('Migrating database...');
    await query(`
      ALTER TABLE usuarios 
      ADD COLUMN IF NOT EXISTS password VARCHAR(255),
      ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
      ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP WITH TIME ZONE;
    `);
    console.log('Migration successful: Added password fields to usuarios table.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

migrate();
