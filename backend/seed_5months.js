/**
 * Seed 5 tháng dữ liệu: 03/2026 → 10/07/2026 (hôm nay)
 *
 * - GIỮ NGUYÊN: customers, users, warehouses, roles
 * - XÓA: products, inventory_balances, inventory_transactions, sales_orders,
 *        sales_order_items, production_receipts, production_receipt_items,
 *        stock_outbound_notes, stock_outbound_note_items, delivery_requests,
 *        shipping_orders, return_requests, return_items,
 *        compensation_requests, compensation_items, supplier_claims,
 *        carrier_claims, auto_codes (chỉ các mã liên quan đến orders/products)
 * - INSERT: ~25 sản phẩm điện tử + tồn kho + ~400 đơn hàng + phiếu nhập + xuất kho + vận chuyển + returns
 *
 * Chạy: cd backend && node seed_5months.js
 */
require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

if (!process.env.DATABASE_URL) {
    console.error('Loi: Chua co DATABASE_URL!');
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

const PASSWORD = '123456';
const HASH = bcrypt.hashSync(PASSWORD, 10);

// ============================================================
// HELPERS
// ============================================================
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min, max) => +(Math.random() * (max - min) + min).toFixed(2);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const weightedPick = (items) => {
    // items: [{ value, weight }]
    const total = items.reduce((s, i) => s + i.weight, 0);
    let r = Math.random() * total;
    for (const item of items) {
        if (r < item.weight) return item.value;
        r -= item.weight;
    }
    return items[items.length - 1].value;
};

const fmtDate = (d) => d.toISOString().slice(0, 19).replace('T', ' ');

// Random date trong khoảng 03/2026 → 10/07/2026
const START = new Date('2026-03-01T00:00:00');
const END   = new Date('2026-07-10T23:59:59');
const randomDate = () => new Date(START.getTime() + Math.random() * (END.getTime() - START.getTime()));

// Tránh cuối tuần (chủ nhật) - giảm tần suất
const randomBusinessDate = () => {
    let d;
    do { d = randomDate(); } while (d.getDay() === 0);
    return d;
};

// ============================================================
// CONSTANTS
// ============================================================
const ELECTRONIC_PRODUCTS = [
    // Điện thoại
    { name: 'iPhone 15 Pro Max 256GB',     unit: 'Chiec', category: 'Dien thoai',  sale_price: 29500000,  min_stock: 30, weight: 0.18 },
    { name: 'iPhone 15 128GB',              unit: 'Chiec', category: 'Dien thoai',  sale_price: 22500000,  min_stock: 40, weight: 0.15 },
    { name: 'Samsung Galaxy S24 Ultra',     unit: 'Chiec', category: 'Dien thoai',  sale_price: 31900000,  min_stock: 25, weight: 0.12 },
    { name: 'Samsung Galaxy A55 5G',        unit: 'Chiec', category: 'Dien thoai',  sale_price:  9490000,  min_stock: 50, weight: 0.10 },
    { name: 'Xiaomi 14 Pro',                unit: 'Chiec', category: 'Dien thoai',  sale_price: 16900000,  min_stock: 35, weight: 0.10 },
    { name: 'OPPO Reno11 F 5G',             unit: 'Chiec', category: 'Dien thoai',  sale_price:  8490000,  min_stock: 40, weight: 0.08 },
    // Laptop
    { name: 'MacBook Pro 14 M3 Pro',        unit: 'Cai',   category: 'Laptop',      sale_price: 52900000,  min_stock: 15, weight: 0.10 },
    { name: 'Dell XPS 15 9530',             unit: 'Cai',   category: 'Laptop',      sale_price: 38900000,  min_stock: 15, weight: 0.08 },
    { name: 'HP Pavilion 15 Ryzen 7',       unit: 'Cai',   category: 'Laptop',      sale_price: 18900000,  min_stock: 25, weight: 0.08 },
    { name: 'Lenovo ThinkPad E14 Gen 5',    unit: 'Cai',   category: 'Laptop',      sale_price: 17900000,  min_stock: 25, weight: 0.06 },
    { name: 'Asus VivoBook 15 OLED',        unit: 'Cai',   category: 'Laptop',      sale_price: 15900000,  min_stock: 25, weight: 0.06 },
    // Tablet
    { name: 'iPad Air 13 M2 WiFi',          unit: 'Chiec', category: 'Tablet',      sale_price: 18900000,  min_stock: 20, weight: 0.06 },
    { name: 'Samsung Galaxy Tab S9 FE',     unit: 'Chiec', category: 'Tablet',      sale_price: 11400000,  min_stock: 25, weight: 0.05 },
    // Phụ kiện audio
    { name: 'AirPods Pro 2 USB-C',          unit: 'Chiec', category: 'Phu kien',    sale_price:  6490000,  min_stock: 60, weight: 0.12 },
    { name: 'Sony WH-1000XM5',              unit: 'Chiec', category: 'Phu kien',    sale_price:  8900000,  min_stock: 30, weight: 0.08 },
    { name: 'JBL Tune 770NC',               unit: 'Chiec', category: 'Phu kien',    sale_price:  2490000,  min_stock: 50, weight: 0.07 },
    { name: 'Loa Bluetooth Harman Kardon Onyx 7', unit: 'Chiec', category: 'Phu kien', sale_price: 6900000, min_stock: 25, weight: 0.04 },
    // Phụ kiện khác
    { name: 'Apple Watch Series 9 45mm',    unit: 'Chiec', category: 'Phu kien',    sale_price: 10900000,  min_stock: 25, weight: 0.06 },
    { name: 'Samsung Galaxy Watch 6',       unit: 'Chiec', category: 'Phu kien',    sale_price:  6990000,  min_stock: 25, weight: 0.04 },
    { name: 'Logitech MX Master 3S',        unit: 'Chiec', category: 'Phu kien',    sale_price:  2990000,  min_stock: 50, weight: 0.05 },
    { name: 'Ban phim co Logitech MX Mechanical', unit: 'Cai', category: 'Phu kien', sale_price: 3490000, min_stock: 30, weight: 0.04 },
    { name: 'SSD Samsung 980 Pro 1TB',      unit: 'Chiec', category: 'Phu kien',    sale_price:  3490000,  min_stock: 35, weight: 0.04 },
    { name: 'Sac nhanh Apple 20W USB-C',    unit: 'Chiec', category: 'Phu kien',    sale_price:   790000,  min_stock: 80, weight: 0.06 },
    { name: 'Pin du phong Anker 20000mAh',  unit: 'Chiec', category: 'Phu kien',    sale_price:  1290000,  min_stock: 60, weight: 0.05 },
    // Màn hình / TV
    { name: 'Man hinh LG UltraGear 27" 165Hz', unit: 'Bo', category: 'Man hinh',  sale_price:  9900000,  min_stock: 20, weight: 0.04 },
    { name: 'Smart TV Samsung 55" 4K UHD',  unit: 'Bo',   category: 'Man hinh',    sale_price: 14900000,  min_stock: 12, weight: 0.03 },
];

const CUSTOMER_IDS = []; // sẽ fill sau khi query
const WAREHOUSE_IDS = []; // sẽ fill sau khi query
const USER_IDS = { sales: null, warehouse: null, factory: null, logistics: null, admin: null };

const ORDER_STATUSES = [
    { value: 'pending',    weight: 0.10 },
    { value: 'shipping',   weight: 0.10 },
    { value: 'completed',  weight: 0.65 },
    { value: 'returned',   weight: 0.08 },
    { value: 'canceled',   weight: 0.04 },
    { value: 'logistics_review', weight: 0.03 },
];

const SHIPPING_STATUSES = [
    { value: 'assigned', weight: 0.10 },
    { value: 'shipped',  weight: 0.15 },
    { value: 'delivered',weight: 0.70 },
    { value: 'failed',   weight: 0.05 },
];

const CARRIERS = [
    { code: 'GHN', name: 'Giao Hang Nhanh',      fee: 35000 },
    { code: 'GHT', name: 'Giao Hang Tiet Kiem',  fee: 28000 },
    { code: 'GR',  name: 'Giao Rong (Roadbull)', fee: 32000 },
    { code: 'VTP', name: 'Viettel Post',         fee: 30000 },
];

const DELIVERY_STEPS = [1, 1, 1, 2, 2, 3, 4]; // phân bố step

// ============================================================
// MAIN
// ============================================================
async function main() {
    console.log('Ket noi Neon thanh cong!\n');
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // ========== 1) RESET DATA (giữ customers, users, warehouses, roles) ==========
        console.log('[1/5] Reset du lieu cu (tru customers, users, warehouses, roles)...');

        // Dùng TRUNCATE ... CASCADE để nhanh hơn DELETE
        await client.query(`
            TRUNCATE TABLE
                compensation_items,
                compensation_requests,
                supplier_claims,
                carrier_claims,
                return_items,
                return_requests,
                delivery_requests,
                stock_outbound_note_items,
                stock_outbound_notes,
                production_receipt_items,
                production_receipts,
                shipping_orders,
                sales_order_items,
                sales_orders,
                inventory_transactions,
                inventory_balances,
                notifications,
                products
            RESTART IDENTITY CASCADE
        `);
        await client.query(`DELETE FROM auto_codes WHERE prefix IN ('SP','SO','PXK','YC','PNH','PBH','GHN','GHT','GR','VTP','CLS','CLC')`);
        console.log('   ✓ Da reset bang (TRUNCATE)');

        // ========== 2) LẤY ID customers, warehouses, users (đảm bảo có 2 kho) ==========
        console.log('\n[2/5] Lay ID customers/warehouses/users...');
        // Đảm bảo có đủ 2 kho: main + defective
        const whCheck = await client.query(`SELECT id, warehouse_code FROM warehouses ORDER BY id`);
        let mainWh = whCheck.rows.find(w => w.warehouse_code === 'KHO-MAIN' || w.warehouse_type === 'main');
        let defectWh = whCheck.rows.find(w => w.warehouse_code === 'KHO-LOI' || w.warehouse_type === 'defective');

        if (!mainWh) {
            const r = await client.query(
                `INSERT INTO warehouses (warehouse_code, name, location, warehouse_type)
                 VALUES ('KHO-MAIN', 'Kho Chinh Binh Duong', 'So 1, Duong So 2, KCN Song Than, Binh Duong', 'main') RETURNING id, warehouse_code`
            );
            mainWh = r.rows[0];
            console.log('   + Tao moi KHO-MAIN');
        }
        if (!defectWh) {
            const r = await client.query(
                `INSERT INTO warehouses (warehouse_code, name, location, warehouse_type)
                 VALUES ('KHO-LOI', 'Kho Hang Loi / Hu Hong', 'Khu vuc cach ly, KCN Song Than, Binh Duong', 'defective') RETURNING id, warehouse_code`
            );
            defectWh = r.rows[0];
            console.log('   + Tao moi KHO-LOI');
        }

        WAREHOUSE_IDS.length = 0;
        WAREHOUSE_IDS.push(mainWh.id, defectWh.id);

        const custRes = await client.query(`SELECT id FROM customers ORDER BY id`);
        CUSTOMER_IDS.push(...custRes.rows.map(r => r.id));
        if (CUSTOMER_IDS.length === 0) throw new Error('Khong co customers trong DB!');

        const userRes = await client.query(`SELECT id, role_id FROM users`);
        for (const r of userRes.rows) {
            if (r.role_id === 1) USER_IDS.admin = r.id;
            if (r.role_id === 2) USER_IDS.sales = r.id;
            if (r.role_id === 3) USER_IDS.logistics = r.id;
            if (r.role_id === 4) USER_IDS.warehouse = r.id;
            if (r.role_id === 5) USER_IDS.factory = r.id;
        }
        console.log(`   ✓ ${CUSTOMER_IDS.length} customers, ${WAREHOUSE_IDS.length} warehouses, ${userRes.rows.length} users`);

        // ========== 3) INSERT PRODUCTS + SKU auto + tồn kho ban đầu ==========
        console.log('\n[3/5] Insert 25 san pham dien tu + SKU auto + ton kho...');
        const productIds = [];
        for (let i = 0; i < ELECTRONIC_PRODUCTS.length; i++) {
            const p = ELECTRONIC_PRODUCTS[i];
            const num = i + 1;
            const sku = `SP-2026-${String(num).padStart(4, '0')}`;
            const ins = await client.query(
                `INSERT INTO products (sku, name, unit, category, sale_price, min_stock)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                [sku, p.name, p.unit, p.category, p.sale_price, p.min_stock]
            );
            productIds.push({ id: ins.rows[0].id, ...p, sku });
            await client.query(
                `INSERT INTO auto_codes (code, prefix, year) VALUES ($1, 'SP', 2026) ON CONFLICT DO NOTHING`,
                [sku]
            );
        }
        console.log(`   ✓ ${productIds.length} san pham`);

        // Tồn kho ban đầu: cho mỗi sản phẩm ở mỗi kho với qty ngẫu nhiên
        for (const p of productIds) {
            for (const whId of WAREHOUSE_IDS) {
                const isMain = whId === WAREHOUSE_IDS[0];
                const qty = rand(
                    isMain ? Math.floor(p.min_stock * 0.8) : 5,
                    isMain ? p.min_stock * 3 : Math.floor(p.min_stock * 0.6)
                );
                await client.query(
                    `INSERT INTO inventory_balances (warehouse_id, product_id, on_hand_qty)
                     VALUES ($1, $2, $3)`,
                    [whId, p.id, qty]
                );
            }
        }
        console.log(`   ✓ Ton kho ban dau: ${productIds.length} SP × ${WAREHOUSE_IDS.length} kho`);

        // ========== 4) SEED DATA 5 THÁNG ==========
        console.log('\n[4/5] Seed 5 thang (03/2026 -> 10/07/2026)...');

        // ----- 4a) PRODUCTION_RECEIPTS (phiếu nhập từ nhà máy) -----
        // Tạo phiếu nhập cho mỗi tháng, mỗi tháng ~15-25 phiếu
        const months = [
            { y: 2026, m: 3, count: rand(35, 50) },
            { y: 2026, m: 4, count: rand(40, 55) },
            { y: 2026, m: 5, count: rand(45, 60) },
            { y: 2026, m: 6, count: rand(50, 65) },
            { y: 2026, m: 7, count: rand(15, 22) },
        ];
        let receiptCount = 0;
        let receiptItemCount = 0;
        let receiptNos = [];
        for (const mth of months) {
            for (let i = 0; i < mth.count; i++) {
                const day = rand(1, 28);
                const d = new Date(Date.UTC(mth.y, mth.m - 1, day, rand(8, 17), rand(0, 59)));
                if (d > END) continue;
                const num = receiptCount + 1;
                const rno = `YC-2026-${String(num).padStart(4, '0')}`;
                const status = weightedPick([
                    { value: 'pending', weight: 0.20 },
                    { value: 'approved', weight: 0.70 },
                    { value: 'rejected', weight: 0.05 },
                    { value: 'completed', weight: 0.05 },
                ]);
                const whId = pick(WAREHOUSE_IDS);
                // responded_by is VARCHAR(100) — store user's full_name instead of id
                const respondedByName = status === 'pending' ? null : 'Pham Thu Kho';
                const ins = await client.query(
                    `INSERT INTO production_receipts (receipt_no, warehouse_id, receipt_date, created_by, status, note, responded_by)
                     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
                    [rno, whId, fmtDate(d), USER_IDS.warehouse, status, 'Yeu cau nhap hang tu nha may', respondedByName]
                );
                const receiptId = ins.rows[0].id;
                receiptNos.push({ id: receiptId, no: rno, date: d, status, whId });
                await client.query(
                    `INSERT INTO auto_codes (code, prefix, year) VALUES ($1, 'YC', 2026) ON CONFLICT DO NOTHING`,
                    [rno]
                );

                // 2-6 items mỗi phiếu
                const itemCount = rand(2, 6);
                const used = new Set();
                for (let j = 0; j < itemCount; j++) {
                    let p;
                    do { p = pick(productIds); } while (used.has(p.id));
                    used.add(p.id);
                    const qty = rand(20, 200);
                    await client.query(
                        `INSERT INTO production_receipt_items (receipt_id, product_id, quantity) VALUES ($1, $2, $3)`,
                        [receiptId, p.id, qty]
                    );
                    // Update tồn kho
                    await client.query(
                        `UPDATE inventory_balances SET on_hand_qty = on_hand_qty + $1, updated_at = CURRENT_TIMESTAMP
                         WHERE product_id = $2 AND warehouse_id = $3`,
                        [qty, p.id, whId]
                    );
                    // Ghi inventory transaction
                    await client.query(
                        `INSERT INTO inventory_transactions (warehouse_id, product_id, transaction_type, quantity, reference_type, reference_id, transaction_date, note)
                         VALUES ($1, $2, 'receipt', $3, 'production_receipt', $4, $5, $6)`,
                        [whId, p.id, qty, receiptId, fmtDate(d), `Nhap tu nha may - ${rno}`]
                    );
                    receiptItemCount++;
                }
                receiptCount++;
            }
        }
        console.log(`   ✓ Production receipts: ${receiptCount} phieu, ${receiptItemCount} items`);

        // ----- 4b) SALES_ORDERS + ITEMS -----
        const orderCount = rand(700, 900);
        const orderIds = [];
        for (let i = 0; i < orderCount; i++) {
            const d = randomBusinessDate();
            const num = i + 1;
            const ono = `SO-2026-${String(num).padStart(4, '0')}`;
            const custId = pick(CUSTOMER_IDS);
            const status = weightedPick(ORDER_STATUSES);
            const expectedDelivery = new Date(d.getTime() + rand(2, 10) * 24 * 60 * 60 * 1000);
            const actualDelivery = (status === 'completed' || status === 'returned')
                ? new Date(expectedDelivery.getTime() + rand(-2, 4) * 24 * 60 * 60 * 1000)
                : null;
            const itemCount = rand(1, 5);
            const used = new Set();
            const items = [];
            for (let j = 0; j < itemCount; j++) {
                let p;
                do { p = pick(productIds); } while (used.has(p.id));
                used.add(p.id);
                const qty = rand(1, 12);
                const unitPrice = p.sale_price * (0.95 + Math.random() * 0.1); // ±5%
                items.push({ product_id: p.id, quantity: qty, unit_price: Math.round(unitPrice), name: p.name, sku: p.sku });
            }
            const deliveryStep = status === 'completed' ? 4
                : status === 'shipping' ? rand(1, 3)
                : status === 'pending' ? 0
                : status === 'returned' ? 4
                : 0;

            const ins = await client.query(
                `INSERT INTO sales_orders (order_no, customer_id, order_date, expected_delivery_date, actual_delivery_date, created_by, status, delivery_step, note)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
                [ono, custId, fmtDate(d), fmtDate(expectedDelivery), actualDelivery ? fmtDate(actualDelivery) : null, USER_IDS.sales, status, deliveryStep, '']
            );
            const orderId = ins.rows[0].id;
            orderIds.push({ id: orderId, no: ono, date: d, expectedDelivery, actualDelivery, status, deliveryStep, custId, items });
            await client.query(
                `INSERT INTO auto_codes (code, prefix, year) VALUES ($1, 'SO', 2026) ON CONFLICT DO NOTHING`,
                [ono]
            );
            for (const it of items) {
                await client.query(
                    `INSERT INTO sales_order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)`,
                    [orderId, it.product_id, it.quantity, it.unit_price]
                );
            }
        }
        console.log(`   ✓ Sales orders: ${orderIds.length} don, ${orderIds.reduce((s, o) => s + o.items.length, 0)} items`);

        // ----- 4c) STOCK_OUTBOUND_NOTES (xuất kho cho đơn đã shipping/completed/returned) -----
        let outboundCount = 0;
        let outboundItemCount = 0;
        for (const o of orderIds) {
            if (!['shipping', 'completed', 'returned'].includes(o.status)) continue;
            const num = outboundCount + 1;
            const ono = `PXK-2026-${String(num).padStart(4, '0')}`;
            const whId = WAREHOUSE_IDS[0]; // xuất từ kho chính
            const exportDate = new Date(o.date.getTime() + rand(1, 3) * 24 * 60 * 60 * 1000);
            const ins = await client.query(
                `INSERT INTO stock_outbound_notes (outbound_no, order_id, warehouse_id, export_date, created_by, status, note)
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
                [ono, o.id, whId, fmtDate(exportDate), USER_IDS.warehouse, 'completed', `Xuat kho cho don ${o.no}`]
            );
            const outboundId = ins.rows[0].id;
            await client.query(
                `INSERT INTO auto_codes (code, prefix, year) VALUES ($1, 'PXK', 2026) ON CONFLICT DO NOTHING`,
                [ono]
            );
            for (const it of o.items) {
                await client.query(
                    `INSERT INTO stock_outbound_note_items (outbound_note_id, product_id, quantity) VALUES ($1, $2, $3)`,
                    [outboundId, it.product_id, it.quantity]
                );
                // Trừ tồn
                await client.query(
                    `UPDATE inventory_balances SET on_hand_qty = GREATEST(0, on_hand_qty - $1), updated_at = CURRENT_TIMESTAMP
                     WHERE product_id = $2 AND warehouse_id = $3`,
                    [it.quantity, it.product_id, whId]
                );
                // Transaction
                await client.query(
                    `INSERT INTO inventory_transactions (warehouse_id, product_id, transaction_type, quantity, reference_type, reference_id, transaction_date, note)
                     VALUES ($1, $2, 'outbound', $3, 'stock_outbound', $4, $5, $6)`,
                    [whId, it.product_id, it.quantity, outboundId, fmtDate(exportDate), `Xuat kho cho don ${o.no}`]
                );
                outboundItemCount++;
            }
            outboundCount++;
        }
        console.log(`   ✓ Outbounds: ${outboundCount} phieu, ${outboundItemCount} items`);

        // ----- 4d) SHIPPING_ORDERS (vận chuyển cho đơn shipping/completed) -----
        let shippingCount = 0;
        const carrierCounters = {};
        for (const o of orderIds) {
            if (!['shipping', 'completed', 'returned'].includes(o.status)) continue;
            const carrier = pick(CARRIERS);
            carrierCounters[carrier.code] = (carrierCounters[carrier.code] || 0) + 1;
            const tno = `${carrier.code}-2026-${String(carrierCounters[carrier.code]).padStart(4, '0')}`;
            const status = o.status === 'completed' ? 'delivered' : weightedPick(SHIPPING_STATUSES);
            const assignedAt = new Date(o.date.getTime() + rand(1, 3) * 86400000);
            const shippedAt = new Date(assignedAt.getTime() + rand(1, 24) * 3600000);
            const deliveredAt = status === 'delivered'
                ? new Date(shippedAt.getTime() + rand(1, 72) * 3600000)
                : null;
            await client.query(
                `INSERT INTO shipping_orders (order_id, carrier_code, carrier_name, tracking_no, shipping_fee, status, assigned_at, shipped_at, delivered_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [o.id, carrier.code, carrier.name, tno, carrier.fee, status, fmtDate(assignedAt), fmtDate(shippedAt), deliveredAt ? fmtDate(deliveredAt) : null]
            );
            await client.query(
                `INSERT INTO auto_codes (code, prefix, year) VALUES ($1, $2, 2026) ON CONFLICT DO NOTHING`,
                [tno, carrier.code]
            );
            shippingCount++;
        }
        console.log(`   ✓ Shipping orders: ${shippingCount} van chuyen`);

        // ----- 4e) RETURN_REQUESTS + ITEMS (cho đơn returned) -----
        let returnCount = 0;
        for (const o of orderIds) {
            if (o.status !== 'returned') continue;
            const rrIns = await client.query(
                `INSERT INTO return_requests (order_id, customer_reject_reason, complaint_source, logistics_action, status, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                [o.id, weightedPick(['khong_nhan_hang', 'sai_hang', 'hong_vo', 'khong_dung_mo_ta']),
                 weightedPick(['after_delivery', 'during_delivery']),
                 weightedPick(['return_to_warehouse', 'exchange', 'refund']),
                 weightedPick(['pending', 'processing', 'resolved', 'closed']),
                 fmtDate(o.actualDelivery || o.date)]
            );
            const rrId = rrIns.rows[0].id;
            // 1-2 items returned
            const returnItems = o.items.slice(0, rand(1, Math.min(2, o.items.length)));
            for (const it of returnItems) {
                const qty = Math.min(it.quantity, rand(1, it.quantity));
                await client.query(
                    `INSERT INTO return_items (return_id, product_id, quantity, is_defective) VALUES ($1, $2, $3, $4)`,
                    [rrId, it.product_id, qty, Math.random() < 0.4]
                );
            }
            returnCount++;
        }
        console.log(`   ✓ Return requests: ${returnCount} phieu`);

        await client.query('COMMIT');
        console.log('\n========================================');
        console.log('Seed 5 thang THANH CONG!');
        console.log('========================================');
        console.log(`  - Products:        ${productIds.length}`);
        console.log(`  - Production rec:  ${receiptCount} (${receiptItemCount} items)`);
        console.log(`  - Sales orders:    ${orderIds.length} (${orderIds.reduce((s, o) => s + o.items.length, 0)} items)`);
        console.log(`  - Outbounds:       ${outboundCount} (${outboundItemCount} items)`);
        console.log(`  - Shippings:       ${shippingCount}`);
        console.log(`  - Returns:         ${returnCount}`);
        console.log(`  - Khoang thoi gian: 01/03/2026 → 10/07/2026`);
        console.log('========================================\n');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('\n[SEED ERROR]', err.message);
        console.error(err.stack);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

main();
