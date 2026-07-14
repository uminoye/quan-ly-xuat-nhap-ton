-- Cảnh báo: Lệnh này sẽ XÓA TOÀN BỘ DỮ LIỆU trong các bảng sau
-- (giữ lại users và roles). Không thể hoàn tác.

BEGIN;

TRUNCATE TABLE
    auto_codes,
    carrier_claims,
    compensation_items,
    compensation_requests,
    customers,
    delivery_requests,
    inventory_balances,
    inventory_transactions,
    notifications,
    production_receipt_items,
    production_receipts,
    products,
    return_items,
    return_requests,
    sales_order_items,
    sales_orders,
    shipping_orders,
    stock_outbound_note_items,
    stock_outbound_notes,
    supplier_claims,
    warehouses
RESTART IDENTITY CASCADE;

COMMIT;