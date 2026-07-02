-- Reset all products and SKU sequence
-- Run this in Neon SQL Editor
-- Order: child tables without CASCADE -> parent tables -> grand-parent tables -> products

-- Step 1: Delete child of products (no ON DELETE CASCADE)
DELETE FROM inventory_balances;
DELETE FROM inventory_transactions;

-- Step 2: Delete parents that reference sales_orders/production_receipts
-- stock_outbound_note_items has ON DELETE CASCADE on stock_outbound_notes
-- stock_outbound_notes references sales_orders
DELETE FROM stock_outbound_note_items;
DELETE FROM stock_outbound_notes;

-- Step 3: Delete order/receipt records (their items cascade automatically)
DELETE FROM delivery_requests;
DELETE FROM sales_order_items;
DELETE FROM production_receipt_items;
DELETE FROM sales_orders;
DELETE FROM production_receipts;

-- Step 4: Delete products and SKU sequence
DELETE FROM products;
DELETE FROM auto_codes WHERE prefix = 'SP';

-- Verify
SELECT 'products' AS tbl, COUNT(*) AS rows FROM products
UNION ALL
SELECT 'auto_codes SP', COUNT(*) FROM auto_codes WHERE prefix = 'SP';