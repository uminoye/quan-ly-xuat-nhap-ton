require('dotenv').config();
const db = require('./src/config/database');

async function test() {
    try {
        const result = await db.getAll(`
            SELECT
                cr.id, cr.compensation_no, cr.return_id, cr.order_id,
                cr.defect_type, cr.total_items, cr.status,
                cr.created_at, cr.updated_at, cr.responded_at, cr.resolution_note,
                so.order_no, c.company_name AS customer_name,
                w.name AS warehouse_name, w.warehouse_code,
                (SELECT json_agg(json_build_object(
                    'product_id', ci.product_id,
                    'product_name', p.name,
                    'sku', p.sku,
                    'defective_qty', ci.defective_qty,
                    'unit_price', ci.unit_price
                )) FROM compensation_items ci
                JOIN products p ON p.id = ci.product_id
                WHERE ci.compensation_id = cr.id) AS items
            FROM compensation_requests cr
            JOIN return_requests rr ON rr.id = cr.return_id
            JOIN sales_orders so ON cr.order_id = so.id
            JOIN customers c ON so.customer_id = c.id
            LEFT JOIN warehouses w ON w.id = cr.warehouse_id
            WHERE DATE_TRUNC('month', cr.created_at) = DATE_TRUNC('month', (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date)
        `);
        console.log("Success:", result.length);
    } catch (e) {
        console.error("Error:", e);
    } finally {
        process.exit(0);
    }
}
test();
