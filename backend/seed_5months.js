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
    // Giữ TCP connection sống qua Neon idle window
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
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

// Random date trong khoảng 03/2026 → 14/07/2026
const START = new Date('2026-03-01T00:00:00');
const END   = new Date('2026-07-14T23:59:59');
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
        // Set statement-level timeouts để hang không bao giờ vĩnh viễn
        await client.query(`SET statement_timeout = '120s'`);
        await client.query(`SET idle_in_transaction_session_timeout = '600s'`);
        await client.query(`SET lock_timeout = '30s'`);
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
        // Batch insert products
        const productValues = [];
        const productParams = [];
        const productNames = [];
        ELECTRONIC_PRODUCTS.forEach((p, i) => {
            const num = i + 1;
            const sku = `SP-2026-${String(num).padStart(4, '0')}`;
            const base = i * 6;
            productValues.push(`($${base+1},$${base+2},$${base+3},$${base+4},$${base+5},$${base+6})`);
            productParams.push(sku, p.name, p.unit, p.category, p.sale_price, p.min_stock);
            productNames.push({ ...p, sku });
        });
        const prodRes = await client.query(
            `INSERT INTO products (sku, name, unit, category, sale_price, min_stock)
             VALUES ${productValues.join(', ')} RETURNING id, sku`,
            productParams
        );
        // Map id by sku
        const skuToId = {};
        prodRes.rows.forEach(r => { skuToId[r.sku] = r.id; });
        productNames.forEach((p) => {
            productIds.push({ id: skuToId[p.sku], ...p });
        });
        // Batch insert auto_codes for products
        const productCodes = productNames.map(p => p.sku);
        await client.query(
            `INSERT INTO auto_codes (code, prefix, year)
             SELECT unnest($1::text[]), 'SP', 2026 ON CONFLICT DO NOTHING`,
            [productCodes]
        );
        console.log(`   ✓ ${productIds.length} san pham`);

        // Tồn kho ban đầu: cho mỗi sản phẩm ở mỗi kho với qty ngẫu nhiên
        const invValues = [];
        const invParams = [];
        for (const p of productIds) {
            for (const whId of WAREHOUSE_IDS) {
                const isMain = whId === WAREHOUSE_IDS[0];
                const qty = rand(
                    isMain ? Math.floor(p.min_stock * 0.8) : 5,
                    isMain ? p.min_stock * 3 : Math.floor(p.min_stock * 0.6)
                );
                const base = invParams.length;
                invValues.push(`($${base+1},$${base+2},$${base+3})`);
                invParams.push(whId, p.id, qty);
            }
        }
        await client.query(
            `INSERT INTO inventory_balances (warehouse_id, product_id, on_hand_qty) VALUES ${invValues.join(', ')}`,
            invParams
        );
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
        // GOM TẤT CẢ receipt + items vào mảng trước, rồi batch insert
        const receiptRows = []; // mỗi row là {rno, whId, d, status, items: [{product_id, qty}]}
        for (const mth of months) {
            for (let i = 0; i < mth.count; i++) {
                const day = rand(1, 28);
                const d = new Date(Date.UTC(mth.y, mth.m - 1, day, rand(8, 17), rand(0, 59)));
                if (d > END) continue;
                const status = weightedPick([
                    { value: 'pending', weight: 0.20 },
                    { value: 'approved', weight: 0.70 },
                    { value: 'rejected', weight: 0.05 },
                    { value: 'completed', weight: 0.05 },
                ]);
                const whId = pick(WAREHOUSE_IDS);
                const respondedByName = status === 'pending' ? null : 'Pham Thu Kho';
                const itemCount = rand(2, 6);
                const used = new Set();
                const items = [];
                for (let j = 0; j < itemCount; j++) {
                    let p;
                    do { p = pick(productIds); } while (used.has(p.id));
                    used.add(p.id);
                    items.push({ product_id: p.id, quantity: rand(20, 200) });
                }
                receiptRows.push({ d, status, whId, respondedByName, items });
            }
        }
        // Gán rno và receiptId tạm
        receiptRows.forEach((r, i) => { r.num = i + 1; r.rno = `YC-2026-${String(r.num).padStart(4, '0')}`; });

        // Batch insert production_receipts
        const REC_BATCH = 100;
        let receiptCount = 0;
        let receiptItemCount = 0;
        // Mapping num -> real id from insert
        const numToReceiptId = {};
        for (let i = 0; i < receiptRows.length; i += REC_BATCH) {
            const chunk = receiptRows.slice(i, i + REC_BATCH);
            const valuesSql = [];
            const params = [];
            chunk.forEach((r, ri) => {
                const base = ri * 7;
                valuesSql.push(`($${base+1},$${base+2},$${base+3},$${base+4},$${base+5},$${base+6},$${base+7})`);
                params.push(r.rno, r.whId, fmtDate(r.d), USER_IDS.warehouse, r.status, 'Yeu cau nhap hang tu nha may', r.respondedByName);
            });
            const ins = await client.query(
                `INSERT INTO production_receipts (receipt_no, warehouse_id, receipt_date, created_by, status, note, responded_by)
                 VALUES ${valuesSql.join(', ')} RETURNING id, receipt_no`,
                params
            );
            const noToId = {};
            ins.rows.forEach(row => { noToId[row.receipt_no] = row.id; });
            chunk.forEach(r => { r.dbId = noToId[r.rno]; numToReceiptId[r.num] = r.dbId; });
            receiptCount += chunk.length;
            if (i % 500 === 0) console.log(`     receipts inserted: ${receiptCount}/${receiptRows.length}`);
        }
        console.log(`   ✓ Production receipts header: ${receiptCount}`);

        // Batch insert auto_codes for receipts
        await client.query(
            `INSERT INTO auto_codes (code, prefix, year)
             SELECT unnest($1::text[]), 'YC', 2026 ON CONFLICT DO NOTHING`,
            [receiptRows.map(r => r.rno)]
        );

        // Batch insert production_receipt_items
        const allReceiptItems = [];
        receiptRows.forEach(r => {
            r.items.forEach(it => allReceiptItems.push({ receipt_dbId: r.dbId, product_id: it.product_id, quantity: it.quantity }));
        });
        const ITEM_BATCH = 300;
        for (let i = 0; i < allReceiptItems.length; i += ITEM_BATCH) {
            const chunk = allReceiptItems.slice(i, i + ITEM_BATCH);
            const valuesSql = [];
            const params = [];
            chunk.forEach((it, ri) => {
                const base = ri * 3;
                valuesSql.push(`($${base+1},$${base+2},$${base+3})`);
                params.push(it.receipt_dbId, it.product_id, it.quantity);
            });
            await client.query(
                `INSERT INTO production_receipt_items (receipt_id, product_id, quantity) VALUES ${valuesSql.join(', ')}`,
                params
            );
            receiptItemCount += chunk.length;
        }
        console.log(`   ✓ Production receipt items: ${receiptItemCount}`);

        // Batch insert inventory_transactions (receipt type) + bulk UPDATE inventory_balances
        // Gom theo (whId, product_id) -> total qty
        const invDelta = {}; // key: `${whId}|${product_id}` -> {whId,product_id,qty}
        receiptRows.forEach(r => {
            r.items.forEach(it => {
                const k = `${r.whId}|${it.product_id}`;
                if (!invDelta[k]) invDelta[k] = { whId: r.whId, product_id: it.product_id, qty: 0 };
                invDelta[k].qty += it.quantity;
            });
        });
        const invDeltaArr = Object.values(invDelta);
        // UPDATE bằng CASE WHEN
        if (invDeltaArr.length) {
            const uVal = invDeltaArr.map((d, i) => {
                const base = i * 3;
                return `(product_id=$${base+1} AND warehouse_id=$${base+2})`;
            });
            const uParams = invDeltaArr.flatMap(d => [d.product_id, d.whId, d.qty]);
            const cases = invDeltaArr.map((d, i) => {
                const base = i * 3;
                return `WHEN product_id=$${base+1} AND warehouse_id=$${base+2} THEN on_hand_qty + $${base+3}`;
            }).join(' ');
            const whens = invDeltaArr.map((d, i) => {
                const base = i * 3;
                return `(product_id=$${base+1} AND warehouse_id=$${base+2})`;
            }).join(' OR ');
            await client.query(
                `UPDATE inventory_balances SET on_hand_qty = CASE ${cases} END, updated_at = CURRENT_TIMESTAMP WHERE ${whens}`,
                uParams
            );
        }
        // Batch insert inventory_transactions receipts
        // Schema (id auto): warehouse_id, product_id, transaction_type, quantity, reference_type, reference_id, transaction_date
        // We hardcode transaction_type='receipt' and reference_type='production_receipt' via literals, no 'note' column.
        const invTxnValues = [];
        const invTxnParams = [];
        receiptRows.forEach(r => {
            r.items.forEach((it) => {
                const base = invTxnParams.length;
                invTxnValues.push(`($${base+1},$${base+2},'receipt',$${base+3},'production_receipt',$${base+4},CURRENT_TIMESTAMP)`);
                invTxnParams.push(r.whId, it.product_id, it.quantity, r.dbId);
            });
        });
        const TXN_BATCH = 100;
        const TXN_COLS = 4; // 4 params per row: whId, product_id, qty, ref_id  (literal 'receipt', literal 'production_receipt', CURRENT_TIMESTAMP)
        for (let i = 0; i < invTxnValues.length; i += TXN_BATCH) {
            const chunkRows = Math.min(TXN_BATCH, invTxnValues.length - i);
            // Rebuild placeholders per chunk so $N numbering restarts at 1 (defensive).
            const rowsSql = [];
            for (let r = 0; r < chunkRows; r++) {
                const b = r * TXN_COLS;
                rowsSql.push(`($${b + 1}, $${b + 2}, 'receipt', $${b + 3}, 'production_receipt', $${b + 4}, CURRENT_TIMESTAMP)`);
            }
            const sliceStart = i * TXN_COLS;
            const sliceEnd = (i + chunkRows) * TXN_COLS;
            const chunkParams = invTxnParams.slice(sliceStart, sliceEnd);
            await client.query(
                `INSERT INTO inventory_transactions (warehouse_id, product_id, transaction_type, quantity, reference_type, reference_id, transaction_date)
                 VALUES ${rowsSql.join(', ')}`,
                chunkParams
            );
        }
        console.log(`   ✓ Inventory transactions (receipts): ${invTxnValues.length}`);
        console.log(`   ✓ Production receipts: ${receiptCount} phieu, ${receiptItemCount} items`);

        // ----- 4b) SALES_ORDERS + ITEMS -----
        const orderCount = rand(700, 900);
        // Build toàn bộ orders in-memory trước
        const ordersData = [];
        const allOrderItems = [];
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
                const unitPrice = p.sale_price * (0.95 + Math.random() * 0.1);
                items.push({ product_id: p.id, quantity: qty, unit_price: Math.round(unitPrice), name: p.name, sku: p.sku });
            }
            const deliveryStep = status === 'completed' ? 4
                : status === 'shipping' ? rand(1, 3)
                : status === 'pending' ? 0
                : status === 'returned' ? 4
                : 0;

            ordersData.push({
                num, ono, custId, d, expectedDelivery, actualDelivery, status, deliveryStep, items,
            });
            items.forEach(it => allOrderItems.push({ num, ...it }));
        }

        // Batch insert sales_orders
        const orderIds = []; // { id, no, date, expectedDelivery, actualDelivery, status, deliveryStep, custId, items }
        const orderNumToId = {};
        const ORD_BATCH = 100;
        let insertedOrders = 0;
        for (let i = 0; i < ordersData.length; i += ORD_BATCH) {
            const chunk = ordersData.slice(i, i + ORD_BATCH);
            const valuesSql = [];
            const params = [];
            chunk.forEach((o, ri) => {
                const base = ri * 9;
                valuesSql.push(`($${base+1},$${base+2},$${base+3},$${base+4},$${base+5},$${base+6},$${base+7},$${base+8},$${base+9})`);
                params.push(
                    o.ono, o.custId, fmtDate(o.d), fmtDate(o.expectedDelivery),
                    o.actualDelivery ? fmtDate(o.actualDelivery) : null,
                    USER_IDS.sales, o.status, o.deliveryStep, ''
                );
            });
            const ins = await client.query(
                `INSERT INTO sales_orders (order_no, customer_id, order_date, expected_delivery_date, actual_delivery_date, created_by, status, delivery_step, note)
                 VALUES ${valuesSql.join(', ')} RETURNING id, order_no`,
                params
            );
            const noToId = {};
            ins.rows.forEach(r => { noToId[r.order_no] = r.id; });
            chunk.forEach(o => { o.dbId = noToId[o.ono]; orderNumToId[o.num] = o.dbId; });
            insertedOrders += chunk.length;
            if (i % 500 === 0) console.log(`     orders inserted: ${insertedOrders}/${ordersData.length}`);
        }
        ordersData.forEach(o => orderIds.push({
            id: o.dbId, no: o.ono, date: o.d, expectedDelivery: o.expectedDelivery,
            actualDelivery: o.actualDelivery, status: o.status, deliveryStep: o.deliveryStep, custId: o.custId, items: o.items,
        }));
        console.log(`   ✓ Sales orders header: ${orderIds.length}`);

        // Batch insert auto_codes cho orders
        await client.query(
            `INSERT INTO auto_codes (code, prefix, year)
             SELECT unnest($1::text[]), 'SO', 2026 ON CONFLICT DO NOTHING`,
            [ordersData.map(o => o.ono)]
        );

        // Batch insert sales_order_items
        const orderItemRows = [];
        for (const o of ordersData) {
            for (const it of o.items) {
                orderItemRows.push({ order_dbId: o.dbId, product_id: it.product_id, quantity: it.quantity, unit_price: it.unit_price });
            }
        }
        const ITEM_BATCH2 = 500;
        let orderItemCount = 0;
        for (let i = 0; i < orderItemRows.length; i += ITEM_BATCH2) {
            const chunk = orderItemRows.slice(i, i + ITEM_BATCH2);
            const valuesSql = [];
            const params = [];
            chunk.forEach((it, ri) => {
                const base = ri * 4;
                valuesSql.push(`($${base+1},$${base+2},$${base+3},$${base+4})`);
                params.push(it.order_dbId, it.product_id, it.quantity, it.unit_price);
            });
            await client.query(
                `INSERT INTO sales_order_items (order_id, product_id, quantity, unit_price) VALUES ${valuesSql.join(', ')}`,
                params
            );
            orderItemCount += chunk.length;
        }
        console.log(`   ✓ Sales orders: ${orderIds.length} don, ${orderItemCount} items`);

        // ----- 4c) STOCK_OUTBOUND_NOTES (xuất kho cho đơn đã shipping/completed/returned) -----
        // Chuẩn bị data
        const outboundable = orderIds.filter(o => ['shipping', 'completed', 'returned'].includes(o.status));
        const outboundList = [];
        outboundable.forEach((o, idx) => {
            outboundList.push({
                num: idx + 1,
                ono: `PXK-2026-${String(idx + 1).padStart(4, '0')}`,
                order: o,
                whId: WAREHOUSE_IDS[0],
                exportDate: new Date(o.date.getTime() + rand(1, 3) * 24 * 60 * 60 * 1000),
            });
        });
        // Batch insert stock_outbound_notes
        const OB_BATCH = 100;
        const OB_COLS = 6; // 6 params per row: outbound_no, order_id, warehouse_id, export_date, created_by, note  (status='completed' literal)
        let outboundCount = 0;
        const outboundNoToId = {};
        for (let i = 0; i < outboundList.length; i += OB_BATCH) {
            const chunk = outboundList.slice(i, i + OB_BATCH);
            const rowsSql = [];
            for (let ri = 0; ri < chunk.length; ri++) {
                const base = ri * OB_COLS;
                rowsSql.push(`($${base+1},$${base+2},$${base+3},$${base+4},$${base+5},'completed',$${base+6})`);
            }
            const params = [];
            chunk.forEach((ob) => {
                params.push(ob.ono, ob.order.id, ob.whId, fmtDate(ob.exportDate), USER_IDS.warehouse, `Xuat kho cho don ${ob.order.no}`);
            });
            const ins = await client.query(
                `INSERT INTO stock_outbound_notes (outbound_no, order_id, warehouse_id, export_date, created_by, status, note)
                 VALUES ${rowsSql.join(', ')} RETURNING id, outbound_no`,
                params
            );
            const noToId = {};
            ins.rows.forEach(r => { noToId[r.outbound_no] = r.id; });
            chunk.forEach(ob => { ob.dbId = noToId[ob.ono]; outboundNoToId[ob.ono] = ob.dbId; });
            outboundCount += chunk.length;
            if (i % 500 === 0) console.log(`     outbounds inserted: ${outboundCount}/${outboundList.length}`);
        }
        // Batch insert auto_codes for outbounds
        await client.query(
            `INSERT INTO auto_codes (code, prefix, year)
             SELECT unnest($1::text[]), 'PXK', 2026 ON CONFLICT DO NOTHING`,
            [outboundList.map(ob => ob.ono)]
        );
        // Build out_items
        const outboundItemsAll = [];
        outboundList.forEach(ob => {
            ob.order.items.forEach(it => {
                outboundItemsAll.push({ outbound_dbId: ob.dbId, product_id: it.product_id, quantity: it.quantity });
            });
        });
        // Batch insert stock_outbound_note_items
        const OB_ITEM_BATCH = 500;
        let outboundItemCount = 0;
        for (let i = 0; i < outboundItemsAll.length; i += OB_ITEM_BATCH) {
            const chunk = outboundItemsAll.slice(i, i + OB_ITEM_BATCH);
            const valuesSql = [];
            const params = [];
            chunk.forEach((it, ri) => {
                const base = ri * 3;
                valuesSql.push(`($${base+1},$${base+2},$${base+3})`);
                params.push(it.outbound_dbId, it.product_id, it.quantity);
            });
            await client.query(
                `INSERT INTO stock_outbound_note_items (outbound_note_id, product_id, quantity) VALUES ${valuesSql.join(', ')}`,
                params
            );
            outboundItemCount += chunk.length;
        }
        // Bulk UPDATE inventory_balances (outbound: subtract)
        const outDelta = {};
        outboundList.forEach(ob => {
            ob.order.items.forEach(it => {
                const k = `${ob.whId}|${it.product_id}`;
                if (!outDelta[k]) outDelta[k] = { whId: ob.whId, product_id: it.product_id, qty: 0 };
                outDelta[k].qty += it.quantity;
            });
        });
        const outDeltaArr = Object.values(outDelta);
        if (outDeltaArr.length) {
            const cases = outDeltaArr.map((d, i) => {
                const base = i * 3;
                return `WHEN product_id=$${base+1} AND warehouse_id=$${base+2} THEN GREATEST(0, on_hand_qty - $${base+3})`;
            }).join(' ');
            const whens = outDeltaArr.map((d, i) => {
                const base = i * 3;
                return `(product_id=$${base+1} AND warehouse_id=$${base+2})`;
            }).join(' OR ');
            const uParams = outDeltaArr.flatMap(d => [d.product_id, d.whId, d.qty]);
            await client.query(
                `UPDATE inventory_balances SET on_hand_qty = CASE ${cases} END, updated_at = CURRENT_TIMESTAMP WHERE ${whens}`,
                uParams
            );
        }
        // Batch insert inventory_transactions outbound
        // Schema: warehouse_id, product_id, transaction_type, quantity, reference_type, reference_id, transaction_date
        const outTxnValues = [];
        const outTxnParams = [];
        outboundList.forEach(ob => {
            ob.order.items.forEach((it) => {
                const base = outTxnParams.length;
                outTxnValues.push(`($${base+1},$${base+2},'outbound',$${base+3},'stock_outbound',$${base+4},CURRENT_TIMESTAMP)`);
                outTxnParams.push(ob.whId, it.product_id, it.quantity, ob.dbId);
            });
        });
        const TXN_BATCH2 = 100;
        const TXN_COLS2 = 4; // whId, product_id, qty, ref_id  (literals + CURRENT_TIMESTAMP)
        for (let i = 0; i < outTxnValues.length; i += TXN_BATCH2) {
            const chunkRows = Math.min(TXN_BATCH2, outTxnValues.length - i);
            const rowsSql = [];
            for (let r = 0; r < chunkRows; r++) {
                const b = r * TXN_COLS2;
                rowsSql.push(`($${b + 1}, $${b + 2}, 'outbound', $${b + 3}, 'stock_outbound', $${b + 4}, CURRENT_TIMESTAMP)`);
            }
            const sliceStart = i * TXN_COLS2;
            const sliceEnd = (i + chunkRows) * TXN_COLS2;
            const chunkParams = outTxnParams.slice(sliceStart, sliceEnd);
            await client.query(
                `INSERT INTO inventory_transactions (warehouse_id, product_id, transaction_type, quantity, reference_type, reference_id, transaction_date)
                 VALUES ${rowsSql.join(', ')}`,
                chunkParams
            );
        }
        console.log(`   ✓ Outbounds: ${outboundCount} phieu, ${outboundItemCount} items`);

        // ----- 4d) SHIPPING_ORDERS (vận chuyển cho đơn shipping/completed) -----
        const shipList = [];
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
            shipList.push({
                order_id: o.id, carrier_code: carrier.code, carrier_name: carrier.name,
                tracking_no: tno, shipping_fee: carrier.fee, status,
                assigned_at: fmtDate(assignedAt), shipped_at: fmtDate(shippedAt),
                delivered_at: deliveredAt ? fmtDate(deliveredAt) : null,
            });
        }
        // Batch insert shipping_orders
        let shippingCount = 0;
        const SHIP_BATCH = 200;
        for (let i = 0; i < shipList.length; i += SHIP_BATCH) {
            const chunk = shipList.slice(i, i + SHIP_BATCH);
            const valuesSql = [];
            const params = [];
            chunk.forEach((s, ri) => {
                const base = ri * 9;
                valuesSql.push(`($${base+1},$${base+2},$${base+3},$${base+4},$${base+5},$${base+6},$${base+7},$${base+8},$${base+9})`);
                params.push(s.order_id, s.carrier_code, s.carrier_name, s.tracking_no,
                    s.shipping_fee, s.status, s.assigned_at, s.shipped_at, s.delivered_at);
            });
            await client.query(
                `INSERT INTO shipping_orders (order_id, carrier_code, carrier_name, tracking_no, shipping_fee, status, assigned_at, shipped_at, delivered_at)
                 VALUES ${valuesSql.join(', ')}`,
                params
            );
            shippingCount += chunk.length;
        }
        // Batch insert auto_codes for shippings
        const codesByCarrier = {};
        shipList.forEach(s => {
            if (!codesByCarrier[s.carrier_code]) codesByCarrier[s.carrier_code] = [];
            codesByCarrier[s.carrier_code].push(s.tracking_no);
        });
        for (const [carrier, codes] of Object.entries(codesByCarrier)) {
            await client.query(
                `INSERT INTO auto_codes (code, prefix, year)
                 SELECT unnest($1::text[]), $2, 2026 ON CONFLICT DO NOTHING`,
                [codes, carrier]
            );
        }
        console.log(`   ✓ Shipping orders: ${shippingCount} van chuyen`);

        // ----- 4e) RETURN_REQUESTS + ITEMS (cho đơn returned) -----
        const returnList = [];
        const returnItemsAll = [];
        const returnedOrders = orderIds.filter(o => o.status === 'returned');
        let returnCount = 0;
        for (const o of returnedOrders) {
            const reason = weightedPick(['khong_nhan_hang', 'sai_hang', 'hong_vo', 'khong_dung_mo_ta']);
            const source = weightedPick(['after_delivery', 'during_delivery']);
            const action = weightedPick(['return_to_warehouse', 'exchange', 'refund']);
            const rrstatus = weightedPick(['pending', 'processing', 'resolved', 'closed']);
            const createdAt = fmtDate(o.actualDelivery || o.date);
            returnList.push({ order: o, reason, source, action, rrstatus, createdAt });

            const returnItems = o.items.slice(0, rand(1, Math.min(2, o.items.length)));
            returnItems.forEach(it => {
                const qty = Math.min(it.quantity, rand(1, it.quantity));
                returnItemsAll.push({ return_ono: o.ono, product_id: it.product_id, quantity: qty, is_defective: Math.random() < 0.4 });
            });
            returnCount++;
        }
        // Batch insert return_requests
        const returnIdByOno = {};
        const RR_BATCH = 100;
        for (let i = 0; i < returnList.length; i += RR_BATCH) {
            const chunk = returnList.slice(i, i + RR_BATCH);
            const valuesSql = [];
            const params = [];
            chunk.forEach((r, ri) => {
                const base = ri * 6;
                valuesSql.push(`($${base+1},$${base+2},$${base+3},$${base+4},$${base+5},$${base+6})`);
                params.push(r.order.id, r.reason, r.source, r.action, r.rrstatus, r.createdAt);
            });
            const ins = await client.query(
                `INSERT INTO return_requests (order_id, customer_reject_reason, complaint_source, logistics_action, status, created_at)
                 VALUES ${valuesSql.join(', ')} RETURNING id, order_id`,
                params
            );
            ins.rows.forEach(r => { returnIdByOno[chunk.find(c => c.order.id === r.order_id).order.ono] = r.id; });
        }
        // Replace o.ono key with real return_id
        returnItemsAll.forEach(it => {
            it.return_dbId = returnIdByOno[it.return_ono];
            delete it.return_ono;
        });
        // Batch insert return_items
        const RI_BATCH = 500;
        let returnItemCount = 0;
        for (let i = 0; i < returnItemsAll.length; i += RI_BATCH) {
            const chunk = returnItemsAll.slice(i, i + RI_BATCH);
            const valuesSql = [];
            const params = [];
            chunk.forEach((it, ri) => {
                const base = ri * 4;
                valuesSql.push(`($${base+1},$${base+2},$${base+3},$${base+4})`);
                params.push(it.return_dbId, it.product_id, it.quantity, it.is_defective);
            });
            await client.query(
                `INSERT INTO return_items (return_id, product_id, quantity, is_defective) VALUES ${valuesSql.join(', ')}`,
                params
            );
            returnItemCount += chunk.length;
        }
        console.log(`   ✓ Return requests: ${returnCount} phieu, ${returnItemCount} items`);

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
