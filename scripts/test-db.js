const { Pool } = require('pg');

async function testConnection() {
  const url = 'postgres://postgres.ljqwwjmqzvmiketkhrri:V5UVbplLOgbAikGz@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x';
  console.log("Testing with ssl: { rejectUnauthorized: false }");
  const pool = new Pool({
    connectionString: url,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    const res = await pool.query('SELECT NOW()');
    console.log("Success 1:", res.rows);
  } catch (err) {
    console.error("Error 1:", err.message);
  }
  await pool.end();

  console.log("\nTesting without sslmode=require in URL but with ssl object");
  const pool2 = new Pool({
    connectionString: url.replace('?sslmode=require&supa=base-pooler.x', ''),
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    const res = await pool2.query('SELECT NOW()');
    console.log("Success 2:", res.rows);
  } catch (err) {
    console.error("Error 2:", err.message);
  }
  await pool2.end();
  
  console.log("\nTesting without ssl object but with sslmode=require");
  const pool3 = new Pool({
    connectionString: url
  });

  try {
    const res = await pool3.query('SELECT NOW()');
    console.log("Success 3:", res.rows);
  } catch (err) {
    console.error("Error 3:", err.message);
  }
  await pool3.end();
}

testConnection();
