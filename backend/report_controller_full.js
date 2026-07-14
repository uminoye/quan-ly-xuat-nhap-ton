// ============================================================
// File: backend/src/controllers/report.controller.js
// Full contents (after all fixes)
// ============================================================

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
// Admin Dashboard — tổng quan toàn hệ thống
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
                WHERE o.created_by = $1 AND o.status = 'completed'
                GROUP BY TO_CHAR(COALESCE(o.actual_delivery_date, o.updated_at, o.created_at), 'YYYY-MM-DD')
                ORDER BY date ASC
            `, [userId]),
            db.getAll(`
                SELECT p.name, p.sku, SUM(oi.quantity) as total_qty,
                       COALESCE(SUM(oi.quantity * COALESCE(oi.unit_price, p.sale_price, 0)), 0) as total_revenue
                FROM sales_order_items oi
                JOIN sales_orders o ON o.id = oi.order_id
                JOIN products p ON p.id = oi.product_id
                WHERE o.created_by = $1 AND o.status = 'completed'
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
                WHERE o.created_by = $1
                GROUP BY o.id, c.company_name
                ORDER BY o.created_at DESC LIMIT 8
            `, [userId]),
        ]);

        const statusBreakdown = await db.getAll(`
            SELECT status, COUNT(*) as count
            FROM sales_orders
            WHERE created_by = $1
            GROUP BY status
        `, [userId]);

        res.status(200).json({
            period: dateFilter.label,
            summary: {
                total_orders: toNumber(totalMyOrdersRow?.total),
                completed_orders: toNumber(completedMyOrdersRow?.total),
                pending_orders: toNumber(pendingMyOrdersRow?.total),
                total_revenue: toNumber(revenueRow?.total),
                my_customers: toNumber(myCustomersRow?.total),
                avg_order_value: toNumber(avgOrderValueRow?.avg_val),
            },
            charts: {
                revenue_by_day: myRevenueByDay,
                status_breakdown: statusBreakdown,
            },
            tables: {
                recent_orders: recentMyOrders,
                top_products: myTopProducts,
            },
        });
    } catch (err) {
        console.error('Sales dashboard error:', err);
        res.status(500).json({ message: 'Loi lay du lieu sales dashboard', error: err.message });
    }
};

module.exports = {
    getAdminDashboard,
    getSalesDashboard,
};
