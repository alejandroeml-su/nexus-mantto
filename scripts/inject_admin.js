const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/mantto',
});

async function inject() {
  try {
    console.log('Injecting Super Admin...');
    
    const checkRes = await pool.query('SELECT * FROM usuarios WHERE email = $1', ['emartinez@complejoavante.com']);
    if (checkRes.rows.length > 0) {
      console.log('User already exists, updating password and role...');
      const hashedPassword = await bcrypt.hash('avante26', 10);
      await pool.query(
        'UPDATE usuarios SET nombre = $1, rol = $2, password = $3 WHERE email = $4',
        ['Edwin Martinez', 'Super Admin', hashedPassword, 'emartinez@complejoavante.com']
      );
      console.log('User updated successfully.');
      return;
    }

    const hashedPassword = await bcrypt.hash('avante26', 10);
    
    await pool.query(
      'INSERT INTO usuarios (nombre, email, rol, password) VALUES ($1, $2, $3, $4)',
      ['Edwin Martinez', 'emartinez@complejoavante.com', 'Super Admin', hashedPassword]
    );

    console.log('Super Admin injected successfully!');
  } catch (err) {
    console.error('Error injecting user:', err);
  } finally {
    pool.end();
  }
}

inject();
