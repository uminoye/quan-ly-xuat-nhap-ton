require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function test() {
  // Test delivery_requests
  try {
    const r = await pool.query('SELECT COUNT(*) FROM delivery_requests');
    console.log('[delivery_requests] OK:', r.rows[0].count);
  } catch (e) {
    console.log('[delivery_requests] ERROR:', e.message);
  }

  // Test stock_outbound_note_items
  try {
    const r = await pool.query('SELECT COUNT(*) FROM stock_outbound_note_items');
    console.log('[stock_outbound_note_items] OK:', r.rows[0].count);
  } catch (e) {
    console.log('[stock_outbound_note_items] ERROR:', e.message);
  }

  // Test outbound controller query (getPendingOutboundRequests)
  try {
    const query = `
      SELECT s.id FROM sales_orders s
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE s.status IN ('warehouse_processing', 'shipping', 'completed', 'returned', 'canceled')
      LIMIT 1
    `;
    const r = await pool.query(query);
    console.log('[getPendingOutboundRequests base] OK:', r.rows.length, 'rows');
  } catch (e) {
    console.log('[getPendingOutboundRequests base] ERROR:', e.message);
  }

  // Test full getPendingOutboundRequests
  try {
    const r = await pool.query(`
      SELECT
        s.id, s.order_no, s.status AS order_status,
        (
          SELECT d.status FROM delivery_requests d
          WHERE d.order_id = s.id ORDER BY d.id DESC LIMIT 1
        ) AS delivery_status
      FROM sales_orders s
      WHERE s.status IN ('warehouse_processing', 'shipping', 'completed', 'returned', 'canceled')
      LIMIT 2
    `);
    console.log('[getPendingOutboundRequests full] OK:', r.rows.length, 'rows');
  } catch (e) {
    console.log('[getPendingOutboundRequests full] ERROR:', e.message, '(code:', e.code, ')');
  }

  await pool.end();
}
test().catch(e => { console.error(e.message); process.exit(1); });
