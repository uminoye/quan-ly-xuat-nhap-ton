require('dotenv').config();
const { pool } = require('./src/config/database');

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rand(0, arr.length - 1)];
const fmtDate = (d) => d.toISOString();

async function seedToday() {
  const client = await pool.connect();
  try {
    console.log('Seeding data for today...');
    await client.query('BEGIN');

    // Get today's date
    const today = new Date();
    // Get warehouses
    const whRes = await client.query('SELECT id FROM warehouses');
    const whIds = whRes.rows.map(r => r.id);
    if (!whIds.length) throw new Error('No warehouses');

    // Get products
    const prodRes = await client.query('SELECT id, sale_price FROM products');
    const prods = prodRes.rows;
    if (!prods.length) throw new Error('No products');

    // Get customers
    const custRes = await client.query('SELECT id FROM customers');
    const custIds = custRes.rows.map(r => r.id);

    // Get users
    const userRes = await client.query('SELECT id, role_id FROM users');
    const users = userRes.rows;
    const admin = users.find(u => u.role_id === 1)?.id || users[0].id;
    const sales = users.find(u => u.role_id === 2)?.id || admin;
    const warehouse = users.find(u => u.role_id === 4)?.id || admin;
    const logistics = users.find(u => u.role_id === 3)?.id || admin;

    // 1. Seed some production receipts
    for (let i = 0; i < 2; i++) {
      const rDate = new Date(today.getTime() - rand(1, 4)*3600000);
      const r = await client.query(
        `INSERT INTO production_receipts (receipt_no, warehouse_id, receipt_date, created_by, status, note) 
         VALUES ($1, $2, $3, $4, 'completed', 'Nhap kho hom nay') RETURNING id`,
        [`PXN-TODAY-${Date.now()}-${i}`, pick(whIds), fmtDate(rDate), warehouse]
      );
      const rId = r.rows[0].id;
      
      const p = pick(prods);
      const qty = rand(20, 50);
      await client.query(
        `INSERT INTO production_receipt_items (receipt_id, product_id, quantity) VALUES ($1, $2, $3)`,
        [rId, p.id, qty]
      );

      // Update inventory
      const whId = pick(whIds);
      const invCheck = await client.query(`SELECT id FROM inventory_balances WHERE warehouse_id=$1 AND product_id=$2`, [whId, p.id]);
      if (invCheck.rows.length) {
        await client.query(`UPDATE inventory_balances SET on_hand_qty = on_hand_qty + $1 WHERE id=$2`, [qty, invCheck.rows[0].id]);
      } else {
        await client.query(`INSERT INTO inventory_balances (warehouse_id, product_id, on_hand_qty) VALUES ($1, $2, $3)`, [whId, p.id, qty]);
      }
    }

    // 2. Seed some sales orders
    for (let i = 0; i < 3; i++) {
      const oDate = new Date(today.getTime() - rand(1, 8)*3600000);
      const o = await client.query(
        `INSERT INTO sales_orders (order_no, customer_id, created_by, status, created_at, order_date) 
         VALUES ($1, $2, $3, 'completed', $4, $4) RETURNING id`,
        [`SO-TODAY-${Date.now()}-${i}`, pick(custIds), sales, fmtDate(oDate)]
      );
      const oId = o.rows[0].id;

      const p = pick(prods);
      const qty = rand(1, 5);
      await client.query(
        `INSERT INTO sales_order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)`,
        [oId, p.id, qty, p.sale_price]
      );

      // Add outbound note
      const ob = await client.query(
        `INSERT INTO stock_outbound_notes (outbound_no, order_id, warehouse_id, export_date, created_by, status)
         VALUES ($1, $2, $3, $4, $5, 'completed') RETURNING id`,
        [`PXK-TODAY-${Date.now()}-${i}`, oId, pick(whIds), fmtDate(oDate), warehouse]
      );

      // Deduct inventory
      const whId = pick(whIds);
      await client.query(`UPDATE inventory_balances SET on_hand_qty = GREATEST(0, on_hand_qty - $1) WHERE warehouse_id=$2 AND product_id=$3`, [qty, whId, p.id]);
    }

    await client.query('COMMIT');
    console.log('Seeded data for today!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error seeding today data:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

seedToday();
