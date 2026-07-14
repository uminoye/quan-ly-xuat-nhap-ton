import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import 'remixicon/fonts/remixicon.css';
import api from '../services/api';
import { formatOrderItems, normalizeOrderItems } from '../utils/orderItems';
import { exportListToExcel } from '../utils/exportList';

const statusConfig = {
    pending:              { label: 'Đang chờ duyệt',        tone: 'warning' },
    returned:            { label: 'Bị từ chối',             tone: 'danger' },
    warehouse_processing: { label: 'Kho đang xuất',          tone: 'info' },
    waiting_sales:       { label: 'Đợi Sales xử lý',       tone: 'amber' },
    return_to_sales:     { label: 'Hoàn về Sales',          tone: 'amber' },
    shipping:            { label: 'Đang giao',               tone: 'purple' },
    completed:           { label: 'Đã hoàn tất',            tone: 'success' },
    logistics_review:     { label: 'Kho báo lỗi',            tone: 'purple' },
    canceled:            { label: 'Hủy đơn',                tone: 'danger' },
    customer_rejected:   { label: 'Khách từ chối',          tone: 'danger' },
    return_pending:      { label: 'Đang xử lý hoàn',        tone: 'orange' },
    return_completed:   { label: 'Hoàn xong',               tone: 'success' },
};

const toneStyles = {
    warning: { background: '#fef3c7', color: '#92400e' },
    danger: { background: '#fee2e2', color: '#991b1b' },
    info: { background: '#dbeafe', color: '#1d4ed8' },
    success: { background: '#dcfce7', color: '#166534' },
    purple: { background: '#ede9fe', color: '#6b21a8' },
    amber:  { background: '#fef9c3', color: '#854d0e' },
    orange: { background: '#ffedd5', color: '#9a3412' },
};

const fmt = new Intl.NumberFormat('vi-VN').format;
const fmtDate = (d) => {
    if (!d) return '';
    try {
        const dt = new Date(d);
        if (isNaN(dt.getTime())) return '';
        return dt.toLocaleDateString('vi-VN');
    } catch { return ''; }
};

const calcTotal = (order) => {
    const items = Array.isArray(order?.items) ? order.items : normalizeOrderItems(order);
    return items.reduce((sum, item) => {
        const price = Number(
            item.unit_price ?? item.sale_price ?? item.price ??
            item.product?.sale_price ?? item.product?.price ?? item.product?.unit_price ??
            item.product_price ?? item.product?.product_price ?? 0
        );
        return sum + price * Number(item.quantity ?? item.qty ?? item.product_quantity ?? 0);
    }, 0);
};

const enrichItems = (items, products) =>
    items.map((item) => {
        const match = products.find(
            (p) => Number(p.id) === Number(item.product_id) ||
                   String(p.sku || '') === String(item.product_sku || item.sku || '')
        );
        return {
            ...item,
            product_name: item.product_name ?? item.name ?? item.product?.name ?? match?.name ?? match?.product_name ?? 'Sản phẩm không tên',
            product_sku: item.product_sku ?? item.sku ?? item.product?.sku ?? match?.sku ?? '',
            unit_price: Number(
                item.unit_price ?? item.sale_price ?? item.price ??
                item.product?.sale_price ?? item.product?.price ?? item.product?.unit_price ??
                match?.sale_price ?? match?.price ?? 0
            ),
        };
    });

export default function SalesOrdersPage() {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    const isAuthorized = [1, 2].includes(user?.role_id);

    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [editingId, setEditingId] = useState(null);
    const [orderNo, setOrderNo] = useState('');
    const [customerId, setCustomerId] = useState('');
    const [expectedDate, setExpectedDate] = useState('');
    const [selectedItems, setSelectedItems] = useState([]);
    const [note, setNote] = useState('');
    const [warehouseNote, setWarehouseNote] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [viewOrder, setViewOrder] = useState(null);
    const [errorOrder, setErrorOrder] = useState(null);
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
    const [rejectOrder, setRejectOrder] = useState(null);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectAction, setRejectAction] = useState('return_to_warehouse'); // 'return_to_warehouse' | 'return_pending'
    const [rejectNote, setRejectNote] = useState('');
    const [cancelOrder, setCancelOrder] = useState(null);
    const [pageLoaded, setPageLoaded] = useState(false);
    const [hoveredRowId, setHoveredRowId] = useState(null);

    // ── Responsive ────────────────────────────────────────────────────────────
    const [isMobile, setIsMobile] = useState(
        typeof window !== 'undefined' ? window.innerWidth < 768 : false
    );
    const [isTablet, setIsTablet] = useState(
        typeof window !== 'undefined' ? window.innerWidth >= 768 && window.innerWidth < 1024 : false
    );

    useEffect(() => {
        const onResize = () => {
            const w = window.innerWidth;
            setIsMobile(w < 768);
            setIsTablet(w >= 768 && w < 1024);
        };
        onResize();
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    // ── Data ──────────────────────────────────────────────────────────────────
    const fetchAll = async () => {
        try {
            const [c, p, o] = await Promise.all([
                api.get('/customers'),
                api.get('/products'),
                api.get('/orders'),
            ]);
            setCustomers(c.data);
            setProducts(p.data);
            setOrders(o.data);
        } catch {
            alert('Lỗi tải dữ liệu hệ thống');
        }
    };

    useEffect(() => {
        fetchAll();
        setPageLoaded(false);
        requestAnimationFrame(() => requestAnimationFrame(() => setPageLoaded(true)));

        const onKey = (e) => {
            if (e.key === 'Escape') {
                closeForm();
                setIsViewOpen(false);
                setViewOrder(null);
                setIsErrorModalOpen(false);
                setErrorOrder(null);
                setCancelOrder(null);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    // ── Computed ──────────────────────────────────────────────────────────────
    const filteredOrders = useMemo(() => {
        const kw = searchTerm.trim().toLowerCase();
        return orders.filter((o) => {
            const status = statusConfig[o.status] ? o.status : 'pending';
            const text = [
                o.order_no, o.customer_name, o.expected_delivery_date, o.note,
                ...(o.items || []).flatMap((i) => [i.product_name, i.product_sku]),
            ].filter(Boolean).join(' ').toLowerCase();
            return (!kw || text.includes(kw)) && (statusFilter === 'all' || status === statusFilter);
        });
    }, [orders, searchTerm, statusFilter]);

    const stats = useMemo(() => ({
        total: orders.length,
        pending: orders.filter((o) => (statusConfig[o.status] ? o.status : 'pending') === 'pending').length,
        completed: orders.filter((o) => o.status === 'completed').length,
        issues: orders.filter((o) => ['returned', 'logistics_review', 'waiting_sales'].includes(o.status)).length,
    }), [orders]);

    // ── Item helpers ─────────────────────────────────────────────────────────
    const addItem = (productId) => {
        if (productId) {
            const prod = products.find((p) => String(p.id) === String(productId));
            if (prod) {
                setSelectedItems((prev) => [
                    ...prev,
                    { product_id: String(prod.id), quantity: 1, unit_price: Number(prod.sale_price || 0) }
                ]);
                return;
            }
        }
        setSelectedItems((p) => [...p, { product_id: '', quantity: 1, unit_price: 0 }]);
    };

    const updateItem = (idx, field, val) => {
        setSelectedItems((prev) => {
            const next = [...prev];
            if (field === 'quantity') next[idx].quantity = Math.max(1, Number(val) || 1);
            else if (field === 'product_id') {
                next[idx].product_id = val;
                const prod = products.find((p) => p.id === parseInt(val, 10));
                if (prod) next[idx].unit_price = Number(prod.sale_price || 0);
            } else {
                next[idx][field] = val;
            }
            return next;
        });
    };

    const removeItem = (idx) => setSelectedItems((p) => p.filter((_, i) => i !== idx));

    // ── Open/close form ───────────────────────────────────────────────────────
    const openForm = () => {
        setIsFormOpen(true);
        requestAnimationFrame(() => setIsFormVisible(true));
    };

    const openAdd = () => {
        setEditingId(null);
        setOrderNo('');
        setCustomerId('');
        setExpectedDate('');
        setNote('');
        setWarehouseNote('');
        setSelectedItems([]);
        openForm();
    };

    const closeForm = () => {
        setIsFormVisible(false);
        window.setTimeout(() => {
            setIsFormOpen(false);
            setEditingId(null);
            setCustomerId('');
            setExpectedDate('');
            setNote('');
            setWarehouseNote('');
            setSelectedItems([]);
        }, 220);
    };

    const openEdit = async (order) => {
        if (['warehouse_processing', 'shipping', 'completed', 'canceled', 'customer_rejected', 'return_pending', 'return_completed'].includes(order?.status)) {
            return alert('Đơn hàng đang ở giai đoạn này nên không thể chỉnh sửa.');
        }
        try {
            const res = await api.get(`/orders/${order.id}/items`);
            setOrderNo(order.order_no);
            setCustomerId(order.customer_id);
            setExpectedDate(order.expected_delivery_date ? order.expected_delivery_date.split('T')[0] : '');
            setNote(order.note || '');
            setWarehouseNote(order.warehouse_note || '');
            setSelectedItems(res.data);
            setEditingId(order.id);
            openForm();
        } catch {
            alert('Lỗi tải chi tiết đơn');
        }
    };

    // ── Submit ───────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedItems.length === 0) return alert('Vui lòng chọn ít nhất 1 sản phẩm');

        try {
            // Backend tự sinh mã trong transaction — không gọi next-code ở đây
            const payload = {
                customer_id: customerId,
                order_date: new Date().toISOString(),
                expected_delivery_date: expectedDate,
                note,
                items: selectedItems,
            };

            if (editingId) {
                await api.put(`/orders/${editingId}`, payload);
                alert('Cập nhật thành công!');
            } else {
                const res = await api.post('/orders', payload);
                alert(`Tạo đơn hàng thành công! Mã đơn: ${res.data.order_no}`);
            }
            closeForm();
            fetchAll();
        } catch (err) {
            alert(err.response?.data?.message || 'Lỗi khi xử lý đơn');
        }
    };

    // ── Delete / Cancel ──────────────────────────────────────────────────────
    const handleDelete = async (order) => {
        if (['warehouse_processing', 'shipping', 'completed', 'canceled', 'customer_rejected', 'return_pending', 'return_completed'].includes(order?.status)) {
            return alert('Đơn hàng đang ở giai đoạn này nên không thể xóa.');
        }
        if (!window.confirm('Xác nhận xóa vĩnh viễn đơn hàng này?')) return;
        try {
            await api.delete(`/orders/${order.id}`);
            setIsErrorModalOpen(false);
            setErrorOrder(null);
            fetchAll();
        } catch (err) {
            alert(err.response?.data?.message || 'Lỗi xóa đơn');
        }
    };

    const handleCancel = async (order) => {
        const isBom = order.note?.includes('[KHÁCH BOM HÀNG');
        const msg = isBom
            ? 'Xác nhận: Khách bom hàng. Hệ thống sẽ tự động CỘNG TRẢ số lượng vào kho và HỦY đơn này?'
            : 'Xác nhận: Bạn muốn HỦY đơn hàng này? (Đơn chưa xuất kho nên sẽ không ảnh hưởng kho)';
        if (!window.confirm(msg)) return;
        try {
            await api.put(`/orders/${order.id}/return-inventory`);
            alert(isBom ? 'Đã hoàn kho và hủy đơn thành công!' : 'Đã hủy đơn thành công!');
            setIsErrorModalOpen(false);
            setErrorOrder(null);
            fetchAll();
        } catch (err) {
            alert(err.response?.data?.message || 'Lỗi khi xử lý hủy đơn');
        }
    };

    // Hoàn đơn lại vào kho (đơn khách không nhận đã quay về Sales)
    const handleReturnToWarehouse = async (order) => {
        if (!window.confirm(`Xác nhận hoàn đơn "${order.order_no}" lại vào kho đã xuất? Hệ thống sẽ cộng trả số lượng vào kho và hủy đơn.`)) return;
        try {
            await api.put(`/orders/${order.id}/return-inventory`);
            alert('Đã hoàn đơn lại vào kho thành công!');
            fetchAll();
        } catch (err) {
            alert(err.response?.data?.message || 'Lỗi khi hoàn đơn vào kho');
        }
    };

    // ── View ─────────────────────────────────────────────────────────────────
    const openView = async (order) => {
        try {
            const res = await api.get(`/orders/${order.id}/items`);
            setViewOrder({ ...order, items: enrichItems(Array.isArray(res.data) ? res.data : [], products) });
        } catch {
            setViewOrder(order);
        }
        setIsViewOpen(true);
    };

    const openErrorModal = async (order) => {
        try {
            const res = await api.get(`/orders/${order.id}/items`);
            setErrorOrder({ ...order, items: enrichItems(Array.isArray(res.data) ? res.data : [], products) });
        } catch {
            setErrorOrder(order);
        }
        setIsErrorModalOpen(true);
    };

    const openCancelModal = async (order) => {
        try {
            const res = await api.get(`/orders/${order.id}/items`);
            setCancelOrder({ ...order, items: enrichItems(Array.isArray(res.data) ? res.data : [], products) });
        } catch {
            setCancelOrder(order);
        }
    };

    // Mở modal xử lý khách từ chối
    const openRejectModal = async (order) => {
        try {
            const res = await api.get(`/orders/${order.id}/items`);
            setRejectOrder({ ...order, items: enrichItems(Array.isArray(res.data) ? res.data : [], products) });
        } catch {
            setRejectOrder(order);
        }
        setRejectAction('return_to_warehouse');
        setRejectNote('');
        setIsRejectModalOpen(true);
    };

    const handleReject = async () => {
        if (!rejectOrder) return;
        try {
            await api.put(`/orders/${rejectOrder.id}/process-customer-rejection`, {
                action: rejectAction,
                note: rejectNote,
            });
            alert(rejectAction === 'return_to_warehouse'
                ? 'Đã hoàn đơn lại vào kho thành công!'
                : 'Đã chuyển sang xử lý hoàn thành công!');
            setIsRejectModalOpen(false);
            setRejectOrder(null);
            fetchAll();
        } catch (err) {
            alert(err.response?.data?.message || 'Lỗi xử lý yêu cầu');
        }
    };

    // ── Layout helpers ──────────────────────────────────────────────────────
    const pad = isMobile ? 14 : isTablet ? 18 : 20;
    const statCols = isMobile ? 1 : isTablet ? 2 : 4;
    const cardR = isMobile ? 16 : 20;

    // ── Render ────────────────────────────────────────────────────────────────
    if (!isAuthorized) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#94a3b8', gap: 12 }}>
                <i className="ri-lock-2-line" style={{ fontSize: 48, color: '#cbd5e1' }} />
                <h2 style={{ margin: 0, color: '#334155' }}>Bạn không có quyền truy cập trang này</h2>
                <p style={{ margin: 0, fontSize: 14 }}>Trang Quản lý đơn hàng chỉ dành cho Admin và Sales.</p>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100dvh', padding: `${pad}px`,
            background: 'radial-gradient(circle at top left, #eff6ff 0%, #f8fafc 35%, #f3f4f6 100%)',
            color: '#0f172a', boxSizing: 'border-box',
            opacity: pageLoaded ? 1 : 0,
            transition: 'opacity 320ms ease',
        }}>
            <div style={{ maxWidth: 1400, margin: '0 auto' }}>
                {/* ── Header ── */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14,
                    marginBottom: isMobile ? 14 : 20, flexWrap: 'wrap',
                    opacity: pageLoaded ? 1 : 0, transition: 'opacity 420ms ease 80ms'
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: isMobile ? 22 : 28, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em' }}>
                            Quản lý đơn hàng
                        </h2>
                        <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: isMobile ? 12 : 14, lineHeight: 1.7 }}>
                            Theo dõi, chỉnh sửa và xử lý đơn hàng trong một giao diện gọn gàng.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button type="button" onClick={async () => {
                            const rows = filteredOrders.map(o => {
                                const total = calcTotal(o);
                                return [
                                    o.order_no || '',
                                    o.customer_name || '',
                                    fmtDate(o.order_date),
                                    fmtDate(o.expected_delivery_date),
                                    fmtDate(o.actual_delivery_date),
                                    statusConfig[o.status]?.label || o.status || '',
                                    (o.items?.length ?? normalizeOrderItems(o).length),
                                    total,
                                ];
                            });
                            await exportListToExcel({
                                filename: 'DanhSachDonHang',
                                sheetName: 'DonHang',
                                title: 'DANH SÁCH ĐƠN HÀNG',
                                headers: ['Mã đơn', 'Khách hàng', 'Ngày đặt', 'Ngày giao dự kiến', 'Ngày giao thực tế', 'Trạng thái', 'Số SP', 'Tổng tiền (VND)'],
                                rows,
                                colWidths: [18, 28, 14, 16, 16, 18, 8, 18],
                                numberCols: [{ col: 8, format: '#,##0 "đ"' }],
                            });
                        }} style={{
                            padding: isMobile ? '11px 16px' : '12px 18px',
                            borderRadius: 14, border: '1px solid #d1fae5',
                            background: 'linear-gradient(135deg, #10b981, #34d399)',
                            color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: isMobile ? 13 : 14,
                            boxShadow: '0 14px 28px rgba(16,185,129,0.22)',
                            display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0
                        }}>
                            <i className="ri-file-excel-2-line" style={{ fontSize: 16 }} />
                            Xuất Excel
                        </button>
                        <button type="button" onClick={openAdd} style={{
                            padding: isMobile ? '11px 16px' : '12px 18px',
                            borderRadius: 14, border: 'none',
                            background: 'linear-gradient(135deg, #2563eb, #60a5fa)',
                            color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: isMobile ? 13 : 14,
                            boxShadow: '0 14px 28px rgba(37,99,235,0.22)',
                            transition: 'transform 160ms ease, box-shadow 160ms ease',
                            display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0
                        }}>
                            <i className="ri-add-line" style={{ fontSize: 16 }} />
                            Tạo đơn hàng
                        </button>
                    </div>
                </div>

                {/* ── Stats ── */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${statCols}, minmax(0, 1fr))`,
                    gap: isMobile ? 10 : 14,
                    marginBottom: isMobile ? 14 : 22,
                    opacity: pageLoaded ? 1 : 0, transition: 'opacity 420ms ease 120ms'
                }}>
                    {[
                        { key: 'total', label: 'Tổng đơn', value: stats.total, bg: '#eff6ff', color: '#2563eb', icon: 'ri-file-list-3-line' },
                        { key: 'pending', label: 'Chờ duyệt', value: stats.pending, bg: '#fffbeb', color: '#d97706', icon: 'ri-time-line' },
                        { key: 'completed', label: 'Đã hoàn tất', value: stats.completed, bg: '#ecfdf5', color: '#16a34a', icon: 'ri-checkbox-circle-line' },
                        { key: 'issues', label: 'Đơn lỗi', value: stats.issues, bg: '#fef2f2', color: '#dc2626', icon: 'ri-error-warning-line' },
                    ].map((s) => (
                        <div key={s.key} style={{
                            borderRadius: cardR, padding: isMobile ? '14px' : '18px',
                            background: '#fff', boxShadow: '0 12px 24px rgba(15,23,42,0.08)',
                            border: '1px solid rgba(148,163,184,0.18)',
                            minHeight: isMobile ? 86 : 104,
                        }}>
                            <div style={{
                                width: isMobile ? 38 : 40, height: isMobile ? 38 : 40, borderRadius: 12,
                                background: s.bg, color: s.color, display: 'grid', placeItems: 'center',
                                marginBottom: isMobile ? 10 : 12, fontSize: 20, boxShadow: `0 8px 18px ${s.bg}`
                            }}>
                                <i className={s.icon} />
                            </div>
                            <p style={{ margin: 0, color: '#64748b', fontSize: isMobile ? 10 : 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                {s.label}
                            </p>
                            <div style={{ margin: '8px 0 0', fontSize: isMobile ? 22 : 30, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em' }}>
                                {s.value}
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Section ── */}
                <div style={{
                    background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(148,163,184,0.18)', borderRadius: cardR,
                    boxShadow: '0 20px 50px rgba(15,23,42,0.08)',
                    marginBottom: 22, overflow: 'hidden',
                    opacity: pageLoaded ? 1 : 0, transition: 'opacity 460ms ease 180ms'
                }}>
                    {/* Section Header */}
                    <div style={{ padding: isMobile ? '14px' : '20px 20px 0' }}>
                        <h3 style={{ margin: 0, fontSize: isMobile ? 15 : 18, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
                            Danh sách đơn hàng
                        </h3>
                        <p style={{ margin: '6px 0 12px', color: '#64748b', fontSize: isMobile ? 11 : 13, lineHeight: 1.6 }}>
                            Theo dõi tiến độ và xử lý nhanh các đơn đang chờ hoặc bị trả về.
                        </p>
                    </div>

                    {/* Filters */}
                    <div style={{ padding: isMobile ? '0 14px 14px' : '0 20px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                            <label style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '10px 14px', borderRadius: 14,
                                border: '1px solid #cbd5e1', background: '#fff',
                                minWidth: 0, flex: isMobile ? '1 1 100%' : isTablet ? '1 1 220px' : '1 1 280px',
                                boxShadow: '0 8px 18px rgba(15,23,42,0.04)'
                            }}>
                                <i className="ri-search-line" style={{ color: '#94a3b8', fontSize: 16, flexShrink: 0 }} />
                                <input
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Tìm mã đơn, khách hàng..."
                                    style={{ border: 'none', outline: 'none', width: '100%', fontSize: 13, background: 'transparent', color: '#0f172a' }}
                                />
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                style={{
                                    padding: '10px 14px', borderRadius: 14,
                                    border: '1px solid #cbd5e1', background: '#fff',
                                    fontSize: 13, color: '#0f172a', cursor: 'pointer',
                                    fontWeight: 600, flex: isMobile ? '1 1 100%' : '0 0 auto',
                                    minWidth: isMobile ? '100%' : 160
                                }}
                            >
                                <option value="all">Tất cả trạng thái</option>
                                <option value="pending">Đang chờ duyệt</option>
                                <option value="returned">Bị từ chối</option>
                                <option value="warehouse_processing">Kho đang xuất</option>
                                <option value="completed">Đã hoàn tất</option>
                                <option value="waiting_sales">Đang đợi Sales</option>
                                <option value="return_to_sales">Hoàn về Sales</option>
                                <option value="customer_rejected">Khách từ chối</option>
                            </select>
                            <div style={{
                                padding: '10px 14px', borderRadius: 14,
                                border: '1px solid #e2e8f0', background: '#f8fafc',
                                color: '#475569', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap'
                            }}>
                                {filteredOrders.length} / {orders.length} đơn
                            </div>
                            {(searchTerm || statusFilter !== 'all') && (
                                <button
                                    type="button" onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                                    style={{
                                        padding: '10px 14px', borderRadius: 14,
                                        border: '1px solid #dbe3ee', background: '#fff',
                                        color: '#334155', fontWeight: 700, fontSize: 12, cursor: 'pointer'
                                    }}
                                >
                                    Xóa lọc
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Table / List */}
                    <div style={{ padding: isMobile ? '0 0 12px' : '0 20px 20px' }}>
                        {orders.length === 0 ? (
                            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>Chưa có đơn hàng nào.</div>
                        ) : filteredOrders.length === 0 ? (
                            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>Không tìm thấy đơn hàng phù hợp.</div>
                        ) : isMobile ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
                                {filteredOrders.map((o, index) => {
                                    const status = statusConfig[o.status] ? o.status : 'pending';
                                    const cfg = statusConfig[status];
                                    const tone = toneStyles[cfg.tone];
                                    return (
                                        <div
                                            key={o.id}
                                            style={{
                                                borderRadius: 16, padding: '14px',
                                                border: '1px solid #e2e8f0',
                                                background: hoveredRowId === o.id ? '#f8fbff' : '#fff',
                                                boxShadow: hoveredRowId === o.id ? '0 8px 20px rgba(15,23,42,0.06)' : '0 2px 8px rgba(15,23,42,0.03)',
                                                opacity: pageLoaded ? 1 : 0,
                                                transition: `opacity 360ms ease ${120 + index * 50}ms, background 180ms ease, box-shadow 180ms ease`
                                            }}
                                            onMouseEnter={() => setHoveredRowId(o.id)}
                                            onMouseLeave={() => setHoveredRowId(null)}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                                                <div>
                                                    <div style={{ fontWeight: 900, color: '#2563eb', fontSize: 14 }}>{o.order_no}</div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#475569', marginTop: 2 }}>
                                                        <i className="ri-user-line" style={{ fontSize: 13, color: '#94a3b8' }} />
                                                        {o.customer_name || '—'}
                                                    </div>
                                                </div>
                                                <span style={{ ...tone, display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                                                    {cfg.label}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, marginBottom: 8 }}>
                                                {formatOrderItems(o)}
                                            </div>
                                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                {status === 'completed' && (
                                                    <button onClick={() => openView(o)} style={{ padding: '7px 12px', borderRadius: 10, border: 'none', background: '#eff6ff', color: '#1d4ed8', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                                                        <i className="ri-eye-line" style={{ marginRight: 4, fontSize: 13 }} />Xem
                                                    </button>
                                                )}
                                                {status === 'canceled' && (
                                                    <button onClick={() => openCancelModal(o)} style={{ padding: '7px 12px', borderRadius: 10, border: '1px solid #fecaca', background: '#fff1f2', color: '#be123c', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                                                        <i className="ri-eye-line" style={{ marginRight: 4, fontSize: 13 }} />Lý do hủy
                                                    </button>
                                                )}
                                                {status === 'returned' && (
                                                    <button onClick={() => openErrorModal(o)} style={{ padding: '7px 12px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #dc2626, #ef4444)', color: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                                                        Xem lỗi & xử lý
                                                    </button>
                                                )}
                                                {status === 'customer_rejected' && (
                                                    <button onClick={() => openRejectModal(o)} style={{ padding: '7px 12px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #ea580c, #f97316)', color: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                                                        <i className="ri-settings-line" style={{ marginRight: 4, fontSize: 13 }} />Xử lý
                                                    </button>
                                                )}
                                                {status === 'pending' && (
                                                    <>
                                                        <button onClick={() => openEdit(o)} style={{ padding: '7px 12px', borderRadius: 10, border: '1px solid #93c5fd', background: '#eff6ff', color: '#1d4ed8', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                                                            <i className="ri-edit-line" style={{ marginRight: 4, fontSize: 13 }} />Sửa
                                                        </button>
                                                        <button onClick={() => handleDelete(o)} style={{ padding: '7px 12px', borderRadius: 10, border: '1px solid #fecaca', background: '#fff1f2', color: '#be123c', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                                                            <i className="ri-delete-bin-line" style={{ marginRight: 4, fontSize: 13 }} />Xóa
                                                        </button>
                                                    </>
                                                )}
                                                {(status === 'waiting_sales' || status === 'return_to_sales') && (
                                                    <>
                                                        <button onClick={() => openEdit(o)} style={{ padding: '7px 12px', borderRadius: 10, border: '1px solid #fbbf24', background: '#fffbeb', color: '#b45309', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                                                            <i className="ri-edit-line" style={{ marginRight: 4, fontSize: 13 }} />Sửa đơn
                                                        </button>
                                                        {status === 'return_to_sales' && (
                                                            <button onClick={() => handleReturnToWarehouse(o)} style={{ padding: '7px 12px', borderRadius: 10, border: '1px solid #16a34a', background: '#f0fdf4', color: '#15803d', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                                                                <i className="ri-arrow-go-back-line" style={{ marginRight: 4, fontSize: 13 }} />Hoàn đơn lại vào kho
                                                            </button>
                                                        )}
                                                        <button onClick={() => handleDelete(o)} style={{ padding: '7px 12px', borderRadius: 10, border: '1px solid #fecaca', background: '#fff1f2', color: '#be123c', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                                                            <i className="ri-delete-bin-line" style={{ marginRight: 4, fontSize: 13 }} />Xóa đơn
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto', borderRadius: isMobile ? 12 : 18, border: '1px solid #e2e8f0' }}>
                                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: isTablet ? 700 : 900 }}>
                                    <thead>
                                        <tr style={{ background: '#f8fafc' }}>
                                            {['Mã đơn', 'Khách hàng', 'Sản phẩm', 'Ngày giao dự kiến', 'Trạng thái', 'Hành động'].map((h) => (
                                                <th key={h} style={{
                                                    textAlign: 'left', padding: '12px 16px',
                                                    fontSize: 12, textTransform: 'uppercase',
                                                    letterSpacing: '0.06em', color: '#64748b',
                                                    borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap'
                                                }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredOrders.map((o, index) => {
                                            const status = statusConfig[o.status] ? o.status : 'pending';
                                            const cfg = statusConfig[status];
                                            const tone = toneStyles[cfg.tone];
                                            const isHovered = hoveredRowId === o.id;
                                            return (
                                                <tr key={o.id}
                                                    onMouseEnter={() => setHoveredRowId(o.id)}
                                                    onMouseLeave={() => setHoveredRowId(null)}
                                                    style={{
                                                        background: isHovered ? 'linear-gradient(90deg, rgba(37,99,235,0.04), #fff)' : '#fff',
                                                        opacity: pageLoaded ? 1 : 0,
                                                        transition: `opacity 360ms ease ${120 + index * 50}ms, background 180ms ease`,
                                                    }}
                                                >
                                                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', fontWeight: 800, color: '#2563eb', whiteSpace: 'nowrap' }}>{o.order_no}</td>
                                                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', color: '#334155', verticalAlign: 'top' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <i className="ri-user-line" style={{ color: '#94a3b8', fontSize: 14, flexShrink: 0 }} />
                                                            <span>{o.customer_name || '—'}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: 13, lineHeight: 1.6, maxWidth: isTablet ? 160 : 340 }}>{formatOrderItems(o)}</td>
                                                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', color: '#334155', whiteSpace: 'nowrap' }}>
                                                        {o.expected_delivery_date ? new Date(o.expected_delivery_date).toLocaleDateString('vi-VN') : '—'}
                                                    </td>
                                                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0' }}>
                                                        <span style={{ ...tone, display: 'inline-flex', alignItems: 'center', padding: '6px 10px', borderRadius: 999, fontSize: 12, fontWeight: 800 }}>
                                                            {cfg.label}
                                                        </span>
                                                        {status === 'waiting_sales' && o.warehouse_note && (
                                                            <div style={{ marginTop: 6, fontSize: 12, color: '#b45309', fontWeight: 600, lineHeight: 1.4, maxWidth: 200 }}>
                                                                <i className="ri-error-warning-line" style={{ marginRight: 4, fontSize: 11 }} />
                                                                Kho: {o.warehouse_note}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0' }}>
                                                        {status === 'completed' && (
                                                            <button onClick={() => openView(o)} title="Xem chi tiết" style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff', color: '#334155', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                                                                <i className="ri-eye-line" style={{ fontSize: 16 }} />
                                                            </button>
                                                        )}
                                                        {status === 'canceled' && (
                                                            <button onClick={() => openCancelModal(o)} title="Xem lý do hủy" style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #fecaca', background: '#fff1f2', color: '#be123c', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                                                                <i className="ri-eye-line" style={{ fontSize: 16 }} />
                                                            </button>
                                                        )}
                                                        {status === 'returned' && (
                                                            <button onClick={() => openErrorModal(o)} style={{ padding: '8px 12px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #dc2626, #ef4444)', color: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                                                                Xem lỗi
                                                            </button>
                                                        )}
                                                        {status === 'customer_rejected' && (
                                                            <button onClick={() => openRejectModal(o)} title="Xử lý đơn khách từ chối" style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #fb923c', background: '#fff7ed', color: '#c2410c', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                                                                <i className="ri-settings-line" style={{ fontSize: 15 }} />
                                                            </button>
                                                        )}
                                                        {status === 'pending' && (
                                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                                <button onClick={() => openEdit(o)} title="Sửa đơn" style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #93c5fd', background: '#eff6ff', color: '#1d4ed8', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                                                                    <i className="ri-edit-line" style={{ fontSize: 15 }} />
                                                                </button>
                                                                <button onClick={() => handleDelete(o)} title="Xóa đơn" style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #fecaca', background: '#fff1f2', color: '#be123c', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                                                                    <i className="ri-delete-bin-line" style={{ fontSize: 15 }} />
                                                                </button>
                                                            </div>
                                                        )}
                                                        {(status === 'waiting_sales' || status === 'return_to_sales') && (
                                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                                <button onClick={() => openEdit(o)} title="Sửa đơn" style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #fbbf24', background: '#fffbeb', color: '#b45309', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                                                                    <i className="ri-edit-line" style={{ fontSize: 15 }} />
                                                                </button>
                                                                {status === 'return_to_sales' && (
                                                                    <button onClick={() => handleReturnToWarehouse(o)} title="Hoàn đơn lại vào kho" style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #16a34a', background: '#f0fdf4', color: '#15803d', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                                                                        <i className="ri-arrow-go-back-line" style={{ fontSize: 15 }} />
                                                                    </button>
                                                                )}
                                                                <button onClick={() => handleDelete(o)} title="Xóa đơn" style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #fecaca', background: '#fff1f2', color: '#be123c', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                                                                    <i className="ri-delete-bin-line" style={{ fontSize: 15 }} />
                                                                </button>
                                                            </div>
                                                        )}
                                                        {['warehouse_processing', 'shipping', 'logistics_review'].includes(status) && (
                                                            <button onClick={() => openView(o)} title="Xem chi tiết" style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff', color: '#334155', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                                                                <i className="ri-eye-line" style={{ fontSize: 16 }} />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Create/Edit Modal ── */}
            {isFormOpen && createPortal(
                <div
                    style={{
                        position: 'fixed', inset: 0,
                        background: isFormVisible ? 'rgba(15,23,42,0.6)' : 'rgba(15,23,42,0)',
                        backdropFilter: isFormVisible ? 'blur(8px)' : 'none',
                        zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: pad, transition: 'background 220ms ease, backdrop-filter 220ms ease',
                    }}
                    onClick={closeForm}
                >
                    <div
                        style={{
                            width: '100%', maxWidth: 1100,
                            maxHeight: '92dvh', overflowY: 'auto',
                            background: '#fff', borderRadius: cardR,
                            boxShadow: '0 30px 80px rgba(15,23,42,0.22)',
                            border: '1px solid #e5eef8',
                            transform: isFormVisible ? 'scale(1)' : 'scale(0.97)',
                            opacity: isFormVisible ? 1 : 0,
                            transition: 'transform 220ms ease, opacity 220ms ease',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div style={{ padding: isMobile ? '16px' : '22px 24px', borderBottom: '1px solid #eef2f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                            <div>
                                <div style={{ fontSize: 11, color: '#2563eb', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                                    {editingId ? 'Chỉnh sửa đơn' : 'Tạo đơn hàng'}
                                </div>
                                <h3 style={{ margin: 0, fontSize: isMobile ? 18 : 22, color: '#0f172a', letterSpacing: '-0.02em' }}>
                                    {editingId ? `Đơn ${orderNo}` : 'Tạo đơn hàng mới'}
                                </h3>
                            </div>
                            <button type="button" onClick={closeForm} style={{
                                width: 36, height: 36, borderRadius: 10,
                                borderWidth: '1px', borderStyle: 'solid', borderColor: '#dbe3ee',
                                background: '#fff', color: '#0f172a', cursor: 'pointer',
                                fontSize: 18, fontWeight: 700, display: 'grid', placeItems: 'center'
                            }}>
                                ×
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: isMobile ? '16px' : '24px' }}>
                            <form onSubmit={handleSubmit}>
                                {/* Row 1: Mã đơn - Khách hàng - Ngày giao dự kiến */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: isMobile
                                        ? '1fr'
                                        : isTablet
                                        ? 'repeat(2, minmax(0, 1fr))'
                                        : '1fr 1.5fr 1fr',
                                    gap: 14, marginBottom: 14
                                }}>
                                    {/* Mã đơn hàng */}
                                    <div>
                                        <label style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 700, color: '#334155' }}>
                                            Mã đơn hàng
                                        </label>
                                        <div style={{
                                            width: '100%', padding: '12px 14px', borderRadius: 14,
                                            border: '1px solid #bfdbfe', background: '#eff6ff',
                                            fontSize: 16, fontWeight: 900, color: '#1d4ed8',
                                            fontFamily: 'monospace', letterSpacing: '0.06em',
                                            boxSizing: 'border-box'
                                        }}>
                                            {editingId ? orderNo : 'Sẽ được sinh khi gửi'}
                                        </div>
                                        <div style={{ marginTop: 6, fontSize: 11, color: '#94a3b8' }}>
                                            {editingId ? 'Mã đơn gốc' : 'Mã được sinh tự động khi bạn nhấn Gửi đơn'}
                                        </div>
                                    </div>

                                    {/* Khách hàng */}
                                    <div>
                                        <label style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 700, color: '#334155' }}>
                                            Khách hàng <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <select
                                            required value={customerId}
                                            onChange={(e) => setCustomerId(e.target.value)}
                                            style={{ width: '100%', padding: '12px 14px', borderRadius: 14, border: '1px solid #cbd5e1', background: '#fff', outline: 'none', fontSize: 14, color: '#0f172a', boxSizing: 'border-box' }}
                                        >
                                            <option value="">-- Chọn khách hàng --</option>
                                            {customers.map((c) => (
                                                <option key={c.id} value={c.id}>{c.company_name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Ngày giao dự kiến */}
                                    <div>
                                        <label style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 700, color: '#334155' }}>
                                            Ngày giao dự kiến <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <input
                                            required type="date" value={expectedDate}
                                            onChange={(e) => setExpectedDate(e.target.value)}
                                            style={{ width: '100%', padding: '12px 14px', borderRadius: 14, border: '1px solid #cbd5e1', background: '#fff', outline: 'none', fontSize: 14, color: '#0f172a', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                </div>

                                {/* Lý do Kho từ chối (chỉ đọc) */}
                                {warehouseNote && (
                                    <div style={{ marginBottom: 14, padding: '12px 14px', borderRadius: 14, background: '#fff7ed', border: '1px solid #fed7aa' }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: '#9a3412', marginBottom: 4 }}>
                                            <i className="ri-error-warning-line" style={{ marginRight: 4 }} />
                                            Lý do Kho từ chối xuất hàng
                                        </div>
                                        <div style={{ color: '#9a3412', fontSize: 14, fontWeight: 600 }}>{warehouseNote}</div>
                                    </div>
                                )}

                                {/* Row 2: Note */}
                                <div style={{ marginBottom: 14 }}>
                                    <label style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 700, color: '#334155' }}>
                                        Địa chỉ giao hàng / Ghi chú
                                    </label>
                                    <textarea
                                        value={note} onChange={(e) => setNote(e.target.value)}
                                        placeholder="Nhập địa chỉ giao hàng hoặc ghi chú..."
                                        style={{
                                            width: '100%', padding: '12px 14px', borderRadius: 14,
                                            border: '1px solid #cbd5e1', background: '#fff', outline: 'none',
                                            fontSize: 14, color: '#0f172a', boxSizing: 'border-box',
                                            minHeight: 88, resize: 'vertical', fontFamily: 'inherit'
                                        }}
                                    />
                                </div>

                                {/* Items */}
                                <div style={{ marginBottom: 20 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                                        <div>
                                            <div style={{ fontSize: isMobile ? 13 : 15, fontWeight: 800, color: '#0f172a' }}>Danh sách sản phẩm</div>
                                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Chọn sản phẩm, số lượng và xem thành tiền.</div>
                                        </div>
                                        <button type="button" onClick={() => addItem()} style={{
                                            padding: '10px 16px', borderRadius: 12, border: 'none',
                                            background: 'linear-gradient(135deg, #0f766e, #2563eb)',
                                            color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                                            boxShadow: '0 14px 30px rgba(37,99,235,0.18)',
                                            display: 'flex', alignItems: 'center', gap: 6
                                        }}>
                                            <i className="ri-add-line" style={{ fontSize: 15 }} />
                                            Thêm sản phẩm
                                        </button>
                                    </div>

                                    {selectedItems.length === 0 ? (
                                        <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', borderRadius: 14, border: '2px dashed #e2e8f0', fontSize: 14 }}>
                                            Chưa có sản phẩm nào. Nhấn "Thêm sản phẩm" để thêm.
                                        </div>
                                    ) : isMobile ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            {selectedItems.map((item, idx) => {
                                                const qty = Math.max(1, Number(item.quantity) || 1);
                                                const price = Number(item.unit_price || 0);
                                                const total = qty * price;
                                                const prod = products.find((p) => String(p.id) === String(item.product_id));
                                                return (
                                                    <div key={item.id || idx} style={{ padding: '12px', borderRadius: 14, border: '1px solid #e2e8f0', background: '#fff' }}>
                                                        <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                                                            <span style={{ fontSize: 11, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 999, padding: '2px 8px', fontWeight: 700 }}>
                                                                {prod?.sku || '—'}
                                                            </span>
                                                            <span style={{ fontWeight: 800, fontSize: 13, color: '#0f172a' }}>{prod?.name || '—'}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                            <div style={{ flex: 1 }}>
                                                                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Số lượng</label>
                                                                <input type="number" min="1" value={qty}
                                                                    onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                                                                    style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontWeight: 700, boxSizing: 'border-box' }}
                                                                />
                                                            </div>
                                                            <div style={{ flex: 1 }}>
                                                                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Đơn giá</label>
                                                                <div style={{ padding: '9px 12px', borderRadius: 10, background: '#f0fdf4', color: '#166534', fontWeight: 800, fontSize: 13 }}>{fmt(price)} đ</div>
                                                            </div>
                                                            <div style={{ flex: 1 }}>
                                                                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Thành tiền</label>
                                                                <div style={{ padding: '9px 12px', borderRadius: 10, background: '#ecfdf5', color: '#166534', fontWeight: 900, fontSize: 13 }}>{fmt(total)} đ</div>
                                                            </div>
                                                            <button type="button" onClick={() => removeItem(idx)} style={{
                                                                width: 36, height: 36, marginTop: 18, borderRadius: 10,
                                                                borderWidth: '1px', borderStyle: 'solid', borderColor: '#fecaca',
                                                                background: '#fff1f2', color: '#e11d48', cursor: 'pointer',
                                                                display: 'grid', placeItems: 'center', fontSize: 18, fontWeight: 700
                                                            }}>×</button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div style={{ overflowX: 'auto', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 700 }}>
                                                <thead>
                                                    <tr style={{ background: '#f8fafc' }}>
                                                        <th style={{ textAlign: 'left', padding: '12px 16px', color: '#475569', fontSize: 13, width: 130 }}>Mã SKU</th>
                                                        <th style={{ textAlign: 'left', padding: '12px 16px', color: '#475569', fontSize: 13 }}>Sản phẩm</th>
                                                        <th style={{ textAlign: 'left', padding: '12px 16px', color: '#475569', fontSize: 13, width: 110 }}>Số lượng</th>
                                                        <th style={{ textAlign: 'left', padding: '12px 16px', color: '#475569', fontSize: 13, width: 150 }}>Đơn giá</th>
                                                        <th style={{ textAlign: 'left', padding: '12px 16px', color: '#475569', fontSize: 13, width: 150 }}>Thành tiền</th>
                                                        <th style={{ width: 60 }} />
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedItems.map((item, idx) => {
                                                        const qty = Math.max(1, Number(item.quantity) || 1);
                                                        const price = Number(item.unit_price || 0);
                                                        const total = qty * price;
                                                        const prod = products.find((p) => String(p.id) === String(item.product_id));
                                                        return (
                                                            <tr key={item.id || idx} style={{ borderTop: '1px solid #e2e8f0' }}>
                                                                <td style={{ padding: '12px 16px' }}>
                                                                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: 999, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', fontSize: 12, fontWeight: 800, fontFamily: 'monospace', letterSpacing: '0.03em' }}>
                                                                        {prod?.sku || '—'}
                                                                    </span>
                                                                </td>
                                                                <td style={{ padding: '12px 16px' }}>
                                                                    <select
                                                                        value={item.product_id}
                                                                        onChange={(e) => updateItem(idx, 'product_id', e.target.value)}
                                                                        style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff', fontSize: 13, color: '#0f172a', boxSizing: 'border-box' }}
                                                                    >
                                                                        <option value="">-- Chọn sản phẩm --</option>
                                                                        {products.map((p) => (
                                                                            <option key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ''}</option>
                                                                        ))}
                                                                    </select>
                                                                </td>
                                                                <td style={{ padding: '12px 16px' }}>
                                                                    <input type="number" min="1" value={qty}
                                                                        onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                                                                        style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontWeight: 700, boxSizing: 'border-box' }}
                                                                    />
                                                                </td>
                                                                <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{fmt(price)} đ</td>
                                                                <td style={{ padding: '12px 16px' }}>
                                                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 12, background: '#ecfdf5', color: '#166534', fontWeight: 800, fontSize: 13 }}>{fmt(total)} đ</div>
                                                                </td>
                                                                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                                    <button type="button" onClick={() => removeItem(idx)} style={{
                                                                        width: 36, height: 36, borderRadius: 10,
                                                                        borderWidth: '1px', borderStyle: 'solid', borderColor: '#fecaca',
                                                                        background: '#fff1f2', color: '#e11d48', cursor: 'pointer',
                                                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                                        fontSize: 18, fontWeight: 700
                                                                    }}>×</button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                {/* Submit */}
                                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                    <button type="button" onClick={closeForm} style={{
                                        padding: '12px 18px', borderRadius: 12,
                                        borderWidth: '1px', borderStyle: 'solid', borderColor: '#cbd5e1',
                                        background: '#fff', color: '#334155', fontWeight: 700, fontSize: 14, cursor: 'pointer'
                                    }}>
                                        Hủy
                                    </button>
                                    <button type="submit" style={{
                                        padding: '12px 20px', borderRadius: 12, border: 'none',
                                        background: editingId ? 'linear-gradient(135deg, #ea580c, #f97316)' : 'linear-gradient(135deg, #0f766e, #22c55e)',
                                        color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer',
                                        boxShadow: '0 14px 30px rgba(15,118,110,0.18)',
                                        display: 'flex', alignItems: 'center', gap: 6
                                    }}>
                                        {editingId ? 'Lưu & Gửi lại' : 'Gửi đơn cho Logistics'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ── View Modal ── */}
            {isViewOpen && viewOrder && createPortal(
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: pad }}
                    onClick={() => { setIsViewOpen(false); setViewOrder(null); }}
                >
                    <div style={{ width: '100%', maxWidth: 700, background: '#fff', borderRadius: cardR, boxShadow: '0 30px 90px rgba(15,23,42,0.3)', border: '1px solid rgba(59,130,246,0.16)', overflow: 'hidden' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ padding: isMobile ? '16px' : 22, background: 'linear-gradient(180deg, #fff, #f8fafc)', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                            <div>
                                <div style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 10px', borderRadius: 999, background: '#dcfce7', color: '#166534', fontWeight: 800, fontSize: 11, marginBottom: 10 }}>ĐƠN HÀNG ĐÃ HOÀN TẤT</div>
                                <h3 style={{ margin: 0, fontSize: isMobile ? 18 : 24, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>Chi tiết đơn {viewOrder.order_no}</h3>
                            </div>
                            <button onClick={() => { setIsViewOpen(false); setViewOrder(null); }} style={{ width: 36, height: 36, borderRadius: 10, borderWidth: '1px', borderStyle: 'solid', borderColor: '#cbd5e1', background: '#fff', cursor: 'pointer', fontSize: 18, fontWeight: 700, display: 'grid', placeItems: 'center', flexShrink: 0 }}>×</button>
                        </div>
                        <div style={{ padding: isMobile ? '14px' : 22 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: 12, marginBottom: 14 }}>
                                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14 }}>
                                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>Khách hàng</div>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{viewOrder.customer_name || '—'}</div>
                                </div>
                                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14 }}>
                                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>Ngày giao dự kiến</div>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{viewOrder.expected_delivery_date ? new Date(viewOrder.expected_delivery_date).toLocaleDateString('vi-VN') : '—'}</div>
                                </div>
                                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 14, padding: 14, gridColumn: isMobile ? 'unset' : '1 / -1' }}>
                                    <div style={{ fontSize: 11, color: '#1d4ed8', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>Tổng tiền</div>
                                    <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 900, color: '#1d4ed8' }}>{fmt(calcTotal(viewOrder))} đ</div>
                                </div>
                            </div>
                            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14, marginBottom: 14 }}>
                                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>Danh sách sản phẩm</div>
                                <div style={{ color: '#0f172a', lineHeight: 1.8 }}>{formatOrderItems(viewOrder)}</div>
                            </div>
                            {viewOrder.note && (
                                <div style={{ background: 'linear-gradient(180deg, #eff6ff, #dbeafe)', border: '1px solid #bfdbfe', borderRadius: 14, padding: 14, marginBottom: 14 }}>
                                    <div style={{ fontSize: 11, color: '#1d4ed8', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>Ghi chú</div>
                                    <div style={{ color: '#1e3a8a', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{viewOrder.note}</div>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button onClick={() => { setIsViewOpen(false); setViewOrder(null); }} style={{ padding: '11px 18px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #2563eb, #60a5fa)', color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', boxShadow: '0 14px 28px rgba(37,99,235,0.18)' }}>Đóng</button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ── Error Modal (returned) ── */}
            {isErrorModalOpen && errorOrder && createPortal(
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: pad }}
                    onClick={() => { setIsErrorModalOpen(false); setErrorOrder(null); }}
                >
                    <div style={{ width: '100%', maxWidth: 540, background: '#fff', borderRadius: cardR, boxShadow: '0 30px 80px rgba(15,23,42,0.3)', border: '1px solid rgba(248,113,113,0.25)', overflow: 'hidden' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ padding: isMobile ? '14px' : 20, background: 'linear-gradient(180deg, #fff1f2, #fff)', borderBottom: '1px solid #fecdd3', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                            <div>
                                <div style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 10px', borderRadius: 999, background: '#fee2e2', color: '#b91c1c', fontWeight: 800, fontSize: 11, marginBottom: 8 }}>ĐƠN BỊ TỪ CHỐI</div>
                                <h3 style={{ margin: 0, fontSize: isMobile ? 16 : 20, fontWeight: 900, color: '#0f172a' }}>Chi tiết lỗi đơn {errorOrder.order_no}</h3>
                            </div>
                            <button onClick={() => { setIsErrorModalOpen(false); setErrorOrder(null); }} style={{ width: 36, height: 36, borderRadius: 10, borderWidth: '1px', borderStyle: 'solid', borderColor: '#cbd5e1', background: '#fff', cursor: 'pointer', fontSize: 18, fontWeight: 700, display: 'grid', placeItems: 'center' }}>×</button>
                        </div>
                        <div style={{ padding: isMobile ? '14px' : 20 }}>
                            <div style={{ background: '#fff1f2', padding: '14px', borderRadius: 14, marginBottom: 16, border: '1px solid #fecdd3', maxHeight: 200, overflowY: 'auto' }}>
                                <div style={{ fontSize: 11, color: '#be123c', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Lý do trả đơn</div>
                                <p style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#9f1239', lineHeight: 1.7, fontSize: 14 }}>{errorOrder.note || 'Không có ghi chú lỗi.'}</p>
                            </div>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                <button onClick={() => { setIsErrorModalOpen(false); setErrorOrder(null); }} style={{ padding: '10px 16px', borderRadius: 12, borderWidth: '1px', borderStyle: 'solid', borderColor: '#cbd5e1', background: '#fff', color: '#334155', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Đóng</button>
                                {errorOrder.status === 'returned' && errorOrder.note?.includes('[KHÁCH BOM HÀNG') && (
                                    <button onClick={() => handleCancel(errorOrder)} style={{ padding: '10px 16px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #16a34a, #22c55e)', color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer', boxShadow: '0 12px 24px rgba(22,163,74,0.18)' }}>Hoàn Kho & Hủy Đơn</button>
                                )}
                                {!(errorOrder.status === 'returned' && errorOrder.note?.includes('[KHÁCH BOM HÀNG')) && (
                                    <>
                                        <button onClick={() => handleDelete(errorOrder)} style={{ padding: '10px 16px', borderRadius: 12, borderWidth: '1px', borderStyle: 'solid', borderColor: '#fecaca', background: '#fff1f2', color: '#dc2626', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Xóa vĩnh viễn</button>
                                        <button onClick={() => { setIsErrorModalOpen(false); setErrorOrder(null); openEdit(errorOrder); }} style={{ padding: '10px 16px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #ea580c, #f97316)', color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Sửa & Gửi lại</button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ── Cancel Modal ── */}
            {cancelOrder && createPortal(
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: pad }}
                    onClick={() => setCancelOrder(null)}
                >
                    <div style={{ width: '100%', maxWidth: 640, background: '#fff', borderRadius: cardR, boxShadow: '0 30px 90px rgba(15,23,42,0.3)', border: '1px solid rgba(244,63,94,0.16)', overflow: 'hidden' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ padding: isMobile ? '14px' : 20, background: 'linear-gradient(180deg, #fff1f2, #fff)', borderBottom: '1px solid #fecdd3', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                            <div>
                                <div style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 10px', borderRadius: 999, background: '#fee2e2', color: '#b91c1c', fontWeight: 800, fontSize: 11, marginBottom: 8 }}>ĐƠN ĐÃ HỦY</div>
                                <h3 style={{ margin: 0, fontSize: isMobile ? 16 : 22, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>Lý do hủy đơn {cancelOrder.order_no}</h3>
                            </div>
                            <button onClick={() => setCancelOrder(null)} style={{ width: 36, height: 36, borderRadius: 10, borderWidth: '1px', borderStyle: 'solid', borderColor: '#cbd5e1', background: '#fff', cursor: 'pointer', fontSize: 18, fontWeight: 700, display: 'grid', placeItems: 'center' }}>×</button>
                        </div>
                        <div style={{ padding: isMobile ? '14px' : 20 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: 12, marginBottom: 14 }}>
                                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14 }}>
                                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Khách hàng</div>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{cancelOrder.customer_name || '—'}</div>
                                </div>
                                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14 }}>
                                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Ngày hủy</div>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                                        {cancelOrder.updated_at ? new Date(cancelOrder.updated_at).toLocaleDateString('vi-VN') :
                                         cancelOrder.created_at ? new Date(cancelOrder.created_at).toLocaleDateString('vi-VN') : '—'}
                                    </div>
                                </div>
                                <div style={{ gridColumn: '1 / -1', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 14, padding: 14 }}>
                                    <div style={{ fontSize: 11, color: '#be123c', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Lý do hủy</div>
                                    <div style={{ color: '#9f1239', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontSize: 14 }}>{cancelOrder.note || 'Không có ghi chú hủy.'}</div>
                                </div>
                            </div>
                            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14, marginBottom: 14 }}>
                                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Sản phẩm</div>
                                <div style={{ color: '#0f172a', lineHeight: 1.8 }}>{formatOrderItems(cancelOrder)}</div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button onClick={() => setCancelOrder(null)} style={{ padding: '11px 18px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #be123c, #f43f5e)', color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', boxShadow: '0 14px 28px rgba(244,63,94,0.18)' }}>Đóng</button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ── Customer Rejection Modal ── */}
            {isRejectModalOpen && rejectOrder && createPortal(
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: pad }}
                    onClick={() => { setIsRejectModalOpen(false); setRejectOrder(null); }}
                >
                    <div style={{ width: '100%', maxWidth: 540, background: '#fff', borderRadius: cardR, boxShadow: '0 30px 80px rgba(15,23,42,0.3)', border: '1px solid rgba(249,115,22,0.2)', overflow: 'hidden' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ padding: isMobile ? '14px' : 20, background: 'linear-gradient(180deg, #fff7ed, #fff)', borderBottom: '1px solid #fed7aa', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                            <div>
                                <div style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 10px', borderRadius: 999, background: '#ffedd5', color: '#c2410c', fontWeight: 800, fontSize: 11, marginBottom: 8 }}>KHÁCH TỪ CHỐI NHẬN</div>
                                <h3 style={{ margin: 0, fontSize: isMobile ? 16 : 20, fontWeight: 900, color: '#0f172a' }}>Xử lý đơn {rejectOrder.order_no}</h3>
                            </div>
                            <button onClick={() => { setIsRejectModalOpen(false); setRejectOrder(null); }} style={{ width: 36, height: 36, borderRadius: 10, borderWidth: '1px', borderStyle: 'solid', borderColor: '#cbd5e1', background: '#fff', cursor: 'pointer', fontSize: 18, fontWeight: 700, display: 'grid', placeItems: 'center' }}>×</button>
                        </div>
                        <div style={{ padding: isMobile ? '14px' : 20 }}>
                            {rejectOrder.note && (
                                <div style={{ background: '#fff7ed', padding: '14px', borderRadius: 14, marginBottom: 16, border: '1px solid #fed7aa', maxHeight: 160, overflowY: 'auto' }}>
                                    <div style={{ fontSize: 11, color: '#c2410c', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Lý do khách từ chối</div>
                                    <p style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#9a3412', lineHeight: 1.7, fontSize: 14 }}>{rejectOrder.note}</p>
                                </div>
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                                <button onClick={() => setRejectAction('return_to_warehouse')} style={{
                                    padding: '16px 14px', borderRadius: 14, border: `2px solid ${rejectAction === 'return_to_warehouse' ? '#16a34a' : '#e2e8f0'}`,
                                    background: rejectAction === 'return_to_warehouse' ? '#f0fdf4' : '#fff', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                                }}>
                                    <i className="ri-arrow-go-back-line" style={{ fontSize: 24, color: rejectAction === 'return_to_warehouse' ? '#15803d' : '#94a3b8', display: 'block', margin: '0 auto 8px' }} />
                                    <div style={{ fontWeight: 900, color: rejectAction === 'return_to_warehouse' ? '#15803d' : '#64748b', fontSize: 13 }}>Hoàn đơn lại vào kho</div>
                                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Cộng tồn kho đã xuất, hủy đơn</div>
                                </button>
                                <button onClick={() => setRejectAction('return_pending')} style={{
                                    padding: '16px 14px', borderRadius: 14, border: `2px solid ${rejectAction === 'return_pending' ? '#ea580c' : '#e2e8f0'}`,
                                    background: rejectAction === 'return_pending' ? '#fff7ed' : '#fff', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                                }}>
                                    <i className="ri-truck-line" style={{ fontSize: 24, color: rejectAction === 'return_pending' ? '#c2410c' : '#94a3b8', display: 'block', margin: '0 auto 8px' }} />
                                    <div style={{ fontWeight: 900, color: rejectAction === 'return_pending' ? '#c2410c' : '#64748b', fontSize: 13 }}>Chuyển xử lý hoàn</div>
                                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Đòi bồi thường vận chuyển</div>
                                </button>
                            </div>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontWeight: 800, fontSize: 13, color: '#374151', marginBottom: 8 }}>Ghi chú (tùy chọn)</label>
                                <textarea rows="3" value={rejectNote} onChange={(e) => setRejectNote(e.target.value)}
                                    placeholder="Nhập ghi chú thêm..."
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, resize: 'vertical', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                <button onClick={() => { setIsRejectModalOpen(false); setRejectOrder(null); }} style={{ padding: '10px 16px', borderRadius: 12, borderWidth: '1px', borderStyle: 'solid', borderColor: '#e2e8f0', background: '#fff', color: '#374151', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Đóng</button>
                                <button onClick={handleReject} style={{ padding: '10px 18px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #ea580c, #f97316)', color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer', boxShadow: '0 12px 24px rgba(234,88,12,0.18)' }}>
                                    {rejectAction === 'return_to_warehouse' ? 'Hoàn đơn lại vào kho' : 'Chuyển xử lý hoàn'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
