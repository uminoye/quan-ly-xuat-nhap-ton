const db = require('../config/database');
const generateCode = require('../utils/autoCode');

const getAllProducts = async (req, res) => {
    try {
        const query = `
            SELECT
                p.*,
                COALESCE(p.min_stock, 50) as min_stock,
                COALESCE(SUM(ib.on_hand_qty), 0) as total_stock,
                CASE
                    WHEN COALESCE(SUM(ib.on_hand_qty), 0) = 0 THEN 'Het hang'
                    WHEN COALESCE(SUM(ib.on_hand_qty), 0) < COALESCE(p.min_stock, 50) THEN 'Sap het hang'
                    ELSE 'Con hang'
                END as stock_status,
                (
                    SELECT string_agg(w.name || ': ' || COALESCE(ib2.on_hand_qty, 0)::text, ' | ')
                    FROM warehouses w
                    LEFT JOIN inventory_balances ib2 ON w.id = ib2.warehouse_id AND ib2.product_id = p.id
                ) as stock_breakdown
            FROM products p
            LEFT JOIN inventory_balances ib ON p.id = ib.product_id
            GROUP BY p.id
            ORDER BY p.id DESC
        `;
        const rows = await db.getAll(query);
        res.status(200).json(rows);
    } catch (err) {
        console.error('[products GET] error:', err);
        res.status(500).json({ message: 'Loi Database', error: err.message });
    }
};

const createProduct = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { name, sale_price, unit, category, image_url, min_stock, warehouse_id, initial_stock } = req.body;
        if (!name || !sale_price) {
            return res.status(400).json({ message: 'Vui long nhap Ten va Gia' });
        }
        const sku = await generateCode('product', client);
        const result = await client.query(
            `INSERT INTO products (sku, name, sale_price, unit, category, image_url, min_stock)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [sku, name, sale_price, unit || 'cai', category || null, image_url || null, parseInt(min_stock, 10) || 50]
        );
        const productId = result.rows[0].id;
        const stockQty = parseInt(initial_stock, 10) || 0;

        if (stockQty > 0) {
            if (warehouse_id === 'all') {
                const warehouses = await db.getAll(`SELECT id FROM warehouses`);
                for (const row of warehouses) {
                    await client.query(
                        `INSERT INTO inventory_balances (warehouse_id, product_id, on_hand_qty) VALUES ($1, $2, $3)`,
                        [row.id, productId, stockQty]
                    );
                }
            } else {
                await client.query(
                    `INSERT INTO inventory_balances (warehouse_id, product_id, on_hand_qty) VALUES ($1, $2, $3)`,
                    [warehouse_id, productId, stockQty]
                );
            }
        }
        res.status(201).json({ message: stockQty > 0 ? 'Them SP va luu Ton kho thanh cong!' : 'Them san pham thanh cong!', sku });
    } catch (err) {
        if (err.message.includes('duplicate') || err.message.includes('unique')) {
            return res.status(400).json({ message: `Ma SKU da ton tai! Vui long thu lai.` });
        }
        res.status(500).json({ message: 'Loi Database' });
    } finally {
        client.release();
    }
};

const updateProduct = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { id } = req.params;
        const { sku, name, sale_price, unit, category, image_url, min_stock, adjust_stock, target_warehouse } = req.body;

        await client.query(
            `UPDATE products SET sku = $1, name = $2, sale_price = $3, unit = $4, category = $5, image_url = $6, min_stock = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8`,
            [sku, name, sale_price, unit, category || null, image_url || null, parseInt(min_stock, 10) || 50, id]
        );

        if (adjust_stock !== undefined && adjust_stock !== '' && target_warehouse) {
            if (target_warehouse === 'all') {
                return res.status(400).json({ message: 'Muon sua ton kho thi phai chon dung 1 kho cu the!' });
            }
            const newQty = parseInt(adjust_stock, 10) || 0;
            const existing = await db.getOne(`SELECT id FROM inventory_balances WHERE product_id = $1 AND warehouse_id = $2`, [id, target_warehouse]);
            if (existing) {
                await client.query(`UPDATE inventory_balances SET on_hand_qty = $1, updated_at = CURRENT_TIMESTAMP WHERE product_id = $2 AND warehouse_id = $3`, [newQty, id, target_warehouse]);
            } else {
                await client.query(`INSERT INTO inventory_balances (warehouse_id, product_id, on_hand_qty) VALUES ($1, $2, $3)`, [target_warehouse, id, newQty]);
            }
            return res.status(200).json({ message: 'Da cap nhat SP va Dieu chinh ton kho thanh cong!' });
        }
        res.status(200).json({ message: 'Cap nhat thong tin san pham thanh cong!' });
    } catch (err) {
        if (err.message.includes('duplicate') || err.message.includes('unique')) {
            return res.status(400).json({ message: `Ma SKU "${req.body.sku}" da ton tai!` });
        }
        res.status(500).json({ message: 'Loi Database khi cap nhat thong tin' });
    } finally {
        client.release();
    }
};

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const row = await db.getOne(`SELECT COALESCE(SUM(on_hand_qty), 0) AS total_stock FROM inventory_balances WHERE product_id = $1`, [id]);
        const totalStock = Number(row?.total_stock || 0);
        if (totalStock > 0) {
            return res.status(400).json({ message: 'Khong the xoa san pham vi van con ton kho!' });
        }
        const result = await db.run(`DELETE FROM products WHERE id = $1`, [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Khong tim thay san pham can xoa' });
        }
        res.status(200).json({ message: 'Xoa san pham thanh cong' });
    } catch (err) {
        res.status(500).json({ message: 'Loi khi xoa san pham', error: err.message });
    }
};

module.exports = { getAllProducts, createProduct, updateProduct, deleteProduct };
