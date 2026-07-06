require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

(async () => {
  const c = await pool.connect();
  try {
    // Check auto_codes constraints/indexes
    const idxs = await c.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'auto_codes' AND schemaname = 'public'
    `);
    console.log('=== AUTO_CODES indexes/constraints ===');
    idxs.rows.forEach(r => console.log(' ', r.indexname, '->', r.indexdef));

    // Check customers constraints
    const custIdxs = await c.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'customers' AND schemaname = 'public'
    `);
    console.log('\n=== CUSTOMERS indexes/constraints ===');
    custIdxs.rows.forEach(r => console.log(' ', r.indexname, '->', r.indexdef));

    // Test generateCode flow end-to-end (simulating what controller does)
    console.log('\n=== Testing full create flow ===');
    await c.query('BEGIN');
    try {
      // 1. Generate code (simulate)
      const lockResult = await c.query(
        `SELECT code FROM auto_codes WHERE code LIKE $1 ORDER BY code DESC LIMIT 1 FOR UPDATE`,
        ['KH-2026-%']
      );
      const row = lockResult.rows[0];
      let nextNum = 1;
      if (row?.code) {
        const lastNum = parseInt(row.code.split('-').pop(), 10);
        nextNum = isNaN(lastNum) ? 1 : lastNum + 1;
      }
      const newCode = `KH-2026-${String(nextNum).padStart(4, '0')}`;
      console.log('Generated code:', newCode);

      // 2. Insert auto_code
      await c.query(
        `INSERT INTO auto_codes (code, prefix, year) VALUES ($1, $2, $3) ON CONFLICT (code) DO NOTHING`,
        [newCode, 'KH', 2026]
      );

      // 3. Insert customer
      const ins = await c.query(
        `INSERT INTO customers (customer_code, company_name, phone, address, contact_person, created_by)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, customer_code, company_name`,
        [newCode, 'Test Neon', '0123456789', 'Test Address', 'Test Person', null]
      );
      console.log('Customer inserted:', ins.rows[0]);

      // Rollback test data
      await c.query('DELETE FROM customers WHERE id = $1', [ins.rows[0].id]);
      await c.query('DELETE FROM auto_codes WHERE code = $1', [newCode]);
      await c.query('COMMIT');
      console.log('\nFull flow: OK');
    } catch (e) {
      await c.query('ROLLBACK');
      console.error('Full flow ERROR:', e.message);
      console.error('  code:', e.code);
    }
  } finally {
    c.release();
    await pool.end();
  }
})();
