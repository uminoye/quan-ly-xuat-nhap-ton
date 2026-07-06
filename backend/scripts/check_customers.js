require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

(async () => {
  const c = await pool.connect();
  try {
    const cols = await c.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'customers' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    console.log('=== CUSTOMERS TABLE SCHEMA ===');
    cols.rows.forEach(r => console.log(`  ${r.column_name} | ${r.data_type} | nullable:${r.is_nullable} | default:${r.column_default}`));

    // Also check if sku column exists anywhere
    const skuCheck = await c.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'customers' AND column_name ILIKE '%sku%'
    `);
    console.log('\nSKU columns in customers:', skuCheck.rows.map(r => r.column_name));

    // Check auto_codes table
    const acRows = await c.query('SELECT * FROM auto_codes WHERE prefix = $1 LIMIT 3', ['KH']);
    console.log('\nauto_codes for KH prefix:', acRows.rows);

    // Try the actual INSERT
    console.log('\n=== Testing INSERT ===');
    try {
      const newCode = 'KH0003';
      const ins = await c.query(`
        INSERT INTO customers (customer_code, company_name, phone, address, contact_person, created_by)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
      `, [newCode, 'Test Company', '0123456789', 'Test Address', 'Test Person', null]);
      console.log('INSERT OK, id:', ins.rows[0].id);
      await c.query('DELETE FROM customers WHERE id = $1', [ins.rows[0].id]);
    } catch (e) {
      console.error('INSERT ERROR:', e.message);
      console.error('  code:', e.code);
    }
  } finally {
    c.release();
    await pool.end();
  }
})();
