require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const fmtDate = (d) => d.toISOString().slice(0, 19).replace('T', ' ');

async function main() {
    console.log('Bắt đầu thêm dữ liệu kho lỗi...');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Lấy Kho Lỗi
        const defectWhRes = await client.query(`SELECT id FROM warehouses WHERE warehouse_code = 'KHO-LOI' LIMIT 1`);
        if (!defectWhRes.rows.length) {
            console.log('Không tìm thấy Kho Lỗi. Bỏ qua.');
            return;
        }
        const defectWhId = defectWhRes.rows[0].id;

        // 2. Lấy danh sách 25 đơn hàng completed
        const ordersRes = await client.query(`
            SELECT id, order_no, order_date FROM sales_orders WHERE status = 'completed' ORDER BY RANDOM() LIMIT 25
        `);
        const orders = ordersRes.rows;

        let totalDefectiveItems = 0;

        for (let i = 0; i < orders.length; i++) {
            const order = orders[i];
            const reason = Math.random() > 0.5 ? 'loi_van_tai' : 'loi_nha_may';
            
            // Đổi status đơn hàng
            await client.query(`UPDATE sales_orders SET status = 'returned' WHERE id = $1`, [order.id]);

            // Lấy item của đơn
            const itemsRes = await client.query(`SELECT product_id, quantity, unit_price FROM sales_order_items WHERE order_id = $1`, [order.id]);
            const items = itemsRes.rows;
            if(!items.length) continue;

            const rrDate = new Date(order.order_date.getTime() + rand(1, 5) * 86400000);
            
            // Thêm return request
            const rrRes = await client.query(`
                INSERT INTO return_requests (order_id, customer_reject_reason, complaint_source, logistics_action, handling_result, status, created_at, logistics_note)
                VALUES ($1, 'hong_vo', 'after_delivery', $2, $2, 'return_completed', $3, 'Tao tự động để test')
                RETURNING id
            `, [order.id, reason, fmtDate(rrDate)]);
            const rrId = rrRes.rows[0].id;

            // Thêm return items
            for (const item of items) {
                const qty = Math.max(1, Math.floor(item.quantity / 2) || 1);
                await client.query(`
                    INSERT INTO return_items (return_id, product_id, quantity, is_defective)
                    VALUES ($1, $2, $3, true)
                `, [rrId, item.product_id, qty]);

                totalDefectiveItems += qty;

                // Cập nhật tồn kho lỗi
                await client.query(`
                    INSERT INTO inventory_balances (warehouse_id, product_id, on_hand_qty, updated_at)
                    VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
                    ON CONFLICT (warehouse_id, product_id)
                    DO UPDATE SET on_hand_qty = inventory_balances.on_hand_qty + $3, updated_at = CURRENT_TIMESTAMP
                `, [defectWhId, item.product_id, qty]);

                // Ghi log giao dịch
                await client.query(`
                    INSERT INTO inventory_transactions (warehouse_id, product_id, transaction_type, quantity, reference_type, reference_id, transaction_date)
                    VALUES ($1, $2, 'IN', $3, 'return', $4, CURRENT_TIMESTAMP)
                `, [defectWhId, item.product_id, qty, rrId]);
            }

            // Nếu lỗi nhà máy, thêm compensation request
            if (reason === 'loi_nha_may') {
                const compNo = `PBH-2026-${String(rand(100, 999)).padStart(4, '0')}`;
                const compRes = await client.query(`
                    INSERT INTO compensation_requests (compensation_no, return_id, order_id, warehouse_id, defect_type, status, total_items, created_at)
                    VALUES ($1, $2, $3, $4, 'loi_nha_may', 'pending', $5, CURRENT_TIMESTAMP)
                    RETURNING id
                `, [compNo, rrId, order.id, defectWhId, items.length]);
                const compId = compRes.rows[0].id;

                for (const item of items) {
                    await client.query(`
                        INSERT INTO compensation_items (compensation_id, product_id, defective_qty, unit_price)
                        VALUES ($1, $2, $3, $4)
                    `, [compId, item.product_id, Math.max(1, Math.floor(item.quantity / 2) || 1), item.unit_price]);
                }
            }
        }

        await client.query('COMMIT');
        console.log(`Thành công! Đã thêm ${orders.length} yêu cầu trả hàng lỗi và cập nhật kho lỗi (${totalDefectiveItems} sản phẩm).`);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Lỗi:', err);
    } finally {
        client.release();
        pool.end();
    }
}
main();
