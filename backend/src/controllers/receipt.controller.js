const db = require('../config/database');

const getAllReceipts = async (req, res) => {
    try {
        const rows = await db.getAll(`
            SELECT p.*, w.name as warehouse_name, u.full_name as creator_name
            FROM production_receipts p
            LEFT JOIN warehouses w ON p.warehouse_id = w.id
            LEFT JOIN users u ON p.created_by = u.id
            ORDER BY p.id DESC
        `);

        if (!rows.length) return res.status(200).json([]);

        const items = await db.getAll(`
            SELECT pri.receipt_id, pri.product_id, pri.quantity, p.name as product_name
            FROM production_receipt_items pri
            LEFT JOIN products p ON p.id = pri.product_id
            WHERE pri.receipt_id = ANY($1::int[])
            ORDER BY pri.id ASC
        `, [rows.map(r => r.id)]);

        const itemsByReceipt = items.reduce((acc, item) => {
            if (!acc[item.receipt_id]) acc[item.receipt_id] = [];
            acc[item.receipt_id].push(item);
            return acc;
        }, {});

        const result = rows.map(row => ({
            ...row,
            items: itemsByReceipt[row.id] || []
        }));
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ message: 'Loi may chu', error: err.message });
    }
};

const createRequest = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { receipt_no, warehouse_id, receipt_date, note, items } = req.body;
        const created_by = req.user?.id || 1;
        if (!receipt_no || !receipt_no.trim()) return res.status(400).json({ message: 'Vui long nhap ma phieu!' });
        if (!warehouse_id) return res.status(400).json({ message: 'Vui long chon kho nhap!' });
        if (!receipt_date) return res.status(400).json({ message: 'Vui long chon ngay!' });
        if (!items || items.length === 0) return res.status(400).json({ message: 'Phai co san pham!' });
        const cleanWarehouseId = Number(warehouse_id);
        if (isNaN(cleanWarehouseId)) return res.status(400).json({ message: 'Kho khong hop le!' });

        await client.query('BEGIN');
        await client.query(
            `INSERT INTO production_receipts (receipt_no, warehouse_id, receipt_date, created_by, note, status)
             VALUES ($1, $2, $3, $4, $5, 'pending')`,
            [receipt_no.trim(), cleanWarehouseId, receipt_date, created_by, note || '']
        );
        const receipt = await db.getOne(`SELECT id FROM production_receipts WHERE receipt_no = $1 ORDER BY id DESC LIMIT 1`, [receipt_no.trim()], client);
        for (const item of items) {
            if (!item.product_id) continue;
            await client.query(
                `INSERT INTO production_receipt_items (receipt_id, product_id, quantity) VALUES ($1, $2, $3)`,
                [receipt.id, Number(item.product_id), Math.max(1, Number(item.quantity) || 1)]
            );
        }
        await client.query('COMMIT');
        res.status(201).json({ message: 'Da gui yeu cau cho Nha may!' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Create receipt error:', err.message, 'Code:', err.code);
        if (err.code === '23505') return res.status(400).json({ message: 'Ma phieu da ton tai, vui long dung ma khac!' });
        if (err.code === '23503') return res.status(400).json({ message: 'Kho hoac san pham khong ton tai trong he thong!' });
        res.status(400).json({ message: 'Loi tao phieu: ' + err.message });
    } finally {
        client.release();
    }
};

const factoryRespond = async (req, res) => {
    try {
        const receiptId = req.params.id;
        const { action, expected_date, reason } = req.body;

        if (!receiptId) return res.status(400).json({ message: 'Thieu ma phieu can xu ly.' });
        if (!['accept', 'reject'].includes(action)) return res.status(400).json({ message: 'Hanh dong khong hop le.' });
        if (action === 'accept' && !expected_date) return res.status(400).json({ message: 'Vui long chon ngay giao du kien truoc khi duyet.' });

        const receipt = await db.getOne(`SELECT status, note FROM production_receipts WHERE id = $1`, [receiptId]);
        if (!receipt) return res.status(404).json({ message: 'Khong tim thay phieu can xu ly.' });
        if (receipt.status !== 'pending') return res.status(400).json({ message: `Phieu dang o trang thai ${receipt.status}, khong the duyet.` });

        const newStatus = action === 'accept' ? 'processing' : 'rejected';
        const finalNote = `[NM Phan hoi]: ${reason || 'Khong co ly do'} | Cu: ${receipt.note || ''}`;
        const respondentName = req.user?.full_name || req.user?.name || null;

        await db.run(
            `UPDATE production_receipts SET status = $1, receipt_date = $2, note = $3, responded_by = $4, responded_reason = $5, expected_delivery_date = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7`,
            [newStatus, expected_date || null, finalNote, respondentName, reason || null, expected_date || null, receiptId]
        );

        res.status(200).json({
            message: action === 'accept' ? 'Da duyet phieu va hen ngay giao hang!' : 'Da tu choi yeu cau nhap kho!'
        });
    } catch (err) {
        res.status(500).json({ message: 'Loi cap nhat phieu duyet.', error: err.message });
    }
};

const confirmReceipt = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const receiptId = req.params.id;
        const receipt = await db.getOne(`SELECT status, warehouse_id FROM production_receipts WHERE id = $1`, [receiptId]);
        if (!receipt || receipt.status !== 'processing') {
            return res.status(400).json({ message: 'Nha may chua giao hoac phieu da chot!' });
        }
        const items = await db.getAll(`SELECT product_id, quantity FROM production_receipt_items WHERE receipt_id = $1`, [receiptId]);

        await client.query('BEGIN');
        for (const item of items) {
            await client.query(`INSERT INTO inventory_balances (warehouse_id, product_id, on_hand_qty, updated_at)
                VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
                ON CONFLICT (warehouse_id, product_id)
                DO UPDATE SET on_hand_qty = inventory_balances.on_hand_qty + $3, updated_at = CURRENT_TIMESTAMP`,
                [receipt.warehouse_id, item.product_id, item.quantity]
            );
            await client.query(
                `INSERT INTO inventory_transactions (warehouse_id, product_id, transaction_type, quantity, reference_type, reference_id)
                 VALUES ($1, $2, 'IN', $3, 'production_receipt', $4)`,
                [receipt.warehouse_id, item.product_id, item.quantity, receiptId]
            );
        }
        await client.query(`UPDATE production_receipts SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [receiptId]);
        await client.query('COMMIT');
        res.status(200).json({ message: 'Da nhan hang va cong ton kho!' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Loi cong kho' });
    } finally {
        client.release();
    }
};

module.exports = { getAllReceipts, createRequest, factoryRespond, confirmReceipt };
