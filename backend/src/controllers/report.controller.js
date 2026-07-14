const db = require('../config/database');
const { verifyToken } = require('../middlewares/auth.middleware');

const toNumber = (value) => Number(value || 0);

const buildDateFilter = (period) => {
    switch (period) {
        case 'day':
            return { label: 'Hôm nay', sql: "created_at >= CURRENT_DATE" };
        case 'week':
            return { label: 'Tuần này', sql: "created_at >= DATE_TRUNC('week', CURRENT_DATE)" };
        case 'month':
            return { label: 'Tháng này', sql: "created_at >= DATE_TRUNC('month', CURRENT_DATE)" };
        case 'quarter':
            return { label: 'Quý này', sql: "created_at >= DATE_TRUNC('quarter', CURRENT_DATE)" };
        default:
            return { label: 'Tất cả', sql: null };
    }
};

// ============================================================
// Admin Dashboard — tổng quan toàn hệ thống (Power BI style)
// ============================================================
const getAdminDashboard = async (req, res) => {
    try {
        const period = req.query.period || 'month';
        const dateFilter = buildDateFilter(period);
        const dateSql = dateFilter.sql ? `AND ${dateFilter.sql}` : '';
        const soDateSql = dateSql.replace('created_at', 'o.created_at');
        // Dùng actual_delivery_date cho chart (phân bố đều theo tháng), fallback về created_at
        const orderDateCol = 'COALESCE(o.actual_delivery_date, o.updated_at, o.created_at)';
        const orderDateSql = dateFilter.sql
            ? `AND ${dateFilter.sql.replace('created_at', orderDateCol)}`
            : '';
        // revenueByMonth: group by month for quarter/all, by day for day/week/month
        const revenueMonthGroup = period === 'quarter' || period === 'all'
            ? `TO_CHAR(${orderDateCol}, 'YYYY-MM')`
            : `TO_CHAR(${orderDateCol}, 'YYYY-MM-DD')`;

        const [totalUsersRow, totalProductsRow, totalCustomersRow, totalWarehousesRow,
            totalOrdersRow, completedOrdersRow, pendingOrdersRow,
            totalRevenueRow, totalReceiptsRow, totalOutboundsRow,
            lowStockRow, returnPendingRow, outboundPendingRow,
            revenueByDay, ordersByDay, revenueByMonth, ordersByStatus,
            ordersByCategory, revenueByCarrier, topCustomersList
        ] = await Promise.all([
            db.getOne('SELECT COUNT(*) as total FROM users WHERE status = \'active\''),
            db.getOne('SELECT COUNT(*) as total FROM products'),
            db.getOne('SELECT COUNT(*) as total FROM customers'),
            db.getOne('SELECT COUNT(*) as total FROM warehouses'),
            db.getOne(`SELECT COUNT(*) as total FROM sales_orders WHERE 1=1 ${dateSql.replace('created_at', 'sales_orders.created_at')}`),
            db.getOne(`SELECT COUNT(*) as total FROM sales_orders WHERE status = 'completed' ${dateSql.replace('created_at', 'sales_orders.updated_at')}`),
            db.getOne(`SELECT COUNT(*) as total FROM sales_orders WHERE status IN ('pending', 'warehouse_processing', 'waiting_sales', 'shipping') ${dateSql.replace('created_at', 'sales_orders.created_at')}`),
            db.getOne(`
                SELECT COALESCE(SUM(oi.quantity * COALESCE(oi.unit_price, p.sale_price, 0)), 0) as total
                FROM sales_orders o
                JOIN sales_order_items oi ON oi.order_id = o.id
                LEFT JOIN products p ON p.id = oi.product_id
                WHERE o.status = 'completed'
            `),
            db.getOne(`SELECT COUNT(*) as total FROM production_receipts WHERE 1=1 ${dateSql}`),
            db.getOne(`SELECT COUNT(*) as total FROM stock_outbound_notes WHERE 1=1 ${dateSql}`),
            db.getOne(`
                SELECT COUNT(*) as total FROM inventory_balances ib
                JOIN warehouses w ON ib.warehouse_id = w.id
                WHERE COALESCE(ib.on_hand_qty, 0) < COALESCE((SELECT min_stock FROM products WHERE id = ib.product_id), 50)
                AND (w.warehouse_type != 'defective' OR w.warehouse_type IS NULL)
            `),
            db.getOne(`SELECT COUNT(*) as total FROM return_requests WHERE status IN ('return_pending', 'pending')`),
            db.getOne(`SELECT COUNT(*) as total FROM stock_outbound_notes WHERE status = 'pending'`),
            // Doanh thu theo ngày (dùng actual_delivery_date, có filter period)
            db.getAll(`
                SELECT TO_CHAR(${orderDateCol}, 'YYYY-MM-DD') as date,
                       COALESCE(SUM(oi.quantity * COALESCE(oi.unit_price, p.sale_price, 0)), 0) as revenue
                FROM sales_orders o
                JOIN sales_order_items oi ON oi.order_id = o.id
                LEFT JOIN products p ON p.id = oi.product_id
                WHERE o.status = 'completed' ${orderDateSql}
                GROUP BY TO_CHAR(${orderDateCol}, 'YYYY-MM-DD')
                ORDER BY date ASC
            `),
            // Đơn hàng theo ngày (dùng actual_delivery_date, có filter period)
            db.getAll(`
                SELECT TO_CHAR(${orderDateCol}, 'YYYY-MM-DD') as date,
                       COUNT(*) as orders
                FROM sales_orders o
                WHERE 1=1 ${orderDateSql}
                GROUP BY TO_CHAR(${orderDateCol}, 'YYYY-MM-DD')
                ORDER BY date ASC
            `),
            // Doanh thu theo tháng — nhóm theo tháng (quarter/all) hoặc ngày (day/week/month) + filter period
            db.getAll(`
                SELECT ${revenueMonthGroup} as period,
                       COALESCE(SUM(oi.quantity * COALESCE(oi.unit_price, p.sale_price, 0)), 0) as revenue,
                       COUNT(DISTINCT o.id) as orders
                FROM sales_orders o
                JOIN sales_order_items oi ON oi.order_id = o.id
                LEFT JOIN products p ON p.id = oi.product_id
                WHERE o.status = 'completed'
                  AND ${orderDateCol} >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months'
                  ${orderDateSql}
                GROUP BY ${revenueMonthGroup}
                ORDER BY period ASC
            `),
            // Đơn hàng theo trạng thái
            db.getAll(`
                SELECT status, COUNT(*) as count,
                       COALESCE(SUM((SELECT SUM(quantity * COALESCE(unit_price, 0)) FROM sales_order_items WHERE order_id = sales_orders.id)), 0) as revenue
                FROM sales_orders
                WHERE 1=1 ${dateSql}
                GROUP BY status
                ORDER BY count DESC
            `),
            // Đơn hàng theo danh mục sản phẩm (dùng actual_delivery_date, có filter period)
            db.getAll(`
                SELECT p.category as name,
                       COUNT(DISTINCT o.id) as orders,
                       COALESCE(SUM(oi.quantity), 0) as qty,
                       COALESCE(SUM(oi.quantity * COALESCE(oi.unit_price, p.sale_price, 0)), 0) as revenue
                FROM sales_orders o
                JOIN sales_order_items oi ON oi.order_id = o.id
                JOIN products p ON p.id = oi.product_id
                WHERE 1=1 ${orderDateSql}
                GROUP BY p.category
                ORDER BY revenue DESC
            `),
            // Doanh thu theo đơn vị vận chuyển
            db.getAll(`
                SELECT sh.carrier_name as name, sh.carrier_code,
                       COUNT(DISTINCT sh.id) as shipments,
                       COALESCE(SUM((SELECT SUM(quantity * COALESCE(unit_price, 0)) FROM sales_order_items WHERE order_id = sh.order_id)), 0) as revenue
                FROM shipping_orders sh
                WHERE 1=1 ${dateSql.replace('created_at', 'sh.assigned_at')}
                GROUP BY sh.carrier_name, sh.carrier_code
                ORDER BY shipments DESC
            `),
            // Top khách hàng (dùng actual_delivery_date, có filter period)
            db.getAll(`
                SELECT c.company_name as name,
                       COUNT(DISTINCT o.id) as orders,
                       COALESCE(SUM(oi.quantity * COALESCE(oi.unit_price, p.sale_price, 0)), 0) as total_spent
                FROM sales_orders o
                JOIN customers c ON c.id = o.customer_id
                JOIN sales_order_items oi ON oi.order_id = o.id
                LEFT JOIN products p ON p.id = oi.product_id
                WHERE o.status = 'completed' ${orderDateSql}
                GROUP BY c.id, c.company_name
                ORDER BY total_spent DESC LIMIT 8
            `),
        ]);

        const recentOrders = await db.getAll(`
            SELECT o.id, o.order_no, o.status, o.created_at,
                   c.company_name AS customer_name,
                   COUNT(oi.id) as item_count,
                   COALESCE(SUM(oi.quantity * COALESCE(oi.unit_price, p.sale_price, 0)), 0) as total_amount
            FROM sales_orders o
            JOIN customers c ON c.id = o.customer_id
            LEFT JOIN sales_order_items oi ON oi.order_id = o.id
            LEFT JOIN products p ON p.id = oi.product_id
            WHERE 1=1 ${orderDateSql}
            GROUP BY o.id, c.company_name
            ORDER BY o.created_at DESC LIMIT 10
        `);

        const topProducts = await db.getAll(`
            SELECT p.name, p.sku, p.category, SUM(oi.quantity) as total_qty,
                   COALESCE(SUM(oi.quantity * COALESCE(oi.unit_price, p.sale_price, 0)), 0) as total_revenue
            FROM sales_order_items oi
            JOIN sales_orders o ON o.id = oi.order_id
            JOIN products p ON p.id = oi.product_id
            WHERE o.status = 'completed' ${orderDateSql}
            GROUP BY p.id, p.name, p.sku, p.category
            ORDER BY total_qty DESC LIMIT 8
        `);

        const warehouseUtilization = await db.getAll(`
            SELECT w.name, w.warehouse_code,
                   COUNT(DISTINCT ib.product_id) as product_count,
                   COALESCE(SUM(ib.on_hand_qty), 0) as total_qty,
                   COALESCE(SUM(ib.on_hand_qty * COALESCE((SELECT sale_price FROM products WHERE id = ib.product_id), 0)), 0) as total_value
            FROM warehouses w
            LEFT JOIN inventory_balances ib ON ib.warehouse_id = w.id
            GROUP BY w.id, w.name, w.warehouse_code
            ORDER BY total_qty DESC
        `);

        const returnStats = await db.getAll(`
            SELECT status, COUNT(*) as count
            FROM return_requests
            WHERE 1=1 ${dateSql.replace('created_at', 'return_requests.created_at')}
            GROUP BY status
        `);

        const returnReasons = await db.getAll(`
            SELECT customer_reject_reason as reason, COUNT(*) as count
            FROM return_requests
            WHERE customer_reject_reason IS NOT NULL
              ${dateSql.replace('created_at', 'created_at')}
            GROUP BY customer_reject_reason
            ORDER BY count DESC
        `);

        res.status(200).json({
            period: dateFilter.label,
            summary: {
                total_users: toNumber(totalUsersRow?.total),
                total_products: toNumber(totalProductsRow?.total),
                total_customers: toNumber(totalCustomersRow?.total),
                total_warehouses: toNumber(totalWarehousesRow?.total),
                total_orders: toNumber(totalOrdersRow?.total),
                completed_orders: toNumber(completedOrdersRow?.total),
                pending_orders: toNumber(pendingOrdersRow?.total),
                total_revenue: toNumber(totalRevenueRow?.total),
                total_receipts: toNumber(totalReceiptsRow?.total),
                total_outbounds: toNumber(totalOutboundsRow?.total),
                low_stock_count: toNumber(lowStockRow?.total),
                return_pending: toNumber(returnPendingRow?.total),
                outbound_pending: toNumber(outboundPendingRow?.total),
            },
            charts: {
                revenue_by_day: revenueByDay,
                orders_by_day: ordersByDay,
                revenue_by_month: revenueByMonth,
                orders_by_status: ordersByStatus,
                orders_by_category: ordersByCategory,
                revenue_by_carrier: revenueByCarrier,
                return_reasons: returnReasons,
            },
            tables: {
                recent_orders: recentOrders,
                top_products: topProducts,
                top_customers: topCustomersList,
                warehouse_utilization: warehouseUtilization,
                return_stats: returnStats,
            },
        });
    } catch (err) {
        console.error('Admin dashboard error:', err);
        res.status(500).json({ message: 'Loi lay du lieu dashboard', error: err.message });
    }
};

// ============================================================
// Sales Dashboard — KPI cá nhân
// ============================================================
const getSalesDashboard = async (req, res) => {
    try {
        const userId = req.user?.id;
        const period = req.query.period || 'month';
        const dateFilter = buildDateFilter(period);
        const dateSql = dateFilter.sql ? `AND ${dateFilter.sql.replace('created_at', 'o.created_at')}` : '';

        const [totalMyOrdersRow, completedMyOrdersRow, revenueRow,
            pendingMyOrdersRow, myCustomersRow, avgOrderValueRow,
            myRevenueByDay, myTopProducts, recentMyOrders
        ] = await Promise.all([
            db.getOne(`SELECT COUNT(*) as total FROM sales_orders o WHERE o.created_by = $1 ${dateSql}`, [userId]),
            db.getOne(`SELECT COUNT(*) as total FROM sales_orders o WHERE o.created_by = $1 AND o.status = 'completed' ${dateSql}`, [userId]),
            db.getOne(`
                SELECT COALESCE(SUM(oi.quantity * COALESCE(oi.unit_price, p.sale_price, 0)), 0) as total
                FROM sales_orders o
                JOIN sales_order_items oi ON oi.order_id = o.id
                LEFT JOIN products p ON p.id = oi.product_id
                WHERE o.created_by = $1 AND o.status = 'completed'
            `, [userId]),
            db.getOne(`SELECT COUNT(*) as total FROM sales_orders o WHERE o.created_by = $1 AND o.status IN ('pending', 'warehouse_processing', 'waiting_sales', 'shipping') ${dateSql}`, [userId]),
            db.getOne(`
                SELECT COUNT(DISTINCT c.id) as total
                FROM sales_orders o
                JOIN customers c ON c.id = o.customer_id
                WHERE o.created_by = $1 ${dateSql}
            `, [userId]),
            db.getOne(`
                SELECT COALESCE(AVG(oi.quantity * COALESCE(oi.unit_price, p.sale_price, 0)), 0) as avg_val
                FROM sales_orders o
                JOIN sales_order_items oi ON oi.order_id = o.id
                LEFT JOIN products p ON p.id = oi.product_id
                WHERE o.created_by = $1 AND o.status = 'completed'
            `, [userId]),
            db.getAll(`
                SELECT TO_CHAR(COALESCE(o.actual_delivery_date, o.updated_at, o.created_at), 'YYYY-MM-DD') as date,
                       COALESCE(SUM(oi.quantity * COALESCE(oi.unit_price, p.sale_price, 0)), 0) as revenue,
                       COUNT(o.id) as orders
                FROM sales_orders o
                JOIN sales_order_items oi ON oi.order_id = o.id
                LEFT JOIN products p ON p.id = oi.product_id
                WHERE o.created_by = $1 AND o.status = 'completed' ${dateSql}
                GROUP BY TO_CHAR(COALESCE(o.actual_delivery_date, o.updated_at, o.created_at), 'YYYY-MM-DD')
                ORDER BY date ASC
            `, [userId]),
            db.getAll(`
                SELECT p.name, p.sku, SUM(oi.quantity) as total_qty,
                       COALESCE(SUM(oi.quantity * COALESCE(oi.unit_price, p.sale_price, 0)), 0) as total_revenue
                FROM sales_order_items oi
                JOIN sales_orders o ON o.id = oi.order_id
                JOIN products p ON p.id = oi.product_id
                WHERE o.created_by = $1 AND o.status = 'completed' ${dateSql}
                GROUP BY p.id, p.name, p.sku
                ORDER BY total_qty DESC LIMIT 5
            `, [userId]),
            db.getAll(`
                SELECT o.id, o.order_no, o.status, o.created_at,
                       c.company_name AS customer_name,
                       COUNT(oi.id) as item_count
                FROM sales_orders o
                JOIN customers c ON c.id = o.customer_id
                LEFT JOIN sales_order_items oi ON oi.order_id = o.id
                WHERE o.created_by = $1 ${dateSql}
                GROUP BY o.id, c.company_name
                ORDER BY o.created_at DESC LIMIT 8
            `, [userId]),
        ]);

        const statusBreakdown = await db.getAll(`
            SELECT status, COUNT(*) as count
            FROM sales_orders
            WHERE created_by = $1 ${dateSql.replace('o.created_at', 'created_at')}
            GROUP BY status
        `, [userId]);

        res.status(200).json({
            period: dateFilter.label,
            user_id: userId,
            summary: {
                total_orders: toNumber(totalMyOrdersRow?.total),
                completed_orders: toNumber(completedMyOrdersRow?.total),
                pending_orders: toNumber(pendingMyOrdersRow?.total),
                total_revenue: toNumber(revenueRow?.total),
                total_customers: toNumber(myCustomersRow?.total),
                avg_order_value: toNumber(avgOrderValueRow?.avg_val),
                completion_rate: toNumber(totalMyOrdersRow?.total) > 0
                    ? Math.round((toNumber(completedMyOrdersRow?.total) / toNumber(totalMyOrdersRow?.total)) * 100)
                    : 0,
            },
            charts: {
                revenue_by_day: myRevenueByDay,
            },
            tables: {
                recent_orders: recentMyOrders,
                top_products: myTopProducts,
                status_breakdown: statusBreakdown,
            },
        });
    } catch (err) {
        console.error('Sales dashboard error:', err);
        res.status(500).json({ message: 'Loi lay du lieu dashboard', error: err.message });
    }
};

// ============================================================
// Warehouse Dashboard — Tổng quan kho
// ============================================================
const getWarehouseDashboard = async (req, res) => {
    try {
        const period = req.query.period || 'month';
        const dateFilter = buildDateFilter(period);
        const dateSql = dateFilter.sql ? `AND ${dateFilter.sql}` : '';

        const [totalProductsRow, totalStockRow, lowStockRow,
            totalReceiptsRow, pendingReceiptsRow, completedReceiptsRow,
            totalOutboundsRow, pendingOutboundsRow, completedOutboundsRow,
            receiptsByDay, outboundsByDay, lowStockProducts,
            warehouseBreakdown, recentReceipts, recentOutbounds
        ] = await Promise.all([
            db.getOne('SELECT COUNT(DISTINCT product_id) as total FROM inventory_balances WHERE on_hand_qty > 0'),
            db.getOne('SELECT COALESCE(SUM(on_hand_qty), 0) as total FROM inventory_balances'),
            db.getOne(`
                SELECT COUNT(*) as total FROM inventory_balances ib
                JOIN products p ON p.id = ib.product_id
                WHERE COALESCE(ib.on_hand_qty, 0) < COALESCE(p.min_stock, 50)
            `),
            db.getOne(`SELECT COUNT(*) as total FROM production_receipts WHERE 1=1 ${dateSql}`),
            db.getOne(`SELECT COUNT(*) as total FROM production_receipts WHERE status = 'pending'`),
            db.getOne(`SELECT COUNT(*) as total FROM production_receipts WHERE status = 'completed'`),
            db.getOne(`SELECT COUNT(*) as total FROM stock_outbound_notes WHERE 1=1 ${dateSql.replace('created_at', 'stock_outbound_notes.created_at')}`),
            db.getOne(`SELECT COUNT(*) as total FROM stock_outbound_notes WHERE status = 'pending'`),
            db.getOne(`SELECT COUNT(*) as total FROM stock_outbound_notes WHERE status = 'completed'`),
            db.getAll(`
                SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as date,
                       COUNT(*) as receipts,
                       COALESCE(SUM((SELECT SUM(quantity) FROM production_receipt_items WHERE receipt_id = production_receipts.id)), 0) as total_qty
                FROM production_receipts
                WHERE 1=1 ${dateSql}
                GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
                ORDER BY date ASC
            `),
            db.getAll(`
                SELECT TO_CHAR(export_date, 'YYYY-MM-DD') as date,
                       COUNT(*) as outbounds
                FROM stock_outbound_notes
                WHERE export_date IS NOT NULL ${dateSql.replace('created_at', 'export_date')}
                GROUP BY TO_CHAR(export_date, 'YYYY-MM-DD')
                ORDER BY date ASC
            `),
            db.getAll(`
                SELECT p.sku, p.name, p.unit,
                       COALESCE(SUM(ib.on_hand_qty), 0) as on_hand,
                       COALESCE(p.min_stock, 50) as min_stock,
                       w.name as warehouse_name
                FROM products p
                LEFT JOIN inventory_balances ib ON ib.product_id = p.id
                LEFT JOIN warehouses w ON w.id = ib.warehouse_id
                GROUP BY p.id, p.sku, p.name, p.unit, p.min_stock, w.name
                HAVING COALESCE(SUM(ib.on_hand_qty), 0) < COALESCE(p.min_stock, 50)
                ORDER BY on_hand ASC LIMIT 10
            `),
            db.getAll(`
                SELECT w.name, w.warehouse_code,
                       COUNT(DISTINCT ib.product_id) as product_types,
                       COALESCE(SUM(ib.on_hand_qty), 0) as total_qty
                FROM warehouses w
                LEFT JOIN inventory_balances ib ON ib.warehouse_id = w.id
                GROUP BY w.id, w.name, w.warehouse_code
                ORDER BY total_qty DESC
            `),
            db.getAll(`
                SELECT r.id, r.receipt_no, r.status, r.receipt_date,
                       w.name as warehouse_name,
                       (SELECT COUNT(*) FROM production_receipt_items WHERE receipt_id = r.id) as item_count
                FROM production_receipts r
                LEFT JOIN warehouses w ON w.id = r.warehouse_id
                ORDER BY r.created_at DESC LIMIT 6
            `),
            db.getAll(`
                SELECT s.id, s.outbound_no, s.status, s.export_date,
                       w.name as warehouse_name,
                       (SELECT COUNT(*) FROM stock_outbound_note_items WHERE outbound_note_id = s.id) as item_count
                FROM stock_outbound_notes s
                LEFT JOIN warehouses w ON w.id = s.warehouse_id
                ORDER BY s.created_at DESC LIMIT 6
            `),
        ]);

        res.status(200).json({
            period: dateFilter.label,
            summary: {
                total_product_types: toNumber(totalProductsRow?.total),
                total_stock: toNumber(totalStockRow?.total),
                low_stock_count: toNumber(lowStockRow?.total),
                total_receipts: toNumber(totalReceiptsRow?.total),
                pending_receipts: toNumber(pendingReceiptsRow?.total),
                completed_receipts: toNumber(completedReceiptsRow?.total),
                total_outbounds: toNumber(totalOutboundsRow?.total),
                pending_outbounds: toNumber(pendingOutboundsRow?.total),
                completed_outbounds: toNumber(completedOutboundsRow?.total),
            },
            charts: {
                receipts_by_day: receiptsByDay,
                outbounds_by_day: outboundsByDay,
            },
            tables: {
                low_stock_products: lowStockProducts,
                warehouse_breakdown: warehouseBreakdown,
                recent_receipts: recentReceipts,
                recent_outbounds: recentOutbounds,
            },
        });
    } catch (err) {
        console.error('Warehouse dashboard error:', err);
        res.status(500).json({ message: 'Loi lay du lieu dashboard', error: err.message });
    }
};

// ============================================================
// Logistics Dashboard — Theo dõi giao hàng
// ============================================================
const getLogisticsDashboard = async (req, res) => {
    try {
        const period = req.query.period || 'month';
        const dateFilter = buildDateFilter(period);
        const dateSql = dateFilter.sql ? `AND ${dateFilter.sql}` : '';

        const [totalDeliveriesRow, completedDeliveriesRow, pendingDeliveriesRow,
            returnCountRow, compensationPendingRow, onTimeRow,
            deliveriesByDay, recentDeliveries, returnList, compensationList
        ] = await Promise.all([
            db.getOne(`SELECT COUNT(*) as total FROM sales_orders WHERE status IN ('shipping', 'completed', 'customer_rejected', 'return_pending', 'return_to_sales') ${dateSql.replace('created_at', 'sales_orders.updated_at')}`),
            db.getOne(`SELECT COUNT(*) as total FROM sales_orders WHERE status = 'completed' ${dateSql.replace('created_at', 'sales_orders.actual_delivery_date')}`),
            db.getOne(`SELECT COUNT(*) as total FROM sales_orders WHERE status IN ('warehouse_processing', 'waiting_sales', 'shipping')`),
            db.getOne(`SELECT COUNT(*) as total FROM return_requests WHERE status IN ('return_pending', 'pending')`),
            db.getOne(`SELECT COUNT(*) as total FROM compensation_requests WHERE status = 'pending'`),
            db.getOne(`
                SELECT COUNT(*) as total FROM sales_orders
                WHERE status = 'completed'
                AND actual_delivery_date IS NOT NULL
                AND actual_delivery_date <= expected_delivery_date
            `),
            db.getAll(`
                SELECT TO_CHAR(actual_delivery_date, 'YYYY-MM-DD') as date,
                       COUNT(*) as deliveries
                FROM sales_orders
                WHERE status = 'completed' AND actual_delivery_date IS NOT NULL ${dateSql.replace('created_at', 'actual_delivery_date')}
                GROUP BY TO_CHAR(actual_delivery_date, 'YYYY-MM-DD')
                ORDER BY date ASC
            `),
            db.getAll(`
                SELECT o.id, o.order_no, o.status, o.expected_delivery_date, o.actual_delivery_date,
                       c.company_name AS customer_name,
                       (SELECT tracking_no FROM shipping_orders WHERE order_id = o.id ORDER BY id DESC LIMIT 1) as tracking_no
                FROM sales_orders o
                JOIN customers c ON c.id = o.customer_id
                WHERE o.status IN ('shipping', 'completed', 'customer_rejected', 'return_pending', 'return_to_sales')
                ORDER BY o.updated_at DESC LIMIT 8
            `),
            db.getAll(`
                SELECT rr.id, rr.order_id, so.order_no, rr.status, rr.customer_reject_reason,
                       rr.logistics_action, rr.complaint_source, rr.created_at,
                       c.company_name AS customer_name
                FROM return_requests rr
                JOIN sales_orders so ON rr.order_id = so.id
                JOIN customers c ON c.id = so.customer_id
                WHERE rr.status IN ('return_pending', 'pending', 'logistics_handled')
                ORDER BY rr.created_at DESC LIMIT 6
            `),
            db.getAll(`
                SELECT cr.id, cr.compensation_no, cr.status, cr.defect_type,
                       so.order_no, c.company_name AS customer_name, cr.created_at
                FROM compensation_requests cr
                JOIN sales_orders so ON cr.order_id = so.id
                JOIN customers c ON so.customer_id = c.id
                WHERE cr.status = 'pending'
                ORDER BY cr.created_at DESC
            `),
        ]);

        const totalCompleted = toNumber(completedDeliveriesRow?.total);
        const totalDelivered = toNumber(totalDeliveriesRow?.total);
        const onTimeCount = toNumber(onTimeRow?.total);

        res.status(200).json({
            period: dateFilter.label,
            summary: {
                total_deliveries: totalDelivered,
                completed_deliveries: totalCompleted,
                pending_deliveries: toNumber(pendingDeliveriesRow?.total),
                return_requests: toNumber(returnCountRow?.total),
                compensation_pending: toNumber(compensationPendingRow?.total),
                on_time_rate: totalCompleted > 0 ? Math.round((onTimeCount / totalCompleted) * 100) : 0,
            },
            charts: {
                deliveries_by_day: deliveriesByDay,
            },
            tables: {
                recent_deliveries: recentDeliveries,
                return_list: returnList,
                compensation_list: compensationList,
            },
        });
    } catch (err) {
        console.error('Logistics dashboard error:', err);
        res.status(500).json({ message: 'Loi lay du lieu dashboard', error: err.message });
    }
};

// ============================================================
// Factory Dashboard — Quản lý sản xuất / bù hàng
// ============================================================
const getFactoryDashboard = async (req, res) => {
    try {
        const period = req.query.period || 'month';
        const dateFilter = buildDateFilter(period);
        const dateSql = dateFilter.sql ? `AND ${dateFilter.sql}` : '';

        const [totalReceiptsRow, pendingReceiptsRow, completedReceiptsRow,
            totalCompensationsRow, pendingCompensationsRow, approvedCompensationsRow,
            receiptsByDay, pendingReceiptList, compensationPendingList
        ] = await Promise.all([
            db.getOne(`SELECT COUNT(*) as total FROM production_receipts WHERE 1=1 ${dateSql}`),
            db.getOne(`SELECT COUNT(*) as total FROM production_receipts WHERE status = 'pending'`),
            db.getOne(`SELECT COUNT(*) as total FROM production_receipts WHERE status = 'completed'`),
            db.getOne(`SELECT COUNT(*) as total FROM compensation_requests`),
            db.getOne(`SELECT COUNT(*) as total FROM compensation_requests WHERE status = 'pending'`),
            db.getOne(`SELECT COUNT(*) as total FROM compensation_requests WHERE status = 'approved'`),
            db.getAll(`
                SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as date,
                       COUNT(*) as receipts
                FROM production_receipts
                WHERE 1=1 ${dateSql}
                GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
                ORDER BY date ASC
            `),
            db.getAll(`
                SELECT r.id, r.receipt_no, r.status, r.receipt_date, r.note,
                       w.name as warehouse_name,
                       (SELECT COUNT(*) FROM production_receipt_items WHERE receipt_id = r.id) as item_count
                FROM production_receipts r
                LEFT JOIN warehouses w ON w.id = r.warehouse_id
                WHERE r.status = 'pending'
                ORDER BY r.created_at DESC LIMIT 6
            `),
            db.getAll(`
                SELECT cr.id, cr.compensation_no, cr.status, cr.defect_type, cr.created_at,
                       so.order_no, c.company_name AS customer_name,
                       (SELECT COUNT(*) FROM compensation_items WHERE compensation_id = cr.id) as item_count
                FROM compensation_requests cr
                JOIN sales_orders so ON cr.order_id = so.id
                JOIN customers c ON so.customer_id = c.id
                WHERE cr.status = 'pending'
                ORDER BY cr.created_at DESC
            `),
        ]);

        res.status(200).json({
            period: dateFilter.label,
            summary: {
                total_receipts: toNumber(totalReceiptsRow?.total),
                pending_receipts: toNumber(pendingReceiptsRow?.total),
                completed_receipts: toNumber(completedReceiptsRow?.total),
                total_compensations: toNumber(totalCompensationsRow?.total),
                pending_compensations: toNumber(pendingCompensationsRow?.total),
                approved_compensations: toNumber(approvedCompensationsRow?.total),
            },
            charts: {
                receipts_by_day: receiptsByDay,
            },
            tables: {
                pending_receipts: pendingReceiptList,
                pending_compensations: compensationPendingList,
            },
        });
    } catch (err) {
        console.error('Factory dashboard error:', err);
        res.status(500).json({ message: 'Loi lay du lieu dashboard', error: err.message });
    }
};

// ============================================================
// Reports — Inventory (Admin + Warehouse)
// ============================================================
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

// ============================================================
// Reports — Sales (doanh thu theo thời gian)
// ============================================================
const getSalesReport = async (req, res) => {
    try {
        const { period = 'month', group_by = 'date' } = req.query;
        const userId = req.user?.id;
        const isAdmin = req.user?.role_id === 1;

        const dateFormat = group_by === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD';
        const dateFilter = buildDateFilter(period);
        const dateSql = dateFilter.sql ? `AND ${dateFilter.sql.replace('created_at', 'o.created_at')}` : '';
        const userFilter = isAdmin ? '' : 'AND o.created_by = $1';

        const [revenueRows, orderStats, topProducts, customerStats] = await Promise.all([
            db.getAll(`
                SELECT TO_CHAR(COALESCE(o.actual_delivery_date, o.updated_at, o.created_at), '${dateFormat}') as period,
                       COALESCE(SUM(oi.quantity * COALESCE(oi.unit_price, p.sale_price, 0)), 0) as revenue,
                       COUNT(DISTINCT o.id) as orders
                FROM sales_orders o
                JOIN sales_order_items oi ON oi.order_id = o.id
                LEFT JOIN products p ON p.id = oi.product_id
                WHERE o.status = 'completed' ${dateSql} ${userFilter}
                GROUP BY TO_CHAR(COALESCE(o.actual_delivery_date, o.updated_at, o.created_at), '${dateFormat}')
                ORDER BY period ASC
            `, [...(isAdmin ? [] : [userId])]),
            db.getAll(`
                SELECT status, COUNT(*) as count,
                       COALESCE(SUM(oi.quantity * COALESCE(oi.unit_price, p.sale_price, 0)), 0) as revenue
                FROM sales_orders o
                LEFT JOIN sales_order_items oi ON oi.order_id = o.id
                LEFT JOIN products p ON p.id = oi.product_id
                WHERE 1=1 ${dateSql} ${userFilter}
                GROUP BY status
            `, [...(isAdmin ? [] : [userId])]),
            db.getAll(`
                SELECT p.name, p.sku, SUM(oi.quantity) as total_qty,
                       COALESCE(SUM(oi.quantity * COALESCE(oi.unit_price, p.sale_price, 0)), 0) as revenue
                FROM sales_order_items oi
                JOIN sales_orders o ON o.id = oi.order_id
                JOIN products p ON p.id = oi.product_id
                WHERE o.status = 'completed' ${dateSql} ${userFilter}
                GROUP BY p.id, p.name, p.sku
                ORDER BY revenue DESC LIMIT 10
            `, [...(isAdmin ? [] : [userId])]),
            db.getAll(`
                SELECT c.company_name, COUNT(o.id) as order_count,
                       COALESCE(SUM(oi.quantity * COALESCE(oi.unit_price, p.sale_price, 0)), 0) as total_spent
                FROM sales_orders o
                JOIN customers c ON c.id = o.customer_id
                LEFT JOIN sales_order_items oi ON oi.order_id = o.id
                LEFT JOIN products p ON p.id = oi.product_id
                WHERE o.status = 'completed' ${dateSql} ${userFilter}
                GROUP BY c.id, c.company_name
                ORDER BY total_spent DESC LIMIT 10
            `, [...(isAdmin ? [] : [userId])]),
        ]);

        res.status(200).json({
            period: dateFilter.label,
            group_by,
            charts: { revenue_by_period: revenueRows },
            summary: {
                total_orders: orderStats.reduce((s, r) => s + toNumber(r.count), 0),
                total_revenue: orderStats.reduce((s, r) => s + toNumber(r.revenue), 0),
            },
            tables: {
                order_stats: orderStats,
                top_products: topProducts,
                top_customers: customerStats,
            },
        });
    } catch (err) {
        console.error('Sales report error:', err);
        res.status(500).json({ message: 'Loi lay bao cao', error: err.message });
    }
};

// ============================================================
// Reports — Logistics (giao hàng & hoàn hàng)
// ============================================================
const getLogisticsReport = async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        const dateFilter = buildDateFilter(period);
        const dateSql = dateFilter.sql ? `AND ${dateFilter.sql.replace('created_at', 'so.updated_at')}` : '';

        const [deliveryStats, returnStats, compensationStats
        ] = await Promise.all([
            db.getAll(`
                SELECT status, COUNT(*) as count
                FROM sales_orders so
                WHERE status IN ('shipping', 'completed', 'customer_rejected', 'return_pending', 'return_to_sales', 'canceled')
                ${dateSql}
                GROUP BY status
            `),
            db.getAll(`
                SELECT rr.customer_reject_reason, rr.complaint_source, COUNT(*) as count
                FROM return_requests rr
                JOIN sales_orders so ON rr.order_id = so.id
                WHERE 1=1 ${dateSql}
                GROUP BY rr.customer_reject_reason, rr.complaint_source
                ORDER BY count DESC
            `),
            db.getAll(`
                SELECT cr.defect_type, cr.status, COUNT(*) as count,
                       COALESCE(SUM((SELECT COUNT(*) FROM compensation_items WHERE compensation_id = cr.id)), 0) as total_items
                FROM compensation_requests cr
                JOIN sales_orders so ON cr.order_id = so.id
                GROUP BY cr.defect_type, cr.status
            `),
        ]);

        res.status(200).json({
            period: dateFilter.label,
            tables: {
                delivery_stats: deliveryStats,
                return_stats: returnStats,
                compensation_stats: compensationStats,
            },
        });
    } catch (err) {
        console.error('Logistics report error:', err);
        res.status(500).json({ message: 'Loi lay bao cao', error: err.message });
    }
};

// ============================================================
// Reports — Warehouse (xuất/nhap kho)
// ============================================================
const getWarehouseReport = async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        const dateFilter = buildDateFilter(period);
        const dateSql = dateFilter.sql ? `AND ${dateFilter.sql}` : '';

        const [receiptStats, outboundStats, productMovement, warehouseSummary,
            receiptsByDay, outboundsByDay
        ] = await Promise.all([
            db.getAll(`
                SELECT status, COUNT(*) as count,
                       COALESCE(SUM((SELECT SUM(quantity) FROM production_receipt_items WHERE receipt_id = production_receipts.id)), 0) as total_qty
                FROM production_receipts
                WHERE 1=1 ${dateSql}
                GROUP BY status
            `),
            db.getAll(`
                SELECT status, COUNT(*) as count,
                       COALESCE(SUM((SELECT SUM(quantity) FROM stock_outbound_note_items WHERE outbound_note_id = stock_outbound_notes.id)), 0) as total_qty
                FROM stock_outbound_notes
                WHERE 1=1 ${dateSql.replace('created_at', 'stock_outbound_notes.created_at')}
                GROUP BY status
            `),
            db.getAll(`
                SELECT * FROM (
                    SELECT p.sku, p.name, p.unit,
                           COALESCE(SUM(CASE WHEN it.transaction_type = 'IN' THEN it.quantity ELSE 0 END), 0) as total_in,
                           COALESCE(SUM(CASE WHEN it.transaction_type = 'OUT' THEN it.quantity ELSE 0 END), 0) as total_out,
                           COALESCE(SUM(CASE WHEN it.transaction_type = 'IN' THEN it.quantity ELSE -it.quantity END), 0) as net_change,
                           COALESCE(ib.on_hand_qty, 0) as current_stock
                    FROM products p
                    LEFT JOIN inventory_transactions it ON it.product_id = p.id
                    LEFT JOIN inventory_balances ib ON ib.product_id = p.id
                    WHERE 1=1 ${dateSql.replace('created_at', 'it.transaction_date')}
                    GROUP BY p.id, p.sku, p.name, p.unit, ib.on_hand_qty
                ) sub ORDER BY ABS(net_change) DESC LIMIT 15
            `),
            db.getAll(`
                SELECT w.name, w.warehouse_code,
                       COUNT(DISTINCT ib.product_id) as product_types,
                       COALESCE(SUM(ib.on_hand_qty), 0) as total_qty,
                       COUNT(DISTINCT pr.id) as receipt_count,
                       COUNT(DISTINCT so.id) as outbound_count
                FROM warehouses w
                LEFT JOIN inventory_balances ib ON ib.warehouse_id = w.id
                LEFT JOIN production_receipts pr ON pr.warehouse_id = w.id
                LEFT JOIN stock_outbound_notes so ON so.warehouse_id = w.id
                GROUP BY w.id, w.name, w.warehouse_code
                ORDER BY total_qty DESC
            `),
            db.getAll(`
                SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as date,
                       COUNT(*) as receipts
                FROM production_receipts
                GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
                ORDER BY date ASC
            `),
            db.getAll(`
                SELECT TO_CHAR(export_date, 'YYYY-MM-DD') as date,
                       COUNT(*) as outbounds
                FROM stock_outbound_notes
                WHERE export_date IS NOT NULL
                GROUP BY TO_CHAR(export_date, 'YYYY-MM-DD')
                ORDER BY date ASC
            `),
        ]);

        res.status(200).json({
            period: dateFilter.label,
            charts: {
                receipts_by_day: receiptsByDay,
                outbounds_by_day: outboundsByDay,
            },
            tables: {
                receipt_stats: receiptStats,
                outbound_stats: outboundStats,
                product_movement: productMovement,
                warehouse_summary: warehouseSummary,
            },
        });
    } catch (err) {
        console.error('Warehouse report error:', err);
        res.status(500).json({ message: 'Loi lay bao cao', error: err.message });
    }
};

// ============================================================
// Reports — Factory (phiếu nhập + phiếu bù)
// ============================================================
const getFactoryReport = async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        const dateFilter = buildDateFilter(period);
        const dateSql = dateFilter.sql ? `AND ${dateFilter.sql}` : '';

        const [receiptStats, compensationStats, receiptByDay,
            pendingReceipts, pendingCompensations, recentActivity
        ] = await Promise.all([
            db.getAll(`
                SELECT status, COUNT(*) as count
                FROM production_receipts
                WHERE 1=1 ${dateSql}
                GROUP BY status
            `),
            db.getAll(`
                SELECT cr.defect_type, cr.status, COUNT(*) as count,
                       COALESCE(SUM((SELECT COUNT(*) FROM compensation_items WHERE compensation_id = cr.id)), 0) as total_items
                FROM compensation_requests cr
                WHERE 1=1 ${dateSql.replace('created_at', 'cr.created_at')}
                GROUP BY cr.defect_type, cr.status
            `),
            db.getAll(`
                SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as date,
                       COUNT(*) as receipts
                FROM production_receipts
                GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
                ORDER BY date ASC
            `),
            db.getAll(`
                SELECT r.id, r.receipt_no, r.status, r.receipt_date, r.note,
                       w.name as warehouse_name,
                       (SELECT COUNT(*) FROM production_receipt_items WHERE receipt_id = r.id) as item_count
                FROM production_receipts r
                LEFT JOIN warehouses w ON w.id = r.warehouse_id
                WHERE r.status = 'pending'
                ORDER BY r.created_at DESC
            `),
            db.getAll(`
                SELECT cr.id, cr.compensation_no, cr.status, cr.defect_type, cr.created_at,
                       so.order_no, c.company_name AS customer_name
                FROM compensation_requests cr
                JOIN sales_orders so ON cr.order_id = so.id
                JOIN customers c ON so.customer_id = c.id
                WHERE cr.status = 'pending'
                ORDER BY cr.created_at DESC
            `),
            db.getAll(`
                SELECT 'receipt' as type, r.receipt_no as code, r.status, r.created_at as date, w.name as ref_name
                FROM production_receipts r
                LEFT JOIN warehouses w ON w.id = r.warehouse_id
                UNION ALL
                SELECT 'compensation' as type, cr.compensation_no as code, cr.status, cr.created_at as date, so.order_no as ref_name
                FROM compensation_requests cr
                JOIN sales_orders so ON cr.order_id = so.id
                ORDER BY date DESC LIMIT 10
            `),
        ]);

        res.status(200).json({
            period: dateFilter.label,
            charts: { receipts_by_day: receiptByDay },
            tables: {
                receipt_stats: receiptStats,
                compensation_stats: compensationStats,
                pending_receipts: pendingReceipts,
                pending_compensations: pendingCompensations,
                recent_activity: recentActivity,
            },
        });
    } catch (err) {
        console.error('Factory report error:', err);
        res.status(500).json({ message: 'Loi lay bao cao', error: err.message });
    }
};

// ============================================================
// Role-aware dispatcher
// ============================================================
const getRoleReport = async (req, res) => {
    const roleId = req.user?.role_id;
    switch (roleId) {
        case 1: return getAdminDashboard(req, res);
        case 2: return getSalesDashboard(req, res);
        case 4: return getWarehouseDashboard(req, res);
        case 3: return getLogisticsDashboard(req, res);
        case 5: return getFactoryDashboard(req, res);
        default:
            res.status(403).json({ message: 'Khong co quyen truy cap dashboard nay' });
    }
};

module.exports = {
    getRoleReport,
    getAdminDashboard,
    getSalesDashboard,
    getWarehouseDashboard,
    getLogisticsDashboard,
    getFactoryDashboard,
    getInventoryReport,
    getSalesReport,
    getLogisticsReport,
    getWarehouseReport,
    getFactoryReport,
};
