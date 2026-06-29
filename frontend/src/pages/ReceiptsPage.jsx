import { useEffect, useMemo, useState } from 'react';
import ExcelJS from 'exceljs';
import api from '../services/api';

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [hoveredReceiptId, setHoveredReceiptId] = useState(null);
  const [isContentVisible, setIsContentVisible] = useState(false);
  const [tableLoading, setTableLoading] = useState(true);
  const [tableReady, setTableReady] = useState(false);
  const [hoveredStat, setHoveredStat] = useState(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [receiptNo, setReceiptNo] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);

  const [isRespondOpen, setIsRespondOpen] = useState(false);
  const [respondTargetId, setRespondTargetId] = useState(null);
  const [respondAction, setRespondAction] = useState('accept');
  const [respondDate, setRespondDate] = useState(new Date().toISOString().split('T')[0]);
  const [respondReason, setRespondReason] = useState('');

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailReceipt, setDetailReceipt] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsCreateOpen(false);
        setIsRespondOpen(false);
        setIsDetailOpen(false);
        setDetailReceipt(null);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const user = JSON.parse(localStorage.getItem('user'));
  const roleId = user?.role_id || 4;

  const fetchData = async ({ showTableLoading = false } = {}) => {
    if (showTableLoading) setTableLoading(true);

    try {
      const [recRes, prodRes, whRes] = await Promise.all([api.get('/receipts'), api.get('/products'), api.get('/warehouses')]);
      setReceipts(recRes.data || []);
      setProducts(prodRes.data || []);
      setWarehouses(whRes.data || []);
      if ((whRes.data || []).length > 0) setWarehouseId(String(whRes.data[0].id));
    } catch (error) {
      console.error('Lỗi tải dữ liệu', error);
    } finally {
      setLoading(false);
      setTableLoading(false);
      setIsContentVisible(true);
    }
  };

  useEffect(() => { fetchData({ showTableLoading: true }); }, []);

  useEffect(() => {
    if (loading) {
      setIsContentVisible(false);
      setTableReady(false);
      return undefined;
    }

    const contentTimer = window.setTimeout(() => setIsContentVisible(true), 60);
    const tableTimer = window.setTimeout(() => setTableReady(true), 180);

    return () => {
      window.clearTimeout(contentTimer);
      window.clearTimeout(tableTimer);
    };
  }, [loading, receipts.length]);

  const statusStyle = (status) => {
    const map = {
      PENDING: { bg: '#fef3c7', color: '#92400e', label: 'Chờ NM duyệt' },
      PROCESSING: { bg: '#dbeafe', color: '#1d4ed8', label: 'NM đang giao' },
      COMPLETED: { bg: '#d1fae5', color: '#047857', label: 'Đã nhập kho' },
      REJECTED: { bg: '#fee2e2', color: '#b91c1c', label: 'Bị từ chối' },
    };
    return map[status] || { bg: '#f3f4f6', color: '#374151', label: status || 'N/A' };
  };

  const getProductSummary = (receipt) => {
    const items = receipt.items || [];
    if (!items.length) return 'Chưa có sản phẩm';
    return items.map((item) => `${item.product_name || item.product_id} x${item.quantity}`).join(', ');
  };

  const getWarehouseName = (receipt) => receipt.warehouse_name || warehouses.find((w) => String(w.id) === String(receipt.warehouse_id))?.name || '—';

  const filteredReceipts = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return receipts.filter((receipt) => {
      const receiptStatus = receipt.status || 'unknown';
      const receiptWarehouseId = String(receipt.warehouse_id || '');
      const searchableText = [receipt.receipt_no, receipt.note, receipt.warehouse_name, ...(receipt.items || []).flatMap((item) => [item.product_name, item.product_id])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return (!keyword || searchableText.includes(keyword)) && (statusFilter === 'all' || receiptStatus === statusFilter) && (warehouseFilter === 'all' || receiptWarehouseId === warehouseFilter);
    });
  }, [receipts, searchTerm, statusFilter, warehouseFilter]);

  const addItem = () => setSelectedItems([...selectedItems, { product_id: '', quantity: 1 }]);
  const updateItem = (index, field, value) => { const newItems = [...selectedItems]; newItems[index][field] = value; setSelectedItems(newItems); };
  const removeItem = (index) => setSelectedItems(selectedItems.filter((_, i) => i !== index));

  const handleRefresh = async () => {
    setRefreshing(true);
    setIsContentVisible(false);
    await fetchData({ showTableLoading: true });
    setRefreshing(false);
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (selectedItems.length === 0) return alert('Chưa chọn sản phẩm!');
    try {
      await api.post('/receipts', { receipt_no: receiptNo, warehouse_id: warehouseId, receipt_date: receiptDate, note, items: selectedItems });
      alert('Đã gửi yêu cầu nhập hàng!');
      setIsCreateOpen(false);
      setReceiptNo('');
      setSelectedItems([]);
      setNote('');
      fetchData();
    } catch {
      alert('Lỗi tạo phiếu');
    }
  };

  const openRespondModal = (id, action) => { setRespondTargetId(id); setRespondAction(action); setRespondReason(''); setIsRespondOpen(true); };

  const openDetailModal = async (receipt) => {
    setIsDetailOpen(true);
    setDetailLoading(true);
    setDetailReceipt(receipt);

    try {
      const response = await api.get(`/receipts/${receipt.id}`);
      setDetailReceipt(response.data || receipt);
    } catch (error) {
      console.error('Lỗi tải chi tiết phiếu', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleRespond = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/receipts/${respondTargetId}/respond`, { action: respondAction, expected_date: respondDate, reason: respondReason });
      alert(respondAction === 'accept' ? 'Đã báo lịch giao hàng cho Kho!' : 'Đã từ chối phiếu!');
      setIsRespondOpen(false);
      fetchData();
    } catch (error) {
      const backendMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Lỗi hệ thống';
      alert(`Không thể xử lý phiếu: ${backendMessage}`);
    }
  };

  const handleConfirm = async (id) => {
    if (window.confirm('Xác nhận đã nhận đủ hàng? Tồn kho sẽ tự động cộng!')) {
      try {
        await api.put(`/receipts/${id}/confirm`);
        alert('Cộng tồn kho thành công!');
        fetchData();
      } catch {
        alert('Lỗi xác nhận');
      }
    }
  };

  const statIcons = {
    total: (<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: '22px', height: '22px' }}><path d="M4 7.5C4 6.12 5.12 5 6.5 5h11C18.88 5 20 6.12 20 7.5v9c0 1.38-1.12 2.5-2.5 2.5h-11C5.12 19 4 17.88 4 16.5v-9Z" stroke="currentColor" strokeWidth="1.8" /><path d="M8 9h8M8 12h8M8 15h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>),
    pending: (<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: '22px', height: '22px' }}><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" /></svg>),
    processing: (<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: '22px', height: '22px' }}><path d="M4 8h16l-1.2 6.5A2 2 0 0 1 16.83 16H7.17a2 2 0 0 1-1.97-1.5L4 8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>),
    completed: (<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: '22px', height: '22px' }}><path d="M20 7 10 17l-5-5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /><path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>),
  };

  const stats = [
    { id: 'total', label: 'Tổng phiếu', value: receipts.length, color: '#2563eb', icon: statIcons.total },
    { id: 'pending', label: 'Chờ duyệt', value: receipts.filter((r) => r.status === 'PENDING').length, color: '#f59e0b', icon: statIcons.pending },
    { id: 'completed', label: 'Đã nhập', value: receipts.filter((r) => r.status === 'COMPLETED').length, color: '#10b981', icon: statIcons.completed },
    { id: 'issues', label: 'Đang giao', value: receipts.filter((r) => r.status === 'PROCESSING').length, color: '#ef4444', icon: statIcons.processing },
  ];

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

  const cellStyle = { padding: '16px 18px', verticalAlign: 'top', color: '#334155', fontSize: '14px' };
  const rowBaseStyle = { borderTop: '1px solid #eef2f7', opacity: isContentVisible ? 1 : 0 };
  const rowHoverStyle = { background: 'linear-gradient(90deg, rgba(37,99,235,0.04), rgba(59,130,246,0.02))' };
  const iconButtonStyle = { width: '38px', height: '38px', borderRadius: '12px', border: '1px solid #dbe3ee', background: '#fff', color: '#0f172a', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)' };

  const formatDateForReport = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
    return date.toLocaleDateString('vi-VN');
  };

  const exportReceiptsExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Inventory Management';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.subject = 'Báo cáo nhập kho';
    workbook.title = 'Báo cáo nhập kho';
    workbook.company = 'Inventory Management';

    const worksheet = workbook.addWorksheet('Bao cao nhap kho', {
      pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
      views: [{ state: 'frozen', ySplit: 5 }],
    });

    const visibleReceipts = filteredReceipts;

    worksheet.mergeCells('A1:G1');
    worksheet.getCell('A1').value = 'BÁO CÁO NHẬP KHO';
    worksheet.getCell('A1').font = { bold: true, size: 18, color: { argb: 'FFFFFFFF' } };
    worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };

    worksheet.mergeCells('A2:G2');
    worksheet.getCell('A2').value = `Xuất lúc: ${new Date().toLocaleString('vi-VN')}  |  Tổng phiếu: ${visibleReceipts.length}`;
    worksheet.getCell('A2').font = { italic: true, size: 11, color: { argb: 'FF475569' } };
    worksheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.mergeCells('A3:G3');
    worksheet.getCell('A3').value = `Từ khóa: ${searchTerm || 'Tất cả'}  |  Trạng thái: ${statusFilter === 'all' ? 'Tất cả' : statusStyle(statusFilter).label}  |  Kho: ${warehouseFilter === 'all' ? 'Tất cả' : (warehouses.find((w) => String(w.id) === String(warehouseFilter))?.name || 'Tất cả')}`;
    worksheet.getCell('A3').font = { size: 11, color: { argb: 'FF64748B' } };
    worksheet.getCell('A3').alignment = { horizontal: 'center', vertical: 'middle' };

    const columns = [
      { header: 'Số phiếu', key: 'receipt_no', width: 18 },
      { header: 'Ngày', key: 'date', width: 14 },
      { header: 'Kho nhập', key: 'warehouse', width: 20 },
      { header: 'Trạng thái', key: 'status', width: 18 },
      { header: 'Sản phẩm nhập', key: 'items', width: 42 },
      { header: 'Lý do nhập', key: 'note', width: 36 },
      { header: 'Người tạo', key: 'creator', width: 18 },
    ];

    worksheet.columns = columns;
    worksheet.addRow(columns.map((column) => column.header));
    const headerRow = worksheet.getRow(4);
    headerRow.height = 22;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    });

    visibleReceipts.forEach((receipt) => {
      const itemsText = (receipt.items || []).map((item) => `${item.product_name || item.product_id} x${item.quantity}`).join('\n');
      const row = worksheet.addRow({
        receipt_no: receipt.receipt_no || '-',
        date: formatDateForReport(receipt.receipt_date),
        warehouse: getWarehouseName(receipt),
        status: statusStyle(receipt.status).label,
        items: itemsText || 'Không có sản phẩm',
        note: receipt.note || '—',
        creator: receipt.creator_name || '—',
      });

      row.height = Math.max(24, Math.ceil(Math.max(itemsText.length, (receipt.note || '—').length) / 36) * 18);
      row.eachCell((cell) => {
        cell.alignment = { vertical: 'top', wrapText: true };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      });
    });

    worksheet.autoFilter = { from: 'A4', to: 'G4' };
    worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 4 }];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bao-cao-nhap-kho-${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
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
        @keyframes rowFadeScaleIn {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
      <div style={{ maxWidth: '1480px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '28px', color: '#0f172a', letterSpacing: '-0.02em' }}>Nhập kho</h2>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button onClick={handleRefresh} disabled={refreshing} style={{ background: '#fff', border: '1px solid #dbe3ee', borderRadius: '12px', padding: '10px 16px', fontWeight: 700, cursor: refreshing ? 'wait' : 'pointer', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)', display: 'inline-flex', alignItems: 'center', gap: '8px', opacity: refreshing ? 0.85 : 1, fontFamily: 'inherit', transition: 'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease, background 160ms ease, filter 160ms ease' }}
              onMouseEnter={(e) => {
                if (refreshing) return;
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 10px 20px rgba(15, 23, 42, 0.08)';
                e.currentTarget.style.borderColor = '#bcd0ea';
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.filter = 'brightness(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 2px rgba(15, 23, 42, 0.04)';
                e.currentTarget.style.borderColor = '#dbe3ee';
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.filter = 'brightness(1)';
              }}>
              <i className="ri-refresh-line" style={{ fontSize: '16px', animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
              <span>{refreshing ? 'Đang làm mới...' : 'Làm mới'}</span>
            </button>
            <button
              type="button"
              onClick={exportReceiptsExcel}
              style={{
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                padding: '10px 16px',
                fontWeight: 400,
                cursor: 'pointer',
                boxShadow: '0 10px 22px rgba(34, 197, 94, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'transform 160ms ease, box-shadow 160ms ease, filter 160ms ease',
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 14px 26px rgba(34, 197, 94, 0.32)';
                e.currentTarget.style.filter = 'brightness(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 22px rgba(34, 197, 94, 0.25)';
                e.currentTarget.style.filter = 'brightness(1)';
              }}
            >
              <i className="ri-download-2-line" style={{ fontSize: '16px' }} />
              <span>Xuất Excel</span>
            </button>
            {(roleId === 1 || roleId === 4) && (
              <button onClick={() => setIsCreateOpen(true)} style={{ padding: '10px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 400, cursor: 'pointer', boxShadow: '0 10px 22px rgba(37, 99, 235, 0.18)', fontFamily: 'inherit', transition: 'transform 160ms ease, box-shadow 160ms ease, filter 160ms ease' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 14px 26px rgba(37, 99, 235, 0.24)'; e.currentTarget.style.filter = 'brightness(1.02)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 22px rgba(37, 99, 235, 0.18)'; e.currentTarget.style.filter = 'brightness(1)'; }}>+ Tạo Yêu Cầu Nhập</button>
            )}
          </div>
        </div>
        <div style={{ marginBottom: '18px', color: '#64748b' }}>Danh sách phiếu nhập, đồng bộ theo phong cách xuất kho</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '14px', marginBottom: '16px' }}>
          {stats.map((stat) => {
            const statHoverStyles = {
              total: { boxShadow: '0 18px 34px rgba(37,99,235,0.14)', borderColor: 'rgba(37,99,235,0.22)' },
              pending: { boxShadow: '0 18px 34px rgba(245,158,11,0.14)', borderColor: 'rgba(245,158,11,0.22)' },
              completed: { boxShadow: '0 18px 34px rgba(22,163,74,0.14)', borderColor: 'rgba(22,163,74,0.22)' },
              issues: { boxShadow: '0 18px 34px rgba(239,68,68,0.14)', borderColor: 'rgba(239,68,68,0.22)' },
            };
            const isHovered = hoveredStat === stat.id;

            return (
              <div
                key={stat.id}
                className="dashboard-hover-card"
                onMouseEnter={() => setHoveredStat(stat.id)}
                onMouseLeave={() => setHoveredStat(null)}
                style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(241,245,249,0.94))',
                  border: `1px solid ${isHovered ? (statHoverStyles[stat.id]?.borderColor || '#e8eef5') : '#e8eef5'}`,
                  borderTop: '4px solid transparent',
                  borderRadius: '18px',
                  padding: '18px 20px',
                  boxShadow: isHovered ? (statHoverStyles[stat.id]?.boxShadow || '0 18px 34px rgba(15,23,42,0.10)') : '0 10px 24px rgba(15, 23, 42, 0.04)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, filter 0.2s ease',
                  transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                  filter: isHovered ? 'saturate(1.03)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: stat.color, color: '#fff', display: 'grid', placeItems: 'center' }}>{stat.icon}</div>
                  <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 700 }}>{stat.label}</div>
                </div>
                <div style={{ fontSize: '34px', lineHeight: 1, fontWeight: 800, color: stat.color }}>{stat.value}</div>
              </div>
            );
          })}
        </div>

        <div style={tableWrapStyle}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #eef2f7', background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a', letterSpacing: '-0.02em' }}>Bảng nhập kho</h3>
                <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '13px' }}>Danh sách phiếu nhập, đồng bộ theo phong cách xuất kho</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) repeat(2, minmax(180px, 1fr)) auto', gap: '12px', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <i className="ri-search-line" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Tìm phiếu, sản phẩm, kho..." style={{ width: '100%', padding: '12px 14px 12px 40px', borderRadius: '12px', border: '1px solid #dbe3ee' }} />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #dbe3ee' }}>
                <option value="all">Tất cả trạng thái</option>
                <option value="PENDING">Chờ duyệt</option>
                <option value="PROCESSING">Đang giao</option>
                <option value="COMPLETED">Đã nhập</option>
                <option value="REJECTED">Bị từ chối</option>
              </select>
              <select value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #dbe3ee' }}>
                <option value="all">Tất cả kho</option>
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
              <button type="button" onClick={() => { setSearchTerm(''); setStatusFilter('all'); setWarehouseFilter('all'); }} style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid #dbe3ee', background: '#f8fafc', fontWeight: 700 }}>Xóa lọc</button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '1280px', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#64748b', fontSize: '12px', background: '#f8fafc' }}>
                  <th style={{ ...cellStyle, width: '120px' }}>Số phiếu</th>
                  <th style={{ ...cellStyle, width: '130px' }}>Ngày</th>
                  <th style={{ ...cellStyle, width: '180px' }}>Kho nhập</th>
                  <th style={{ ...cellStyle, minWidth: '320px' }}>Sản phẩm nhập</th>
                  <th style={{ ...cellStyle, width: '180px' }}>Ghi chú</th>
                  <th style={{ ...cellStyle, width: '170px' }}>Trạng thái</th>
                  <th style={{ ...cellStyle, width: '120px' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {tableLoading || refreshing ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <tr key={`skeleton-${index}`} style={rowBaseStyle}>
                      <td style={cellStyle}><div style={{ height: '14px', borderRadius: '999px', background: 'linear-gradient(90deg, #e8eef5 25%, #f4f7fb 37%, #e8eef5 63%)', backgroundSize: '400% 100%', animation: 'shimmer 1.4s ease infinite', width: '80px' }} /></td>
                      <td style={cellStyle}><div style={{ height: '14px', borderRadius: '999px', background: 'linear-gradient(90deg, #e8eef5 25%, #f4f7fb 37%, #e8eef5 63%)', backgroundSize: '400% 100%', animation: 'shimmer 1.4s ease infinite', width: '90px' }} /></td>
                      <td style={cellStyle}><div style={{ height: '14px', borderRadius: '999px', background: 'linear-gradient(90deg, #e8eef5 25%, #f4f7fb 37%, #e8eef5 63%)', backgroundSize: '400% 100%', animation: 'shimmer 1.4s ease infinite', width: '130px' }} /></td>
                      <td style={cellStyle}><div style={{ height: '14px', borderRadius: '999px', background: 'linear-gradient(90deg, #e8eef5 25%, #f4f7fb 37%, #e8eef5 63%)', backgroundSize: '400% 100%', animation: 'shimmer 1.4s ease infinite', width: '100%' }} /></td>
                      <td style={cellStyle}><div style={{ height: '14px', borderRadius: '999px', background: 'linear-gradient(90deg, #e8eef5 25%, #f4f7fb 37%, #e8eef5 63%)', backgroundSize: '400% 100%', animation: 'shimmer 1.4s ease infinite', width: '120px' }} /></td>
                      <td style={cellStyle}><div style={{ height: '24px', borderRadius: '999px', background: 'linear-gradient(90deg, #e8eef5 25%, #f4f7fb 37%, #e8eef5 63%)', backgroundSize: '400% 100%', animation: 'shimmer 1.4s ease infinite', width: '90px' }} /></td>
                      <td style={cellStyle}><div style={{ height: '38px', width: '38px', borderRadius: '12px', background: 'linear-gradient(90deg, #e8eef5 25%, #f4f7fb 37%, #e8eef5 63%)', backgroundSize: '400% 100%', animation: 'shimmer 1.4s ease infinite' }} /></td>
                    </tr>
                  ))
                ) : filteredReceipts.length === 0 ? (
                  <tr><td colSpan="7" style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>Chưa có phiếu nhập nào.</td></tr>
                ) : filteredReceipts.map((r, index) => {
                  const s = statusStyle(r.status);
                  const isHovered = hoveredReceiptId === r.id;
                  return (
                    <tr
                      key={r.id}
                      onMouseEnter={() => setHoveredReceiptId(r.id)}
                      onMouseLeave={() => setHoveredReceiptId(null)}
                      style={{ ...rowBaseStyle, ...(isHovered ? rowHoverStyle : {}), animation: tableReady ? `rowFadeScaleIn 420ms cubic-bezier(0.16, 1, 0.3, 1) ${Math.min(260, index * 70)}ms both` : 'none' }}
                    >
                      <td style={{ ...cellStyle, fontWeight: 800, color: '#2563eb' }}>{r.receipt_no}</td>
                      <td style={cellStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <i className="ri-calendar-line" style={{ color: '#94a3b8' }} />
                          <span>{new Date(r.receipt_date).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </td>
                      <td style={cellStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <i className="ri-store-2-line" style={{ color: '#94a3b8' }} />
                          <span>{getWarehouseName(r)}</span>
                        </div>
                      </td>
                      <td style={{ ...cellStyle, color: '#475569', lineHeight: 1.6 }}>{getProductSummary(r)}</td>
                      <td style={{ ...cellStyle, color: '#475569' }}>{r.note || '—'}</td>
                      <td style={cellStyle}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '7px 11px', borderRadius: '999px', background: s.bg, color: s.color, fontSize: '12px', fontWeight: 700 }}>{s.label}</span>
                      </td>
                      <td style={{ ...cellStyle, textAlign: 'center' }}>
                        {r.status === 'PENDING' && (roleId === 1 || roleId === 5) && (
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={() => openRespondModal(r.id, 'accept')}
                              style={{ padding: '9px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}
                            >
                              Duyệt
                            </button>
                            <button
                              type="button"
                              onClick={() => openRespondModal(r.id, 'reject')}
                              style={{ padding: '9px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}
                            >
                              Từ chối
                            </button>
                          </div>
                        )}

                        {r.status === 'PROCESSING' && (roleId === 1 || roleId === 4) && (
                          <button type="button" onClick={() => handleConfirm(r.id)} style={{ padding: '10px 14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>Xác nhận</button>
                        )}

                        {r.status !== 'PENDING' && r.status !== 'PROCESSING' && (
                          <button type="button" onClick={() => openDetailModal(r)} style={iconButtonStyle} title="Xem chi tiết phiếu">
                            <i className="ri-eye-line" />
                          </button>
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

      {isCreateOpen && (
        <div className="modal-animate" style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.62)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '18px' }}>
          <div className="modal-panel-animate" style={{ width: 'min(720px, 100%)', maxHeight: '90vh', overflowY: 'auto', background: '#fff', borderRadius: '24px', border: '1px solid #e5eef8', boxShadow: '0 30px 80px rgba(15, 23, 42, 0.22)' }}>
            <div style={{ padding: '22px 24px', borderBottom: '1px solid #eef2f7', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#2563eb', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tạo yêu cầu nhập</div>
                <h3 style={{ margin: '6px 0 0', fontSize: '22px', color: '#0f172a' }}>Kho: Yêu cầu nhập hàng</h3>
              </div>
              <button type="button" onClick={() => setIsCreateOpen(false)} style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1px solid #dbe3ee', background: '#fff', cursor: 'pointer', fontSize: '18px' }}>×</button>
            </div>

            <form onSubmit={handleCreateRequest} style={{ padding: '22px 24px 24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px', marginBottom: '14px' }}>
                <input required placeholder="Mã phiếu (VD: YC-01)" value={receiptNo} onChange={(e) => setReceiptNo(e.target.value)} style={{ padding: '12px 14px', border: '1px solid #dbe3ee', borderRadius: '14px', outline: 'none' }} />
                <select required value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} style={{ padding: '12px 14px', border: '1px solid #dbe3ee', borderRadius: '14px', outline: 'none' }}>
                  <option value="">-- Chọn kho muốn nhập --</option>
                  {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px', marginBottom: '14px' }}>
                <input required type="date" value={receiptDate} onChange={(e) => setReceiptDate(e.target.value)} style={{ padding: '12px 14px', border: '1px solid #dbe3ee', borderRadius: '14px', outline: 'none' }} />
                <input placeholder="Lý do / ghi chú" value={note} onChange={(e) => setNote(e.target.value)} style={{ padding: '12px 14px', border: '1px solid #dbe3ee', borderRadius: '14px', outline: 'none' }} />
              </div>

              <div style={{ border: '1px solid #e5eef8', borderRadius: '18px', background: '#f8fbff', padding: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>Sản phẩm nhập</div>
                  <button type="button" onClick={addItem} style={{ padding: '8px 12px', borderRadius: '12px', border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>+ Thêm sản phẩm</button>
                </div>

                {selectedItems.length === 0 && (
                  <div style={{ padding: '14px', border: '1px dashed #cbd5e1', borderRadius: '14px', color: '#64748b', background: '#fff' }}>Chưa có sản phẩm nào. Bấm “Thêm sản phẩm” để chọn hàng cần nhập.</div>
                )}

                {selectedItems.map((item, index) => (
                  <div key={index} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) 120px 44px', gap: '10px', marginBottom: '10px' }}>
                    <select required value={item.product_id} onChange={(e) => updateItem(index, 'product_id', e.target.value)} style={{ padding: '11px 12px', border: '1px solid #dbe3ee', borderRadius: '12px', outline: 'none' }}>
                      <option value="">-- Chọn sản phẩm --</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <input required type="number" min="1" placeholder="SL" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} style={{ padding: '11px 12px', border: '1px solid #dbe3ee', borderRadius: '12px', outline: 'none' }} />
                    <button type="button" onClick={() => removeItem(index)} style={{ borderRadius: '12px', border: '1px solid #fecaca', background: '#fff1f2', color: '#e11d48', cursor: 'pointer', fontSize: '16px' }}>×</button>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" style={{ flex: 1, padding: '12px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 800, cursor: 'pointer' }}>Gửi yêu cầu</button>
                <button type="button" onClick={() => setIsCreateOpen(false)} style={{ flex: 1, padding: '12px 16px', background: '#f1f5f9', color: '#0f172a', border: '1px solid #dbe3ee', borderRadius: '14px', fontWeight: 800, cursor: 'pointer' }}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isRespondOpen && (
        <div className="modal-animate" style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.62)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '18px' }}>
          <div className="modal-panel-animate" style={{ width: 'min(520px, 100%)', background: '#fff', borderRadius: '24px', border: '1px solid #e5eef8', boxShadow: '0 30px 80px rgba(15, 23, 42, 0.22)' }}>
            <div style={{ padding: '22px 24px', borderBottom: '1px solid #eef2f7', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '13px', color: respondAction === 'accept' ? '#2563eb' : '#ef4444', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{respondAction === 'accept' ? 'Duyệt phiếu' : 'Từ chối phiếu'}</div>
                <h3 style={{ margin: '6px 0 0', fontSize: '22px', color: '#0f172a' }}>{respondAction === 'accept' ? 'Hẹn ngày giao hàng' : 'Xác nhận lý do từ chối'}</h3>
              </div>
              <button type="button" onClick={() => setIsRespondOpen(false)} style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1px solid #dbe3ee', background: '#fff', cursor: 'pointer', fontSize: '18px' }}>×</button>
            </div>

            <form onSubmit={handleRespond} style={{ padding: '22px 24px 24px' }}>
              {respondAction === 'accept' && (
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: '#334155' }}>Ngày giao dự kiến</label>
                  <input required type="date" value={respondDate} onChange={(e) => setRespondDate(e.target.value)} style={{ width: '100%', padding: '12px 14px', border: '1px solid #dbe3ee', borderRadius: '14px', outline: 'none' }} />
                </div>
              )}

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: '#334155' }}>Lý do / lời nhắn</label>
                <textarea required value={respondReason} onChange={(e) => setRespondReason(e.target.value)} placeholder={respondAction === 'accept' ? 'VD: Dự kiến giao vào ngày 25/04...' : 'VD: Không đủ nguyên liệu để sản xuất...'} style={{ width: '100%', minHeight: '120px', padding: '12px 14px', border: '1px solid #dbe3ee', borderRadius: '14px', outline: 'none', resize: 'vertical' }} />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" style={{ flex: 1, padding: '12px 16px', background: respondAction === 'accept' ? '#2563eb' : '#ef4444', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 800, cursor: 'pointer' }}>{respondAction === 'accept' ? 'Duyệt' : 'Từ chối'}</button>
                <button type="button" onClick={() => setIsRespondOpen(false)} style={{ flex: 1, padding: '12px 16px', background: '#f1f5f9', color: '#0f172a', border: '1px solid #dbe3ee', borderRadius: '14px', fontWeight: 800, cursor: 'pointer' }}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDetailOpen && (
        <div className="modal-animate" style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.62)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '18px' }}>
          <div className="modal-panel-animate" style={{ width: 'min(760px, 100%)', maxHeight: '90vh', overflowY: 'auto', background: '#fff', borderRadius: '24px', border: '1px solid #e5eef8', boxShadow: '0 30px 80px rgba(15, 23, 42, 0.22)' }}>
            <div style={{ padding: '22px 24px', borderBottom: '1px solid #eef2f7', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#2563eb', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Chi tiết phiếu nhập</div>
                <h3 style={{ margin: '6px 0 0', fontSize: '22px', color: '#0f172a' }}>{detailReceipt.receipt_no}</h3>
              </div>
              <button type="button" onClick={() => setIsDetailOpen(false)} style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1px solid #dbe3ee', background: '#fff', cursor: 'pointer', fontSize: '18px' }}>×</button>
            </div>

            <div style={{ padding: '22px 24px 24px' }}>
              {detailLoading || !detailReceipt ? (
                <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Đang tải chi tiết phiếu...</div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px', marginBottom: '18px' }}>
                    <div style={{ padding: '14px', border: '1px solid #e5eef8', borderRadius: '16px', background: '#f8fbff' }}><div style={{ fontSize: '12px', color: '#64748b' }}>Ngày phiếu</div><div style={{ fontWeight: 800, color: '#0f172a' }}>{new Date(detailReceipt.receipt_date).toLocaleDateString('vi-VN')}</div></div>
                    <div style={{ padding: '14px', border: '1px solid #e5eef8', borderRadius: '16px', background: '#f8fbff' }}><div style={{ fontSize: '12px', color: '#64748b' }}>Kho nhập</div><div style={{ fontWeight: 800, color: '#0f172a' }}>{getWarehouseName(detailReceipt)}</div></div>
                    <div style={{ padding: '14px', border: '1px solid #e5eef8', borderRadius: '16px', background: '#f8fbff' }}><div style={{ fontSize: '12px', color: '#64748b' }}>Trạng thái</div><div style={{ fontWeight: 800, color: '#0f172a' }}>{statusStyle(detailReceipt.status).label}</div></div>
                    <div style={{ padding: '14px', border: '1px solid #e5eef8', borderRadius: '16px', background: '#f8fbff' }}><div style={{ fontSize: '12px', color: '#64748b' }}>Ghi chú</div><div style={{ fontWeight: 800, color: '#0f172a' }}>{detailReceipt.note || '—'}</div></div>
                  </div>

                      <div style={{ border: '1px solid #e5eef8', borderRadius: '18px', overflow: 'hidden' }}>
                    <div style={{ padding: '14px 16px', background: '#f8fbff', borderBottom: '1px solid #e5eef8', fontWeight: 800, color: '#0f172a' }}>Sản phẩm</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ textAlign: 'left', background: '#fff' }}>
                          <th style={{ padding: '12px 16px', borderBottom: '1px solid #eef2f7' }}>Tên sản phẩm</th>
                          <th style={{ padding: '12px 16px', borderBottom: '1px solid #eef2f7', width: '140px' }}>Số lượng</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(detailReceipt.items || []).map((item, idx) => (
                          <tr key={`${item.product_id}-${idx}`}>
                            <td style={{ padding: '12px 16px', borderBottom: '1px solid #eef2f7' }}>{item.product_name || item.product_id}</td>
                            <td style={{ padding: '12px 16px', borderBottom: '1px solid #eef2f7', fontWeight: 700 }}>{item.quantity}</td>
                          </tr>
                        ))}
                        {(!detailReceipt.items || detailReceipt.items.length === 0) && (
                          <tr><td colSpan="2" style={{ padding: '16px', textAlign: 'center', color: '#94a3b8' }}>Không có sản phẩm</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
    
