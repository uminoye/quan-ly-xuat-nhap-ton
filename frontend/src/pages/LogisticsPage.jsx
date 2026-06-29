import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';

const statusConfig = {
    pending: {
        label: 'Chờ điều phối',
        tone: 'warning',
        description: 'Đơn mới từ Sales, sẵn sàng phân tuyến.'
    },
    warehouse_processing: {
        label: 'Kho đang xử lý',
        tone: 'info',
        description: 'Đã điều phối, chờ kho soạn hàng và xuất tuyến.'
    },
    shipping: {
        label: 'Đang giao hàng',
        tone: 'purple',
        description: 'Hàng đã rời kho, đang trên đường đến tay khách.'
    },
    completed: {
        label: 'Đã giao thành công',
        tone: 'success',
        description: 'Đơn đã hoàn tất giao nhận.'
    },
    canceled: {
        label: 'Hoàn trả / Bom hàng',
        tone: 'danger',
        description: 'Đơn bị hủy hoặc hoàn trả trong quá trình giao.'
    }
};

const toneStyles = {
    warning: { background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' },
    danger: { background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' },
    info: { background: '#dbeafe', color: '#1d4ed8', border: '1px solid #93c5fd' },
    success: { background: '#dcfce7', color: '#166534', border: '1px solid #86efac' },
    purple: { background: '#f3e8ff', color: '#6b21a8', border: '1px solid #d8b4fe' }
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
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        gap: '16px',
        marginBottom: '22px',
        padding: '4px 2px 2px',
        flexWrap: 'wrap',
    },
    heroCard: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        flex: '1 1 560px',
        minWidth: '280px',
    },
    heroTitle: {
        margin: 0,
        fontSize: '28px',
        lineHeight: 1.2,
        letterSpacing: '-0.03em',
        color: '#0f172a',
    },
    heroSubtitle: {
        margin: 0,
        maxWidth: '760px',
        color: '#64748b',
        lineHeight: 1.7,
        fontSize: '14px',
    },
    heroAside: {
        display: 'none',
    },
    statGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: '14px',
        marginBottom: '22px',
    },
    statCard: {
        background: 'rgba(255,255,255,0.92)',
        borderRadius: '22px',
        padding: '18px',
        boxShadow: '0 12px 24px rgba(15,23,42,0.08)',
        border: '1px solid rgba(148,163,184,0.18)',
        minHeight: '108px',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        cursor: 'default',
    },
    statIcon: {
        width: '44px',
        height: '44px',
        borderRadius: '14px',
        display: 'grid',
        placeItems: 'center',
        marginBottom: '12px',
        fontSize: '18px',
        color: '#fff',
        boxShadow: '0 12px 24px rgba(37,99,235,0.18)',
    },
    quickIcon: {
        width: '42px',
        height: '42px',
        borderRadius: '14px',
        display: 'grid',
        placeItems: 'center',
        fontSize: '18px',
        color: '#fff',
        boxShadow: '0 12px 24px rgba(37,99,235,0.16)',
        flexShrink: 0,
    },
    statLabel: { margin: 0, color: '#64748b', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' },
    statValue: { margin: '10px 0 0', fontSize: '30px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em' },
    statDesc: { margin: '8px 0 0', color: '#64748b', fontSize: '13px', lineHeight: 1.5 },
    quickPanel: {
        display: 'grid',
        gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', // 👉 Đã sửa thành 5 cột
        gap: '12px',
        marginBottom: '22px',
    },
    quickItem: {
        background: 'rgba(255,255,255,0.9)',
        border: '1px solid rgba(148,163,184,0.18)',
        borderRadius: '20px',
        padding: '16px',
        boxShadow: '0 10px 24px rgba(15,23,42,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        cursor: 'default',
    },
    quickLabel: { fontWeight: 800, color: '#0f172a', marginBottom: '4px' },
    quickDesc: { color: '#64748b', fontSize: '12px', lineHeight: 1.5 },
    statBlue: { background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' },
    statAmber: { background: 'linear-gradient(135deg, #f59e0b, #d97706)' },
    statEmerald: { background: 'linear-gradient(135deg, #10b981, #059669)' },
    statRose: { background: 'linear-gradient(135deg, #f43f5e, #e11d48)' },
    statPurple: { background: 'linear-gradient(135deg, #9333ea, #7e22ce)' },
    statBlueShadow: { boxShadow: '0 18px 34px rgba(37,99,235,0.14), 0 10px 24px rgba(37,99,235,0.10)' },
    statAmberShadow: { boxShadow: '0 18px 34px rgba(245,158,11,0.16), 0 10px 24px rgba(245,158,11,0.10)' },
    statEmeraldShadow: { boxShadow: '0 18px 34px rgba(16,185,129,0.16), 0 10px 24px rgba(16,185,129,0.10)' },
    statRoseShadow: { boxShadow: '0 18px 34px rgba(244,63,94,0.16), 0 10px 24px rgba(244,63,94,0.10)' },
    statPurpleShadow: { boxShadow: '0 18px 34px rgba(147,51,234,0.16), 0 10px 24px rgba(147,51,234,0.10)' },
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
    tabRow: {
        display: 'inline-flex',
        gap: '0',
        padding: '4px',
        margin: '12px 24px 0',
        background: '#eef2f7',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        width: 'fit-content',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.85)',
        flexWrap: 'nowrap',
    },
    tabButton: {
        border: 'none',
        borderRadius: '12px',
        padding: '0 18px',
        minWidth: '150px',
        height: '38px',
        fontWeight: 800,
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: 'none',
        whiteSpace: 'nowrap',
    },
    tableWrap: {
        padding: '18px 24px 24px',
        overflowX: 'auto',
    },
    table: {
        width: '100%',
        borderCollapse: 'separate',
        borderSpacing: '0 10px',
        minWidth: '980px',
        transition: 'opacity 0.28s ease, transform 0.28s ease',
    },
    tableRow: {
        background: '#fff',
        transition: 'transform 0.22s ease, box-shadow 0.22s ease, opacity 0.22s ease',
        willChange: 'transform, box-shadow, opacity',
    },
    th: {
        textAlign: 'left',
        padding: '14px 16px',
        fontSize: '12px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: '#64748b',
        borderBottom: '1px solid #e2e8f0',
    },
    td: {
        padding: '16px',
        borderBottom: '1px solid #eef2f7',
        verticalAlign: 'top',
    },
    actionButton: {
        border: 'none',
        borderRadius: '12px',
        padding: '10px 14px',
        cursor: 'pointer',
        fontWeight: 800,
        transition: 'transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease',
        boxShadow: '0 8px 20px rgba(15,23,42,0.08)',
    },
    primaryButton: {
        background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
        color: 'white',
    },
    dangerButton: {
        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
        color: 'white',
    },
    neutralButton: {
        background: '#eef2ff',
        color: '#3730a3',
    },
    modalOverlay: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 99999,
        padding: '20px',
        animation: 'modalFadeIn 180ms ease both',
    },
    modal: {
        width: '100%',
        maxWidth: '560px',
        background: 'rgba(255,255,255,0.98)',
        borderRadius: '24px',
        padding: '24px',
        boxShadow: '0 30px 80px rgba(15,23,42,0.25)',
        border: '1px solid rgba(148,163,184,0.22)',
        animation: 'modalScaleIn 220ms cubic-bezier(0.16, 1, 0.3, 1) both',
        transformOrigin: 'center center',
        willChange: 'transform, opacity',
    },
    input: {
        width: '100%',
        padding: '13px 14px',
        borderRadius: '14px',
        border: '1px solid #cbd5e1',
        background: '#fff',
        outline: 'none',
        boxSizing: 'border-box',
        fontFamily: 'inherit',
    },
    textarea: {
        width: '100%',
        padding: '13px 14px',
        borderRadius: '14px',
        border: '1px solid #cbd5e1',
        background: '#fff',
        outline: 'none',
        boxSizing: 'border-box',
        minHeight: '120px',
        resize: 'vertical',
        fontFamily: 'inherit',
    },
};

const formatDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('vi-VN');
};

const formatCurrency = (value) => {
    const number = Number(value || 0);
    return new Intl.NumberFormat('vi-VN').format(Number.isNaN(number) ? 0 : number);
};

const getOrderStatusMeta = (status) => {
    return statusConfig[status] || {
        label: status || 'Không xác định',
        tone: 'warning',
        description: 'Trạng thái chưa được cấu hình.',
    };
};

export default function LogisticsPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pageMounted, setPageMounted] = useState(false);
    const [activeTab, setActiveTab] = useState('pending');
    const [searchTerm, setSearchTerm] = useState('');
    const [hoveredCard, setHoveredCard] = useState(null);
    const [hoveredOrderId, setHoveredOrderId] = useState(null);
    const [animateTrackingTable, setAnimateTrackingTable] = useState(false);
    const [trackingViewKey, setTrackingViewKey] = useState(0);

    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [carrier, setCarrier] = useState('Xe Công Ty (Nội bộ)');
    const [trackingCode, setTrackingCode] = useState('');
    const [shippingFee, setShippingFee] = useState('');

    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectAction, setRejectAction] = useState('reject');

    const modalRoot = typeof document !== 'undefined' ? document.body : null;

    const fetchData = async () => {
        try {
            const res = await api.get('/orders');
            setOrders(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error('Lỗi tải dữ liệu Logistics:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const timer = window.setTimeout(() => setPageMounted(true), 40);
        return () => window.clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (activeTab !== 'tracking') {
            setAnimateTrackingTable(false);
            return undefined;
        }

        setTrackingViewKey((prev) => prev + 1);
        setAnimateTrackingTable(false);
        const timer = window.setTimeout(() => setAnimateTrackingTable(true), 60);
        return () => window.clearTimeout(timer);
    }, [activeTab]);

    useEffect(() => {
        if (!isAssignModalOpen && !isRejectModalOpen) return undefined;

        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                if (isAssignModalOpen) closeAssignModal();
                if (isRejectModalOpen) closeRejectModal();
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isAssignModalOpen, isRejectModalOpen]);

    const pendingOrders = useMemo(() => orders.filter((o) => o.status === 'pending'), [orders]);
    
    // 👉 ĐÃ THÊM LẠI 'shipping' VÀO ĐÂY (Lỗi ăn bớt số 1 nằm ở đây)
    const trackingOrders = useMemo(
        () => orders.filter((o) => ['warehouse_processing', 'shipping', 'completed', 'canceled'].includes(o.status)),
        [orders],
    );

    const visibleOrders = useMemo(() => {
        const base = activeTab === 'pending' ? pendingOrders : trackingOrders;
        const term = searchTerm.trim().toLowerCase();
        if (!term) return base;
        return base.filter((order) => {
            const haystack = [order.order_no, order.customer_name, order.note, order.address, order.shipping_carrier, order.tracking_code]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return haystack.includes(term);
        });
    }, [activeTab, pendingOrders, searchTerm, trackingOrders]);

    const summaryCards = [
        { label: 'Tổng đơn', value: orders.length, desc: 'Tất cả đơn đang có trong hệ thống.', icon: 'ri-stack-line', tone: 'statBlue' },
        { label: 'Chờ điều phối', value: pendingOrders.length, desc: 'Đơn mới cần logistics xử lý.', icon: 'ri-time-line', tone: 'statAmber' },
        { label: 'Đang theo dõi', value: trackingOrders.length, desc: 'Đơn đã được bàn giao hoặc đã giao.', icon: 'ri-truck-line', tone: 'statEmerald' },
        { label: 'Sự cố / hoàn trả', value: orders.filter((o) => ['returned', 'canceled'].includes(o.status)).length, desc: 'Đơn phát sinh vấn đề giao nhận.', icon: 'ri-alert-line', tone: 'statRose' },
    ];

    const handleAssignCarrier = async (e) => {
        e.preventDefault();
        try {
            const logisticsNote = `[GIAO VẬN] - ĐVVC: ${carrier} | Mã VĐ: ${trackingCode} | Phí: ${formatCurrency(shippingFee)}đ.`;
            const finalNote = selectedOrder?.note ? `${selectedOrder.note} | ${logisticsNote}` : logisticsNote;

            await api.post('/logistics/process', {
                order_id: selectedOrder.id,
                new_status: 'warehouse_processing',
                logistics_note: finalNote,
            });

            alert('Đã điều phối đơn hàng sang kho xử lý!');
            closeAssignModal();
            setCarrier('Xe Công Ty (Nội bộ)');
            setTrackingCode('');
            setShippingFee('');
            fetchData();
        } catch (error) {
            alert('Lỗi điều phối: ' + (error.response?.data?.message || 'Lỗi hệ thống'));
        }
    };

    const handleRejectOrReturn = async (e) => {
        e.preventDefault();
        try {
            const prefix = rejectAction === 'reject' ? '[LOGISTICS TỪ CHỐI]' : '[KHÁCH BOM HÀNG/HOÀN TRẢ]';
            const finalNote = `${prefix} - Lý do: ${rejectReason}`;
            const nextStatus = rejectAction === 'reject' ? 'returned' : 'returned';

            await api.post('/logistics/process', {
                order_id: selectedOrder.id,
                new_status: nextStatus,
                logistics_note: finalNote,
            });

            alert('Đã cập nhật trạng thái thành công!');
            closeRejectModal();
            setRejectReason('');
            fetchData();
        } catch (error) {
            alert('Lỗi hệ thống: ' + (error.response?.data?.message || 'Không thể xử lý'));
        }
    };

    const openAssignModal = (order) => {
        setSelectedOrder(order);
        setCarrier('Xe Công Ty (Nội bộ)');
        setTrackingCode('');
        setShippingFee('');
        setIsAssignModalVisible(true);
        setIsAssignModalOpen(true);
    };

    const closeAssignModal = () => {
        setIsAssignModalVisible(false);
        window.setTimeout(() => {
            setIsAssignModalOpen(false);
            setSelectedOrder(null);
        }, 220);
    };

    const openRejectModal = (order, actionType) => {
        setSelectedOrder(order);
        setRejectAction(actionType);
        setRejectReason('');
        setIsRejectModalVisible(true);
        setIsRejectModalOpen(true);
    };

    const closeRejectModal = () => {
        setIsRejectModalVisible(false);
        window.setTimeout(() => {
            setIsRejectModalOpen(false);
            setSelectedOrder(null);
        }, 220);
    };
    
    const handleConfirmSuccess = async (id) => {
        if (window.confirm("Xác nhận khách đã nhận hàng và thanh toán thành công?")) {
            try {
                await api.put(`/orders/${id}/confirm-delivery`);
                alert("Đã hoàn tất đơn hàng!");
                fetchData();
            } catch (error) {
                alert("Lỗi khi xác nhận giao hàng");
            }
        }
    };

    const assignModal = isAssignModalOpen && modalRoot ? createPortal(
        <div
            style={{
                ...pageStyles.modalOverlay,
                opacity: isAssignModalVisible ? 1 : 0,
                pointerEvents: isAssignModalVisible ? 'auto' : 'none',
            }}
        >
            <div
                style={{
                    ...pageStyles.modal,
                    opacity: isAssignModalVisible ? 1 : 0,
                    transform: isAssignModalVisible ? 'translateY(0) scale(1)' : 'translateY(18px) scale(0.94)',
                    transition: 'opacity 220ms ease, transform 220ms cubic-bezier(0.16, 1, 0.3, 1)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: '16px', marginBottom: '18px' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '22px', color: '#0f172a' }}>Điều phối vận chuyển</h3>
                        <p style={{ margin: '8px 0 0', color: '#64748b' }}>Bổ sung đơn vị vận chuyển, tracking và phí dự tính trước khi chuyển sang kho.</p>
                    </div>
                    <button onClick={closeAssignModal} style={{ ...pageStyles.actionButton, ...pageStyles.neutralButton, padding: '10px 12px' }}>
                        Đóng
                    </button>
                </div>

                <div style={{ marginBottom: '16px', padding: '14px 16px', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>Mã đơn</div>
                    <div style={{ fontWeight: 900, color: '#0f172a', marginTop: '4px' }}>{selectedOrder?.order_no}</div>
                </div>

                <form onSubmit={handleAssignCarrier}>
                    <div style={{ display: 'grid', gap: '14px' }}>
                        <div>
                            <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px', color: '#0f172a' }}>Đơn vị vận chuyển</label>
                            <select required value={carrier} onChange={(e) => setCarrier(e.target.value)} style={pageStyles.input}>
                                <option value="Xe Công Ty (Nội bộ)">Xe Công Ty (Giao nội bộ)</option>
                                <option value="Giao Hàng Tiết Kiệm">Giao Hàng Tiết Kiệm</option>
                                <option value="Viettel Post">Viettel Post</option>
                                <option value="Grab Express">Grab Express</option>
                                <option value="Ahamove">Ahamove</option>
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                            <div>
                                <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px', color: '#0f172a' }}>Mã vận đơn</label>
                                <input required placeholder="VD: GHTK123456" value={trackingCode} onChange={(e) => setTrackingCode(e.target.value)} style={pageStyles.input} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px', color: '#0f172a' }}>Phí ship dự tính (VNĐ)</label>
                                <input required type="number" min="0" placeholder="VD: 35000" value={shippingFee} onChange={(e) => setShippingFee(e.target.value)} style={pageStyles.input} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                            <button type="submit" style={{ ...pageStyles.actionButton, ...pageStyles.primaryButton, flex: 1, padding: '14px 16px' }}>
                                Lưu và chuyển kho xuất hàng
                            </button>
                            <button type="button" onClick={closeAssignModal} style={{ ...pageStyles.actionButton, ...pageStyles.neutralButton, flex: 1, padding: '14px 16px' }}>
                                Hủy
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>,
        modalRoot,
    ) : null;

    const rejectModal = isRejectModalOpen && modalRoot ? createPortal(
        <div
            style={{
                ...pageStyles.modalOverlay,
                opacity: isRejectModalVisible ? 1 : 0,
                pointerEvents: isRejectModalVisible ? 'auto' : 'none',
            }}
        >
            <div
                style={{
                    ...pageStyles.modal,
                    opacity: isRejectModalVisible ? 1 : 0,
                    transform: isRejectModalVisible ? 'translateY(0) scale(1)' : 'translateY(18px) scale(0.94)',
                    transition: 'opacity 220ms ease, transform 220ms cubic-bezier(0.16, 1, 0.3, 1)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: '16px', marginBottom: '18px' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '22px', color: '#b91c1c' }}>
                            {rejectAction === 'reject' ? 'Từ chối đơn hàng' : 'Báo cáo khách hoàn trả / bom hàng'}
                        </h3>
                        <p style={{ margin: '8px 0 0', color: '#64748b' }}>Ghi nhận lý do xử lý sự cố để các bộ phận khác dễ theo dõi.</p>
                    </div>
                    <button onClick={closeRejectModal} style={{ ...pageStyles.actionButton, ...pageStyles.neutralButton, padding: '10px 12px' }}>
                        Đóng
                    </button>
                </div>

                <div style={{ marginBottom: '16px', padding: '14px 16px', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>Khách hàng</div>
                    <div style={{ fontWeight: 900, color: '#0f172a', marginTop: '4px' }}>{selectedOrder?.customer_name || '—'}</div>
                </div>

                <form onSubmit={handleRejectOrReturn}>
                    <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px', color: '#0f172a' }}>Lý do chi tiết</label>
                    <textarea
                        required
                        rows="4"
                        placeholder={rejectAction === 'reject' ? 'Sai địa chỉ, không có tuyến giao...' : 'Gọi nhiều lần không nghe máy, hàng bị móp...'}
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        style={pageStyles.textarea}
                    />

                    <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                        <button type="submit" style={{ ...pageStyles.actionButton, ...pageStyles.dangerButton, flex: 1, padding: '14px 16px' }}>
                            Gửi báo cáo
                        </button>
                        <button type="button" onClick={closeRejectModal} style={{ ...pageStyles.actionButton, ...pageStyles.neutralButton, flex: 1, padding: '14px 16px' }}>
                            Hủy
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        modalRoot,
    ) : null;

    return (
        <div
            style={{
                ...pageStyles.page,
                opacity: pageMounted ? 1 : 0,
                transform: pageMounted ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.985)',
                transition: 'opacity 260ms ease, transform 320ms cubic-bezier(0.16, 1, 0.3, 1)',
                transformOrigin: 'top center',
                willChange: 'opacity, transform',
            }}
        >
            <div style={pageStyles.shell}>
                <div style={pageStyles.hero}>
                    <div style={pageStyles.heroCard}>
                        <h2 style={pageStyles.heroTitle}>Tiếp nhận giao hàng</h2>
                        <p style={pageStyles.heroSubtitle}>
                            Quản lý đơn chờ điều phối, theo dõi vận chuyển và xử lý sự cố giao nhận trong một màn hình gọn gàng.
                        </p>
                    </div>
                </div>

                <div style={pageStyles.statGrid}>
                    {summaryCards.map((card) => (
                        <div
                            key={card.label}
                            style={{
                                ...pageStyles.statCard,
                                transform: hoveredCard === `stat-${card.label}` ? 'translateY(-4px)' : 'translateY(0)',
                                ...(hoveredCard === `stat-${card.label}` ? pageStyles[`${card.tone}Shadow`] : null),
                                borderColor: hoveredCard === `stat-${card.label}` ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.18)',
                            }}
                            onMouseEnter={() => setHoveredCard(`stat-${card.label}`)}
                            onMouseLeave={() => setHoveredCard(null)}
                        >
                            <div style={{ ...pageStyles.statIcon, ...pageStyles[card.tone] }}>
                                <i className={card.icon} />
                            </div>
                            <p style={pageStyles.statLabel}>{card.label}</p>
                            <p style={pageStyles.statValue}>{card.value}</p>
                            <p style={pageStyles.statDesc}>{card.desc}</p>
                        </div>
                    ))}
                </div>

                <div style={pageStyles.quickPanel}>
                    {/* Đồng bộ các trạng thái đang hiển thị */}
                    {['pending', 'warehouse_processing', 'shipping', 'completed', 'canceled'].map((key) => {
                        const meta = getOrderStatusMeta(key);
                        const iconMap = {
                            pending: 'ri-time-line',
                            warehouse_processing: 'ri-box-3-line',
                            shipping: 'ri-truck-line',
                            completed: 'ri-check-line',
                            canceled: 'ri-alert-line',
                        };
                        const toneMap = {
                            pending: pageStyles.statAmber,
                            warehouse_processing: pageStyles.statBlue,
                            shipping: pageStyles.statPurple,
                            completed: pageStyles.statEmerald,
                            canceled: pageStyles.statRose,
                        };
                        return (
                            <div
                                key={key}
                                style={{
                                    ...pageStyles.quickItem,
                                    transform: hoveredCard === `quick-${key}` ? 'translateY(-3px)' : 'translateY(0)',
                                    ...(hoveredCard === `quick-${key}` ? pageStyles[`${meta.tone}Shadow`] : null),
                                    borderColor: hoveredCard === `quick-${key}` ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.18)',
                                }}
                                onMouseEnter={() => setHoveredCard(`quick-${key}`)}
                                onMouseLeave={() => setHoveredCard(null)}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ ...pageStyles.quickIcon, ...toneMap[key] }}>
                                        <i className={iconMap[key]} />
                                    </div>
                                    <div>
                                        <div style={pageStyles.quickLabel}>{meta.label}</div>
                                        <div style={pageStyles.quickDesc}>{meta.description}</div>
                                    </div>
                                </div>
                                <span style={{ ...toneStyles[meta.tone], padding: '8px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 800, whiteSpace: 'nowrap' }}>
                                    {key === 'canceled'
                                        ? orders.filter((o) => ['returned', 'canceled'].includes(o.status)).length
                                        : orders.filter((o) => o.status === key).length}
                                </span>
                            </div>
                        );
                    })}
                </div>

                <div style={pageStyles.section}>
                    <div style={pageStyles.sectionHeader}>
                        <h3 style={pageStyles.sectionTitle}>Danh sách điều phối</h3>
                        <p style={pageStyles.sectionDesc}>Tìm nhanh đơn theo mã, khách hàng, ghi chú hoặc đơn vị vận chuyển.</p>
                    </div>

                    <div style={pageStyles.tabRow}>
                        <button
                            onClick={() => setActiveTab('pending')}
                            style={{
                                ...pageStyles.tabButton,
                                background: activeTab === 'pending' ? '#ffffff' : 'transparent',
                                color: activeTab === 'pending' ? '#2563eb' : '#64748b',
                                boxShadow: activeTab === 'pending' ? '0 1px 3px rgba(15,23,42,0.08)' : 'none',
                                border: activeTab === 'pending' ? '1px solid #dbeafe' : '1px solid transparent',
                            }}
                        >
                            Chờ điều phối ({pendingOrders.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('tracking')}
                            style={{
                                ...pageStyles.tabButton,
                                background: activeTab === 'tracking' ? '#ffffff' : 'transparent',
                                color: activeTab === 'tracking' ? '#2563eb' : '#64748b',
                                boxShadow: activeTab === 'tracking' ? '0 1px 3px rgba(15,23,42,0.08)' : 'none',
                                border: activeTab === 'tracking' ? '1px solid #dbeafe' : '1px solid transparent',
                            }}
                        >
                            Theo dõi giao hàng ({trackingOrders.length})
                        </button>
                    </div>

                    <div style={{ padding: '18px 24px 0' }}>
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Tìm theo mã đơn, khách hàng, ghi chú..."
                            style={pageStyles.input}
                        />
                    </div>

                    <div style={pageStyles.tableWrap}>
                        {loading ? (
                            <div style={{ padding: '28px', color: '#64748b' }}>Đang tải dữ liệu...</div>
                        ) : (
                            <table style={pageStyles.table}>
                                <thead>
                                    <tr>
                                        <th style={pageStyles.th}>Mã đơn</th>
                                        <th style={pageStyles.th}>Khách hàng</th>
                                        <th style={pageStyles.th}>Ngày yêu cầu</th>
                                        <th style={pageStyles.th}>Trạng thái / Địa chỉ</th>
                                        <th style={pageStyles.th}>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody
                                    style={{
                                        opacity: activeTab === 'tracking' ? (animateTrackingTable ? 1 : 0) : 1,
                                        transform: activeTab === 'tracking' ? (animateTrackingTable ? 'scale(1)' : 'scale(0.95)') : 'scale(1)',
                                        transformOrigin: 'top center',
                                    }}
                                    key={activeTab === 'tracking' ? trackingViewKey : 'pending-view'}
                                >
                                    {visibleOrders.length === 0 && (
                                        <tr>
                                            <td colSpan="5" style={{ ...pageStyles.td, textAlign: 'center', color: '#94a3b8', padding: '28px 16px' }}>
                                                Không có dữ liệu phù hợp.
                                            </td>
                                        </tr>
                                    )}

                                    {visibleOrders.map((order, index) => {
                                        const meta = getOrderStatusMeta(order.status);
                                        const isHovered = hoveredOrderId === order.id;
                                        return (
                                            <tr
                                                key={order.id}
                                                style={{
                                                    ...pageStyles.tableRow,
                                                    opacity: activeTab === 'tracking' ? (animateTrackingTable ? 1 : 0) : 1,
                                                    transform: activeTab === 'tracking'
                                                        ? animateTrackingTable
                                                            ? 'translateY(0) scale(1)'
                                                            : 'translateY(14px) scale(0.95)'
                                                        : 'translateY(0) scale(1)',
                                                    boxShadow: '0 6px 16px rgba(15,23,42,0.03)',
                                                    borderRadius: '18px',
                                                    transitionDelay: activeTab === 'tracking' && animateTrackingTable ? `${index * 110}ms` : '0ms',
                                                    transition: 'background-color 180ms ease, box-shadow 180ms ease, opacity 220ms ease, transform 220ms ease',
                                                    backgroundColor: '#fff',
                                                }}
                                                onMouseEnter={() => setHoveredOrderId(order.id)}
                                                onMouseLeave={() => setHoveredOrderId(null)}
                                            >
                                                <td style={{ ...pageStyles.td, borderTopLeftRadius: '18px', borderBottomLeftRadius: '18px', backgroundColor: isHovered ? 'rgba(59,130,246,0.03)' : '#fff' }}>
                                                    <div>
                                                        <div style={{ fontWeight: 900, color: '#1d4ed8' }}>{order.order_no}</div>
                                                        <div style={{ marginTop: '6px', color: '#64748b', fontSize: '12px' }}>ID: {order.id}</div>
                                                    </div>
                                                </td>
                                                <td style={{ ...pageStyles.td, backgroundColor: isHovered ? 'rgba(59,130,246,0.03)' : '#fff' }}>
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                                        <i className="ri-user-line" style={{ marginTop: '2px', color: '#94a3b8', fontSize: '16px' }} />
                                                        <div>
                                                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{order.customer_name || '—'}</div>
                                                            <div style={{ marginTop: '6px', color: '#64748b', fontSize: '13px', lineHeight: 1.55 }}>
                                                                {order.address || ''}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ ...pageStyles.td, backgroundColor: isHovered ? 'rgba(59,130,246,0.03)' : '#fff' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <i className="ri-calendar-line" style={{ color: '#94a3b8', fontSize: '16px' }} />
                                                        <div style={{ fontWeight: 400, color: '#0f172a' }}>{formatDate(order.expected_delivery_date)}</div>
                                                    </div>
                                                </td>
                                                <td style={{ ...pageStyles.td, backgroundColor: isHovered ? 'rgba(59,130,246,0.03)' : '#fff' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                                        <span style={{ ...toneStyles[meta.tone], padding: '8px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 800 }}>
                                                            {meta.label}
                                                        </span>
                                                    </div>
                                                    <div style={{ marginTop: '10px', color: '#64748b', fontSize: '13px', lineHeight: 1.6 }}>
                                                        {order.status === 'warehouse_processing' && 'Kho đang soạn hàng và chuẩn bị xuất tuyến.'}
                                                        {order.status === 'shipping' && 'Hàng đã rời kho, đang trên đường giao đến khách hàng.'}
                                                        {order.status === 'completed' && 'Đơn đã giao thành công cho khách hàng.'}
                                                        {order.status === 'canceled' && 'Đơn đã phát sinh vấn đề hoặc hoàn trả.'}
                                                        {order.status === 'pending' && (order.note || 'Chưa có ghi chú điều phối.')}
                                                        {order.status !== 'pending' && order.note && (
                                                            <>
                                                                <br />
                                                                <span style={{ color: '#94a3b8' }}>{order.note}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                                <td style={{ ...pageStyles.td, borderTopRightRadius: '18px', borderBottomRightRadius: '18px', backgroundColor: isHovered ? 'rgba(59,130,246,0.03)' : '#fff' }}>
                                                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                                        {activeTab === 'pending' && (
                                                            <>
                                                                <button
                                                                    onClick={() => openAssignModal(order)}
                                                                    style={{
                                                                        ...pageStyles.actionButton,
                                                                        ...pageStyles.primaryButton,
                                                                        animation: isHovered ? 'fadeScaleIn 180ms ease both' : 'none',
                                                                        transform: isHovered ? 'translateY(0)' : 'translateY(0)',
                                                                    }}
                                                                >
                                                                    Điều phối xe
                                                                </button>
                                                                <button
                                                                    onClick={() => openRejectModal(order, 'reject')}
                                                                    style={{
                                                                        ...pageStyles.actionButton,
                                                                        ...pageStyles.dangerButton,
                                                                        animation: isHovered ? 'fadeScaleIn 180ms ease 60ms both' : 'none',
                                                                        transform: isHovered ? 'translateY(0)' : 'translateY(0)',
                                                                    }}
                                                                >
                                                                    Từ chối
                                                                </button>
                                                            </>
                                                        )}

                                                        {/* 👉 ĐÃ THÊM LẠI NÚT "ĐÃ NHẬN HÀNG" BỊ RỚT MẤT NÈ */}
                                                        {activeTab === 'tracking' && order.status === 'shipping' && (
                                                            <button
                                                                onClick={() => handleConfirmSuccess(order.id)}
                                                                style={{
                                                                    ...pageStyles.actionButton,
                                                                    background: '#10b981',
                                                                    color: 'white',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '8px',
                                                                    padding: '10px 14px',
                                                                    borderRadius: '12px',
                                                                    boxShadow: '0 10px 22px rgba(16,185,129,0.18)',
                                                                    minHeight: '40px',
                                                                    whiteSpace: 'nowrap'
                                                                }}
                                                            >
                                                                <i className="ri-check-double-line" style={{ fontSize: '16px' }} />
                                                                Đã nhận hàng
                                                            </button>
                                                        )}

                                                        {/* 👉 ĐÃ SỬA: Nút Báo Bom hàng cho phép bấm khi đang Shipping hoặc Completed */}
                                                        {activeTab === 'tracking' && ['shipping', 'completed'].includes(order.status) && (
                                                            <button
                                                                onClick={() => openRejectModal(order, 'returned')}
                                                                style={{
                                                                    ...pageStyles.actionButton,
                                                                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                                                    color: '#fff',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '8px',
                                                                    padding: '10px 14px',
                                                                    borderRadius: '12px',
                                                                    boxShadow: '0 10px 22px rgba(239,68,68,0.18)',
                                                                    minHeight: '40px',
                                                                    whiteSpace: 'nowrap'
                                                                }}
                                                            >
                                                                <i className="ri-alarm-warning-line" style={{ fontSize: '16px' }} />
                                                                Báo bom hàng
                                                            </button>
                                                        )}

                                                        {activeTab === 'tracking' && order.status === 'warehouse_processing' && (
                                                            <span style={{ ...toneStyles.info, padding: '10px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 800 }}>
                                                                Đang chờ kho xuất hàng
                                                            </span>
                                                        )}

                                                        {activeTab === 'tracking' && order.status === 'canceled' && (
                                                            <span style={{ ...toneStyles.danger, padding: '10px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 800 }}>
                                                                Đơn đã đóng sự cố
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {assignModal}
            {rejectModal}
        </div>
    );
}