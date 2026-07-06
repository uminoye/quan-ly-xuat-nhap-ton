/**
 * Seed mẫu — 5 đơn hàng + data liên quan.
 * Khi user nhập thêm, hệ thống sẽ tự sinh mã tiếp theo:
 *   Đơn hàng: SO-2026-0006, SO-2026-0007...
 *   Sản phẩm: SP-2026-0006, SP-2026-0007...
 *   Khách hàng: KH-2026-0006, KH-2026-0007...
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_urDq5LjKC1Zp@ep-plain-waterfall-aor6r9l0-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false },
});

const YEAR = new Date().getFullYear(); // 2026

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── 1. Warehouses ──────────────────────────────────────────────────────────
    const whResult = await client.query(`
      INSERT INTO warehouses (warehouse_code, name, location)
      VALUES ('KHO-MAIN', 'Kho Chinh Binh Duong', 'So 1 Duong So 2, KCN Song Than, Binh Duong')
      ON CONFLICT (warehouse_code) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `);
    const warehouseId = whResult.rows[0].id;
    console.log('✓ Kho:', warehouseId);

    // ── 2. Products (5 mẫu → auto code sẽ nhảy SP-2026-0006) ────────────────
    const products = [
      { sku: 'LAP-XPS15',  name: 'Laptop Dell XPS 15 9530',       unit: 'Cai',  category: 'Laptop',        sale_price: 35000000, stock: 10 },
      { sku: 'MAC-M3',     name: 'MacBook Pro 14 inch M3',        unit: 'Cai',  category: 'Laptop',        sale_price: 39990000, stock: 8  },
      { sku: 'IPH-15P',    name: 'iPhone 15 Pro Max 256GB',       unit: 'Chiec', category: 'Dien thoai',    sale_price: 29500000, stock: 15 },
      { sku: 'MON-LG27',   name: 'Man hinh LG 27 inch 4K',        unit: 'Bo',    category: 'Phu kien',      sale_price: 8500000,  stock: 20 },
      { sku: 'KEY-MX',     name: 'Ban phim co Logitech MX Mechanical', unit: 'Cai', category: 'Phu kien', sale_price: 3200000,  stock: 50 },
    ];

    const productIds = [];
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const code = `SP-${YEAR}-${String(i + 1).padStart(4, '0')}`;
      // Pre-seed auto_codes
      await client.query(
        `INSERT INTO auto_codes (code, prefix, year) VALUES ($1, $2, $3)
         ON CONFLICT (code) DO NOTHING`,
        [code, 'SP', YEAR]
      );
      // Insert product
      const r = await client.query(`
        INSERT INTO products (sku, name, unit, category, sale_price)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, sale_price = EXCLUDED.sale_price
        RETURNING id
      `, [p.sku, p.name, p.unit, p.category, p.sale_price]);
      productIds.push({ id: r.rows[0].id, ...p });
    }
    console.log('✓ 5 San pham');

    // ── 3. Inventory balances (cho 5 sp) ─────────────────────────────────────
    for (const prod of productIds) {
      await client.query(`
        INSERT INTO inventory_balances (warehouse_id, product_id, on_hand_qty)
        VALUES ($1, $2, $3)
        ON CONFLICT (warehouse_id, product_id) DO UPDATE SET on_hand_qty = EXCLUDED.on_hand_qty
      `, [warehouseId, prod.id, prod.stock]);
    }
    console.log('✓ Ton kho');

    // ── 4. Customers (5 mẫu → auto code sẽ nhảy KH-2026-0006) ──────────────
    const customers = [
      { company: 'Cong Ty TNHH Vien Thong A', phone: '02812345678', address: '123 Le Lai, Q1, TP.HCM', contact: 'Nguyen Van A' },
      { company: 'Cong Ty CP Tin Hoc B',      phone: '02823456789', address: '456 Nguyen Trai, Q5, TP.HCM', contact: 'Tran Thi B' },
      { company: 'Cua Hang Dien Tu C',       phone: '02834567890', address: '789 Hung Vuong, Q10, TP.HCM', contact: 'Le Van C' },
      { company: 'CTY TNHH ABC Tech',         phone: '02845678901', address: '101 Dien Bien Phu, Binh Thanh, TP.HCM', contact: 'Pham D' },
      { company: 'Cong Ty Hao Hao',           phone: '02856789012', address: '202 Vo Van KIet, Q5, TP.HCM', contact: 'Trinh E' },
    ];

    const customerIds = [];
    for (let i = 0; i < customers.length; i++) {
      const c = customers[i];
      const code = `KH-${YEAR}-${String(i + 1).padStart(4, '0')}`;
      await client.query(
        `INSERT INTO auto_codes (code, prefix, year) VALUES ($1, $2, $3)
         ON CONFLICT (code) DO NOTHING`,
        [code, 'KH', YEAR]
      );
      const r = await client.query(`
        INSERT INTO customers (customer_code, company_name, phone, address, contact_person)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (customer_code) DO UPDATE SET company_name = EXCLUDED.company_name
        RETURNING id
      `, [code, c.company, c.phone, c.address, c.contact]);
      customerIds.push({ id: r.rows[0].id, ...c });
    }
    console.log('✓ 5 Khach hang');

    // ── 5. Sales Orders (5 mẫu → user nhap tiep se tu dong SO-2026-0006) ─────
    const orderStatuses = ['completed', 'completed', 'pending', 'warehouse_processing', 'shipping'];
    const orderNotes = [
      'Giao hang nhanh, can gap.',
      'Khach VIP, uu tien xu ly.',
      '',
      '',
      'Giao buoi sang, can goi truoc 30 phut.',
    ];

    for (let i = 0; i < 5; i++) {
      const orderNo = `SO-${YEAR}-${String(i + 1).padStart(4, '0')}`;
      const cust = customerIds[i];
      const prod1 = productIds[i % productIds.length];
      const prod2 = productIds[(i + 1) % productIds.length];
      const status = orderStatuses[i];
      const now = new Date();
      const deliveryDate = new Date(now);
      deliveryDate.setDate(deliveryDate.getDate() + 3 + i);

      const orderRes = await client.query(`
        INSERT INTO sales_orders
          (order_no, customer_id, order_date, expected_delivery_date, status, note, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, 1)
        ON CONFLICT (order_no) DO NOTHING
        RETURNING id
      `, [orderNo, cust.id, now.toISOString(), deliveryDate.toISOString(), status, orderNotes[i]]);

      if (orderRes.rows.length > 0) {
        const orderId = orderRes.rows[0].id;

        // Item 1
        await client.query(`
          INSERT INTO sales_order_items (order_id, product_id, quantity, unit_price)
          VALUES ($1, $2, $3, $4)
        `, [orderId, prod1.id, 2 + i, prod1.sale_price]);

        // Item 2
        await client.query(`
          INSERT INTO sales_order_items (order_id, product_id, quantity, unit_price)
          VALUES ($1, $2, $3, $4)
        `, [orderId, prod2.id, 1, prod2.sale_price]);

        // Neu completed → giam ton kho
        if (status === 'completed') {
          await client.query(`
            UPDATE inventory_balances
            SET on_hand_qty = on_hand_qty - 3
            WHERE warehouse_id = $1 AND product_id = $2
          `, [warehouseId, prod1.id]);
          await client.query(`
            UPDATE inventory_balances
            SET on_hand_qty = on_hand_qty - 1
            WHERE warehouse_id = $1 AND product_id = $2
          `, [warehouseId, prod2.id]);
        }
      }
    }
    console.log('✓ 5 Don hang mau');

    await client.query('COMMIT');
    console.log('\nSeed xong!');
    console.log('  Don hang tiep theo se la: SO-2026-0006');
    console.log('  San pham tiep theo se la: SP-2026-0006');
    console.log('  Khach hang tiep theo se la: KH-2026-0006');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Loi seed:', err.message);
    console.error(err.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
