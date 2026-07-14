require('dotenv').config();
const db = require('./src/config/database');
async function test() {
  const t1 = await db.getAll("SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as d, count(*) FROM production_receipts GROUP BY d");
  const t2 = await db.getAll("SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as d, count(*) FROM stock_outbound_notes GROUP BY d");
  const t3 = await db.getAll("SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as d, count(*) FROM return_requests GROUP BY d");
  const t4 = await db.getAll("SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as d, count(*) FROM shipping_orders GROUP BY d");
  console.log("production_receipts", t1);
  console.log("stock_outbound_notes", t2);
  console.log("return_requests", t3);
  console.log("shipping_orders", t4);
}
test().catch(console.error).finally(() => process.exit(0));
