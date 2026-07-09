import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import { exportListToExcel } from '../utils/exportList';

const CARRIERS = [
  { code: 'GHN', name: 'Giao Hàng Nhanh (GHN)', prefix: 'GHN' },
  { code: 'GR',  name: 'Giao Hàng Tiết Kiệm (GR)',  prefix: 'GR'  },
  { code: 'GHT', name: 'Giao Hàng Tiêu Chuẩn (GHT)', prefix: 'GHT' },
];

const LOGISTICS_ACTIONS = [
  { value: 'loi_nha_may', label: 'Lỗi do nhà máy' },
  { value: 'loi_van_tai', label: 'Lỗi do vận chuyển' },
];

const statusConfig = {
  pending:             { label: 'Chờ điều phối',     tone: 'warning', description: 'Đơn mới từ Sales, sẵn sàng phân tuyến.' },
  warehouse_processing: { label: 'Kho đang xử lý',     tone: 'info',    description: 'Đã điều phối, chờ kho soạn hàng và xuất tuyến.' },
  waiting_sales:        { label: 'Đang đợi Sales',      tone: 'amber',   description: 'Kho từ chối, đợi Sales quyết định.' },
  shipping:            { label: 'Đang giao hàng',       tone: 'purple',  description: 'Hàng đã rời kho, đang trên đường giao đến khách.' },
  completed:           { label: 'Đã giao thành công',   tone: 'success', description: 'Khách đã nhận hàng thành công.' },
  customer_rejected:   { label: 'Khách từ chối nhận',  tone: 'danger',  description: 'Khách từ chối nhận hàng, cần xử lý.' },
  return_pending:      { label: 'Đang xử lý hoàn hàng', tone: 'orange',  description: 'Đang xử lý hàng lỗi / hoàn trả.' },
  return_to_sales:     { label: 'Hoàn về Sales',         tone: 'amber',   description: 'Chuyển về Sales xử lý.' },
  canceled:            { label: 'Đã hủy / Bom hàng',    tone: 'danger',  description: 'Đơn bị hủy hoặc hoàn trả.' },
};

const toneStyles = {
  warning:  { background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' },
  danger:   { background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' },
  info:     { background: '#dbeafe', color: '#1d4ed8', border: '1px solid #93c5fd' },
  success:  { background: '#dcfce7', color: '#166534', border: '1px solid #86efac' },
  purple:   { background: '#f3e8ff', color: '#6b21a8', border: '1px solid #d8b4fe' },
  amber:    { background: '#fef9c3', color: '#854d0e', border: '1px solid #fde047' },
  orange:   { background: '#ffedd5', color: '#9a3412', border: '1px solid #fb923c' },
};

const pageStyles = {
  page: { minHeight: '100vh', padding: '28px', background: 'radial-gradient(circle at top left, #eff6ff 0%, #f8fafc 35%, #f3f4f6 100%)', color: '#0f172a' },
  shell: { maxWidth: '1400px', margin: '0 auto' },
  hero: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px', marginBottom: '22px', flexWrap: 'wrap' },
  heroTitle: { margin: 0, fontSize: '28px', letterSpacing: '-0.03em', color: '#0f172a' },
  heroSubtitle: { margin: '8px 0 0', color: '#64748b', lineHeight: 1.7, fontSize: '14px' },
  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '14px', marginBottom: '22px' },
  statCard: { background: 'rgba(255,255,255,0.92)', borderRadius: '22px', padding: '18px', boxShadow: '0 12px 24px rgba(15,23,42,0.08)', border: '1px solid rgba(148,163,184,0.18)', minHeight: '108px', transition: 'transform 0.2s ease, box-shadow 0.2s ease' },
  statIcon: { width: '44px', height: '44px', borderRadius: '14px', display: 'grid', placeItems: 'center', fontSize: '18px', color: '#fff', boxShadow: '0 12px 24px rgba(37,99,235,0.18)', marginBottom: '12px' },
  statLabel: { margin: 0, color: '#64748b', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' },
  statValue: { margin: '10px 0 0', fontSize: '30px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em' },
  statDesc: { margin: '8px 0 0', color: '#64748b', fontSize: '13px', lineHeight: 1.5 },
  quickPanel: { display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '12px', marginBottom: '22px' },
  quickItem: { background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(148,163,184,0.18)', borderRadius: '20px', padding: '16px', boxShadow: '0 10px 24px rgba(15,23,42,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', transition: 'transform 0.2s ease' },
  quickLabel: { fontWeight: 800, color: '#0f172a', marginBottom: '4px', fontSize: '13px' },
  quickDesc: { color: '#64748b', fontSize: '11px', lineHeight: 1.5 },
  statBlue:    { background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' },
  statAmber:   { background: 'linear-gradient(135deg, #f59e0b, #d97706)' },
  statEmerald: { background: 'linear-gradient(135deg, #10b981, #059669)' },
  statRose:    { background: 'linear-gradient(135deg, #f43f5e, #e11d48)' },
  statPurple:  { background: 'linear-gradient(135deg, #9333ea, #7e22ce)' },
  section: { background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(148,163,184,0.18)', borderRadius: '24px', boxShadow: '0 20px 50px rgba(15,23,42,0.08)', overflow: 'hidden', marginBottom: '22px' },
  sectionHeader: { padding: '22px 24px 0' },
  sectionTitle: { margin: 0, fontSize: '20px', color: '#0f172a' },
  sectionDesc: { margin: '8px 0 0', color: '#64748b', lineHeight: 1.6 },
  tabRow: { display: 'inline-flex', gap: '0', padding: '4px', margin: '12px 24px 0', background: '#eef2f7', border: '1px solid #e2e8f0', borderRadius: '16px', width: 'fit-content' },
  tabButton: { border: 'none', borderRadius: '12px', padding: '0 18px', minWidth: '150px', height: '38px', fontWeight: 800, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s ease' },
  tableWrap: { padding: '18px 24px 24px', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px', minWidth: '980px' },
  tableRow: { background: '#fff', transition: 'transform 0.22s ease, box-shadow 0.22s ease', borderRadius: '18px' },
  th: { textAlign: 'left', padding: '14px 16px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', borderBottom: '1px solid #e2e8f0' },
  td: { padding: '16px', borderBottom: '1px solid #eef2f7', verticalAlign: 'top' },
  actionButton: { border: 'none', borderRadius: '12px', padding: '10px 14px', cursor: 'pointer', fontWeight: 800, transition: 'transform 0.15s ease, box-shadow 0.15s ease' },
  primaryButton:   { background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white' },
  dangerButton:    { background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white' },
  successButton:   { background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white' },
  neutralButton:   { background: '#eef2ff', color: '#3730a3' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '20px', animation: 'modalFadeIn 180ms ease both' },
  modal: { width: '100%', maxWidth: '580px', background: 'rgba(255,255,255,0.98)', borderRadius: '24px', padding: '24px', boxShadow: '0 30px 80px rgba(15,23,42,0.25)', border: '1px solid rgba(148,163,184,0.22)', animation: 'modalScaleIn 220ms cubic-bezier(0.16,1,0.3,1) both' },
  modalWide: { width: '100%', maxWidth: '820px', background: 'rgba(255,255,255,0.98)', borderRadius: '24px', padding: '24px', boxShadow: '0 30px 80px rgba(15,23,42,0.25)', border: '1px solid rgba(148,163,184,0.22)', animation: 'modalScaleIn 220ms cubic-bezier(0.16,1,0.3,1) both' },
  input: { width: '100%', padding: '13px 14px', borderRadius: '14px', border: '1px solid #cbd5e1', background: '#fff', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  textarea: { width: '100%', padding: '13px 14px', borderRadius: '14px', border: '1px solid #cbd5e1', background: '#fff', outline: 'none', boxSizing: 'border-box', minHeight: '120px', resize: 'vertical', fontFamily: 'inherit' },
  badge: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 800, whiteSpace: 'nowrap' },
  progressBar: { height: '8px', borderRadius: '999px', background: '#e2e8f0', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: '999px', transition: 'width 1s linear' },
};

const formatDate = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('vi-VN');
};

const formatCurrency = (v) => new Intl.NumberFormat('vi-VN').format(Number(v) || 0);

const getMeta = (status) => statusConfig[status] || { label: status || '—', tone: 'warning', description: '' };

const CUSTOMER_REJECT_LABELS = {
  khong_nhan_hang:   'Không nhận hàng',
  hang_loi:          'Hàng lỗi / hư hỏng',
  thieu_hang:        'Thiếu hàng',
  khieu_nai_sau_giao:'Khiếu nại sau giao',
  loi_van_tai:       'Lỗi vận chuyển',
};

export default function LogisticsPage() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const roleId = user?.role_id || 0;
  const isAuthorized = [1, 3].includes(roleId); // Admin (1) + Logistics (3)

  if (!isAuthorized) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#94a3b8', gap: 12 }}>
        <i className="ri-lock-2-line" style={{ fontSize: 48, color: '#cbd5e1' }} />
        <h2 style={{ margin: 0, color: '#334155' }}>Bạn không có quyền truy cập trang này</h2>
        <p style={{ margin: 0, fontSize: 14 }}>Trang Giao hàng / Logistics chỉ dành cho Admin và Logistics.</p>
      </div>
    );
  }

  const [orders, setOrders] = useState([]);
  const [shippingOrders, setShippingOrders] = useState([]);
  const [returnRequests, setReturnRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageMounted, setPageMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredOrderId, setHoveredOrderId] = useState(null);

  // Dispatch modal
  const [isDispatchOpen, setIsDispatchOpen] = useState(false);
  const [isDispatchVisible, setIsDispatchVisible] = useState(false);
  const [dispatchOrder, setDispatchOrder] = useState(null);
  const [selectedCarrier, setSelectedCarrier] = useState('GHN');
  const [trackingNo, setTrackingNo] = useState('');
  const [shippingFee, setShippingFee] = useState('');

  // Reject modal (Logistics từ chối đơn)
  const [isLogisticsRejectOpen, setIsLogisticsRejectOpen] = useState(false);
  const [isLogisticsRejectVisible, setIsLogisticsRejectVisible] = useState(false);
  const [logisticsRejectOrder, setLogisticsRejectOrder] = useState(null);
  const [logisticsRejectReason, setLogisticsRejectReason] = useState('');

  // Delivery simulation modal
  const [isDeliverySimOpen, setIsDeliverySimOpen] = useState(false);
  const [isDeliverySimVisible, setIsDeliverySimVisible] = useState(false);
  const [simOrder, setSimOrder] = useState(null);
  const [deliveryStep, setDeliveryStep] = useState(0); // 0=idle, 1=vận chuyển, 2=đang giao, 3=xong
  const [deliveryResult, setDeliveryResult] = useState(null); // null | { success, reason }
  const deliveryAutoRef = useRef(null); // lưu timeout ID của auto-advance step 3

  // Customer rejection processing modal
  const [isCustomerRejectOpen, setIsCustomerRejectOpen] = useState(false);
  const [isCustomerRejectVisible, setIsCustomerRejectVisible] = useState(false);
  const [customerRejectOrder, setCustomerRejectOrder] = useState(null);
  const [customerRejectReason, setCustomerRejectReason] = useState('');
  const [logisticsAction, setLogisticsAction] = useState('khong_nhan_hang');
  const [logisticsActionNote, setLogisticsActionNote] = useState('');

  // Completed order processing modal (khách nhận rồi nhưng vẫn muốn khiếu nại)
  const [isCompletedOrderOpen, setIsCompletedOrderOpen] = useState(false);
  const [isCompletedOrderVisible, setIsCompletedOrderVisible] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [completedAction, setCompletedAction] = useState('confirm'); // 'confirm' | 'complaint'
  const [completedNote, setCompletedNote] = useState('');
  const [completedLogisticsAction, setCompletedLogisticsAction] = useState('hang_loi');

  // View modal for waiting_sales orders
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isViewVisible, setIsViewVisible] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);

  const modalRoot = typeof document !== 'undefined' ? document.body : null;

  const fetchData = async () => {
    try {
      const [ordersRes, shippingRes, returnsRes] = await Promise.all([
        api.get('/orders'),
        api.get('/logistics/shipping'),
        api.get('/logistics/returns'),
      ]);
      setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
      setShippingOrders(Array.isArray(shippingRes.data) ? shippingRes.data : []);
      setReturnRequests(Array.isArray(returnsRes.data) ? returnsRes.data : []);
    } catch (error) {
      console.error('Lỗi tải dữ liệu Logistics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const t = window.setTimeout(() => setPageMounted(true), 40);
    return () => window.clearTimeout(t);
  }, []);

  // Đóng modal bằng Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        closeDispatchModal();
        closeLogisticsRejectModal();
        closeDeliverySim();
        closeCustomerRejectModal();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Delivery simulation: gọi backend mỗi bước 5s
  // Bước 1: Kho đang xử lý → Bước 2: Đang vận chuyển → Bước 3: Đang giao hàng → Bước 4: Giao thành công
  useEffect(() => {
    if (!isDeliverySimOpen || !simOrder) return;

    if (deliveryStep === 1) {
      // Đợi 5s rồi gọi backend advance step 1 → 2 (đồng thời set status = 'shipping')
      const t = window.setTimeout(async () => {
        try { await api.post('/logistics/simulate', { order_id: simOrder.id }); } catch (_) {}
        setDeliveryStep(2);
      }, 5000);
      return () => window.clearTimeout(t);
    }
    if (deliveryStep === 2) {
      const t = window.setTimeout(async () => {
        try { await api.post('/logistics/simulate', { order_id: simOrder.id }); } catch (_) {}
        setDeliveryStep(3);
      }, 5000);
      return () => window.clearTimeout(t);
    }
    if (deliveryStep === 3) {
      const t = window.setTimeout(async () => {
        deliveryAutoRef.current = null;
        try { await api.post('/logistics/simulate', { order_id: simOrder.id }); } catch (_) {}
        setDeliveryStep(4);
      }, 5000);
      deliveryAutoRef.current = t;
      return () => { window.clearTimeout(t); deliveryAutoRef.current = null; };
    }
    if (deliveryStep === 4) {
      const t = window.setTimeout(async () => {
        try {
          // User đã xác nhận giao thành công → gọi API với success=true
          const res = await api.post('/logistics/simulate', { order_id: simOrder.id, success: true });
          setDeliveryResult({ success: true, reason: null });
          fetchData();
        } catch (err) {
          console.error('Lỗi simulate:', err);
          setDeliveryResult({ success: false, reason: 'loi_he_thong' });
        }
      }, 2000);
      return () => window.clearTimeout(t);
    }
  }, [isDeliverySimOpen, simOrder, deliveryStep]);

  // Auto-simulate all shipping orders every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const hasShipping = orders.some((o) => o.status === 'shipping');
      if (!hasShipping) return;
      try {
        await api.post('/logistics/simulate-all');
        fetchData();
      } catch (err) {
        // silent fail - just retry next interval
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [orders, fetchData]);

  const pendingOrders = useMemo(() => orders.filter((o) => o.status === 'pending'), [orders]);
  const trackingOrders = useMemo(() => orders.filter((o) =>
    ['warehouse_processing', 'waiting_sales', 'shipping', 'completed', 'customer_rejected', 'return_pending', 'return_to_sales', 'canceled'].includes(o.status)
  ), [orders]);
  const visibleOrders = useMemo(() => {
    const base = activeTab === 'pending' ? pendingOrders : trackingOrders;
    const term = searchTerm.trim().toLowerCase();
    if (!term) return base;
    return base.filter((o) =>
      [o.order_no, o.customer_name, o.note].filter(Boolean).join(' ').toLowerCase().includes(term)
    );
  }, [activeTab, pendingOrders, trackingOrders, searchTerm]);

  const summaryCards = [
    { label: 'Tổng đơn',         value: orders.length,                                              icon: 'ri-stack-line',    tone: 'statBlue' },
    { label: 'Chờ điều phối',    value: pendingOrders.length,                                       icon: 'ri-time-line',     tone: 'statAmber' },
    { label: 'Đang theo dõi',     value: trackingOrders.filter(o => o.status !== 'completed').length, icon: 'ri-truck-line',     tone: 'statEmerald' },
    { label: 'Khách từ chối',     value: orders.filter((o) => ['customer_rejected', 'return_pending'].includes(o.status)).length, icon: 'ri-alert-line', tone: 'statRose' },
  ];

  // === Dispatch Modal ===
  const openDispatchModal = (order) => {
    setDispatchOrder(order);
    setSelectedCarrier('GHN');
    setTrackingNo('');
    setShippingFee('');
    setIsDispatchVisible(true);
    setIsDispatchOpen(true);
  };
  const closeDispatchModal = () => {
    setIsDispatchVisible(false);
    setTimeout(() => { setIsDispatchOpen(false); setDispatchOrder(null); }, 220);
  };
  const handleDispatch = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/logistics/dispatch', {
        order_id: dispatchOrder.id,
        carrier_code: selectedCarrier,
        shipping_fee: Number(shippingFee) || 0,
      });
      alert(`Điều phối thành công!\nMã vận đơn: ${res.data.tracking_no}\nĐơn vị: ${res.data.carrier}\nPhí ship: ${formatCurrency(res.data.shipping_fee)}đ`);
      closeDispatchModal();
      fetchData();
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message));
    }
  };

  // === Logistics Reject Modal ===
  const openLogisticsRejectModal = (order) => {
    setLogisticsRejectOrder(order);
    setLogisticsRejectReason('');
    setIsLogisticsRejectVisible(true);
    setIsLogisticsRejectOpen(true);
  };
  const closeLogisticsRejectModal = () => {
    setIsLogisticsRejectVisible(false);
    setTimeout(() => { setIsLogisticsRejectOpen(false); setLogisticsRejectOrder(null); }, 220);
  };
  const handleLogisticsReject = async (e) => {
    e.preventDefault();
    try {
      await api.post('/logistics/reject', {
        order_id: logisticsRejectOrder.id,
        reason: logisticsRejectReason,
      });
      alert('Đã từ chối đơn. Đơn quay về trạng thái chờ Sales xử lý.');
      closeLogisticsRejectModal();
      fetchData();
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message));
    }
  };

  // === Delivery Simulation ===
  const openDeliverySim = (order) => {
    setSimOrder(order);
    setDeliveryStep(1); // Bắt đầu từ bước 1
    setDeliveryResult(null);
    setIsDeliverySimVisible(true);
    setIsDeliverySimOpen(true);
  };
  const closeDeliverySim = () => {
    if (deliveryAutoRef.current) { window.clearTimeout(deliveryAutoRef.current); deliveryAutoRef.current = null; }
    setIsDeliverySimVisible(false);
    setTimeout(() => { setIsDeliverySimOpen(false); setSimOrder(null); setDeliveryStep(0); setDeliveryResult(null); }, 220);
  };

  // === Customer Rejection Processing ===
  const openCustomerRejectModal = (order) => {
    setCustomerRejectOrder(order);
    setCustomerRejectReason('Không nhận hàng');
    setLogisticsActionNote('');
    setIsCustomerRejectVisible(true);
    setIsCustomerRejectOpen(true);
  };
  const closeCustomerRejectModal = () => {
    setIsCustomerRejectVisible(false);
    setTimeout(() => { setIsCustomerRejectOpen(false); setCustomerRejectOrder(null); }, 220);
  };

  // === Completed Order Processing (khách nhận rồi nhưng vẫn khiếu nại) ===
  const openCompletedOrderModal = (order) => {
    setCompletedOrder(order);
    setCompletedAction('confirm');
    setCompletedNote('');
    setCompletedLogisticsAction('loi_nha_may');
    setIsCompletedOrderVisible(true);
    setIsCompletedOrderOpen(true);
  };
  const closeCompletedOrderModal = () => {
    setIsCompletedOrderVisible(false);
    setTimeout(() => { setIsCompletedOrderOpen(false); setCompletedOrder(null); setCompletedNote(''); setCompletedLogisticsAction('hang_loi'); }, 220);
  };

  // === View Modal (cho waiting_sales) ===
  const openViewModal = (order) => {
    setViewOrder(order);
    setIsViewVisible(true);
    setIsViewOpen(true);
  };
  const closeViewModal = () => {
    setIsViewVisible(false);
    setTimeout(() => { setIsViewOpen(false); setViewOrder(null); }, 220);
  };
  const handleProcessCompletedOrder = async (e) => {
    e.preventDefault();
    try {
      await api.post('/logistics/process-completed', {
        order_id: completedOrder.id,
        action: completedAction,
        note: completedNote,
        logistics_action: completedAction === 'complaint' ? completedLogisticsAction : null,
      });
      alert(completedAction === 'confirm' ? 'Đã xác nhận hoàn thành!' : 'Đã ghi nhận khiếu nại!');
      closeCompletedOrderModal();
      fetchData();
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message));
    }
  };
  const handleProcessCustomerRejection = async (e) => {
    e.preventDefault();
    try {
      await api.post('/logistics/customer-rejection', {
        order_id: customerRejectOrder.id,
        logistics_action: logisticsAction,
        logistics_note: logisticsActionNote,
      });
      alert('Đã xử lý! Đơn đã được chuyển đến khu vực phù hợp.');
      closeCustomerRejectModal();
      fetchData();
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message));
    }
  };

  // === Delivery Simulation steps ===
  // Bước 1: Kho đang xử lý  →  Bước 2: Đang vận chuyển  →  Bước 3: Đang giao hàng  →  Bước 4: Giao thành công
  const DELIVERY_STEPS = [
    { label: 'Kho đang xử lý',  icon: 'ri-archive-line',          color: '#2563eb', desc: 'Kho đang soạn và đóng gói hàng...' },
    { label: 'Đang vận chuyển', icon: 'ri-truck-line',            color: '#9333ea', desc: 'Hàng đã rời kho, đang trên đường...' },
    { label: 'Đang giao hàng',  icon: 'ri-navigation-line',        color: '#d97706', desc: 'Hàng đang được giao đến khách...' },
    { label: 'Giao thành công', icon: 'ri-checkbox-circle-line',  color: '#10b981', desc: '' },
  ];

  // === Render Modals ===
  const dispatchModal = isDispatchOpen && modalRoot ? createPortal(
    <div style={{ ...pageStyles.modalOverlay, opacity: isDispatchVisible ? 1 : 0, pointerEvents: isDispatchVisible ? 'auto' : 'none' }}>
      <div style={{ ...pageStyles.modal, opacity: isDispatchVisible ? 1 : 0, transform: isDispatchVisible ? 'translateY(0) scale(1)' : 'translateY(18px) scale(0.94)', transition: 'opacity 220ms ease, transform 220ms ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '22px', color: '#0f172a' }}>Điều phối vận chuyển</h3>
            <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '14px' }}>Chọn đơn vị vận chuyển — mã vận đơn sẽ tự sinh.</p>
          </div>
          <button onClick={closeDispatchModal} style={{ ...pageStyles.actionButton, ...pageStyles.neutralButton, padding: '10px 12px' }}>Đóng</button>
        </div>

        <div style={{ padding: '14px 16px', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: '18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div><div style={{ fontSize: '12px', color: '#64748b' }}>Mã đơn</div><div style={{ fontWeight: 900, color: '#1d4ed8' }}>{dispatchOrder?.order_no}</div></div>
            <div><div style={{ fontSize: '12px', color: '#64748b' }}>Khách hàng</div><div style={{ fontWeight: 800 }}>{dispatchOrder?.customer_name}</div></div>
            <div><div style={{ fontSize: '12px', color: '#64748b' }}>Ngày giao</div><div style={{ fontWeight: 800 }}>{formatDate(dispatchOrder?.expected_delivery_date)}</div></div>
          </div>
        </div>

        <form onSubmit={handleDispatch}>
          <div style={{ display: 'grid', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px', color: '#0f172a' }}>Đơn vị vận chuyển</label>
              <select value={selectedCarrier} onChange={(e) => { setSelectedCarrier(e.target.value); setTrackingNo(''); }} style={pageStyles.input}>
                {CARRIERS.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px', color: '#0f172a' }}>Mã vận đơn <span style={{ color: '#2563eb', fontSize: '12px' }}>(tự sinh)</span></label>
              <input value={trackingNo} readOnly placeholder="Mã sẽ tự sinh khi bấm điều phối..." style={{ ...pageStyles.input, background: '#f1f5f9', color: '#64748b' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px', color: '#0f172a' }}>Phí ship dự tính (VNĐ)</label>
              <input type="number" min="0" placeholder="VD: 35000" value={shippingFee} onChange={(e) => setShippingFee(e.target.value)} style={pageStyles.input} required />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" style={{ ...pageStyles.actionButton, ...pageStyles.primaryButton, flex: 1, padding: '14px 16px' }}>
                <i className="ri-truck-line" style={{ marginRight: '8px' }} />Điều phối sang kho
              </button>
              <button type="button" onClick={closeDispatchModal} style={{ ...pageStyles.actionButton, ...pageStyles.neutralButton, flex: 1, padding: '14px 16px' }}>Hủy</button>
            </div>
          </div>
        </form>
      </div>
    </div>, modalRoot
  ) : null;

  const logisticsRejectModal = isLogisticsRejectOpen && modalRoot ? createPortal(
    <div style={{ ...pageStyles.modalOverlay, opacity: isLogisticsRejectVisible ? 1 : 0, pointerEvents: isLogisticsRejectVisible ? 'auto' : 'none' }}>
      <div style={{ ...pageStyles.modal, opacity: isLogisticsRejectVisible ? 1 : 0, transform: isLogisticsRejectVisible ? 'translateY(0) scale(1)' : 'translateY(18px) scale(0.94)', transition: 'opacity 220ms ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '22px', color: '#b91c1c' }}>Từ chối đơn hàng</h3>
            <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '14px' }}>Gửi lại cho Sales để sửa hoặc xóa đơn.</p>
          </div>
          <button onClick={closeLogisticsRejectModal} style={{ ...pageStyles.actionButton, ...pageStyles.neutralButton, padding: '10px 12px' }}>Đóng</button>
        </div>
        <div style={{ padding: '14px 16px', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: '18px' }}>
          <div style={{ fontSize: '12px', color: '#64748b' }}>Khách hàng</div>
          <div style={{ fontWeight: 900, marginTop: '4px' }}>{logisticsRejectOrder?.customer_name || '—'}</div>
        </div>
        <form onSubmit={handleLogisticsReject}>
          <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px' }}>Lý do từ chối <span style={{ color: '#ef4444' }}>*</span></label>
          <textarea required rows="4" placeholder="VD: Địa chỉ không rõ ràng, không có tuyến giao..." value={logisticsRejectReason} onChange={(e) => setLogisticsRejectReason(e.target.value)} style={pageStyles.textarea} />
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button type="submit" style={{ ...pageStyles.actionButton, ...pageStyles.dangerButton, flex: 1, padding: '14px 16px' }}>Gửi từ chối</button>
            <button type="button" onClick={closeLogisticsRejectModal} style={{ ...pageStyles.actionButton, ...pageStyles.neutralButton, flex: 1, padding: '14px 16px' }}>Hủy</button>
          </div>
        </form>
      </div>
    </div>, modalRoot
  ) : null;

  const deliverySimModal = isDeliverySimOpen && modalRoot ? createPortal(
    <div style={{ ...pageStyles.modalOverlay, opacity: isDeliverySimVisible ? 1 : 0, pointerEvents: isDeliverySimVisible ? 'auto' : 'none' }}>
      <div style={{ ...pageStyles.modalWide, opacity: isDeliverySimVisible ? 1 : 0, transform: isDeliverySimVisible ? 'translateY(0) scale(1)' : 'translateY(18px) scale(0.94)', transition: 'opacity 220ms ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '24px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '22px', color: '#0f172a' }}>
              <i className="ri-truck-line" style={{ marginRight: '10px', color: '#2563eb' }} />
              Bảng giao hàng ảo
            </h3>
            <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '14px' }}>Theo dõi đơn #{simOrder?.order_no} — Khách: {simOrder?.customer_name}</p>
          </div>
          <button onClick={closeDeliverySim} style={{ ...pageStyles.actionButton, ...pageStyles.neutralButton, padding: '10px 12px' }}>Đóng</button>
        </div>

        {deliveryResult === null ? (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
              {DELIVERY_STEPS.map((step, idx) => {
                const done = deliveryStep > idx + 1;
                const active = deliveryStep === idx + 1;
                return (
                  <div key={idx} style={{
                    padding: '20px',
                    borderRadius: '20px',
                    border: active ? `2px solid ${step.color}` : '2px solid #e2e8f0',
                    background: done ? '#f0fdf4' : active ? '#eff6ff' : '#f8fafc',
                    textAlign: 'center',
                    transition: 'all 0.4s ease',
                  }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: done ? '#10b981' : active ? step.color : '#cbd5e1', display: 'grid', placeItems: 'center', margin: '0 auto 14px', transition: 'background 0.4s ease' }}>
                      <i className={done ? 'ri-check-line' : active ? step.icon : 'ri-checkbox-blank-circle-line'} style={{ fontSize: '24px', color: '#fff' }} />
                    </div>
                    <div style={{ fontWeight: 900, color: done ? '#166534' : active ? step.color : '#94a3b8', marginBottom: '6px' }}>{step.label}</div>
                    {active && <div style={{ fontSize: '12px', color: '#64748b' }}>{step.desc}</div>}
                    {active && (
                      <div style={{ marginTop: '12px' }}>
                        <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: step.color, width: '70%', borderRadius: '999px', animation: 'progressPulse 5s linear forwards' }} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
              <i className="ri-loader-4-line" style={{ animation: 'spin 1s linear infinite', marginRight: '8px' }} />
              Đang cập nhật tự động... (mỗi bước 5 giây)
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            {deliveryResult.success ? (
              <>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#dcfce7', display: 'grid', placeItems: 'center', margin: '0 auto 20px' }}>
                  <i className="ri-checkbox-circle-line" style={{ fontSize: '48px', color: '#166534' }} />
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: '24px', color: '#166534' }}>Giao hàng thành công!</h3>
                <p style={{ color: '#64748b', margin: '0 0 24px' }}>Khách hàng đã nhận đầy đủ hàng hóa.</p>
                <button onClick={closeDeliverySim} style={{ ...pageStyles.actionButton, ...pageStyles.successButton, padding: '12px 32px', fontSize: '15px' }}>Đóng</button>
              </>
            ) : (
              <>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#fee2e2', display: 'grid', placeItems: 'center', margin: '0 auto 20px' }}>
                  <i className="ri-close-circle-line" style={{ fontSize: '48px', color: '#991b1b' }} />
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: '24px', color: '#991b1b' }}>Khách từ chối nhận hàng!</h3>
                <p style={{ color: '#64748b', margin: '0 0 8px' }}>Lý do: <strong style={{ color: '#b91c1c' }}>{CUSTOMER_REJECT_LABELS[deliveryResult.reason] || deliveryResult.reason}</strong></p>
                <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 24px' }}>Nhấn nút bên dưới để xử lý khiếu nại.</p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button onClick={closeDeliverySim} style={{ ...pageStyles.actionButton, ...pageStyles.neutralButton, padding: '12px 24px', fontSize: '14px' }}>Đóng</button>
                  <button
                    onClick={() => {
                      closeDeliverySim();
                      // Mở modal xử lý hàng trả cho đơn này
                      openCustomerRejectModal(simOrder);
                    }}
                    style={{ ...pageStyles.actionButton, ...pageStyles.dangerButton, padding: '12px 24px', fontSize: '14px' }}
                  >
                    <i className="ri-settings-line" style={{ marginRight: '6px' }} />Xử lý khiếu nại
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>, modalRoot
  ) : null;

  const customerRejectModal = isCustomerRejectOpen && modalRoot ? createPortal(
    <div style={{ ...pageStyles.modalOverlay, opacity: isCustomerRejectVisible ? 1 : 0, pointerEvents: isCustomerRejectVisible ? 'auto' : 'none' }}>
      <div style={{ ...pageStyles.modal, opacity: isCustomerRejectVisible ? 1 : 0, transform: isCustomerRejectVisible ? 'translateY(0) scale(1)' : 'translateY(18px) scale(0.94)', transition: 'opacity 220ms ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '22px', color: '#991b1b' }}>
              <i className="ri-alert-warning-line" style={{ marginRight: '8px' }} />Xử lý hàng trả
            </h3>
            <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '14px' }}>Đơn #{customerRejectOrder?.order_no} — {customerRejectOrder?.customer_name}</p>
          </div>
          <button onClick={closeCustomerRejectModal} style={{ ...pageStyles.actionButton, ...pageStyles.neutralButton, padding: '10px 12px' }}>Đóng</button>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          // Gửi về Sales — không cần logistics_action
          api.put(`/orders/${customerRejectOrder.id}/return-to-sales`, {
            note: logisticsActionNote,
          }).then(() => {
            alert('Da gui don ve Sales xu ly!');
            closeCustomerRejectModal();
            fetchData();
          }).catch(err => {
            alert('Loi: ' + (err.response?.data?.message || err.message));
          });
        }}>
          <div style={{ padding: '14px 16px', borderRadius: '16px', background: '#fee2e2', border: '1px solid #fca5a5', marginBottom: '18px' }}>
            <div style={{ fontSize: '12px', color: '#991b1b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px' }}>Lý do khách từ chối</div>
            <div style={{ fontWeight: 900, color: '#b91c1c', fontSize: '16px' }}>Không nhận hàng</div>
          </div>

          <div style={{ display: 'grid', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px' }}>Ghi chú</label>
              <textarea rows="3" placeholder="VD: Khách báo không đặt hàng, địa chỉ sai..." value={logisticsActionNote} onChange={(e) => setLogisticsActionNote(e.target.value)} style={pageStyles.textarea} />
            </div>
            <div style={{ padding: '12px 14px', borderRadius: '14px', background: '#fef9c3', border: '1px solid #fde047', fontSize: '13px', color: '#92400e' }}>
              → Hàng sẽ được gửi về <strong>Sales</strong> xử lý. Sales có thể sửa đơn, giao lại hoặc hủy đơn.
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" style={{ ...pageStyles.actionButton, ...pageStyles.dangerButton, flex: 1, padding: '14px 16px' }}>
                <i className="ri-send-plane-line" style={{ marginRight: '8px' }} />Gửi về Sales
              </button>
              <button type="button" onClick={closeCustomerRejectModal} style={{ ...pageStyles.actionButton, ...pageStyles.neutralButton, flex: 1, padding: '14px 16px' }}>Hủy</button>
            </div>
          </div>
        </form>
      </div>
    </div>, modalRoot
  ) : null;

  // Modal xử lý đơn đã giao thành công (Logistics vẫn thấy nút Hoàn thành / Khiếu nại)
  const completedOrderModal = isCompletedOrderOpen && modalRoot ? createPortal(
    <div style={{ ...pageStyles.modalOverlay, opacity: isCompletedOrderVisible ? 1 : 0, pointerEvents: isCompletedOrderVisible ? 'auto' : 'none' }}>
      <div style={{ ...pageStyles.modal, opacity: isCompletedOrderVisible ? 1 : 0, transform: isCompletedOrderVisible ? 'translateY(0) scale(1)' : 'translateY(18px) scale(0.94)', transition: 'opacity 220ms ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '22px', color: '#0f172a' }}>
              <i className="ri-checkbox-circle-line" style={{ marginRight: '8px', color: '#16a34a' }} />Đơn đã giao thành công
            </h3>
            <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '14px' }}>Đơn #{completedOrder?.order_no} — {completedOrder?.customer_name}</p>
          </div>
          <button onClick={closeCompletedOrderModal} style={{ ...pageStyles.actionButton, ...pageStyles.neutralButton, padding: '10px 12px' }}>Đóng</button>
        </div>

        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#dcfce7', display: 'grid', placeItems: 'center', margin: '0 auto 14px' }}>
            <i className="ri-checkbox-circle-line" style={{ fontSize: '42px', color: '#16a34a' }} />
          </div>
          <h3 style={{ margin: '0 0 6px', fontSize: '22px', color: '#16a34a' }}>Giao hàng thành công!</h3>
          <p style={{ color: '#64748b', margin: '0', fontSize: '14px' }}>Khách hàng đã nhận đầy đủ hàng hóa.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '12px' }}>
            <div style={{ fontSize: '11px', color: '#166534', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Ngày giao dự kiến</div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#15803d' }}>{completedOrder?.expected_delivery_date ? new Date(completedOrder.expected_delivery_date).toLocaleDateString('vi-VN') : '—'}</div>
          </div>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '12px' }}>
            <div style={{ fontSize: '11px', color: '#166534', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Ngày giao thực tế</div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#15803d' }}>{completedOrder?.actual_delivery_date ? new Date(completedOrder.actual_delivery_date).toLocaleDateString('vi-VN') : '—'}</div>
          </div>
        </div>

        {completedOrder?.note && (
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Ghi chú</div>
            <div style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6 }}>{completedOrder.note}</div>
          </div>
        )}

        {/* Action: Hoàn thành / Khiếu nại */}
        <form onSubmit={handleProcessCompletedOrder}>
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>Hành động của Logistics</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <label style={{ flex: 1, cursor: 'pointer' }}>
                <input type="radio" name="completedAction" value="confirm" checked={completedAction === 'confirm'} onChange={() => setCompletedAction('confirm')} style={{ marginRight: '6px' }} />
                <span style={{ padding: '8px 14px', borderRadius: '10px', border: completedAction === 'confirm' ? '2px solid #16a34a' : '2px solid #e2e8f0', background: completedAction === 'confirm' ? '#f0fdf4' : '#fff', color: completedAction === 'confirm' ? '#15803d' : '#64748b', fontWeight: 700, fontSize: '13px', display: 'inline-block' }}>
                  <i className="ri-checkbox-circle-line" style={{ marginRight: '4px' }} />Hoàn thành
                </span>
              </label>
              <label style={{ flex: 1, cursor: 'pointer' }}>
                <input type="radio" name="completedAction" value="complaint" checked={completedAction === 'complaint'} onChange={() => setCompletedAction('complaint')} style={{ marginRight: '6px' }} />
                <span style={{ padding: '8px 14px', borderRadius: '10px', border: completedAction === 'complaint' ? '2px solid #dc2626' : '2px solid #e2e8f0', background: completedAction === 'complaint' ? '#fff1f2' : '#fff', color: completedAction === 'complaint' ? '#b91c1c' : '#64748b', fontWeight: 700, fontSize: '13px', display: 'inline-block' }}>
                  <i className="ri-error-warning-line" style={{ marginRight: '4px' }} />Khiếu nại
                </span>
              </label>
            </div>
          </div>

          {completedAction === 'complaint' && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>Loại khiếu nại</div>
              <select
                value={completedLogisticsAction}
                onChange={(e) => setCompletedLogisticsAction(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#334155', background: '#fff' }}
              >
                {LOGISTICS_ACTIONS.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
              <div style={{ marginTop: '10px', padding: '10px 12px', borderRadius: '10px', background: completedLogisticsAction === 'loi_nha_may' ? '#fef3c7' : '#e0f2fe', border: '1px solid ' + (completedLogisticsAction === 'loi_nha_may' ? '#fde047' : '#bae6fd'), fontSize: '13px', color: completedLogisticsAction === 'loi_nha_may' ? '#92400e' : '#0369a1' }}>
                {completedLogisticsAction === 'loi_nha_may'
                  ? '→ Hàng vào Kho lỗi. Phiếu bù gửi Nhà máy xác nhận bù hàng.'
                  : '→ Hàng vào Kho lỗi. Công ty tự chịu thiệt hại vận chuyển.'}
              </div>
            </div>
          )}

          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>Ghi chú</div>
            <textarea
              value={completedNote}
              onChange={(e) => setCompletedNote(e.target.value)}
              placeholder="Nhập ghi chú nếu cần..."
              rows={2}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#334155', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={closeCompletedOrderModal} style={{ ...pageStyles.actionButton, ...pageStyles.neutralButton, padding: '10px 20px', fontSize: '14px' }}>Hủy</button>
            <button type="submit" style={{ ...pageStyles.actionButton, ...(completedAction === 'confirm' ? pageStyles.successButton : pageStyles.dangerButton), padding: '10px 20px', fontSize: '14px' }}>
              {completedAction === 'confirm' ? 'Xác nhận hoàn thành' : 'Ghi nhận khiếu nại'}
            </button>
          </div>
        </form>
      </div>
    </div>, modalRoot
  ) : null;

  // Modal xem đơn đang đợi Sales (Logistics đã từ chối)
  const viewModal = isViewOpen && modalRoot ? createPortal(
    <div style={{ ...pageStyles.modalOverlay, opacity: isViewVisible ? 1 : 0, pointerEvents: isViewVisible ? 'auto' : 'none' }}>
      <div style={{ ...pageStyles.modal, opacity: isViewVisible ? 1 : 0, transform: isViewVisible ? 'translateY(0) scale(1)' : 'translateY(18px) scale(0.94)', transition: 'opacity 220ms ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '22px', color: '#b45309' }}>
              <i className="ri-time-line" style={{ marginRight: '8px', color: '#b45309' }} />Đơn đang đợi Sales xử lý
            </h3>
            <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '14px' }}>Đơn #{viewOrder?.order_no} — {viewOrder?.customer_name}</p>
          </div>
          <button onClick={closeViewModal} style={{ ...pageStyles.actionButton, ...pageStyles.neutralButton, padding: '10px 12px' }}>Đóng</button>
        </div>

        <div style={{ padding: '14px 16px', borderRadius: '16px', background: '#fef9c3', border: '1px solid #fde047', marginBottom: '18px' }}>
          <div style={{ fontSize: '12px', color: '#92400e', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>Lý do Kho từ chối xuất hàng</div>
          <div style={{ fontWeight: 900, color: '#854d0e', fontSize: '15px' }}>{viewOrder?.warehouse_note || 'Không có ghi chú'}</div>
        </div>

        {viewOrder?.warehouse_note && (
          <div style={{ padding: '14px 16px', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: '18px' }}>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Lý do Logistics từ chối (gốc)</div>
            <div style={{ color: '#475569', fontSize: '14px' }}>{viewOrder?.note || '—'}</div>
          </div>
        )}

        <div style={{ padding: '14px 16px', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: '18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div><div style={{ fontSize: '12px', color: '#64748b' }}>Ngày giao dự kiến</div><div style={{ fontWeight: 800, marginTop: '4px' }}>{formatDate(viewOrder?.expected_delivery_date)}</div></div>
            <div><div style={{ fontSize: '12px', color: '#64748b' }}>Trạng thái</div><div style={{ fontWeight: 800, marginTop: '4px', color: '#92400e' }}>Đang đợi Sales</div></div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={closeViewModal} style={{ ...pageStyles.actionButton, ...pageStyles.neutralButton, padding: '12px 24px', fontSize: '14px' }}>Đóng</button>
        </div>
      </div>
    </div>, modalRoot
  ) : null;

  const iconMap = { pending: 'ri-time-line', warehouse_processing: 'ri-box-3-line', waiting_sales: 'ri-user-follow-line', shipping: 'ri-truck-line', completed: 'ri-check-line', customer_rejected: 'ri-close-circle-line', return_pending: 'ri-arrow-go-back-line', return_to_sales: 'ri-reply-line', canceled: 'ri-alert-line' };
  const toneMap = { pending: pageStyles.statAmber, warehouse_processing: pageStyles.statBlue, waiting_sales: pageStyles.statAmber, shipping: pageStyles.statPurple, completed: pageStyles.statEmerald, customer_rejected: pageStyles.statRose, return_pending: pageStyles.statRose, return_to_sales: pageStyles.statAmber, canceled: pageStyles.statRose };

  return (
    <div style={{ ...pageStyles.page, opacity: pageMounted ? 1 : 0, transition: 'opacity 260ms ease' }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes modalFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalScaleIn { from { opacity: 0; transform: scale(0.94) translateY(18px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes progressPulse { from { width: 0%; } to { width: 100%; } }
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <div style={pageStyles.shell}>
        {/* Hero */}
        <div style={pageStyles.hero}>
          <div>
            <h2 style={pageStyles.heroTitle}>Điều phối giao hàng</h2>
            <p style={pageStyles.heroSubtitle}>Quản lý đơn từ Sales → điều phối → kho xuất → giao hàng → xử lý hoàn trong một màn hình.</p>
          </div>
        </div>

        {/* Stats */}
        <div style={pageStyles.statGrid}>
          {summaryCards.map((card) => (
            <div key={card.label} style={{ ...pageStyles.statCard, transform: hoveredCard === card.label ? 'translateY(-4px)' : 'translateY(0)' }}
              onMouseEnter={() => setHoveredCard(card.label)} onMouseLeave={() => setHoveredCard(null)}>
              <div style={{ ...pageStyles.statIcon, ...pageStyles[card.tone] }}><i className={card.icon} /></div>
              <p style={pageStyles.statLabel}>{card.label}</p>
              <p style={pageStyles.statValue}>{card.value}</p>
              <p style={pageStyles.statDesc}>{card.desc}</p>
            </div>
          ))}
        </div>

        {/* Quick panel */}
        <div style={pageStyles.quickPanel}>
          {['pending', 'warehouse_processing', 'waiting_sales', 'shipping', 'customer_rejected'].map((key) => {
            const meta = getMeta(key);
            return (
              <div key={key} style={{ ...pageStyles.quickItem, transform: hoveredCard === `q-${key}` ? 'translateY(-3px)' : 'translateY(0)' }}
                onMouseEnter={() => setHoveredCard(`q-${key}`)} onMouseLeave={() => setHoveredCard(null)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '12px', display: 'grid', placeItems: 'center', ...toneMap[key] }}>
                    <i className={iconMap[key]} style={{ fontSize: '18px', color: '#fff' }} />
                  </div>
                  <div>
                    <div style={pageStyles.quickLabel}>{meta.label}</div>
                    <div style={{ ...pageStyles.quickDesc }}>{meta.description}</div>
                  </div>
                </div>
                <span style={{ ...toneStyles[meta.tone], padding: '6px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 800 }}>
                  {orders.filter((o) => o.status === key).length}
                </span>
              </div>
            );
          })}
        </div>

        {/* Main Section */}
        <div style={pageStyles.section}>
          <div style={pageStyles.sectionHeader}>
            <h3 style={pageStyles.sectionTitle}>Danh sách điều phối</h3>
            <p style={pageStyles.sectionDesc}>Tìm nhanh đơn theo mã, khách hàng, ghi chú.</p>
          </div>

          {/* Tabs */}
          <div style={pageStyles.tabRow}>
            {['pending', 'tracking'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{ ...pageStyles.tabButton, background: activeTab === tab ? '#fff' : 'transparent', color: activeTab === tab ? '#2563eb' : '#64748b', boxShadow: activeTab === tab ? '0 1px 3px rgba(15,23,42,0.08)' : 'none', border: activeTab === tab ? '1px solid #dbeafe' : '1px solid transparent' }}>
                {tab === 'pending' ? `Chờ điều phối (${pendingOrders.length})` : `Theo dõi giao hàng (${trackingOrders.length})`}
              </button>
            ))}
          </div>

          {/* Search + Export */}
          <div style={{ padding: '18px 24px 0', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Tìm theo mã đơn, khách hàng..." style={{ ...pageStyles.input, flex: 1, minWidth: 200 }} />
            <button
              onClick={async () => {
                const list = activeTab === 'pending' ? pendingOrders : trackingOrders;
                const rows = list.map(o => [
                  o.order_no || '',
                  o.customer_name || '',
                  o.customer_phone || '',
                  o.customer_address || '',
                  o.expected_delivery_date ? new Date(o.expected_delivery_date).toLocaleDateString('vi-VN') : '',
                  o.actual_delivery_date ? new Date(o.actual_delivery_date).toLocaleDateString('vi-VN') : '',
                  o.status || '',
                  o.delivery_step || 0,
                  o.tracking_no || '',
                  o.carrier_name || '',
                ]);
                await exportListToExcel({
                  filename: 'DanhSachGiaoHang',
                  sheetName: 'GiaoHang',
                  title: 'DANH SÁCH ĐƠN GIAO HÀNG / VẬN CHUYỂN',
                  headers: ['Mã đơn', 'Khách hàng', 'SĐT', 'Địa chỉ', 'Ngày giao DK', 'Ngày giao TT', 'Trạng thái', 'Step', 'Mã vận đơn', 'ĐVVC'],
                  rows,
                  colWidths: [16, 24, 14, 32, 14, 14, 16, 8, 18, 14],
                });
              }}
              style={{
                padding: '10px 16px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg, #10b981, #34d399)', color: '#fff',
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
                boxShadow: '0 6px 14px rgba(16,185,129,0.22)',
                display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
              }}
            >
              <i className="ri-file-excel-2-line" style={{ fontSize: 15 }} />
              Xuất Excel
            </button>
          </div>

          {/* Table */}
          <div style={pageStyles.tableWrap}>
            {loading ? <div style={{ padding: '28px', color: '#64748b' }}>Đang tải...</div> : (
              <table style={pageStyles.table}>
                <thead>
                  <tr>
                    <th style={pageStyles.th}>Mã đơn</th>
                    <th style={pageStyles.th}>Khách hàng</th>
                    <th style={pageStyles.th}>Ngày giao</th>
                    <th style={pageStyles.th}>Trạng thái</th>
                    <th style={pageStyles.th}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleOrders.length === 0 && (
                    <tr><td colSpan="5" style={{ ...pageStyles.td, textAlign: 'center', color: '#94a3b8', padding: '28px' }}>Không có dữ liệu.</td></tr>
                  )}
                  {visibleOrders.map((order) => {
                    const meta = getMeta(order.status);
                    const isHov = hoveredOrderId === order.id;
                    return (
                      <tr key={order.id} style={{ ...pageStyles.tableRow, backgroundColor: isHov ? 'rgba(59,130,246,0.03)' : '#fff' }}
                        onMouseEnter={() => setHoveredOrderId(order.id)} onMouseLeave={() => setHoveredOrderId(null)}>
                        <td style={{ ...pageStyles.td, borderTopLeftRadius: '18px', borderBottomLeftRadius: '18px' }}>
                          <div style={{ fontWeight: 900, color: '#1d4ed8' }}>{order.order_no}</div>
                          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>ID: {order.id}</div>
                        </td>
                        <td style={pageStyles.td}>
                          <div style={{ fontWeight: 700 }}>{order.customer_name || '—'}</div>
                          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{order.address || ''}</div>
                        </td>
                        <td style={pageStyles.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <i className="ri-calendar-line" style={{ color: '#94a3b8' }} />
                            {formatDate(order.expected_delivery_date)}
                          </div>
                        </td>
                        <td style={pageStyles.td}>
                          <span style={{ ...toneStyles[meta.tone], padding: '6px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 800 }}>{meta.label}</span>
                          {order.note && <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>{order.note}</div>}
                        </td>
                        <td style={{ ...pageStyles.td, borderTopRightRadius: '18px', borderBottomRightRadius: '18px' }}>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>

                            {/* === PENDING === */}
                            {order.status === 'pending' && (
                              <>
                                <button onClick={() => openDispatchModal(order)} style={{ ...pageStyles.actionButton, ...pageStyles.primaryButton }}>
                                  <i className="ri-truck-line" style={{ marginRight: '6px' }} />Điều phối
                                </button>
                                <button onClick={() => openLogisticsRejectModal(order)} style={{ ...pageStyles.actionButton, ...pageStyles.dangerButton }}>
                                  <i className="ri-close-line" style={{ marginRight: '6px' }} />Từ chối
                                </button>
                              </>
                            )}

                            {/* === WAREHOUSE_PROCESSING === */}
                            {order.status === 'warehouse_processing' && (
                              <span style={{ ...toneStyles.info, padding: '8px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 800 }}>
                                <i className="ri-loader-4-line" style={{ marginRight: '6px', animation: 'spin 1s linear infinite' }} />Kho đang xử lý
                              </span>
                            )}

                            {/* === WAITING_SALES === */}
                            {order.status === 'waiting_sales' && (
                              <button onClick={() => openViewModal(order)} style={{ ...pageStyles.actionButton, ...pageStyles.neutralButton }}>
                                <i className="ri-eye-line" style={{ marginRight: '6px' }} />Xem
                              </button>
                            )}

                            {/* === SHIPPING === */}
                            {order.status === 'shipping' && (
                              <>
                                <button onClick={() => openDeliverySim(order)} style={{ ...pageStyles.actionButton, ...pageStyles.successButton }}>
                                  <i className="ri-eye-line" style={{ marginRight: '6px' }} />Xem giao hàng
                                </button>
                              </>
                            )}

                            {/* === COMPLETED === */}
                            {order.status === 'completed' && (
                              <button onClick={() => openCompletedOrderModal(order)} style={{ ...pageStyles.actionButton, ...pageStyles.successButton }}>
                                <i className="ri-eye-line" style={{ marginRight: '6px' }} />Xem đơn hoàn thành
                              </button>
                            )}

                            {/* === CUSTOMER_REJECTED === */}
                            {order.status === 'customer_rejected' && (
                              <button onClick={() => openCustomerRejectModal(order)} style={{ ...pageStyles.actionButton, ...pageStyles.dangerButton }}>
                                <i className="ri-alert-warning-line" style={{ marginRight: '6px' }} />Xử lý hàng trả
                              </button>
                            )}

                            {/* === RETURN_PENDING === */}
                            {order.status === 'return_pending' && (
                              <span style={{ ...toneStyles.orange, padding: '8px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 800 }}>
                                <i className="ri-arrow-go-back-line" style={{ marginRight: '6px' }} />Đang xử lý hoàn
                              </span>
                            )}

                            {/* === RETURN_TO_SALES === */}
                            {order.status === 'return_to_sales' && (
                              <span style={{ ...toneStyles.amber, padding: '8px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 800 }}>
                                <i className="ri-reply-line" style={{ marginRight: '6px' }} />Hoàn về Sales
                              </span>
                            )}

                            {/* === CANCELED === */}
                            {order.status === 'canceled' && (
                              <span style={{ ...toneStyles.danger, padding: '8px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 800 }}>
                                <i className="ri-alert-line" style={{ marginRight: '6px' }} />Đã hủy
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

        {/* Theo dõi hoàn hàng */}
        <div style={{ ...pageStyles.section, marginTop: '22px' }}>
          <div style={{ ...pageStyles.sectionHeader }}>
            <h3 style={pageStyles.sectionTitle}>Theo dõi hoàn hàng</h3>
            <p style={pageStyles.sectionDesc}>Đơn hàng đang trong quy trình hoàn trả / khiếu nại sau giao.</p>
          </div>
          <div style={pageStyles.tableWrap}>
            {returnRequests.length === 0 ? (
              <div style={{ padding: '28px', color: '#94a3b8', textAlign: 'center' }}>Không có yêu cầu hoàn hàng nào.</div>
            ) : (
              <table style={pageStyles.table}>
                <thead>
                  <tr>
                    <th style={pageStyles.th}>Mã đơn</th>
                    <th style={pageStyles.th}>Khách hàng</th>
                    <th style={pageStyles.th}>Lý do</th>
                    <th style={pageStyles.th}>Nguồn</th>
                    <th style={pageStyles.th}>Trạng thái</th>
                    <th style={pageStyles.th}>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {returnRequests.map((rr) => {
                    const statusLabel = {
                      pending: 'Chờ xử lý',
                      return_pending: 'Đang hoàn',
                      return_to_sales: 'Hoàn về Sales',
                      return_completed: 'Đã hoàn thành',
                      canceled: 'Đã hủy',
                    }[rr.status] || rr.status;
                    const toneKey = {
                      pending: 'warning',
                      return_pending: 'orange',
                      return_to_sales: 'amber',
                      return_completed: 'success',
                      canceled: 'danger',
                    }[rr.status] || 'info';
                    const sourceLabel = {
                      during_delivery: 'Trong quá trình giao',
                      after_delivery: 'Sau khi giao',
                    }[rr.complaint_source] || rr.complaint_source || '—';
                    return (
                      <tr key={rr.id} style={pageStyles.tableRow}>
                        <td style={pageStyles.td}>
                          <div style={{ fontWeight: 900, color: '#1d4ed8' }}>{rr.order_no}</div>
                          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>ID: {rr.order_id}</div>
                        </td>
                        <td style={pageStyles.td}>{rr.customer_name || '—'}</td>
                        <td style={pageStyles.td}>{rr.customer_reject_reason || '—'}</td>
                        <td style={pageStyles.td}>{sourceLabel}</td>
                        <td style={pageStyles.td}>
                          <span style={{ ...toneStyles[toneKey], padding: '6px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 800 }}>{statusLabel}</span>
                        </td>
                        <td style={pageStyles.td}>
                          <div style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12px', color: '#64748b' }}>
                            {rr.logistics_note || rr.order_note || '—'}
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

      {dispatchModal}
      {logisticsRejectModal}
      {deliverySimModal}
      {customerRejectModal}
      {completedOrderModal}
      {viewModal}
    </div>
  );
}
