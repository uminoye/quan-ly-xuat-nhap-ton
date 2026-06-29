-- Migration: Add auto_codes table for sequential code generation
-- Run this ONCE on your Neon database (SQL Editor in Neon dashboard)

CREATE TABLE IF NOT EXISTS auto_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    prefix VARCHAR(20) NOT NULL,
    year INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_auto_codes_prefix_year ON auto_codes(prefix, year);
CREATE INDEX IF NOT EXISTS idx_auto_codes_code ON auto_codes(code);

-- Seed existing codes from current tables so the sequence continues correctly
INSERT INTO auto_codes (code, prefix, year)
SELECT receipt_no, 'YC', EXTRACT(YEAR FROM CURRENT_DATE) FROM production_receipts WHERE receipt_no LIKE 'YC-%'
ON CONFLICT DO NOTHING;

INSERT INTO auto_codes (code, prefix, year)
SELECT order_no, 'SO', EXTRACT(YEAR FROM CURRENT_DATE) FROM sales_orders WHERE order_no LIKE 'SO-%'
ON CONFLICT DO NOTHING;

INSERT INTO auto_codes (code, prefix, year)
SELECT outbound_no, 'PXK', EXTRACT(YEAR FROM CURRENT_DATE) FROM stock_outbound_notes WHERE outbound_no LIKE 'PXK-%'
ON CONFLICT DO NOTHING;

INSERT INTO auto_codes (code, prefix, year)
SELECT sku, 'SP', EXTRACT(YEAR FROM CURRENT_DATE) FROM products WHERE sku LIKE 'SP-%'
ON CONFLICT DO NOTHING;

INSERT INTO auto_codes (code, prefix, year)
SELECT customer_code, 'KH', EXTRACT(YEAR FROM CURRENT_DATE) FROM customers WHERE customer_code LIKE 'KH-%'
ON CONFLICT DO NOTHING;
