const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres123@localhost:5432/warehouse_db' });
(async () => {
  const c = await pool.connect();
  await c.query('BEGIN');
  await c.query('DELETE FROM customers');
  await c.query("DELETE FROM auto_codes WHERE prefix = 'KH'");
  await c.query('COMMIT');
  c.release();
  await pool.end();
  console.log('Done: cleared customers and KH codes');
})().catch(e => { console.error(e.message); process.exit(1); });
