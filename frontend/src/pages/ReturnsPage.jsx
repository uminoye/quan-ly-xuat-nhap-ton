import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

export default function ReturnsPage() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [hoveredRowId, setHoveredRowId] = useState(null);
  const [isContentVisible, setIsContentVisible] = useState(false);
  const [hoveredStat, setHoveredStat] = useState(null);

  const [isProcessOpen, setIsProcessOpen] = useState(false);
  const [processTarget, setProcessTarget] = useState(null);
  const [processAction, setProcessAction] = useState('accept');
  const [processNote, setProcessNote] = useState('');
  const [processingSubmit, setProcessingSubmit] = useState(false);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsProcessOpen(false);
        setIsDetailOpen(false);
        setDetailItem(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const fetchReturns = async ({ showLoading = false } = {}) => {
    if (showLoading) setLoading(true);
    setError(null);

    try {
      let data = [];
      try {
        const res = await api.get('/receipts', { params: { type: 'return' } });
        data = res.data || [];
      } catch {
        try {
          const res2 = await api.get('/orders', { params: { type: 'return' } });
          data = res2.data || [];
        } catch {
          data = [];
        }
      }
      setReturns(data);
    } catch (err) {
      console.error('Lỗi tải dữ liệu hoàn/trả:', err);
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
      setReturns([]);
    } finally {
      setLoading(false);
      setIsContentVisible(true);
    }
  };

  useEffect(() => {
    fetchReturns({ showLoading: true });
  }, []);

  useEffect(() => {
    if (loading) {
      setIsContentVisible(false);
      return;
    }
    const timer = window.setTimeout(() => setIsContentVisible(true), 60);
    return () => window.clearTimeout(timer);
  }, [loading, returns.length]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setIsContentVisible(false);
    await fetchReturns({ showLoading: true });
    setRefreshing(false);
  };

  const statusStyle = (status) => {
    const map = {
      pending: { bg: '#fef3c7', color: '#92400e', label: 'Đang chờ' },
      processing: { bg: '#dbeafe', color: '#1d4ed8', label: 'Đang xử lý' },
      completed: { bg: '#d1fae5', color: '#047857', label: 'Đã xử lý' },
      accepted: { bg: '#d1fae5', color: '#047857', label: 'Đã xử lý' },
      rejected: { bg: '#fee2e2', color: '#b91c1c', label: 'Từ chối' },
      returned: { bg: '#fee2e2', color: '#b91c1c', label: 'Từ chối' },
      error: { bg: '#fee2e2', color: '#b91c1c', label: 'Lỗi' },
    };
    return map[status] || { bg: '#f3f4f6', color: '#374151', label: status || 'N/A' };
  };

  const isPending = (item) => ['pending', 'processing'].includes(item.status);

  const filteredReturns = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return returns.filter((item) => {
      const itemStatus = item.status || 'unknown';
      const searchableText = [
        item.receipt_no,
        item.order_no,
        item.return_no,
        item.customer_name,
        item.reason,
        item.note,
        ...(item.items || []).flatMap((it) => [it.product_name, it.product_id]),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = !keyword || searchableText.includes(keyword);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'pending' && isPending(item)) ||
        (statusFilter === 'completed' && ['completed', 'accepted'].includes(item.status)) ||
        (statusFilter === 'rejected' && ['rejected', 'returned', 'error'].includes(item.status));

      return matchesSearch && matchesStatus;
    });
  }, [returns, searchTerm, statusFilter]);

  const getItemsSummary = (item) => {
    const items = item.items || [];
    if (!items.length) return '—';
    return items
      .map((it) => `${it.product_name || it.product_id} x${it.quantity}`)
      .join(', ');
  };

  const getTotalQuantity = (item) => {
    return (item.items || []).reduce((sum, it) => sum + (parseInt(it.quantity) || 0), 0);
  };

  const getCode = (item) => item.receipt_no || item.order_no || item.return_no || `RT${item.id}`;
  const getDate = (item) => item.return_date || item.receipt_date || item.order_date || item.created_at || null;
  const getCustomer = (item) => item.customer_name || item.partner_name || item.supplier_name || '—';
  const getReason = (item) => item.reason || item.note || '—';

  const openProcessModal = (item, action) => {
    setProcessTarget(item);
    setProcessAction(action);
    setProcessNote('');
    setIsProcessOpen(true);
  };

  const handleProcess = async (e) => {
    e.preventDefault();
    if (!processTarget) return;
    setProcessingSubmit(true);

    try {
      const newStatus = processAction === 'accept' ? 'completed' : 'rejected';
      const endpoint = `/receipts/${processTarget.id}`;
      try {
        await api.put(endpoint, { status: newStatus, note: processNote });
      } catch {
        try {
          await api.put(`/orders/${processTarget.id}`, { status: newStatus, note: processNote });
        } catch {
          await api.patch(endpoint, { status: newStatus, note: processNote });
        }
      }

      alert(
        processAction === 'accept'
          ? 'Đã chấp nhận yêu cầu hoàn/trả hàng!'
          : 'Đã từ chối yêu cầu hoàn/trả hàng!'
      );
      setIsProcessOpen(false);
      fetchReturns();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Lỗi không xác định';
      alert('Không thể xử lý: ' + msg);
    } finally {
      setProcessingSubmit(false);
    }
  };

  const openDetailModal = async (item) => {
    setIsDetailOpen(true);
    setDetailItem(item);
    setDetailLoading(false);
  };

  const tableWrapStyle = {
    background: '#fff',
    borderRadius: '20px',
    border: '1px solid #e8eef5',
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.04)',
    overflow: 'hidden',
    opacity: isContentVisible ? 1 : 0,
    transform: isContentVisible ? 'translateY(0)' : 'translateY(10px)',
    transition: 'opacity 320ms ease, transform 320ms ease',
  };

  const cellStyle = {
    padding: '16px 18px',
    verticalAlign: 'middle',
    color: '#334155',
    fontSize: '14px',
  };

  const iconBtnStyle = {
    width: '38px',
    height: '38px',
    borderRadius: '12px',
    border: '1px solid #dbe3ee',
    background: '#fff',
    color: '#0f172a',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)',
  };

  const statIcons = {
    total: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: '22px', height: '22px' }}>
        <path d="M9 2h6l1 7H8L9 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M4 9v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    pending: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: '22px', height: '22px' }}>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    completed: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: '22px', height: '22px' }}>
        <path d="M20 7L10 17l-5-5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    rejected: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: '22px', height: '22px' }}>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
        <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  };

  const stats = [
    {
      id: 'total',
      label: 'Tổng phiếu',
      value: returns.length,
      color: '#2563eb',
      icon: statIcons.total,
    },
    {
      id: 'pending',
      label: 'Đang chờ',
      value: returns.filter((r) => isPending(r)).length,
      color: '#f59e0b',
      icon: statIcons.pending,
    },
    {
      id: 'completed',
      label: 'Đã xử lý',
      value: returns.filter((r) => ['completed', 'accepted'].includes(r.status)).length,
      color: '#10b981',
      icon: statIcons.completed,
    },
    {
      id: 'rejected',
      label: 'Từ chối',
      value: returns.filter((r) => ['rejected', 'returned', 'error'].includes(r.status)).length,
      color: '#ef4444',
      icon: statIcons.rejected,
    },
  ];

  const skeletonRows = Array.from({ length: 6 }, (_, i) => i);
  const skeletonStyle = {
    height: '14px',
    borderRadius: '999px',
    background: 'linear-gradient(90deg, #e8eef5 25%, #f4f7fb 37%, #e8eef5 63%)',
    backgroundSize: '400% 100%',
    animation: 'shimmer 1.4s ease infinite',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f6f8fc 0%, #eef3f9 100%)', padding: '20px' }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes rowFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalScaleIn {
          from { opacity: 0; transform: scale(0.96) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .modal-animate { animation: modalFadeIn 180ms ease-out; }
        .modal-panel-animate { animation: modalScaleIn 220ms ease-out; }
      `}</style>

      <div style={{ maxWidth: '1480px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '12px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '28px', color: '#0f172a', letterSpacing: '-0.02em' }}>
              Xử lý hàng hoàn / lỗi
            </h2>
            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px', lineHeight: 1.6 }}>
              Quản lý và xử lý yêu cầu hoàn trả, hàng lỗi từ khách hàng
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              style={{
                background: '#fff',
                border: '1px solid #dbe3ee',
                borderRadius: '12px',
                padding: '10px 16px',
                fontWeight: 700,
                cursor: refreshing ? 'wait' : 'pointer',
                boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                opacity: refreshing ? 0.85 : 1,
                fontFamily: 'inherit',
                transition: 'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease, background 160ms ease',
              }}
              onMouseEnter={(e) => {
                if (refreshing) return;
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 10px 20px rgba(15, 23, 42, 0.08)';
                e.currentTarget.style.borderColor = '#bcd0ea';
                e.currentTarget.style.background = '#f8fafc';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 2px rgba(15, 23, 42, 0.04)';
                e.currentTarget.style.borderColor = '#dbe3ee';
                e.currentTarget.style.background = '#fff';
              }}
            >
              <i
                className="ri-refresh-line"
                style={{ fontSize: '16px', animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }}
              />
              <span>{refreshing ? 'Đang làm mới...' : 'Làm mới'}</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '14px', marginBottom: '16px' }}>
          {stats.map((stat) => {
            const hoverStyles = {
              total: { boxShadow: '0 18px 34px rgba(37,99,235,0.14)', borderColor: 'rgba(37,99,235,0.22)' },
              pending: { boxShadow: '0 18px 34px rgba(245,158,11,0.14)', borderColor: 'rgba(245,158,11,0.22)' },
              completed: { boxShadow: '0 18px 34px rgba(22,163,74,0.14)', borderColor: 'rgba(22,163,74,0.22)' },
              rejected: { boxShadow: '0 18px 34px rgba(239,68,68,0.14)', borderColor: 'rgba(239,68,68,0.22)' },
            };
            const isHovered = hoveredStat === stat.id;

            return (
              <div
                key={stat.id}
                onMouseEnter={() => setHoveredStat(stat.id)}
                onMouseLeave={() => setHoveredStat(null)}
                style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(241,245,249,0.94))',
                  border: '1px solid',
                  borderColor: isHovered ? (hoverStyles[stat.id]?.borderColor || '#e8eef5') : '#e8eef5',
                  borderTopWidth: '4px',
                  borderTopStyle: 'solid',
                  borderTopColor: stat.color,
                  borderRadius: '18px',
                  padding: '18px 20px',
                  boxShadow: isHovered ? (hoverStyles[stat.id]?.boxShadow || '0 10px 24px rgba(15,23,42,0.10)') : '0 10px 24px rgba(15, 23, 42, 0.04)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, filter 0.2s ease',
                  transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                  filter: isHovered ? 'saturate(1.03)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '14px',
                      background: stat.color,
                      color: '#fff',
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    {stat.icon}
                  </div>
                  <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 700 }}>{stat.label}</div>
                </div>
                <div style={{ fontSize: '34px', lineHeight: 1, fontWeight: 800, color: stat.color }}>
                  {stat.value}
                </div>
              </div>
            );
          })}
        </div>

        {/* Error state */}
        {error && (
          <div
            style={{
              marginBottom: '16px',
              padding: '16px 20px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '14px',
              color: '#991b1b',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <i className="ri-error-warning-line" style={{ fontSize: '20px' }} />
            <span>{error}</span>
          </div>
        )}

        {/* Table */}
        <div style={tableWrapStyle}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #eef2f7', background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a', letterSpacing: '-0.02em' }}>
                  Danh sách phiếu hoàn / lỗi
                </h3>
                <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '13px' }}>
                  {filteredReturns.length} phiếu được tìm thấy
                </p>
              </div>
            </div>

            {/* Filters */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 2fr) repeat(2, minmax(180px, 1fr)) auto',
                gap: '12px',
                alignItems: 'center',
              }}
            >
              <div style={{ position: 'relative' }}>
                <i
                  className="ri-search-line"
                  style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm mã phiếu, khách hàng, sản phẩm..."
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 40px',
                    borderRadius: '12px',
                    border: '1px solid #dbe3ee',
                    outline: 'none',
                    fontSize: '14px',
                    background: '#fff',
                  }}
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid #dbe3ee',
                  outline: 'none',
                  fontSize: '14px',
                  background: '#fff',
                }}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Đang chờ</option>
                <option value="completed">Đã xử lý</option>
                <option value="rejected">Từ chối</option>
              </select>

              <div />

              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid #dbe3ee',
                  background: '#f8fafc',
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: '#0f172a',
                }}
              >
                Xóa lọc
              </button>
            </div>
          </div>

          {/* Table content */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '1200px', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#64748b', fontSize: '12px', background: '#f8fafc' }}>
                  <th style={{ ...cellStyle, width: '140px' }}>Mã phiếu</th>
                  <th style={{ ...cellStyle, width: '130px' }}>Ngày</th>
                  <th style={{ ...cellStyle, width: '180px' }}>Khách hàng</th>
                  <th style={{ ...cellStyle, minWidth: '240px' }}>Sản phẩm</th>
                  <th style={{ ...cellStyle, width: '110px' }}>Số lượng</th>
                  <th style={{ ...cellStyle, width: '200px' }}>Lý do</th>
                  <th style={{ ...cellStyle, width: '140px' }}>Trạng thái</th>
                  <th style={{ ...cellStyle, width: '180px', textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading || refreshing ? (
                  skeletonRows.map((i) => (
                    <tr key={`skeleton-${i}`} style={{ borderTop: '1px solid #eef2f7' }}>
                      <td style={cellStyle}><div style={{ ...skeletonStyle, width: '90px' }} /></td>
                      <td style={cellStyle}><div style={{ ...skeletonStyle, width: '80px' }} /></td>
                      <td style={cellStyle}><div style={{ ...skeletonStyle, width: '130px' }} /></td>
                      <td style={cellStyle}><div style={{ ...skeletonStyle, width: '100%' }} /></td>
                      <td style={cellStyle}><div style={{ ...skeletonStyle, width: '60px' }} /></td>
                      <td style={cellStyle}><div style={{ ...skeletonStyle, width: '120px' }} /></td>
                      <td style={cellStyle}><div style={{ ...skeletonStyle, width: '90px', height: '28px' }} /></td>
                      <td style={{ ...cellStyle, textAlign: 'center' }}><div style={{ ...skeletonStyle, width: '80px', height: '36px', margin: '0 auto' }} /></td>
                    </tr>
                  ))
                ) : filteredReturns.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
                      <div style={{ marginBottom: '12px' }}>
                        <i className="ri-inbox-line" style={{ fontSize: '40px', opacity: 0.4 }} />
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>Không có phiếu hoàn / lỗi nào</div>
                      <div style={{ fontSize: '13px' }}>Danh sách trống hoặc không có kết quả phù hợp với bộ lọc</div>
                    </td>
                  </tr>
                ) : (
                  filteredReturns.map((item, index) => {
                    const s = statusStyle(item.status);
                    const isHovered = hoveredRowId === item.id;
                    const pending = isPending(item);

                    return (
                      <tr
                        key={item.id}
                        onMouseEnter={() => setHoveredRowId(item.id)}
                        onMouseLeave={() => setHoveredRowId(null)}
                        style={{
                          borderTop: '1px solid #eef2f7',
                          opacity: isContentVisible ? 1 : 0,
                          background: isHovered ? 'linear-gradient(90deg, rgba(37,99,235,0.03), rgba(59,130,246,0.01))' : '#fff',
                          animation: isContentVisible ? `rowFadeIn 420ms ease ${Math.min(240, index * 45)}ms both` : 'none',
                        }}
                      >
                        <td style={{ ...cellStyle, fontWeight: 800, color: '#2563eb' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="ri-file-list-3-line" style={{ color: '#94a3b8', fontSize: '16px' }} />
                            {getCode(item)}
                          </div>
                        </td>
                        <td style={cellStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' }}>
                            <i className="ri-calendar-line" style={{ color: '#94a3b8' }} />
                            {getDate(item) ? new Date(getDate(item)).toLocaleDateString('vi-VN') : '—'}
                          </div>
                        </td>
                        <td style={cellStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="ri-user-3-line" style={{ color: '#94a3b8' }} />
                            <span style={{ color: '#0f172a', fontWeight: 500 }}>{getCustomer(item)}</span>
                          </div>
                        </td>
                        <td style={{ ...cellStyle, color: '#475569', lineHeight: 1.6, maxWidth: '240px' }}>
                          <div
                            style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              whiteSpace: 'normal',
                            }}
                          >
                            {getItemsSummary(item)}
                          </div>
                        </td>
                        <td style={cellStyle}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              minWidth: '40px',
                              padding: '4px 10px',
                              background: '#f1f5f9',
                              borderRadius: '8px',
                              fontWeight: 700,
                              color: '#334155',
                              fontSize: '13px',
                            }}
                          >
                            {getTotalQuantity(item)}
                          </span>
                        </td>
                        <td style={{ ...cellStyle, color: '#64748b', maxWidth: '200px' }}>
                          <div
                            style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              whiteSpace: 'normal',
                            }}
                          >
                            {getReason(item)}
                          </div>
                        </td>
                        <td style={cellStyle}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '7px 12px',
                              borderRadius: '999px',
                              background: s.bg,
                              color: s.color,
                              fontSize: '12px',
                              fontWeight: 700,
                              transition: 'all 160ms ease',
                            }}
                          >
                            {s.label}
                          </span>
                        </td>
                        <td style={{ ...cellStyle, textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={() => openDetailModal(item)}
                              style={{
                                ...iconBtnStyle,
                                ...(isHovered ? { transform: 'translateY(-1px) scale(1.03)', boxShadow: '0 10px 20px rgba(15, 23, 42, 0.10)', borderColor: '#bcd0ea' } : {}),
                              }}
                              title="Xem chi tiết"
                              aria-label="Xem chi tiết"
                            >
                              <i className="ri-eye-line" style={{ fontSize: '16px' }} />
                            </button>

                            {pending && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => openProcessModal(item, 'accept')}
                                  style={{
                                    padding: '9px 12px',
                                    background: '#2563eb',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    boxShadow: '0 6px 14px rgba(37, 99, 235, 0.22)',
                                    transition: 'transform 160ms ease, box-shadow 160ms ease, filter 160ms ease',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                    e.currentTarget.style.boxShadow = '0 10px 20px rgba(37, 99, 235, 0.28)';
                                    e.currentTarget.style.filter = 'brightness(1.04)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 6px 14px rgba(37, 99, 235, 0.22)';
                                    e.currentTarget.style.filter = 'brightness(1)';
                                  }}
                                >
                                  Duyệt
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openProcessModal(item, 'reject')}
                                  style={{
                                    padding: '9px 12px',
                                    background: '#ef4444',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    boxShadow: '0 6px 14px rgba(239, 68, 68, 0.22)',
                                    transition: 'transform 160ms ease, box-shadow 160ms ease, filter 160ms ease',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                    e.currentTarget.style.boxShadow = '0 10px 20px rgba(239, 68, 68, 0.28)';
                                    e.currentTarget.style.filter = 'brightness(1.04)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 6px 14px rgba(239, 68, 68, 0.22)';
                                    e.currentTarget.style.filter = 'brightness(1)';
                                  }}
                                >
                                  Từ chối
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Process Modal */}
      {isProcessOpen && processTarget && (
        <div className="modal-animate" style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.62)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '18px' }}>
          <div className="modal-panel-animate" style={{ width: 'min(520px, 100%)', background: '#fff', borderRadius: '24px', border: '1px solid #e5eef8', boxShadow: '0 30px 80px rgba(15, 23, 42, 0.22)' }}>
            <div style={{ padding: '22px 24px', borderBottom: '1px solid #eef2f7', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '13px', color: processAction === 'accept' ? '#2563eb' : '#ef4444', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {processAction === 'accept' ? 'Chấp nhận hoàn trả' : 'Từ chối hoàn trả'}
                </div>
                <h3 style={{ margin: '6px 0 0', fontSize: '22px', color: '#0f172a' }}>
                  {processAction === 'accept' ? 'Xác nhận đồng ý hoàn hàng' : 'Xác nhận từ chối hoàn hàng'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsProcessOpen(false)}
                style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1px solid #dbe3ee', background: '#fff', cursor: 'pointer', fontSize: '18px' }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleProcess} style={{ padding: '22px 24px 24px' }}>
              <div
                style={{
                  padding: '16px',
                  borderRadius: '14px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  marginBottom: '18px',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Mã phiếu</div>
                    <div style={{ fontWeight: 800, color: '#2563eb' }}>{getCode(processTarget)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Khách hàng</div>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{getCustomer(processTarget)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Ngày</div>
                    <div style={{ fontWeight: 600, color: '#334155' }}>
                      {getDate(processTarget) ? new Date(getDate(processTarget)).toLocaleDateString('vi-VN') : '—'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Tổng số lượng</div>
                    <div style={{ fontWeight: 700, color: '#334155' }}>{getTotalQuantity(processTarget)} sản phẩm</div>
                  </div>
                </div>

                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Sản phẩm</div>
                  <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>{getItemsSummary(processTarget)}</div>
                </div>

                {getReason(processTarget) && getReason(processTarget) !== '—' && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Lý do</div>
                    <div style={{ fontSize: '13px', color: '#475569' }}>{getReason(processTarget)}</div>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: '#334155' }}>
                  Ghi chú xử lý {processAction === 'accept' ? '(tùy chọn)' : '(bắt buộc)'}
                </label>
                <textarea
                  value={processNote}
                  onChange={(e) => setProcessNote(e.target.value)}
                  placeholder={
                    processAction === 'accept'
                      ? 'VD: Đã nhận hàng hoàn, tiền sẽ được hoàn trả trong 3-5 ngày làm việc...'
                      : 'VD: Sản phẩm không thuộc diện đổi trả, đã quá hạn 30 ngày...'
                  }
                  required={processAction === 'reject'}
                  style={{
                    width: '100%',
                    minHeight: '120px',
                    padding: '12px 14px',
                    border: '1px solid #dbe3ee',
                    borderRadius: '14px',
                    outline: 'none',
                    resize: 'vertical',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="submit"
                  disabled={processingSubmit}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    background: processAction === 'accept' ? '#2563eb' : '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '14px',
                    fontWeight: 800,
                    cursor: processingSubmit ? 'wait' : 'pointer',
                    opacity: processingSubmit ? 0.8 : 1,
                    fontSize: '15px',
                  }}
                >
                  {processingSubmit ? 'Đang xử lý...' : processAction === 'accept' ? 'Xác nhận duyệt' : 'Xác nhận từ chối'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsProcessOpen(false)}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    background: '#f1f5f9',
                    color: '#0f172a',
                    border: '1px solid #dbe3ee',
                    borderRadius: '14px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontSize: '15px',
                  }}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {isDetailOpen && detailItem && (
        <div className="modal-animate" style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.62)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '18px' }}>
          <div className="modal-panel-animate" style={{ width: 'min(760px, 100%)', maxHeight: '90vh', overflowY: 'auto', background: '#fff', borderRadius: '24px', border: '1px solid #e5eef8', boxShadow: '0 30px 80px rgba(15, 23, 42, 0.22)' }}>
            <div style={{ padding: '22px 24px', borderBottom: '1px solid #eef2f7', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#2563eb', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Chi tiết phiếu hoàn / lỗi
                </div>
                <h3 style={{ margin: '6px 0 0', fontSize: '22px', color: '#0f172a' }}>
                  {getCode(detailItem)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1px solid #dbe3ee', background: '#fff', cursor: 'pointer', fontSize: '18px' }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: '22px 24px 24px' }}>
              {detailLoading ? (
                <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Đang tải chi tiết...</div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '14px', marginBottom: '18px' }}>
                    <div style={{ padding: '14px 16px', border: '1px solid #e5eef8', borderRadius: '16px', background: '#f8fbff' }}>
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Mã phiếu</div>
                      <div style={{ fontWeight: 800, color: '#2563eb', fontSize: '15px' }}>{getCode(detailItem)}</div>
                    </div>
                    <div style={{ padding: '14px 16px', border: '1px solid #e5eef8', borderRadius: '16px', background: '#f8fbff' }}>
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Ngày</div>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>
                        {getDate(detailItem) ? new Date(getDate(detailItem)).toLocaleDateString('vi-VN') : '—'}
                      </div>
                    </div>
                    <div style={{ padding: '14px 16px', border: '1px solid #e5eef8', borderRadius: '16px', background: '#f8fbff' }}>
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Khách hàng</div>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{getCustomer(detailItem)}</div>
                    </div>
                    <div style={{ padding: '14px 16px', border: '1px solid #e5eef8', borderRadius: '16px', background: '#f8fbff' }}>
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Tổng số lượng</div>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{getTotalQuantity(detailItem)} sản phẩm</div>
                    </div>
                    <div style={{ padding: '14px 16px', border: '1px solid #e5eef8', borderRadius: '16px', background: '#f8fbff' }}>
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Trạng thái</div>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '6px 12px',
                          borderRadius: '999px',
                          background: statusStyle(detailItem.status).bg,
                          color: statusStyle(detailItem.status).color,
                          fontSize: '13px',
                          fontWeight: 700,
                        }}
                      >
                        {statusStyle(detailItem.status).label}
                      </span>
                    </div>
                    <div style={{ padding: '14px 16px', border: '1px solid #e5eef8', borderRadius: '16px', background: '#f8fbff' }}>
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Lý do</div>
                      <div style={{ fontWeight: 600, color: '#334155', fontSize: '13px' }}>{getReason(detailItem)}</div>
                    </div>
                  </div>

                  {/* Products table */}
                  <div style={{ border: '1px solid #e5eef8', borderRadius: '18px', overflow: 'hidden' }}>
                    <div style={{ padding: '14px 16px', background: '#f8fbff', borderBottom: '1px solid #e5eef8', fontWeight: 800, color: '#0f172a' }}>
                      Sản phẩm hoàn / lỗi
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ textAlign: 'left', background: '#fff' }}>
                          <th style={{ padding: '12px 16px', borderBottom: '1px solid #eef2f7', color: '#64748b', fontSize: '12px', fontWeight: 700 }}>Tên sản phẩm</th>
                          <th style={{ padding: '12px 16px', borderBottom: '1px solid #eef2f7', color: '#64748b', fontSize: '12px', fontWeight: 700, width: '120px' }}>Số lượng</th>
                          <th style={{ padding: '12px 16px', borderBottom: '1px solid #eef2f7', color: '#64748b', fontSize: '12px', fontWeight: 700, width: '120px' }}>Đơn vị</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(detailItem.items || []).map((item, idx) => (
                          <tr key={`${item.product_id}-${idx}`} style={{ borderTop: idx > 0 ? '1px solid #f1f5f9' : 'none' }}>
                            <td style={{ padding: '12px 16px', color: '#334155' }}>{item.product_name || item.product_id || '—'}</td>
                            <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>{item.quantity || 0}</td>
                            <td style={{ padding: '12px 16px', color: '#64748b' }}>{item.unit || ' cái'}</td>
                          </tr>
                        ))}
                        {(!detailItem.items || detailItem.items.length === 0) && (
                          <tr>
                            <td colSpan="3" style={{ padding: '16px', textAlign: 'center', color: '#94a3b8' }}>
                              Không có thông tin sản phẩm
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Actions for pending items */}
                  {isPending(detailItem) && (
                    <div style={{ marginTop: '18px', display: 'flex', gap: '12px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setIsDetailOpen(false);
                          setTimeout(() => openProcessModal(detailItem, 'accept'), 100);
                        }}
                        style={{
                          flex: 1,
                          padding: '12px 16px',
                          background: '#2563eb',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '14px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          fontSize: '15px',
                          boxShadow: '0 8px 20px rgba(37, 99, 235, 0.22)',
                        }}
                      >
                        <i className="ri-check-line" style={{ marginRight: '8px' }} />
                        Chấp nhận hoàn trả
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsDetailOpen(false);
                          setTimeout(() => openProcessModal(detailItem, 'reject'), 100);
                        }}
                        style={{
                          flex: 1,
                          padding: '12px 16px',
                          background: '#ef4444',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '14px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          fontSize: '15px',
                          boxShadow: '0 8px 20px rgba(239, 68, 68, 0.22)',
                        }}
                      >
                        <i className="ri-close-line" style={{ marginRight: '8px' }} />
                        Từ chối hoàn trả
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
