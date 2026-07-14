const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_urDq5LjKC1Zp@ep-plain-waterfall-aor6r9l0-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false },
});

async function truncate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const tables = [
      'auto_codes',
      'carrier_claims',
      'compensation_items',
      'compensation_requests',
      'customers',
      'delivery_requests',
      'inventory_balances',
      'inventory_transactions',
      'notifications',
      'production_receipt_items',
      'production_receipts',
      'products',
      'return_items',
      'return_requests',
      'sales_order_items',
      'sales_orders',
      'shipping_orders',
      'stock_outbound_note_items',
      'stock_outbound_notes',
      'supplier_claims',
      'warehouses',
    ];

    for (const t of tables) {
      await client.query(`TRUNCATE TABLE "${t}" RESTART IDENTITY CASCADE`);
      console.log(`✓ Da xoa: ${t}`);
    }

    await client.query('COMMIT');
    console.log('\nXong! Tat ca data da bi xoa (tru users/roles).');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Loi:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

truncate();
