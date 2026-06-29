import { useEffect, useMemo, useRef, useState } from 'react';
import api from '../services/api';
import { formatOrderItems, normalizeOrderItems } from '../utils/orderItems';

const statusConfig = {
    pending: {
        label: 'Đang chờ duyệt',
        tone: 'warning',
    },
    returned: {
        label: 'Bị từ chối',
        tone: 'danger',
    },
    warehouse_processing: {
        label: 'Kho đang xuất',
        tone: 'info',
    },
    shipping: {
        label: 'Đang giao',
        tone: 'purple',
    },
    completed: {
        label: 'Đã hoàn tất',
        tone: 'success',
    },
    logistics_review: {
        label: 'Kho báo lỗi',
        tone: 'purple',
    },
    canceled: {
        label: 'Hủy đơn',
        tone: 'danger',
    },
};

const toneStyles = {
    warning: { background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' },
    danger: { background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' },
    info: { background: '#dbeafe', color: '#1d4ed8', border: '1px solid #93c5fd' },
    success: { background: '#dcfce7', color: '#166534', border: '1px solid #86efac' },
    purple: { background: '#ede9fe', color: '#6b21a8', border: '1px solid #c4b5fd' },
};

const statIcons = {
    total: (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: '22px', height: '22px' }}>
            <path d="M4 7.5C4 6.12 5.12 5 6.5 5h11C18.88 5 20 6.12 20 7.5v9c0 1.38-1.12 2.5-2.5 2.5h-11C5.12 19 4 17.88 4 16.5v-9Z" stroke="currentColor" strokeWidth="1.8" />
            <path d="M8 9h8M8 12h8M8 15h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    ),
    pending: (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: '22px', height: '22px' }}>
            <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
        </svg>
    ),
    completed: (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: '22px', height: '22px' }}>
            <path d="M20 7 10 17l-5-5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    ),
    issues: (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: '22px', height: '22px' }}>
            <path d="M12 9v4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
            <path d="M12 17h.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <path d="m10.29 4.86-7.43 12.8A2 2 0 0 0 4.58 21h14.84a2 2 0 0 0 1.72-3.34l-7.43-12.8a2 2 0 0 0-3.44 0Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
    ),
};

const pageStyles = {
    page: {
        minHeight: '100vh',
        padding: '28px',
        background: 'radial-gradient(circle at top left, #eff6ff 0%, #f8fafc 35%, #f3f4f6 100%)',
        color: '#0f172a',
    },
    shell: {
        maxWidth: '1400px',
        margin: '0 auto',
    },
    hero: {
        display: 'grid',
        gridTemplateColumns: '1.3fr 0.7fr',
        gap: '20px',
        alignItems: 'stretch',
        marginBottom: '22px',
    },
    heroCard: {
        background: 'linear-gradient(135deg, rgba(15,23,42,0.98), rgba(30,41,59,0.95))',
        borderRadius: '24px',
        padding: '28px',
        color: 'white',
        boxShadow: '0 24px 60px rgba(15,23,42,0.16)',
    },
    heroTitle: {
        margin: 0,
        fontSize: '30px',
        lineHeight: 1.2,
        letterSpacing: '-0.03em',
    },
    heroSubtitle: {
        margin: '12px 0 0',
        maxWidth: '760px',
        color: 'rgba(255,255,255,0.78)',
        lineHeight: 1.7,
    },
    heroStats: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: '14px',
        width: '100%',
    },
    statCard: {
        background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(241,245,249,0.94))',
        borderRadius: '22px',
        padding: '18px 18px 16px',
        boxShadow: '0 12px 24px rgba(15,23,42,0.08)',
        border: '1px solid rgba(148,163,184,0.18)',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '104px',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
    },
    statBlue: { '--hover-shadow': '0 20px 44px rgba(37,99,235,0.20)', '--hover-border': '#93c5fd', borderTop: '4px solid #2563eb' },
    statAmber: { '--hover-shadow': '0 20px 44px rgba(245,158,11,0.20)', '--hover-border': '#fbbf24', borderTop: '4px solid #f59e0b' },
    statGreen: { '--hover-shadow': '0 20px 44px rgba(22,163,74,0.20)', '--hover-border': '#86efac', borderTop: '4px solid #16a34a' },
    statRose: { '--hover-shadow': '0 20px 44px rgba(220,38,38,0.20)', '--hover-border': '#fca5a5', borderTop: '4px solid #dc2626' },
    statBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        borderRadius: '14px',
        marginBottom: '12px',
        fontSize: '20px',
        boxShadow: '0 8px 18px rgba(15,23,42,0.08)',
    },
    statLabel: { margin: 0, color: '#64748b', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' },
    statValue: { margin: '10px 0 0', fontSize: '30px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em' },
    section: {
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(148,163,184,0.18)',
        borderRadius: '24px',
        boxShadow: '0 20px 50px rgba(15,23,42,0.08)',
        overflow: 'hidden',
        marginBottom: '22px',
    },
    sectionHeader: {
        padding: '22px 24px 0',
    },
    sectionTitle: { margin: 0, fontSize: '20px', color: '#0f172a' },
    sectionDesc: { margin: '8px 0 0', color: '#64748b', lineHeight: 1.6 },
    formGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: '14px',
    },
    input: {
        width: '100%',
        padding: '13px 14px',
        borderRadius: '14px',
        border: '1px solid #cbd5e1',
        background: '#fff',
        outline: 'none',
        boxSizing: 'border-box',
    },
    textarea: {
        width: '100%',
        padding: '13px 14px',
        borderRadius: '14px',
        border: '1px solid #cbd5e1',
        background: '#fff',
        outline: 'none',
        boxSizing: 'border-box',
        minHeight: '110px',
        resize: 'vertical',
        fontFamily: 'inherit',
    },
    table: {
        width: '100%',
        borderCollapse: 'separate',
        borderSpacing: 0,
    },
};

const formatCurrency = new Intl.NumberFormat('vi-VN').format;

const calculateOrderTotal = (order) => {
    const items = Array.isArray(order?.items) ? order.items : normalizeOrderItems(order);

    return items.reduce((sum, item) => {
        const unitPrice = Number(
            item.unit_price ??
            item.sale_price ??
            item.price ??
            item.product?.sale_price ??
            item.product?.price ??
            item.product?.unit_price ??
            item.product_price ??
            item.product?.product_price ??
            0
        );
        const quantity = Number(item.quantity ?? item.qty ?? item.product_quantity ?? 0);
        return sum + unitPrice * quantity;
    }, 0);
};

const enrichOrderItemsWithProducts = (items, products) => {
    return items.map((item) => {
        const matchedProduct = products.find((product) =>
            Number(product.id) === Number(item.product_id) ||
            String(product.sku || '') === String(item.product_sku || item.sku || '')
        );

        return {
            ...item,
            product_name:
                item.product_name ??
                item.name ??
                item.product?.name ??
                matchedProduct?.name ??
                matchedProduct?.product_name ??
                matchedProduct?.title ??
                'Sản phẩm không tên',
            product_sku:
                item.product_sku ??
                item.sku ??
                item.product?.sku ??
                matchedProduct?.sku ??
                matchedProduct?.product_sku ??
                '',
            unit_price: Number(
                item.unit_price ??
                item.sale_price ??
                item.price ??
                item.product?.sale_price ??
                item.product?.price ??
                item.product?.unit_price ??
                matchedProduct?.sale_price ??
                matchedProduct?.price ??
                0
            ),
        };
    });
};

export default function SalesOrdersPage() {
    const [hoveredStat, setHoveredStat] = useState(null);
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
    const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
    const [hoveredOrderId, setHoveredOrderId] = useState(null);
    const orderNoInputRef = useRef(null);

    const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);
    const [errorOrder, setErrorOrder] = useState(null);
    const [isOrderViewOpen, setIsOrderViewOpen] = useState(false);
    const [viewOrder, setViewOrder] = useState(null);
    const [cancelReasonOrder, setCancelReasonOrder] = useState(null);

    const fetchData = async () => {
        try {
            const [custRes, prodRes, ordRes] = await Promise.all([
                api.get('/customers'),
                api.get('/products'),
                api.get('/orders'),
            ]);
            setCustomers(custRes.data);
            setProducts(prodRes.data);
            setOrders(ordRes.data);
        } catch {
            alert('Lỗi tải dữ liệu hệ thống');
        }
    };

    useEffect(() => {
        let isActive = true;

        const loadData = async () => {
            if (!isActive) return;
            await fetchData();
        };

        loadData();

        return () => {
            isActive = false;
        };
    }, []);

    const filteredOrders = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();

        return orders.filter((order) => {
            const currentStatus = statusConfig[order.status] ? order.status : 'pending';
            const searchableText = [
                order.order_no,
                order.customer_name,
                order.expected_delivery_date,
                order.note,
                order.delivery_address,
                order.shipping_address,
                order.customer_address,
                ...(order.items || []).flatMap((item) => [item.product_name, item.product_sku]),
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            const matchesSearch = !keyword || searchableText.includes(keyword);
            const matchesStatus = statusFilter === 'all' || currentStatus === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [orders, searchTerm, statusFilter]);

    const stats = useMemo(() => {
        const total = orders.length;
        const pending = orders.filter((o) => (statusConfig[o.status] ? o.status : 'pending') === 'pending').length;
        const completed = orders.filter((o) => o.status === 'completed').length;
        const issues = orders.filter((o) => ['returned', 'logistics_review'].includes(o.status)).length;
        return { total, pending, completed, issues };
    }, [orders]);

    const addItem = () => setSelectedItems([...selectedItems, { product_id: '', quantity: 1, unit_price: 0 }]);

    const updateItem = (index, field, value) => {
        const newItems = [...selectedItems];
        if (field === 'quantity') {
            newItems[index][field] = Math.max(1, Number(value) || 1);
        } else {
            newItems[index][field] = value;
        }
        if (field === 'product_id') {
            const prod = products.find((p) => p.id === parseInt(value, 10));
            if (prod) {
                newItems[index].unit_price = Number(prod.sale_price || 0);
            }
        }
        setSelectedItems(newItems);
    };

    const removeItem = (index) => setSelectedItems(selectedItems.filter((_, i) => i !== index));

    const handleViewClick = async (order) => {
        try {
            const res = await api.get(`/orders/${order.id}/items`);
            const enrichedItems = enrichOrderItemsWithProducts(Array.isArray(res.data) ? res.data : [], products);
            setViewOrder({
                ...order,
                items: enrichedItems,
            });
            setIsOrderViewOpen(true);
        } catch (error) {
            setViewOrder(order);
            setIsOrderViewOpen(true);
        }
    };

    const closeViewModal = () => {
        setIsOrderViewOpen(false);
        setViewOrder(null);
    };

    const handleEditClick = async (order) => {
        const currentStatus = order?.status || 'pending';
        if (['warehouse_processing', 'shipping', 'completed', 'canceled'].includes(currentStatus)) {
            alert('Đơn hàng đang trong trạng thái này nên không thể chỉnh sửa.');
            return;
        }

        try {
            const res = await api.get(`/orders/${order.id}/items`);
            setOrderNo(order.order_no);
            setCustomerId(order.customer_id);
            setExpectedDate(order.expected_delivery_date);
            setNote(order.note || '');
            setSelectedItems(res.data);
            setEditingId(order.id);
            setIsCreateOrderOpen(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setIsReasonModalOpen(false);
        } catch {
            alert('Lỗi tải chi tiết đơn');
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setOrderNo('');
        setCustomerId('');
        setExpectedDate('');
        setNote('');
        setSelectedItems([]);
        setIsCreateOrderOpen(false);
        setIsReasonModalOpen(false);
    };

    useEffect(() => {
        if (isCreateOrderOpen) {
            const timer = window.setTimeout(() => orderNoInputRef.current?.focus(), 80);
            return () => window.clearTimeout(timer);
        }
        return undefined;
    }, [isCreateOrderOpen, editingId]);

    useEffect(() => {
        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                if (isCreateOrderOpen || isReasonModalOpen || isOrderViewOpen || cancelReasonOrder) {
                    cancelEdit();
                    closeViewModal();
                    closeCancelReason();
                }
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isCreateOrderOpen, isReasonModalOpen, isOrderViewOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedItems.length === 0) return alert('Vui lòng chọn ít nhất 1 sản phẩm');
        try {
            const orderData = {
                customer_id: customerId,
                order_date: new Date().toISOString(),
                expected_delivery_date: expectedDate,
                note,
                items: selectedItems,
            };

            if (editingId) {
                await api.put(`/orders/${editingId}`, orderData);
                alert('Cập nhật thành công!');
            } else {
                await api.post('/orders', { ...orderData, order_no: orderNo });
                alert('Tạo đơn hàng thành công!');
            }
            cancelEdit();
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Lỗi không xác định khi xử lý đơn');
        }
    };

    const handleDelete = async (order) => {
        const currentStatus = order?.status || 'pending';
        if (['warehouse_processing', 'shipping', 'completed', 'canceled'].includes(currentStatus)) {
            alert('Đơn hàng đang ở trạng thái này nên không thể xóa.');
            return;
        }

        if (window.confirm('Xác nhận xóa vĩnh viễn đơn hàng này?')) {
            try {
                await api.delete(`/orders/${order.id}`);
                setIsReasonModalOpen(false);
                fetchData();
            } catch (error) {
                alert(error.response?.data?.message || 'Lỗi xóa đơn');
            }
        }
    };
    const handleCancelOrder = async (order) => {
        const isBomHang = order.note?.includes('[KHÁCH BOM HÀNG');
        const confirmMsg = isBomHang 
            ? 'Xác nhận: Khách bom hàng. Hệ thống sẽ tự động CỘNG TRẢ số lượng vào kho và HỦY đơn này?' 
            : 'Xác nhận: Bạn muốn HỦY đơn hàng này? (Đơn chưa xuất kho nên sẽ không ảnh hưởng kho)';

        if (window.confirm(confirmMsg)) {
            try {
                // API này backend đã tự biết lúc nào cần hoàn kho, lúc nào không
                await api.put(`/orders/${order.id}/return-inventory`);
                alert(isBomHang ? 'Đã hoàn kho và hủy đơn thành công!' : 'Đã hủy đơn thành công!');
                setIsReasonModalOpen(false);
                setErrorOrder((current) => (current?.id === order.id ? null : current));
                fetchData();
            } catch (error) {
                alert(error.response?.data?.message || 'Lỗi khi xử lý hủy đơn');
            }
        }
    };

    const openCancelReason = async (order) => {
        try {
            const res = await api.get(`/orders/${order.id}/items`);
            setCancelReasonOrder({
                ...order,
                items: enrichOrderItemsWithProducts(Array.isArray(res.data) ? res.data : [], products),
            });
        } catch {
            setCancelReasonOrder(order);
        }
    };

    const closeCancelReason = () => {
        setCancelReasonOrder(null);
    };

    return (
        <div style={pageStyles.page}>
            <style>{`
                @keyframes modalFadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                @keyframes modalScaleIn {
                    from {
                        opacity: 0;
                        transform: scale(0.96) translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }

                .modal-overlay-fade {
                    animation: modalFadeIn 180ms ease-out;
                }

                .modal-panel-fade {
                    animation: modalScaleIn 220ms ease-out;
                }
            `}</style>
            <div style={pageStyles.shell}>
                <div style={{ marginBottom: '22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <h2 style={{ margin: 0, fontSize: 28, color: '#0f172a', letterSpacing: '-0.03em' }}>Quản lý đơn hàng</h2>
                        <p style={{ margin: 0, color: '#64748b' }}>Theo dõi, chỉnh sửa và xử lý đơn hàng trong một giao diện gọn gàng.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsCreateOrderOpen(true)}
                        style={{ padding: '12px 18px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #2563eb, #60a5fa)', color: 'white', fontWeight: 800, cursor: 'pointer', boxShadow: '0 14px 28px rgba(37,99,235,0.22)', fontFamily: 'inherit', transition: 'transform 160ms ease, box-shadow 160ms ease, filter 160ms ease' }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 18px 34px rgba(37,99,235,0.28)';
                            e.currentTarget.style.filter = 'brightness(1.03)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 14px 28px rgba(37,99,235,0.22)';
                            e.currentTarget.style.filter = 'brightness(1)';
                        }}
                    >
                        + Tạo đơn hàng
                    </button>
                </div>

                <div style={{ ...pageStyles.heroStats, marginBottom: '40px' }}>
                    <div
                        style={{
                            ...pageStyles.statCard,
                            transform: hoveredStat === 'total' ? 'translateY(-4px)' : 'translateY(0)',
                            boxShadow: hoveredStat === 'total' ? '0 18px 34px rgba(37,99,235,0.14)' : pageStyles.statCard.boxShadow,
                            borderColor: hoveredStat === 'total' ? 'rgba(37,99,235,0.22)' : pageStyles.statCard.border,
                        }}
                        onMouseEnter={() => setHoveredStat('total')}
                        onMouseLeave={() => setHoveredStat(null)}
                    >
                        <div style={{ ...pageStyles.statBadge, background: '#eff6ff', color: '#2563eb' }}>
                            {statIcons.total}
                        </div>
                        <p style={pageStyles.statLabel}>Tổng đơn</p>
                        <p style={pageStyles.statValue}>{stats.total}</p>
                    </div>
                    <div
                        style={{
                            ...pageStyles.statCard,
                            transform: hoveredStat === 'pending' ? 'translateY(-4px)' : 'translateY(0)',
                            boxShadow: hoveredStat === 'pending' ? '0 18px 34px rgba(245,158,11,0.14)' : pageStyles.statCard.boxShadow,
                            borderColor: hoveredStat === 'pending' ? 'rgba(245,158,11,0.22)' : pageStyles.statCard.border,
                        }}
                        onMouseEnter={() => setHoveredStat('pending')}
                        onMouseLeave={() => setHoveredStat(null)}
                    >
                        <div style={{ ...pageStyles.statBadge, background: '#fffbeb', color: '#d97706' }}>
                            {statIcons.pending}
                        </div>
                        <p style={pageStyles.statLabel}>Chờ duyệt</p>
                        <p style={pageStyles.statValue}>{stats.pending}</p>
                    </div>
                    <div
                        style={{
                            ...pageStyles.statCard,
                            transform: hoveredStat === 'completed' ? 'translateY(-4px)' : 'translateY(0)',
                            boxShadow: hoveredStat === 'completed' ? '0 18px 34px rgba(22,163,74,0.14)' : pageStyles.statCard.boxShadow,
                            borderColor: hoveredStat === 'completed' ? 'rgba(22,163,74,0.22)' : pageStyles.statCard.border,
                        }}
                        onMouseEnter={() => setHoveredStat('completed')}
                        onMouseLeave={() => setHoveredStat(null)}
                    >
                        <div style={{ ...pageStyles.statBadge, background: '#ecfdf5', color: '#16a34a' }}>
                            {statIcons.completed}
                        </div>
                        <p style={pageStyles.statLabel}>Đã hoàn tất</p>
                        <p style={pageStyles.statValue}>{stats.completed}</p>
                    </div>
                    <div
                        style={{
                            ...pageStyles.statCard,
                            transform: hoveredStat === 'issues' ? 'translateY(-4px)' : 'translateY(0)',
                            boxShadow: hoveredStat === 'issues' ? '0 18px 34px rgba(220,38,38,0.14)' : pageStyles.statCard.boxShadow,
                            borderColor: hoveredStat === 'issues' ? 'rgba(220,38,38,0.22)' : pageStyles.statCard.border,
                        }}
                        onMouseEnter={() => setHoveredStat('issues')}
                        onMouseLeave={() => setHoveredStat(null)}
                    >
                        <div style={{ ...pageStyles.statBadge, background: '#fef2f2', color: '#dc2626' }}>
                            {statIcons.issues}
                        </div>
                        <p style={pageStyles.statLabel}>Đơn lỗi</p>
                        <p style={pageStyles.statValue}>{stats.issues}</p>
                    </div>
                </div>
            </div>

            {isCreateOrderOpen && (
                <div className="modal-overlay-fade" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.62)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: 20 }}>
                    <div className="modal-panel-fade" style={{ background: 'white', width: 'min(1100px, 100%)', maxHeight: '92vh', overflowY: 'auto', borderRadius: 24, border: '1px solid #e5eef8', boxShadow: '0 30px 80px rgba(15, 23, 42, 0.22)', transformOrigin: 'center' }}>
                        <div style={{ padding: '22px 24px', borderBottom: '1px solid #eef2f7', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                            <div>
                                <div style={{ fontSize: 13, color: '#2563eb', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tạo đơn hàng</div>
                                <h3 style={{ margin: '6px 0 0', fontSize: 22, color: '#0f172a' }}>{editingId ? `Chỉnh sửa đơn ${orderNo}` : 'Tạo đơn hàng mới'}</h3>
                            </div>
                            <button type="button" onClick={cancelEdit} style={{ width: 40, height: 40, borderRadius: 12, border: '1px solid #dbe3ee', background: '#fff', cursor: 'pointer', fontSize: 18 }}>×</button>
                        </div>

                        <div style={{ padding: '24px' }}>
                            <form onSubmit={handleSubmit}>
                                <div style={pageStyles.formGrid}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 700, color: '#334155' }}>Mã đơn hàng</label>
                                        <input ref={orderNoInputRef} required placeholder="VD: SO-2026-001" value={orderNo} onChange={(e) => setOrderNo(e.target.value)} disabled={!!editingId} style={pageStyles.input} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 700, color: '#334155' }}>Khách hàng</label>
                                        <select required value={customerId} onChange={(e) => setCustomerId(e.target.value)} style={pageStyles.input}>
                                            <option value="">-- Chọn khách hàng --</option>
                                            {customers.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.company_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 700, color: '#334155' }}>Ngày giao dự kiến</label>
                                        <input required type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} style={pageStyles.input} />
                                    </div>
                                </div>

                                <div style={{ marginTop: 16 }}>
                                    <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 700, color: '#334155' }}>Ghi chú</label>
                                    <textarea placeholder="Địa chỉ giao hàng" value={note} onChange={(e) => setNote(e.target.value)} style={pageStyles.textarea} />
                                </div>

                                <div style={{ marginTop: 22, borderRadius: 18, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 18px', background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)', borderBottom: '1px solid #e2e8f0' }}>
                                        <div>
                                            <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Danh sách sản phẩm</div>
                                            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Chọn sản phẩm, số lượng và xem thành tiền ngay bên dưới.</div>
                                        </div>
                                        <button type="button" onClick={addItem} style={{ padding: '11px 16px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #0f766e, #2563eb)', color: 'white', fontWeight: 700, cursor: 'pointer', boxShadow: '0 14px 30px rgba(37,99,235,0.22)', fontFamily: 'inherit', transition: 'transform 160ms ease, box-shadow 160ms ease, filter 160ms ease' }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-1px)';
                                                e.currentTarget.style.boxShadow = '0 18px 34px rgba(37,99,235,0.28)';
                                                e.currentTarget.style.filter = 'brightness(1.03)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = '0 14px 30px rgba(37,99,235,0.22)';
                                                e.currentTarget.style.filter = 'brightness(1)';
                                            }}>
                                            + Thêm sản phẩm
                                        </button>
                                    </div>

                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={pageStyles.table}>
                                            <thead>
                                                <tr style={{ background: '#fff' }}>
                                                    <th style={{ textAlign: 'left', padding: '14px 18px', color: '#475569', fontSize: 13 }}>Sản phẩm</th>
                                                    <th style={{ textAlign: 'left', padding: '14px 18px', color: '#475569', fontSize: 13, width: '140px' }}>Số lượng</th>
                                                    <th style={{ textAlign: 'left', padding: '14px 18px', color: '#475569', fontSize: 13, width: '170px' }}>Đơn giá</th>
                                                    <th style={{ textAlign: 'left', padding: '14px 18px', color: '#475569', fontSize: 13, width: '170px' }}>Thành tiền</th>
                                                    <th style={{ width: '90px' }}></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedItems.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="5" style={{ padding: '24px 18px', textAlign: 'center', color: '#64748b' }}>
                                                            Chưa có sản phẩm nào. Hãy thêm sản phẩm để bắt đầu.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    selectedItems.map((item, index) => {
                                                        const normalizedItem = normalizeOrderItems({ items: [item] })[0] || item;
                                                        const quantity = Math.max(1, Number(item.quantity) || 1);
                                                        const unitPrice = Number(item.unit_price || 0);
                                                        const lineTotal = quantity * unitPrice;
                                                        return (
                                                            <tr key={item.id || index} style={{ borderTop: '1px solid #e2e8f0' }}>
                                                                <td style={{ padding: '16px 18px' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                                        <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #dbeafe, #eff6ff)', display: 'grid', placeItems: 'center', color: '#1d4ed8', flexShrink: 0 }}>
                                                                            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: 20, height: 20 }}>
                                                                                <path d="M4 7.5 12 4l8 3.5-8 3.5-8-3.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                                                                                <path d="M4 7.5V16.5L12 20l8-3.5V7.5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                                                                            </svg>
                                                                        </div>
                                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                                            <select required value={item.product_id} onChange={(e) => updateItem(index, 'product_id', e.target.value)} style={{ ...pageStyles.input, background: '#fff' }}>
                                                                                <option value="">-- Chọn sản phẩm --</option>
                                                                                {products.map((p) => (
                                                                                    <option key={p.id} value={p.id}>
                                                                                        {p.name}{p.sku ? ` (${p.sku})` : ''}
                                                                                    </option>
                                                                                ))}
                                                                            </select>
                                                                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
                                                                                {normalizedItem.product_name}{normalizedItem.product_sku ? ` (${normalizedItem.product_sku})` : ''}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td style={{ padding: '16px 18px' }}>
                                                                    <div style={{ position: 'relative' }}>
                                                                        <input type="number" min="1" value={quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} style={{ ...pageStyles.input, paddingRight: 46, fontWeight: 700 }} />
                                                                        <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#64748b', fontWeight: 700 }}>SL</span>
                                                                    </div>
                                                                </td>
                                                                <td style={{ padding: '16px 18px', fontWeight: 700, color: '#0f172a' }}>
                                                                    {formatCurrency(unitPrice)} đ
                                                                </td>
                                                                <td style={{ padding: '16px 18px' }}>
                                                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 14, background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', color: '#166534', fontWeight: 800, border: '1px solid #86efac' }}>
                                                                        {formatCurrency(lineTotal)} đ
                                                                    </div>
                                                                </td>
                                                                <td style={{ padding: '16px 18px', textAlign: 'center' }}>
                                                                    <button type="button" onClick={() => removeItem(index)} style={{ width: 40, height: 40, borderRadius: 12, border: '1px solid #fecaca', background: '#fff1f2', color: '#e11d48', cursor: 'pointer', fontWeight: 800 }}>
                                                                        ×
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
                                    <button type="submit" style={{ padding: '13px 20px', borderRadius: 14, border: 'none', background: editingId ? 'linear-gradient(135deg, #ea580c, #f97316)' : 'linear-gradient(135deg, #0f766e, #22c55e)', color: 'white', fontWeight: 800, cursor: 'pointer', boxShadow: '0 14px 30px rgba(15,118,110,0.18)', fontFamily: 'inherit', transition: 'transform 160ms ease, box-shadow 160ms ease, filter 160ms ease' }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                            e.currentTarget.style.boxShadow = '0 18px 34px rgba(15,118,110,0.24)';
                                            e.currentTarget.style.filter = 'brightness(1.03)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 14px 30px rgba(15,118,110,0.18)';
                                            e.currentTarget.style.filter = 'brightness(1)';
                                        }}>
                                        {editingId ? 'Lưu & Gửi lại' : 'Gửi đơn cho Logistics'}
                                    </button>
                                    {editingId && (
                                        <button type="button" onClick={cancelEdit} style={{ padding: '13px 20px', borderRadius: 14, border: '1px solid #cbd5e1', background: '#fff', color: '#334155', fontWeight: 700, cursor: 'pointer' }}>
                                            Hủy chỉnh sửa
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <div className="status-table-animate" style={pageStyles.section}>
                <div style={pageStyles.sectionHeader}>
                    <h3 style={pageStyles.sectionTitle}>Danh sách trạng thái đơn hàng</h3>
                    <p style={pageStyles.sectionDesc}>Theo dõi tiến độ và xử lý nhanh các đơn đang chờ hoặc bị trả về.</p>
                </div>

                <div style={{ padding: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) repeat(2, minmax(180px, 1fr)) auto', gap: 12, marginBottom: 16 }}>
                        <div style={{ position: 'relative' }}>
                            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#94a3b8' }}>
                                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
                                <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                            <input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Tìm mã đơn, khách hàng, sản phẩm..."
                                style={{ ...pageStyles.input, paddingLeft: 42, background: '#fff' }}
                            />
                        </div>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...pageStyles.input, background: '#fff' }}>
                            <option value="all">Tất cả trạng thái</option>
                            <option value="pending">Đang chờ duyệt</option>
                            <option value="returned">Bị từ chối</option>
                            <option value="warehouse_processing">Kho đang xuất</option>
                            <option value="completed">Đã hoàn tất</option>
                            <option value="logistics_review">Kho báo lỗi</option>
                            <option value="canceled">Hủy đơn</option>
                        </select>
                        <div style={{ display: 'flex', alignItems: 'center', padding: '0 14px', borderRadius: 14, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontWeight: 700 }}>
                            {filteredOrders.length} / {orders.length} đơn
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setSearchTerm('');
                                setStatusFilter('all');
                            }}
                            style={{ padding: '12px 16px', borderRadius: 14, border: '1px solid #dbe3ee', background: '#fff', color: '#334155', fontWeight: 800, cursor: 'pointer' }}
                        >
                            Xóa lọc
                        </button>
                    </div>

                    <div style={{ overflowX: 'auto', borderRadius: 18, border: '1px solid #e2e8f0' }}>
                        <table style={pageStyles.table}>
                            <thead>
                                <tr style={{ background: '#f8fafc' }}>
                                    <th style={{ textAlign: 'left', padding: '14px 18px', color: '#475569', fontSize: 13 }}>Mã đơn</th>
                                    <th style={{ textAlign: 'left', padding: '14px 18px', color: '#475569', fontSize: 13 }}>Khách hàng</th>
                                    <th style={{ textAlign: 'left', padding: '14px 18px', color: '#475569', fontSize: 13 }}>Sản phẩm đặt</th>
                                    <th style={{ textAlign: 'left', padding: '14px 18px', color: '#475569', fontSize: 13 }}>Ngày giao dự kiến</th>
                                    <th style={{ textAlign: 'left', padding: '14px 18px', color: '#475569', fontSize: 13 }}>Trạng thái</th>
                                    <th style={{ textAlign: 'left', padding: '14px 18px', color: '#475569', fontSize: 13 }}>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map((o) => {
                                    const currentStatus = statusConfig[o.status] ? o.status : 'pending';
                                    const config = statusConfig[currentStatus];
                                    const style = toneStyles[config.tone];
                                    const isHovered = hoveredOrderId === o.id;

                                    return (
                                        <tr
                                            key={o.id}
                                            onMouseEnter={() => setHoveredOrderId(o.id)}
                                            onMouseLeave={() => setHoveredOrderId(null)}
                                            style={{
                                                borderTop: '1px solid #e2e8f0',
                                                background: isHovered ? 'linear-gradient(90deg, rgba(37,99,235,0.05), rgba(255,255,255,0.98))' : '#fff',
                                                transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                                                boxShadow: isHovered ? '0 14px 28px rgba(15,23,42,0.08)' : 'none',
                                                transition: 'transform 180ms ease, box-shadow 180ms ease, background 180ms ease',
                                            }}
                                        >
                                            <td style={{ padding: '16px 18px', fontWeight: 800, color: '#2563eb' }}>{o.order_no}</td>
                                            <td style={{ padding: '16px 18px', color: '#334155' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <i className="ri-user-line" style={{ color: '#94a3b8', fontSize: 18, flexShrink: 0 }} />
                                                    <span>{o.customer_name}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 18px', color: '#475569', fontSize: 13, lineHeight: 1.6, maxWidth: 420 }}>
                                                {formatOrderItems(o)}
                                            </td>
                                            <td style={{ padding: '16px 18px', color: '#334155' }}>{o.expected_delivery_date}</td>
                                            <td style={{ padding: '16px 18px' }}>
                                                <span style={{ ...style, display: 'inline-flex', alignItems: 'center', padding: '8px 12px', borderRadius: 999, fontSize: 12, fontWeight: 800 }}>
                                                    {config.label}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px 18px' }}>
                                                {currentStatus === 'completed' ? (
                                                    <button type="button" onClick={() => handleViewClick(o)} aria-label="Xem chi tiết đơn hàng" title="Xem chi tiết" style={{ width: 40, height: 40, borderRadius: 0, border: 'none', background: 'transparent', color: '#111827', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: 'none' }}>
                                                        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: 20, height: 20 }}>
                                                            <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                                                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                                                        </svg>
                                                    </button>
                                                ) : currentStatus === 'canceled' ? (
                                                    <button type="button" onClick={() => openCancelReason(o)} aria-label="Xem lý do hủy" title="Xem lý do hủy" style={{ width: 40, height: 40, borderRadius: 14, border: '1px solid #fecaca', background: 'linear-gradient(135deg, #fff1f2, #ffe4e6)', color: '#be123c', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 10px 18px rgba(244,63,94,0.12)' }}>
                                                        <i className="ri-eye-line" style={{ fontSize: 18 }} />
                                                    </button>
                                                ) : currentStatus === 'returned' ? (
                                                    <button onClick={() => { setErrorOrder(o); setIsReasonModalOpen(true); }} style={{ padding: '10px 14px', background: 'linear-gradient(135deg, #dc2626, #ef4444)', color: 'white', border: 'none', borderRadius: 14, cursor: 'pointer', fontWeight: 800, boxShadow: '0 12px 24px rgba(239,68,68,0.18)' }}>
                                                        Xem lỗi & xử lý
                                                    </button>
                                                ) : ['warehouse_processing', 'shipping', 'completed', 'canceled'].includes(currentStatus) ? (
                                                    <button type="button" onClick={() => handleViewClick(o)} aria-label="Xem chi tiết đơn hàng" title="Xem chi tiết" style={{ width: 40, height: 40, borderRadius: 14, border: '1px solid #cbd5e1', background: 'linear-gradient(135deg, #ffffff, #f8fafc)', color: '#111827', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 10px 18px rgba(15,23,42,0.08)' }}>
                                                        <i className="ri-eye-line" style={{ fontSize: 18 }} />
                                                    </button>
                                                ) : currentStatus === 'pending' ? (
                                                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                                        <button
                                                            onClick={() => handleEditClick(o)}
                                                            aria-label="Sửa đơn hàng"
                                                            title="Sửa đơn hàng"
                                                            style={{
                                                                width: 40,
                                                                height: 40,
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                borderRadius: 14,
                                                                border: '1px solid #93c5fd',
                                                                background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                                                                color: '#1d4ed8',
                                                                cursor: 'pointer',
                                                                boxShadow: '0 10px 18px rgba(59,130,246,0.12)',
                                                                transition: 'transform 160ms ease, box-shadow 160ms ease, filter 160ms ease',
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.transform = 'translateY(-1px)';
                                                                e.currentTarget.style.boxShadow = '0 14px 24px rgba(59,130,246,0.18)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.transform = 'translateY(0)';
                                                                e.currentTarget.style.boxShadow = '0 10px 18px rgba(59,130,246,0.12)';
                                                            }}
                                                        >
                                                            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: 18, height: 18 }}>
                                                                <path d="M4 20h4l10.5-10.5a1.8 1.8 0 0 0 0-2.55l-1.45-1.45a1.8 1.8 0 0 0-2.55 0L4 16v4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                                                                <path d="M13.5 6.5 17.5 10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(o)}
                                                            aria-label="Xóa đơn hàng"
                                                            title="Xóa đơn hàng"
                                                            style={{
                                                                width: 40,
                                                                height: 40,
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                borderRadius: 14,
                                                                border: '1px solid #fecaca',
                                                                background: 'linear-gradient(135deg, #fff1f2, #ffe4e6)',
                                                                color: '#be123c',
                                                                cursor: 'pointer',
                                                                boxShadow: '0 10px 18px rgba(244,63,94,0.12)',
                                                                transition: 'transform 160ms ease, box-shadow 160ms ease, filter 160ms ease',
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.transform = 'translateY(-1px)';
                                                                e.currentTarget.style.boxShadow = '0 14px 24px rgba(244,63,94,0.18)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.transform = 'translateY(0)';
                                                                e.currentTarget.style.boxShadow = '0 10px 18px rgba(244,63,94,0.12)';
                                                            }}
                                                        >
                                                            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: 18, height: 18 }}>
                                                                <path d="M5 7h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                                                <path d="M9 7V5.8A1.8 1.8 0 0 1 10.8 4h2.4A1.8 1.8 0 0 1 15 5.8V7" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                                                                <path d="M8 7l.7 12.2A1.8 1.8 0 0 0 10.5 21h3a1.8 1.8 0 0 0 1.8-1.8L16 7" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                                                                <path d="M10 11v5M14 11v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 13 }}>Đang xử lý...</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {isOrderViewOpen && viewOrder && (
                <div className="modal-overlay-fade" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.68)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: 20 }}>
                    <div className="modal-panel-fade" style={{ width: 'min(760px, 100%)', borderRadius: 28, overflow: 'hidden', background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98))', border: '1px solid rgba(59,130,246,0.16)', boxShadow: '0 30px 90px rgba(15,23,42,0.32)', transformOrigin: 'center' }}>
                        <div style={{ padding: 22, background: 'linear-gradient(180deg, #ffffff, #f8fafc)', color: '#0f172a', borderBottom: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', padding: '7px 12px', borderRadius: 999, background: '#dbeafe', color: '#1d4ed8', fontWeight: 800, fontSize: 12, marginBottom: 14, letterSpacing: '0.02em' }}>
                                        ĐƠN HÀNG ĐÃ HOÀN TẤT
                                    </div>
                                    <h3 style={{ margin: '0 0 8px', fontSize: 26, lineHeight: 1.2, letterSpacing: '-0.03em' }}>Chi tiết đơn {viewOrder.order_no}</h3>
                                    <p style={{ margin: 0, color: '#64748b', lineHeight: 1.7 }}>Tổng hợp thông tin đơn hàng trong một khung nhìn gọn gàng và hiện đại.</p>
                                </div>
                                <button type="button" onClick={closeViewModal} aria-label="Đóng popup" style={{ width: 42, height: 42, borderRadius: 14, border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', cursor: 'pointer', fontWeight: 800, fontSize: 18 }}>×</button>
                            </div>
                        </div>

                        <div style={{ padding: 22 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14, marginBottom: 18 }}>
                                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 18, padding: 16, boxShadow: '0 10px 24px rgba(15,23,42,0.04)' }}>
                                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, marginBottom: 8 }}>Khách hàng</div>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{viewOrder.customer_name || '---'}</div>
                                </div>
                                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 18, padding: 16, boxShadow: '0 10px 24px rgba(15,23,42,0.04)' }}>
                                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, marginBottom: 8 }}>Ngày giao dự kiến</div>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{viewOrder.expected_delivery_date || '---'}</div>
                                </div>
                                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 18, padding: 16, boxShadow: '0 10px 24px rgba(15,23,42,0.04)' }}>
                                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, marginBottom: 8 }}>Trạng thái</div>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '8px 12px', borderRadius: 999, background: '#dcfce7', color: '#166534', fontWeight: 800, fontSize: 12 }}>{statusConfig.completed.label}</span>
                                </div>
                                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 18, padding: 16, boxShadow: '0 10px 24px rgba(15,23,42,0.04)' }}>
                                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, marginBottom: 8 }}>Địa chỉ giao | Thông tin giao hàng</div>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', lineHeight: 1.5 }}>{viewOrder.note || 'Không có ghi chú.'}</div>
                                </div>
                                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 18, padding: 16, boxShadow: '0 10px 24px rgba(15,23,42,0.04)', gridColumn: '1 / -1' }}>
                                    <div style={{ fontSize: 12, color: '#1d4ed8', fontWeight: 700, marginBottom: 8 }}>Tổng tiền</div>
                                    <div style={{ fontSize: 22, fontWeight: 900, color: '#1d4ed8' }}>{formatCurrency(calculateOrderTotal(viewOrder))} đ</div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gap: 14 }}>
                                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 18, padding: 16, boxShadow: '0 10px 24px rgba(15,23,42,0.04)' }}>
                                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, marginBottom: 10 }}>Danh sách sản phẩm</div>
                                    <div style={{ color: '#0f172a', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{formatOrderItems(viewOrder)}</div>
                                </div>

                                <div style={{ background: 'linear-gradient(180deg, #eff6ff, #dbeafe)', border: '1px solid #bfdbfe', borderRadius: 18, padding: 16 }}>
                                    <div style={{ fontSize: 12, color: '#1d4ed8', fontWeight: 700, marginBottom: 8 }}>Ghi chú</div>
                                    <div style={{ color: '#1e3a8a', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{viewOrder.note || 'Không có ghi chú.'}</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
                                <button onClick={closeViewModal} style={{ padding: '12px 18px', background: 'linear-gradient(135deg, #2563eb, #60a5fa)', color: 'white', border: 'none', borderRadius: 14, cursor: 'pointer', fontWeight: 800, boxShadow: '0 14px 28px rgba(37,99,235,0.18)' }}>
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isReasonModalOpen && errorOrder && (
                <div className="modal-overlay-fade" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.62)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: 20 }}>
                    <div className="modal-panel-fade" style={{ background: 'white', padding: '28px', borderRadius: 24, width: 'min(560px, 100%)', border: '1px solid rgba(248, 113, 113, 0.25)', boxShadow: '0 30px 80px rgba(15,23,42,0.3)', transformOrigin: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', padding: '8px 12px', borderRadius: 999, background: '#fee2e2', color: '#b91c1c', fontWeight: 800, fontSize: 12, marginBottom: 16 }}>
                            ĐƠN BỊ TỪ CHỐI
                        </div>
                        <h3 style={{ margin: '0 0 10px', color: '#0f172a', fontSize: 22 }}>Chi tiết lỗi đơn {errorOrder.order_no}</h3>
                        <p style={{ margin: '0 0 16px', color: '#64748b', lineHeight: 1.7 }}>Xem lý do trả đơn và chọn cách xử lý tiếp theo ngay tại đây.</p>
                        <div style={{ background: '#fff1f2', padding: '16px', borderRadius: 18, marginBottom: 20, border: '1px solid #fecdd3', maxHeight: 240, overflowY: 'auto' }}>
                            <p style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#9f1239', lineHeight: 1.7 }}>{errorOrder.note || 'Không có ghi chú lỗi.'}</p>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                            <button onClick={() => setIsReasonModalOpen(false)} style={{ padding: '12px 16px', background: '#e2e8f0', color: '#0f172a', border: 'none', borderRadius: 14, cursor: 'pointer', fontWeight: 700 }}>
                                Đóng
                            </button>
                            {errorOrder.status === 'returned' && errorOrder.note?.includes('[KHÁCH BOM HÀNG') ? (
                                <button onClick={() => handleCancelOrder(errorOrder)} style={{ padding: '12px 16px', background: 'linear-gradient(135deg, #16a34a, #22c55e)', color: 'white', border: 'none', borderRadius: 14, cursor: 'pointer', fontWeight: 800, boxShadow: '0 12px 24px rgba(22,163,74,0.18)' }}>
                                    Xác nhận Hoàn Kho & Hủy Đơn
                                </button>
                            ) : (
                                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                    <button onClick={() => handleDelete(errorOrder)} style={{ padding: '12px 16px', background: '#fff', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 14, cursor: 'pointer', fontWeight: 800 }}>
                                        Xóa vĩnh viễn
                                    </button>
                                    <button onClick={() => handleEditClick(errorOrder)} style={{ padding: '12px 16px', background: 'linear-gradient(135deg, #ea580c, #f97316)', color: 'white', border: 'none', borderRadius: 14, cursor: 'pointer', fontWeight: 800 }}>
                                        Sửa & Gửi lại
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {cancelReasonOrder && (
                <div className="modal-overlay-fade" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.68)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: 20 }}>
                    <div className="modal-panel-fade" style={{ width: 'min(760px, 100%)', borderRadius: 28, overflow: 'hidden', background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98))', border: '1px solid rgba(244,63,94,0.16)', boxShadow: '0 30px 90px rgba(15,23,42,0.32)', transformOrigin: 'center' }}>
                        <div style={{ padding: 22, background: 'linear-gradient(180deg, #fff1f2, #ffffff)', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                            <div>
                                <div style={{ display: 'inline-flex', alignItems: 'center', padding: '7px 12px', borderRadius: 999, background: '#fee2e2', color: '#b91c1c', fontWeight: 800, fontSize: 12, marginBottom: 14 }}>
                                    ĐƠN ĐÃ HỦY
                                </div>
                                <h3 style={{ margin: '0 0 8px', fontSize: 26, lineHeight: 1.2, letterSpacing: '-0.03em', color: '#0f172a' }}>Lý do hủy đơn {cancelReasonOrder.order_no}</h3>
                                <p style={{ margin: 0, color: '#64748b', lineHeight: 1.7 }}>Xem chi tiết vì sao đơn này bị hủy và thông tin đi kèm.</p>
                            </div>
                            <button type="button" onClick={closeCancelReason} aria-label="Đóng popup" style={{ width: 42, height: 42, borderRadius: 14, border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', cursor: 'pointer', fontWeight: 800, fontSize: 18 }}>×</button>
                        </div>

                        <div style={{ padding: 22, display: 'grid', gap: 14 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
                                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 18, padding: 16 }}>
                                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, marginBottom: 8 }}>Khách hàng</div>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{cancelReasonOrder.customer_name || '---'}</div>
                                </div>
                                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 18, padding: 16 }}>
                                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, marginBottom: 8 }}>Trạng thái</div>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '8px 12px', borderRadius: 999, background: '#fee2e2', color: '#991b1b', fontWeight: 800, fontSize: 12 }}>{statusConfig.canceled.label}</span>
                                </div>
                                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 18, padding: 16 }}>
                                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, marginBottom: 8 }}>Ngày hủy</div>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{cancelReasonOrder.updated_at || cancelReasonOrder.created_at || '---'}</div>
                                </div>
                                <div style={{ gridColumn: '1 / -1', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 18, padding: 16 }}>
                                    <div style={{ fontSize: 12, color: '#be123c', fontWeight: 700, marginBottom: 8 }}>Lý do hủy</div>
                                    <div style={{ color: '#9f1239', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{cancelReasonOrder.note || 'Không có ghi chú hủy.'}</div>
                                </div>
                            </div>

                            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 18, padding: 16 }}>
                                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, marginBottom: 10 }}>Sản phẩm</div>
                                <div style={{ color: '#0f172a', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{formatOrderItems(cancelReasonOrder)}</div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button onClick={closeCancelReason} style={{ padding: '12px 18px', background: 'linear-gradient(135deg, #be123c, #f43f5e)', color: 'white', border: 'none', borderRadius: 14, cursor: 'pointer', fontWeight: 800, boxShadow: '0 14px 28px rgba(244,63,94,0.18)' }}>
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>

    );
}
