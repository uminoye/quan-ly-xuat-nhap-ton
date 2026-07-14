require('dotenv').config();
const db = require('./src/config/database');

async function fixDates() {
  console.log("Fixing sales_orders...");
  await db.run("UPDATE sales_orders SET created_at = order_date, updated_at = order_date");
  
  console.log("Fixing production_receipts...");
  await db.run("UPDATE production_receipts SET created_at = receipt_date, updated_at = receipt_date");
  
  console.log("Fixing stock_outbound_notes...");
  await db.run("UPDATE stock_outbound_notes SET created_at = export_date, updated_at = export_date WHERE export_date IS NOT NULL");
  
  console.log("Fixing shipping_orders...");
  await db.run("UPDATE shipping_orders SET created_at = assigned_at, updated_at = assigned_at");
  
  console.log("Done!");
}

fixDates().catch(console.error).finally(() => process.exit(0));
