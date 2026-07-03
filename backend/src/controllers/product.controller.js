const db = require('../config/database');

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
        console.log(`[products GET] success, rows: ${rows.length}`);
        res.status(200).json(rows);
    } catch (err) {
        console.error('[products GET] error:', err);
        console.error('[products GET] stack:', err.stack);
        res.status(500).json({ message: 'Loi Database', error: err.message });
    }
};

const createProduct = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { name, sale_price, unit, category, image_url, min_stock, warehouse_id, initial_stock } = req.body;

        // Validate
        if (!name || String(name).trim().length === 0) {
            return res.status(400).json({ message: 'Vui long nhap Ten san pham' });
        }
        if (!sale_price || isNaN(Number(sale_price)) || Number(sale_price) <= 0) {
            return res.status(400).json({ message: 'Vui long nhap Don gia hop le' });
        }

        await client.query('BEGIN');

        // Sinh SKU trong cùng transaction
        const prefix = 'SP';
        const year = new Date().getFullYear();
        const pattern = `${prefix}-${year}-%`;
        const lockRes = await client.query(
            `SELECT code FROM auto_codes WHERE code LIKE $1 ORDER BY code DESC LIMIT 1 FOR UPDATE`,
            [pattern]
        );
        let nextNum = 1;
        if (lockRes.rows[0]?.code) {
            const lastNum = parseInt(lockRes.rows[0].code.split('-').pop(), 10);
            nextNum = isNaN(lastNum) ? 1 : lastNum + 1;
        }
        const sku = `${prefix}-${year}-${String(nextNum).padStart(4, '0')}`;
        await client.query(
            `INSERT INTO auto_codes (code, prefix, year) VALUES ($1, $2, $3) ON CONFLICT (code) DO NOTHING`,
            [sku, prefix, year]
        );

        // Insert san pham
        const insertRes = await client.query(
            `INSERT INTO products (sku, name, sale_price, unit, category, image_url, min_stock)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [sku, String(name).trim(), Number(sale_price), unit || 'Cai', category || null, image_url || null, parseInt(min_stock, 10) || 50]
        );
        const productId = insertRes.rows[0].id;
        const stockQty = parseInt(initial_stock, 10) || 0;

        if (stockQty > 0) {
            if (warehouse_id === 'all') {
                const whRes = await client.query(`SELECT id FROM warehouses`);
                for (const row of whRes.rows) {
                    await client.query(
                        `INSERT INTO inventory_balances (warehouse_id, product_id, on_hand_qty)
                         VALUES ($1, $2, $3)
                         ON CONFLICT (warehouse_id, product_id) DO UPDATE SET on_hand_qty = $3, updated_at = CURRENT_TIMESTAMP`,
                        [row.id, productId, stockQty]
                    );
                }
            } else if (warehouse_id) {
                await client.query(
                    `INSERT INTO inventory_balances (warehouse_id, product_id, on_hand_qty)
                     VALUES ($1, $2, $3)
                     ON CONFLICT (warehouse_id, product_id) DO UPDATE SET on_hand_qty = $3, updated_at = CURRENT_TIMESTAMP`,
                    [warehouse_id, productId, stockQty]
                );
            }
        }

        await client.query('COMMIT');
        res.status(201).json({
            message: stockQty > 0 ? 'Them SP va luu Ton kho thanh cong!' : 'Them san pham thanh cong!',
            sku
        });
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        console.error('[createProduct] error:', err.message);
        if (err.code === '23505') { // unique_violation
            return res.status(400).json({ message: 'Ma SKU da ton tai! Vui long thu lai.' });
        }
        res.status(500).json({ message: 'Loi Database', error: err.message });
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
            await client.query(
                `INSERT INTO inventory_balances (warehouse_id, product_id, on_hand_qty)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (warehouse_id, product_id) DO UPDATE SET on_hand_qty = $3, updated_at = CURRENT_TIMESTAMP`,
                [target_warehouse, id, newQty]
            );
            return res.status(200).json({ message: 'Da cap nhat SP va Dieu chinh ton kho thanh cong!' });
        }
        res.status(200).json({ message: 'Cap nhat thong tin san pham thanh cong!' });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ message: `Ma SKU "${req.body.sku}" da ton tai!` });
        }
        res.status(500).json({ message: 'Loi Database khi cap nhat thong tin' });
    } finally {
        client.release();
    }
};

const deleteProduct = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { id } = req.params;

        let totalStock = 0;
        const stockResult = await client.query(
            `SELECT COALESCE(SUM(on_hand_qty), 0)::int AS total_stock FROM inventory_balances WHERE product_id = $1`,
            [id]
        );
        totalStock = Number(stockResult.rows[0]?.total_stock || 0);

        if (totalStock > 0) {
            client.release();
            return res.status(400).json({ message: 'Khong the xoa san pham vi van con ton kho!' });
        }

        await client.query('BEGIN');
        const skuRow = await client.query(`SELECT sku FROM products WHERE id = $1`, [id]);
        const sku = skuRow.rows[0]?.sku;
        await client.query(`DELETE FROM inventory_transactions WHERE product_id = $1`, [id]);
        await client.query(`DELETE FROM inventory_balances WHERE product_id = $1`, [id]);
        const result = await client.query(`DELETE FROM products WHERE id = $1`, [id]);
        if (sku) await client.query(`DELETE FROM auto_codes WHERE code = $1`, [sku]);
        await client.query('COMMIT');

        if (result.rowCount === 0) {
            client.release();
            return res.status(404).json({ message: 'Khong tim thay san pham can xoa' });
        }
        client.release();
        res.status(200).json({ message: 'Xoa san pham thanh cong' });
    } catch (err) {
        try { await client.query('ROLLBACK'); } catch (_) {}
        client.release();
        if (err.code === '23503') {
            return res.status(400).json({ message: 'San pham dang duoc su dung trong don hang hoac phieu, khong the xoa!' });
        }
        res.status(500).json({ message: 'Loi khi xoa san pham', error: err.message });
    }
};

module.exports = { getAllProducts, createProduct, updateProduct, deleteProduct };
