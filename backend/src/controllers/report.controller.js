const db = require('../config/database');

const toNumber = (value) => Number(value || 0);

const getDashboardStats = async (req, res) => {
    try {
        const [productRow, warehouseRow, lowStockRow, revenueRow, processingRow] = await Promise.all([
            db.getOne('SELECT COUNT(*) as total_products FROM products'),
            db.getOne('SELECT COUNT(*) as total_warehouses FROM warehouses'),
            db.getOne('SELECT COUNT(*) as low_stock FROM inventory_balances WHERE COALESCE(on_hand_qty, 0) < 50'),
            db.getOne(`
                SELECT COALESCE(SUM(oi.quantity * COALESCE(oi.unit_price, p.sale_price, 0)), 0) as total_revenue
                FROM sales_orders o
                JOIN sales_order_items oi ON oi.order_id = o.id
                LEFT JOIN products p ON p.id = oi.product_id
                WHERE o.status = 'completed'
            `),
            db.getOne(`
                SELECT COUNT(*) as processing_orders
                FROM sales_orders
                WHERE status IN ('pending', 'processing', 'warehouse_processing')
            `),
        ]);

        const [revenueRows, importRows, exportRows, lowStockRows, topSellingProducts, recentOrders, recentExports, recentImports] = await Promise.all([
            db.getAll(`
                SELECT
                    TO_CHAR(COALESCE(o.actual_delivery_date, o.updated_at, o.created_at), 'YYYY-MM') as month,
                    COALESCE(SUM(oi.quantity * COALESCE(oi.unit_price, p.sale_price, 0)), 0) as revenue
                FROM sales_orders o
                JOIN sales_order_items oi ON oi.order_id = o.id
                LEFT JOIN products p ON p.id = oi.product_id
                WHERE o.status = 'completed'
                    AND COALESCE(o.actual_delivery_date, o.updated_at, o.created_at) IS NOT NULL
                GROUP BY TO_CHAR(COALESCE(o.actual_delivery_date, o.updated_at, o.created_at), 'YYYY-MM')
                ORDER BY month ASC
            `),
            db.getAll(`
                SELECT
                    TO_CHAR(created_at, 'YYYY-MM') as month,
                    COUNT(*) as total
                FROM production_receipts
                WHERE created_at IS NOT NULL
                GROUP BY TO_CHAR(created_at, 'YYYY-MM')
                ORDER BY month ASC
            `),
            db.getAll(`
                SELECT
                    TO_CHAR(export_date, 'YYYY-MM') as month,
                    COUNT(*) as total
                FROM stock_outbound_notes
                WHERE export_date IS NOT NULL
                GROUP BY TO_CHAR(export_date, 'YYYY-MM')
                ORDER BY month ASC
            `),
            db.getAll(`
                SELECT
                    p.id, p.sku, p.name,
                    COALESCE(p.stock, ib.total_stock, 0) as stock, p.unit
                FROM products p
                LEFT JOIN (
                    SELECT product_id, SUM(on_hand_qty) as total_stock
                    FROM inventory_balances GROUP BY product_id
                ) ib ON ib.product_id = p.id
                WHERE COALESCE(p.stock, ib.total_stock, 0) < 50
                ORDER BY COALESCE(p.stock, ib.total_stock, 0) ASC, p.name ASC
                LIMIT 10
            `),
            db.getAll(`
                SELECT p.name, SUM(oi.quantity) as value
                FROM sales_order_items oi
                JOIN sales_orders o ON o.id = oi.order_id
                JOIN products p ON p.id = oi.product_id
                WHERE o.status = 'completed'
                GROUP BY p.name
                ORDER BY value DESC
                LIMIT 5
            `),
            db.getAll(`
                SELECT
                    o.id, o.order_no, o.status, o.expected_delivery_date,
                    COALESCE(o.actual_delivery_date, o.updated_at, o.created_at) as completed_at,
                    c.company_name as customer_name
                FROM sales_orders o
                JOIN customers c ON c.id = o.customer_id
                ORDER BY o.created_at DESC
                LIMIT 5
            `),
            db.getAll(`
                SELECT s.id, s.outbound_no as code, s.status,
                    s.export_date as activity_date, 'Xuat kho' as type,
                    w.name as warehouse_name, s.order_id
                FROM stock_outbound_notes s
                LEFT JOIN warehouses w ON w.id = s.warehouse_id
                ORDER BY s.id DESC LIMIT 5
            `),
            db.getAll(`
                SELECT r.id, r.receipt_no as code, r.status,
                    r.created_at as activity_date, 'Nhap kho' as type, w.name as warehouse_name
                FROM production_receipts r
                LEFT JOIN warehouses w ON w.id = r.warehouse_id
                ORDER BY r.id DESC LIMIT 5
            `),
        ]);

        const monthMap = {};
        const ensureMonth = (month) => {
            if (!monthMap[month]) monthMap[month] = { name: month, 'Nhap': 0, 'Xuat': 0, 'DoanhThu': 0 };
        };

        revenueRows.forEach((row) => {
            if (!row.month) return;
            ensureMonth(row.month);
            monthMap[row.month].DoanhThu = toNumber(row.revenue);
        });
        importRows.forEach((row) => {
            if (!row.month) return;
            ensureMonth(row.month);
            monthMap[row.month].Nhap = toNumber(row.total);
        });
        exportRows.forEach((row) => {
            if (!row.month) return;
            ensureMonth(row.month);
            monthMap[row.month].Xuat = toNumber(row.total);
        });

        res.status(200).json({
            total_products: toNumber(productRow?.total_products),
            total_warehouses: toNumber(warehouseRow?.total_warehouses),
            low_stock: toNumber(lowStockRow?.low_stock),
            total_revenue: toNumber(revenueRow?.total_revenue),
            processing_orders: toNumber(processingRow?.processing_orders),
            revenue_trend: revenueRows,
            monthly_import_export: Object.values(monthMap).sort((a, b) => a.name.localeCompare(b.name)),
            top_selling_products: topSellingProducts,
            low_stock_products: lowStockRows,
            recent_orders: recentOrders,
            recent_activities: [...recentExports, ...recentImports]
                .sort((a, b) => new Date(b.activity_date || 0) - new Date(a.activity_date || 0))
                .slice(0, 5),
        });
    } catch (err) {
        console.error('Dashboard stats error:', err);
        res.status(500).json({ message: 'Loi lay du lieu dashboard', error: err.message });
    }
};

const getInventoryReport = async (req, res) => {
    try {
        const rows = await db.getAll(`
            SELECT
                p.sku, p.name as product_name, w.name as warehouse_name,
                ib.on_hand_qty, p.unit, p.sale_price,
                (ib.on_hand_qty * p.sale_price) as total_value
            FROM inventory_balances ib
            JOIN products p ON ib.product_id = p.id
            JOIN warehouses w ON ib.warehouse_id = w.id
            WHERE ib.on_hand_qty > 0
            ORDER BY w.name, p.name
        `);
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Loi lay bao cao', error: err.message });
    }
};

module.exports = { getDashboardStats, getInventoryReport };
