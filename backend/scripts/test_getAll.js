require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Simulate what getAllCustomers does
(async () => {
  const c = await pool.connect();
  try {
    const rows = await c.query(`
        SELECT c.*, u.full_name as creator_name
        FROM customers c
        LEFT JOIN users u ON c.created_by = u.id
        ORDER BY c.id DESC
    `);
    console.log('Query OK, rows:', rows.rows.length);
    console.log(JSON.stringify(rows.rows, null, 2));
  } catch (e) {
    console.error('ERROR:', e.message);
    console.error('CODE:', e.code);
    console.error('STACK:', e.stack);
  } finally {
    c.release();
    await pool.end();
  }
})();
