require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  const c = await pool.connect();
  try {
    const r = await c.query('SELECT * FROM customers LIMIT 3');
    console.log('OK, rows:', r.rows.length);
    console.log(JSON.stringify(r.rows, null, 2));
  } catch (e) {
    console.error('ERROR:', e.message);
    console.error('CODE:', e.code);
  } finally {
    c.release();
    await pool.end();
  }
})();
