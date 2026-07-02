-- Reset all products and SKU sequence
-- Run this in Neon SQL Editor
-- Order matters: delete child tables BEFORE parent tables (FK)

DELETE FROM inventory_balances;
DELETE FROM production_receipt_items;
DELETE FROM sales_order_items;
DELETE FROM products;
DELETE FROM auto_codes WHERE prefix = 'SP';

-- Verify
SELECT 'products' AS table_name, COUNT(*) AS remaining FROM products
UNION ALL
SELECT 'auto_codes (SP)', COUNT(*) FROM auto_codes WHERE prefix = 'SP';