require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { Pool } = require('pg');

console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);
console.log('URL host:', process.env.DATABASE_URL?.split('@')[1]?.split('/')[0]);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

(async () => {
  const c = await pool.connect();
  try {
    // Check tables
    const tables = await c.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('\nTables found:', tables.rows.length);
    tables.rows.forEach(r => console.log(' -', r.table_name));

    // Test customer query
    console.log('\nTesting customers query...');
    const rows = await c.query('SELECT id, customer_code, company_name FROM customers LIMIT 5');
    console.log('Customer rows:', rows.rows.length);
    rows.rows.forEach(r => console.log(' -', JSON.stringify(r)));

  } catch (e) {
    console.error('ERROR:', e.message);
    console.error('CODE:', e.code);
  } finally {
    c.release();
    await pool.end();
  }
})();
