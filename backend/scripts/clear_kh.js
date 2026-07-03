require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  console.log('Connecting...');
  const c = await pool.connect();
  console.log('Connected, starting transaction...');
  await c.query('BEGIN');
  console.log('Deleting customers...');
  await c.query('DELETE FROM customers');
  console.log('Deleting KH auto_codes...');
  await c.query("DELETE FROM auto_codes WHERE prefix = 'KH'");
  console.log('Committing...');
  await c.query('COMMIT');
  c.release();
  await pool.end();
  console.log('Cleared customers and KH codes');
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
