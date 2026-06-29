require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function check() {
  // Test warehouses table
  try {
    const r = await pool.query('SELECT * FROM warehouses LIMIT 5');
    console.log('warehouses rows:', r.rows.length);
    console.log('columns:', Object.keys(r.rows[0] || {}).join(', '));
    if (r.rows[0]) console.log('sample:', JSON.stringify(r.rows[0]));
  } catch (e) {
    console.log('warehouses ERROR:', e.message);
  }

  // Test inventory_balances
  try {
    const r = await pool.query('SELECT COUNT(*) FROM inventory_balances');
    console.log('inventory_balances:', r.rows[0].count);
  } catch (e) {
    console.log('inventory_balances ERROR:', e.message);
  }

  await pool.end();
}
check().catch(e => { console.error(e.message); process.exit(1); });
