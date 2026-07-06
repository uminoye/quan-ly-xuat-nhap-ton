import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';

const LOGISTICS_ACTION_LABELS = {
  loi_nha_may:  'Lỗi do nhà máy',
  loi_van_tai:  'Lỗi do vận chuyển',
};

const ACTION_OUTCOMES = {
  loi_nha_may: {
    icon: 'ri-error-warning-line',
    iconBg: '#fee2e2', iconColor: '#991b1b',
    headline: 'Kho lỗi + Phiếu bù nhà máy',
    detail: 'Hàng đưa vào kho lỗi. Phiếu bù sẽ gửi nhà máy để xác nhận bù hàng.',
    note: 'Hàng lỗi → Kho lỗi → Phiếu bù → Nhà máy xác nhận bù',
    badge: { bg: '#fee2e2', color: '#991b1b' },
  },
  loi_van_tai: {
    icon: 'ri-truck-line',
    iconBg: '#e0f2fe', iconColor: '#0369a1',
    headline: 'Kho lỗi (tự chịu)',
    detail: 'Hàng lỗi do vận chuyển. Đưa vào kho lỗi — công ty tự chịu thiệt hại.',
    note: 'Hàng lỗi VC → Kho lỗi → Tự chịu',
    badge: { bg: '#e0f2fe', color: '#0369a1' },
  },
};

const PAGE_STYLES = {
  page: (pad) => ({ minHeight: '100vh', padding: pad, background: 'radial-gradient(circle at top left, #fff7ed 0%, #f8fafc 35%, #f3f4f6 100%)', color: '#0f172a' }),
  shell: { maxWidth: '1400px', margin: '0 auto' },
  heroTitle: (fs) => ({ margin: 0, fontSize: fs, letterSpacing: '-0.03em' }),
  heroSub: { margin: '8px 0 0', color: '#64748b', fontSize: '14px' },
  statGrid: (cols) => ({ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: '14px', marginBottom: '22px' }),
  statCard: { background: 'rgba(255,255,255,0.92)', borderRadius: '22px', padding: '20px', boxShadow: '0 12px 24px rgba(15,23,42,0.08)', border: '1px solid rgba(148,163,184,0.18)' },
  statLabel: { margin: 0, color: '#64748b', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' },
  statValue: { margin: '10px 0 0', fontSize: '36px', fontWeight: 900, letterSpacing: '-0.04em' },
  statDesc: { margin: '8px 0 0', color: '#64748b', fontSize: '13px' },
  section: { background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(148,163,184,0.18)', borderRadius: '24px', boxShadow: '0 20px 50px rgba(15,23,42,0.08)', overflow: 'hidden', marginBottom: '22px' },
  sectionHeader: { padding: '22px 24px 0' },
  sectionTitle: { margin: 0, fontSize: '20px' },
  tableWrap: { padding: '18px 24px 24px', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px', minWidth: 700 },
  th: { textAlign: 'left', padding: '12px 16px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', borderBottom: '1px solid #e2e8f0' },
  td: { padding: '16px', borderBottom: '1px solid #eef2f7', verticalAlign: 'middle' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '20px' },
  modal: (isMobile) => ({ background: 'rgba(255,255,255,0.98)', borderRadius: '24px', padding: isMobile ? '20px' : '28px', boxShadow: '0 30px 80px rgba(15,23,42,0.25)', border: '1px solid rgba(148,163,184,0.22)', width: '100%', maxWidth: '580px' }),
  input: { width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#fff', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: '14px' },
  badge: { display: 'inline-flex', alignItems: 'center', padding: '6px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 800 },
};

const formatDate = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('vi-VN');
};

export default function ReturnsPage() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const roleId = user?.role_id || 0;
  const isAdmin = roleId === 1;
  const isSales = roleId === 2;
  const isLogistics = roleId === 3;
  const isWarehouse = roleId === 4;
  const isFactory = roleId === 5;
  // Xử lý: Admin + Logistics
  // Duyệt phiếu bù: Admin (tất cả) + Factory (chỉ lỗi nhà máy)
  // Xem phiếu bù: Admin + Logistics + Warehouse + Factory (tất cả đều xem được)

  const [returns, setReturns] = useState([]);
  const [compensations, setCompensations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('returns'); // 'returns' | 'compensations'
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState(''); // '' | 'during_delivery' | 'after_delivery'
  const [compFilter, setCompFilter] = useState(''); // '' | 'pending' | 'approved'

  // Modals
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [isProcessModalVisible, setIsProcessModalVisible] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [processResult, setProcessResult] = useState(null);
  const [processing, setProcessing] = useState(false);

  // Modal phê duyệt phiếu bù
  const [isCompModalOpen, setIsCompModalOpen] = useState(false);
  const [isCompModalVisible, setIsCompModalVisible] = useState(false);
  const [selectedComp, setSelectedComp] = useState(null);
  const [compNote, setCompNote] = useState('');

  const modalRoot = typeof document !== 'undefined' ? document.body : null;

  // ── Responsive ──────────────────────────────────────────────────────────────
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const [isTablet, setIsTablet] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 768 && window.innerWidth < 1200 : false
  );

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      setIsMobile(w < 768);
      setIsTablet(w >= 768 && w < 1200);
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const pagePad = isMobile ? 12 : 18;
  const statCols = isMobile ? 1 : isTablet ? 2 : 3;
  const cardR = isMobile ? 14 : 20;
  const fs = isMobile ? 22 : 28;

  // Permission checks
  // Xử lý hàng hoàn: Admin + Logistics
  const canProcess = isAdmin || isLogistics;
  // Xem phiếu bù: Admin, Logistics, Warehouse, Factory
  const canViewCompensation = isAdmin || isLogistics || isWarehouse || isFactory;
  // Duyệt phiếu bù: Admin (tất cả) + Factory (chỉ lỗi nhà máy)
  const canApproveCompensation = (comp) => isAdmin || (isFactory && comp.defect_type === 'loi_nha_may');

  const fetchData = async () => {
    try {
      const [retRes, compRes] = await Promise.all([
        api.get('/returns'),
        api.get('/returns/compensations'),
      ]);
      setReturns(Array.isArray(retRes.data) ? retRes.data : []);
      setCompensations(Array.isArray(compRes.data) ? compRes.data : []);
    } catch (err) {
      console.error('Lỗi tải dữ liệu Returns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const t = window.setTimeout(() => setMounted(true), 40);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        closeProcessModal();
        closeCompModal();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const filteredReturns = returns.filter((r) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return [r.order_no, r.customer_name].filter(Boolean).join(' ').toLowerCase().includes(term);
  }).filter((r) => {
    if (!sourceFilter) return true;
    return r.complaint_source === sourceFilter;
  });

  const filteredComps = compensations.filter((c) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return [c.compensation_no, c.order_no, c.customer_name].filter(Boolean).join(' ').toLowerCase().includes(term);
  }).filter((c) => {
    if (!compFilter) return true;
    return c.status === compFilter;
  });

  // Stats
  const pendingReturns = returns.filter((r) => r.status === 'return_pending' && r.logistics_action);
  const completedReturns = returns.filter((r) => r.status === 'return_completed');
  const pendingComps = compensations.filter((c) => c.status === 'pending');

  const openProcessModal = (ret) => {
    setSelectedReturn(ret);
    setProcessResult(null);
    setIsProcessModalVisible(true);
    setIsProcessModalOpen(true);
  };

  const closeProcessModal = () => {
    setIsProcessModalVisible(false);
    setTimeout(() => {
      setIsProcessModalOpen(false);
      setSelectedReturn(null);
      setProcessResult(null);
    }, 220);
  };

  const handleProcess = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const res = await api.post('/returns/process', {
        order_id: selectedReturn.order_id,
        logistics_action: selectedReturn.logistics_action,
      });
      setProcessResult(res.data);
      fetchData();
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message));
    } finally {
      setProcessing(false);
    }
  };

  const openCompModal = (comp) => {
    setSelectedComp(comp);
    setCompNote('');
    setIsCompModalVisible(true);
    setIsCompModalOpen(true);
  };

  const closeCompModal = () => {
    setIsCompModalVisible(false);
    setTimeout(() => {
      setIsCompModalOpen(false);
      setSelectedComp(null);
      setCompNote('');
    }, 220);
  };

  const handleCompensation = async () => {
    try {
      await api.put(`/returns/compensations/${selectedComp.id}`, {
        compensation_id: selectedComp.id,
        resolution_note: compNote,
      });
      alert('Da dong y bu hang!');
      closeCompModal();
      fetchData();
    } catch (err) {
      alert('Loi: ' + (err.response?.data?.message || err.message));
    }
  };

  const actionBtn = (bg) => ({
    border: 'none', borderRadius: '12px', padding: '10px 16px', cursor: 'pointer',
    fontWeight: 800, fontSize: '14px', color: '#fff', background: bg,
    boxShadow: `0 8px 18px ${bg}40`,
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  });

  const getStatusBadge = (status) => {
    const map = {
      return_pending:     { label: 'Chờ xử lý',     bg: '#fef3c7', color: '#92400e' },
      return_completed:   { label: 'Đã xử lý xong', bg: '#dcfce7', color: '#166534' },
      return_to_sales:    { label: 'Về Sales',       bg: '#ede9fe', color: '#6d28d9' },
      logistics_handled:  { label: 'Đã chọn hướng', bg: '#f1f5f9', color: '#475569' },
    };
    const s = map[status] || { label: status, bg: '#f1f5f9', color: '#64748b' };
    return <span style={{ ...PAGE_STYLES.badge, background: s.bg, color: s.color }}>{s.label}</span>;
  };

  const getCompStatusBadge = (status) => {
    const map = {
      pending:  { label: 'Chờ xác nhận', bg: '#fef3c7', color: '#92400e' },
      approved: { label: 'Đã đồng ý',   bg: '#dcfce7', color: '#166534' },
      rejected: { label: 'Từ chối',     bg: '#fee2e2', color: '#991b1b' },
    };
    const s = map[status] || { label: status, bg: '#f1f5f9', color: '#64748b' };
    return <span style={{ ...PAGE_STYLES.badge, background: s.bg, color: s.color }}>{s.label}</span>;
  };

  const getActionBadge = (action) => {
    const meta = ACTION_OUTCOMES[action] || { badge: { bg: '#f1f5f9', color: '#64748b' } };
    return (
      <span style={{ ...PAGE_STYLES.badge, background: meta.badge.bg, color: meta.badge.color }}>
        {LOGISTICS_ACTION_LABELS[action] || action}
      </span>
    );
  };

  // ── Process Return Modal ──
  const processModal = isProcessModalOpen && modalRoot && selectedReturn ? createPortal(
    <div style={{ ...PAGE_STYLES.modalOverlay, opacity: isProcessModalVisible ? 1 : 0, pointerEvents: isProcessModalVisible ? 'auto' : 'none' }}>
      <div style={{ ...PAGE_STYLES.modal(isMobile), opacity: isProcessModalVisible ? 1 : 0, transform: isProcessModalVisible ? 'scale(1)' : 'scale(0.94)', transition: 'opacity 220ms ease, transform 220ms ease' }}>
        {processResult === null ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '22px', color: '#991b1b' }}>
                  <i className="ri-arrow-go-back-line" style={{ marginRight: '8px' }} />Xử lý hàng hoàn
                </h3>
                <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '14px' }}>
                  Đơn #{selectedReturn.order_no} — {selectedReturn.customer_name}
                </p>
              </div>
              <button onClick={closeProcessModal} style={{ ...actionBtn('#6366f1'), background: '#eef2ff', color: '#4338ca', boxShadow: 'none', padding: '10px 14px' }}>Đóng</button>
            </div>

            <div style={{ padding: '14px 16px', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Hướng xử lý Logistics đã chọn</div>
              {getActionBadge(selectedReturn.logistics_action)}
              {selectedReturn.logistics_note && (
                <div style={{ marginTop: '8px', fontSize: '13px', color: '#64748b' }}>
                  <i className="ri-sticky-note-line" style={{ marginRight: '4px' }} />
                  {selectedReturn.logistics_note}
                </div>
              )}
            </div>

            {(() => {
              const meta = ACTION_OUTCOMES[selectedReturn.logistics_action] || ACTION_OUTCOMES.loi_van_tai;
              return (
                <div style={{ padding: '16px 18px', borderRadius: '16px', background: meta.iconBg, border: '1px solid rgba(0,0,0,0.08)', marginBottom: '20px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: meta.iconBg, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <i className={meta.icon} style={{ fontSize: '24px', color: meta.iconColor }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: '16px', color: meta.iconColor, marginBottom: '4px' }}>{meta.headline}</div>
                    <div style={{ fontSize: '13px', color: '#374151' }}>{meta.detail}</div>
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280', fontStyle: 'italic' }}>{meta.note}</div>
                  </div>
                </div>
              );
            })()}

            <form onSubmit={handleProcess}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" disabled={processing} style={{ ...actionBtn('#ef4444'), flex: 1, padding: '14px', opacity: processing ? 0.7 : 1 }}>
                  <i className="ri-checkbox-circle-line" style={{ marginRight: '8px' }} />
                  {processing ? 'Đang xử lý...' : 'Xác nhận xử lý'}
                </button>
                <button type="button" onClick={closeProcessModal} style={{ ...actionBtn('#6366f1'), background: '#f1f5f9', color: '#475569', boxShadow: 'none', flex: 1, padding: '14px' }}>Hủy</button>
              </div>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '12px 0 4px' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#dcfce7', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
              <i className="ri-checkbox-circle-line" style={{ fontSize: '40px', color: '#166534' }} />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '22px', color: '#166534' }}>Xử lý hoàn hàng thành công!</h3>
            <div style={{ marginBottom: '20px', color: '#64748b', fontSize: '14px', textAlign: 'left', background: '#f8fafc', borderRadius: '14px', padding: '14px' }}>
              <div style={{ marginBottom: '6px' }}>Mã phiếu nhập: <strong style={{ color: '#0f172a' }}>{processResult.receipt_no}</strong></div>
              {processResult.claim_no && (
                <div style={{ marginBottom: '6px' }}>Mã phiếu bù: <strong style={{ color: '#991b1b' }}>{processResult.claim_no}</strong></div>
              )}
              <div>
                Nơi nhận: <strong style={{ color: '#0f172a' }}>{processResult.destination === 'kho_goc' ? 'Kho gốc (cộng tồn)' : 'Kho lỗi (cách ly)'}</strong>
              </div>
              {processResult.claim_no && (
                <div style={{ color: '#92400e', marginTop: '4px' }}>
                  <i className="ri-notification-3-line" style={{ marginRight: '4px' }} />
                  Thông báo đã gửi đến Nhà máy
                </div>
              )}
            </div>
            <button onClick={closeProcessModal} style={{ ...actionBtn('#10b981'), padding: '14px 32px', fontSize: '15px' }}>
              Đóng
            </button>
          </div>
        )}
      </div>
    </div>, modalRoot
  ) : null;

  // ── Compensation Modal ──
  const compModal = isCompModalOpen && modalRoot && selectedComp ? createPortal(
    <div style={{ ...PAGE_STYLES.modalOverlay, opacity: isCompModalVisible ? 1 : 0, pointerEvents: isCompModalVisible ? 'auto' : 'none' }}>
      <div style={{ ...PAGE_STYLES.modal(isMobile), opacity: isCompModalVisible ? 1 : 0, transform: isCompModalVisible ? 'scale(1)' : 'scale(0.94)', transition: 'opacity 220ms ease', maxWidth: '620px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '22px', color: '#0f172a' }}>
              <i className="ri-file-list-3-line" style={{ marginRight: '8px', color: '#92400e' }} />Phiếu bù hàng
            </h3>
            <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '14px' }}>
              #{selectedComp.compensation_no} — {selectedComp.order_no}
            </p>
          </div>
          <button onClick={closeCompModal} style={{ ...actionBtn('#6366f1'), background: '#eef2ff', color: '#4338ca', boxShadow: 'none', padding: '10px 14px' }}>Đóng</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px', marginBottom: '16px' }} className="ret-modal-grid">
          <div style={{ padding: '14px', borderRadius: '14px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 800, marginBottom: '4px' }}>Loại lỗi</div>
            <div style={{ fontWeight: 900, color: '#991b1b' }}>
              {selectedComp.defect_type === 'loi_nha_may' ? 'Lỗi do nhà máy' : 'Lỗi do vận chuyển'}
            </div>
          </div>
          <div style={{ padding: '14px', borderRadius: '14px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 800, marginBottom: '4px' }}>Kho</div>
            <div style={{ fontWeight: 800 }}>{selectedComp.warehouse_name || selectedComp.warehouse_code || 'Kho lỗi'}</div>
          </div>
          <div style={{ padding: '14px', borderRadius: '14px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 800, marginBottom: '4px' }}>Số loại sản phẩm</div>
            <div style={{ fontWeight: 900 }}>{selectedComp.total_items} loại</div>
          </div>
          <div style={{ padding: '14px', borderRadius: '14px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 800, marginBottom: '4px' }}>Ngày tạo</div>
            <div style={{ fontWeight: 800 }}>{formatDate(selectedComp.created_at)}</div>
          </div>
        </div>

        {/* Chi tiết sản phẩm */}
        {selectedComp.items && Array.isArray(selectedComp.items) && selectedComp.items.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#334155', marginBottom: '8px' }}>Chi tiết sản phẩm lỗi</div>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: 800, borderBottom: '1px solid #e2e8f0' }}>Sản phẩm</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', color: '#64748b', fontWeight: 800, borderBottom: '1px solid #e2e8f0' }}>SL lỗi</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', color: '#64748b', fontWeight: 800, borderBottom: '1px solid #e2e8f0' }}>Đơn giá</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedComp.items.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: '10px 12px', borderBottom: idx < selectedComp.items.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                        <div style={{ fontWeight: 700 }}>{item.product_name}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{item.sku}</div>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, borderBottom: idx < selectedComp.items.length - 1 ? '1px solid #f1f5f9' : 'none' }}>{item.defective_qty}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#334155', borderBottom: idx < selectedComp.items.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                        {new Intl.NumberFormat('vi-VN').format(Number(item.unit_price) || 0)} đ
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Ghi chú */}
        {selectedComp.resolution_note && (
          <div style={{ padding: '12px 14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: '16px', fontSize: '13px', color: '#475569' }}>
            <strong>Ghi chú:</strong> {selectedComp.resolution_note}
          </div>
        )}

        {selectedComp.status === 'pending' && canApproveCompensation(selectedComp) ? (
          <>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontWeight: 800, fontSize: '13px', color: '#334155', marginBottom: '8px' }}>
                Ghi chú phê duyệt (tùy chọn)
              </label>
              <textarea
                value={compNote}
                onChange={(e) => setCompNote(e.target.value)}
                placeholder="VD: Da dong y boi thuong, se gui hang thay the trong 3 ngay..."
                rows={2}
                style={{ ...PAGE_STYLES.input, minHeight: '72px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleCompensation}
                style={{ ...actionBtn('#16a34a'), flex: 1, padding: '14px', boxShadow: '0 8px 18px rgba(22,163,74,0.3)' }}
              >
                <i className="ri-checkbox-circle-line" style={{ marginRight: '8px' }} />
                Đồng ý bù hàng
              </button>
              <button onClick={closeCompModal} style={{ ...actionBtn('#6366f1'), background: '#f1f5f9', color: '#475569', boxShadow: 'none', flex: 1, padding: '14px' }}>
                Hủy
              </button>
            </div>
          </>
        ) : selectedComp.status === 'pending' && !canApproveCompensation(selectedComp) ? (
          <div style={{ padding: '12px 14px', borderRadius: '12px', background: '#fef3c7', border: '1px solid #fcd34d', fontSize: '13px', color: '#92400e', marginBottom: '10px' }}>
            <i className="ri-lock-line" style={{ marginRight: '8px' }} />
            Bạn chỉ có quyền xem phiếu bù này. Phiếu bù lỗi nhà máy cần Nhà máy phê duyệt.
          </div>
        ) : selectedComp.status !== 'pending' ? (
          <button onClick={closeCompModal} style={{ ...actionBtn('#6366f1'), padding: '14px', width: '100%' }}>
            Đóng
          </button>
        ) : null}
      </div>
    </div>, modalRoot
  ) : null;

  // Access denied for roles that shouldn't see anything
  if (!(isAdmin || isSales || isLogistics || isWarehouse || isFactory)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#94a3b8', gap: 12 }}>
        <i className="ri-lock-2-line" style={{ fontSize: 48, color: '#cbd5e1' }} />
        <h2 style={{ margin: 0, color: '#334155' }}>Bạn không có quyền truy cập trang này</h2>
        <p style={{ margin: 0, fontSize: 14 }}>Trang Xử lý hàng hoàn / lỗi chỉ dành cho Admin, Sales, Logistics, Warehouse và Factory.</p>
      </div>
    );
  }

  return (
    <div style={{ ...PAGE_STYLES.page(pagePad), opacity: mounted ? 1 : 0, transition: 'opacity 260ms ease' }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .ret-stat-grid { grid-template-columns: 1fr !important; }
          .ret-modal-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div style={PAGE_STYLES.shell}>
        <div style={{ marginBottom: '22px' }}>
          <h2 style={PAGE_STYLES.heroTitle(fs)}>Xử lý hàng hoàn / lỗi</h2>
          <p style={PAGE_STYLES.heroSub}>Danh sách hàng khách không nhận hoặc lỗi cần xử lý.</p>
        </div>

        {/* Stats */}
        <div style={PAGE_STYLES.statGrid(statCols)} className="ret-stat-grid">
          <div style={{ ...PAGE_STYLES.section, marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '18px 22px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#fef3c7', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <i className="ri-time-line" style={{ fontSize: '22px', color: '#92400e' }} />
              </div>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Chờ xử lý</p>
                <p style={{ fontSize: '28px', fontWeight: 900, color: '#92400e', margin: '2px 0 0', lineHeight: 1 }}>{pendingReturns.length}</p>
              </div>
            </div>
          </div>
          <div style={{ ...PAGE_STYLES.section, marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '18px 22px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#dcfce7', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <i className="ri-checkbox-circle-line" style={{ fontSize: '22px', color: '#166534' }} />
              </div>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Đã xử lý</p>
                <p style={{ fontSize: '28px', fontWeight: 900, color: '#166534', margin: '2px 0 0', lineHeight: 1 }}>{completedReturns.length}</p>
              </div>
            </div>
          </div>
          <div style={{ ...PAGE_STYLES.section, marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '18px 22px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#fee2e2', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <i className="ri-file-list-3-line" style={{ fontSize: '22px', color: '#991b1b' }} />
              </div>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Phiếu bù chờ</p>
                <p style={{ fontSize: '28px', fontWeight: 900, color: '#991b1b', margin: '2px 0 0', lineHeight: 1 }}>{pendingComps.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0', marginBottom: '22px', background: '#f1f5f9', borderRadius: '16px', padding: '4px', border: '1px solid #e2e8f0' }}>
          <button onClick={() => setActiveTab('returns')}
            style={{ flex: 1, padding: '11px 24px', borderRadius: '12px', border: 'none',
              background: activeTab === 'returns' ? '#fff' : 'transparent', color: activeTab === 'returns' ? '#2563eb' : '#64748b',
              fontWeight: activeTab === 'returns' ? 800 : 600, fontSize: '14px', cursor: 'pointer',
              boxShadow: activeTab === 'returns' ? '0 2px 8px rgba(37,99,235,0.12)' : 'none',
              transition: 'all 200ms ease' }}>
            <i className="ri-arrow-go-back-line" style={{ marginRight: '8px' }} />
            Hàng hoàn / lỗi ({returns.length})
          </button>
          <button onClick={() => setActiveTab('compensations')}
            style={{ flex: 1, padding: '11px 24px', borderRadius: '12px', border: 'none',
              background: activeTab === 'compensations' ? '#fff' : 'transparent', color: activeTab === 'compensations' ? '#2563eb' : '#64748b',
              fontWeight: activeTab === 'compensations' ? 800 : 600, fontSize: '14px', cursor: 'pointer',
              boxShadow: activeTab === 'compensations' ? '0 2px 8px rgba(37,99,235,0.12)' : 'none',
              transition: 'all 200ms ease' }}>
            <i className="ri-file-list-3-line" style={{ marginRight: '8px' }} />
            Phiếu bù nhà máy ({pendingComps.length > 0 ? `${pendingComps.length} chờ` : compensations.length})
          </button>
        </div>

        {/* Main Section */}
        <div style={PAGE_STYLES.section}>
          <div style={PAGE_STYLES.sectionHeader}>
            <h3 style={PAGE_STYLES.sectionTitle}>
              {activeTab === 'returns' ? 'Danh sách hàng hoàn / lỗi' : 'Danh sách phiếu bù nhà máy'}
            </h3>
          </div>

          {/* Search & Filter */}
          <div style={{ padding: '16px 24px 0', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Tìm theo mã đơn, khách hàng..."
              style={{ ...PAGE_STYLES.input, borderRadius: '14px', flex: 1, minWidth: 200 }} />
            {activeTab === 'returns' ? (
              <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}
                style={{ ...PAGE_STYLES.input, borderRadius: '14px', minWidth: 180 }}>
                <option value="">Tất cả nguồn</option>
                <option value="during_delivery">Trong quá trình giao</option>
                <option value="after_delivery">Sau khi giao thành công</option>
              </select>
            ) : (
              <select value={compFilter} onChange={(e) => setCompFilter(e.target.value)}
                style={{ ...PAGE_STYLES.input, borderRadius: '14px', minWidth: 180 }}>
                <option value="">Tất cả trạng thái</option>
                <option value="pending">Chờ xác nhận</option>
                <option value="approved">Đã đồng ý</option>
              </select>
            )}
          </div>

          <div style={PAGE_STYLES.tableWrap}>
            {loading ? (
              <div style={{ padding: '28px', color: '#64748b' }}>Đang tải...</div>
            ) : (
              <table style={PAGE_STYLES.table}>
                <thead>
                  <tr>
                    {activeTab === 'returns' ? (
                      <>
                        <th style={PAGE_STYLES.th}>Mã đơn</th>
                        <th style={PAGE_STYLES.th}>Khách hàng</th>
                        <th style={PAGE_STYLES.th}>Nguồn</th>
                        <th style={PAGE_STYLES.th}>Hướng xử lý</th>
                        <th style={PAGE_STYLES.th}>Trạng thái</th>
                        <th style={PAGE_STYLES.th}>Hành động</th>
                      </>
                    ) : (
                      <>
                        <th style={PAGE_STYLES.th}>Mã phiếu bù</th>
                        <th style={PAGE_STYLES.th}>Mã đơn</th>
                        <th style={PAGE_STYLES.th}>Khách hàng</th>
                        <th style={PAGE_STYLES.th}>Loại lỗi</th>
                        <th style={PAGE_STYLES.th}>Trạng thái</th>
                        <th style={PAGE_STYLES.th}>Hành động</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {activeTab === 'returns' ? (
                    filteredReturns.length === 0 ? (
                      <tr><td colSpan="6" style={{ ...PAGE_STYLES.td, textAlign: 'center', color: '#94a3b8', padding: '36px' }}>Chưa có yêu cầu hoàn hàng nào.</td></tr>
                    ) : filteredReturns.map((ret) => (
                      <tr key={ret.id}>
                        <td style={{ ...PAGE_STYLES.td, borderTopLeftRadius: '18px', borderBottomLeftRadius: '18px' }}>
                          <div style={{ fontWeight: 900, color: '#1d4ed8' }}>{ret.order_no}</div>
                        </td>
                        <td style={PAGE_STYLES.td}><div style={{ fontWeight: 700 }}>{ret.customer_name || '—'}</div></td>
                        <td style={PAGE_STYLES.td}>
                          <span style={{ ...PAGE_STYLES.badge, background: ret.complaint_source === 'after_delivery' ? '#ede9fe' : '#fef3c7', color: ret.complaint_source === 'after_delivery' ? '#6d28d9' : '#92400e' }}>
                            {ret.complaint_source === 'after_delivery' ? 'Sau giao' : 'Trong giao'}
                          </span>
                        </td>
                        <td style={PAGE_STYLES.td}>
                          {ret.logistics_action ? getActionBadge(ret.logistics_action) : (
                            <span style={{ ...PAGE_STYLES.badge, background: '#f1f5f9', color: '#94a3b8' }}>Chưa chọn</span>
                          )}
                        </td>
                        <td style={PAGE_STYLES.td}>{getStatusBadge(ret.status)}</td>
                        <td style={{ ...PAGE_STYLES.td, borderTopRightRadius: '18px', borderBottomRightRadius: '18px' }}>
                          {ret.status === 'return_pending' && ret.logistics_action && canProcess ? (
                            <button onClick={() => openProcessModal(ret)} style={{ ...actionBtn('#ef4444'), padding: '8px 14px' }}>
                              <i className="ri-settings-3-line" style={{ marginRight: '6px' }} />Xử lý
                            </button>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '13px' }}>
                              {!canProcess ? 'Chỉ xem' : '—'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    filteredComps.length === 0 ? (
                      <tr><td colSpan="6" style={{ ...PAGE_STYLES.td, textAlign: 'center', color: '#94a3b8', padding: '36px' }}>Chưa có phiếu bù nào.</td></tr>
                    ) : filteredComps.map((comp) => (
                      <tr key={comp.id}>
                        <td style={{ ...PAGE_STYLES.td, borderTopLeftRadius: '18px', borderBottomLeftRadius: '18px' }}>
                          <div style={{ fontWeight: 900, color: '#991b1b' }}>{comp.compensation_no}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{formatDate(comp.created_at)}</div>
                        </td>
                        <td style={PAGE_STYLES.td}><div style={{ fontWeight: 700, color: '#1d4ed8' }}>{comp.order_no || '—'}</div></td>
                        <td style={PAGE_STYLES.td}><div style={{ fontWeight: 700 }}>{comp.customer_name || '—'}</div></td>
                        <td style={PAGE_STYLES.td}>
                          <span style={{ ...PAGE_STYLES.badge, background: comp.defect_type === 'loi_nha_may' ? '#fee2e2' : '#e0f2fe', color: comp.defect_type === 'loi_nha_may' ? '#991b1b' : '#0369a1' }}>
                            {comp.defect_type === 'loi_nha_may' ? 'Lỗi nhà máy' : 'Lỗi vận chuyển'}
                          </span>
                        </td>
                        <td style={PAGE_STYLES.td}>{getCompStatusBadge(comp.status)}</td>
                        <td style={{ ...PAGE_STYLES.td, borderTopRightRadius: '18px', borderBottomRightRadius: '18px' }}>
                          <button onClick={() => openCompModal(comp)} style={{ ...actionBtn('#6366f1'), padding: '8px 14px' }}>
                            <i className="ri-eye-line" style={{ marginRight: '6px' }} />
                            {canApproveCompensation(comp) ? 'Xem & Duyệt' : 'Xem'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      {processModal}
      {compModal}
    </div>
  );
}
