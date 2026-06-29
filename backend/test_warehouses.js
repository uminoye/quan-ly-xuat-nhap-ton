require('dotenv').config();
const { Pool } = require('pg');

async function test() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Test 1: warehouses table
    const wh = await pool.query('SELECT * FROM warehouses ORDER BY id ASC');
    console.log('warehouses:', wh.rows);

    // Test 2: products table
    const prod = await pool.query('SELECT id, sku, name, stock FROM products LIMIT 3');
    console.log('products sample:', prod.rows);

    // Test 3: Try the exact query from controller
    const rows = await pool.query('SELECT * FROM warehouses ORDER BY id ASC');
    console.log('controller query OK, rows:', rows.rowCount);

    // Test 4: Check if warehouse_code column exists
    const col = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'warehouses'
      ORDER BY ordinal_position
    `);
    console.log('warehouses columns:', col.rows);

  } catch (e) {
    console.error('ERROR:', e.code, '-', e.message);
    if (e.code === '42P01') console.log('-> Table does not exist');
  } finally {
    await pool.end();
  }
}
test();
