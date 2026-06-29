import { useEffect, useMemo, useState } from 'react';
import ExcelJS from 'exceljs';
import api from '../services/api';

export default function OutboundsPage() {
  const [orders, setOrders] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [targetWarehouse, setTargetWarehouse] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [hoveredOrderId, setHoveredOrderId] = useState(null);
  const [isContentVisible, setIsContentVisible] = useState(false);
  const [hoveredStat, setHoveredStat] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsConfirmOpen(false);
        setIsDetailOpen(false);
        setSelectedOrder(null);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const fetchData = async ({ showTableLoading = false } = {}) => {
    if (showTableLoading) setLoading(true);

    try {
      const [pendingRes, whRes] = await Promise.all([api.get('/outbounds/pending'), api.get('/warehouses')]);
      setOrders(pendingRes.data || []);
      setWarehouses(whRes.data || []);
    } catch (error) {
      console.error('Lỗi tải dữ liệu:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData({ showTableLoading: true });
  }, []);

  useEffect(() => {
    if (loading) {
      setIsContentVisible(false);
      return;
    }

    const timer = window.setTimeout(() => setIsContentVisible(true), 60);
    return () => window.clearTimeout(timer);
  }, [loading, orders.length]);

  const warehouseOptions = useMemo(
    () =>
      warehouses.map((warehouse) => ({
        id: String(warehouse.id),
        label: warehouse.name || warehouse.code || `Kho ${warehouse.id}`,
      })),
    [warehouses],
  );

  const filteredOrders = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return orders.filter((order) => {
      const orderStatus = order.order_status || order.status || 'unknown';
      const orderWarehouseId = String(order.warehouse_id || order.warehouse?.id || order.warehouseId || '');
      const searchableText = [
        order.order_no,
        order.customer_name,
        order.warehouse_name,
        order.warehouse_code,
        order.delivery_note,
        order.note,
        ...(order.items || []).flatMap((item) => [item.product_name, item.product_sku]),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = !keyword || searchableText.includes(keyword);
      const matchesStatus = statusFilter === 'all' || orderStatus === statusFilter;
      const matchesWarehouse = warehouseFilter === 'all' || orderWarehouseId === warehouseFilter;

      return matchesSearch && matchesStatus && matchesWarehouse;
    });
  }, [orders, searchTerm, statusFilter, warehouseFilter]);

  const getDisplayDate = (order) => order.order_date || order.expected_delivery_date || order.updated_at || order.created_at || '-';

  const getWarehouseDisplay = (order) => order.warehouse_name || order.warehouse_code || 'Chọn kho để hiện';

  const getTotalAmount = (order) => {
    const amount = order.total_amount ?? 0;
    return Number(amount || 0);
  };

  const getItemsPreview = (order) => {
    const items = order.items || [];
    if (!items.length) return 'Không có sản phẩm';
    return items.map((item) => `${item.product_name || 'Sản phẩm'}${item.product_sku ? ` (${item.product_sku})` : ''} x${item.quantity}`).join('\n');
  };

  const isCompletedOrder = (order) => ['completed', 'canceled'].includes(order.order_status || order.status);

  const statusStyle = (status) => {
    const map = {
      shipping: { bg: '#f3e8ff', color: '#6b21a8', label: 'Đang giao' },
      warehouse_processing: { bg: '#dbeafe', color: '#1d4ed8', label: 'Kho đang xử lý' },
      logistics_review: { bg: '#ede9fe', color: '#6d28d9', label: 'Logistics duyệt' },
      returned: { bg: '#fee2e2', color: '#b91c1c', label: 'Bị từ chối' },
      completed: { bg: '#d1fae5', color: '#047857', label: 'Giao thành công' },
      canceled: { bg: '#f3f4f6', color: '#4b5563', label: 'Hủy đơn' }, // 👉 ĐÃ THÊM DÒNG NÀY (MÀU XÁM)
    };
    return map[status] || { bg: '#f3f4f6', color: '#374151', label: status || 'N/A' };
  };

  const handleExport = async (e) => {
    e.preventDefault();
    if (!selectedOrder || !targetWarehouse) return;

    try {
      const res = await api.post('/outbounds', {
        order_id: selectedOrder.id,
        warehouse_id: targetWarehouse,
        export_date: new Date().toISOString().split('T')[0],
        note: selectedOrder.note || '',
      });

      alert(res.data.message);
      setIsConfirmOpen(false);
      setTargetWarehouse('');
      setSelectedOrder(null);
      await fetchData({ showTableLoading: true });
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi khi xuất kho');
    }
  };

  const handleOpenDetail = (order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const formatDateForReport = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
    return date.toLocaleDateString('vi-VN');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setIsContentVisible(false);
    await fetchData({ showTableLoading: true });
    setRefreshing(false);
  };

  const exportOutboundsExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Inventory Management';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.subject = 'Báo cáo xuất kho';
    workbook.title = 'Báo cáo xuất kho';
    workbook.company = 'Inventory Management';
    workbook.calcProperties.fullCalcOnLoad = true;

    const worksheet = workbook.addWorksheet('Bao cao xuat kho', {
      pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
      views: [{ state: 'frozen', ySplit: 6 }],
    });

    const visibleOrders = filteredOrders;
    const totalAmount = visibleOrders.reduce((sum, order) => sum + getTotalAmount(order), 0);

    worksheet.mergeCells('A1:H1');
    worksheet.getCell('A1').value = 'BÁO CÁO XUẤT KHO';
    worksheet.getCell('A1').font = { bold: true, size: 18, color: { argb: 'FFFFFFFF' } };
    worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
    worksheet.getRow(1).height = 26;

    worksheet.mergeCells('A2:H2');
    worksheet.getCell('A2').value = `Xuất lúc: ${new Date().toLocaleString('vi-VN')}  |  Tổng đơn: ${visibleOrders.length}  |  Tổng tiền: ${totalAmount.toLocaleString('vi-VN')} đ`;
    worksheet.getCell('A2').font = { italic: true, size: 11, color: { argb: 'FF475569' } };
    worksheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.mergeCells('A3:H3');
    worksheet.getCell('A3').value = `Từ khóa: ${searchTerm || 'Tất cả'}  |  Trạng thái: ${statusFilter === 'all' ? 'Tất cả' : statusStyle(statusFilter).label}  |  Kho: ${warehouseFilter === 'all' ? 'Tất cả' : (warehouseOptions.find((item) => item.id === warehouseFilter)?.label || 'Tất cả')}`;
    worksheet.getCell('A3').font = { size: 11, color: { argb: 'FF64748B' } };
    worksheet.getCell('A3').alignment = { horizontal: 'center', vertical: 'middle' };

    const columns = [
      { header: 'Mã đơn', key: 'order_no', width: 18 },
      { header: 'Ngày', key: 'date', width: 14 },
      { header: 'Khách hàng', key: 'customer', width: 24 },
      { header: 'Kho', key: 'warehouse', width: 20 },
      { header: 'Trạng thái', key: 'status', width: 18 },
      { header: 'Sản phẩm', key: 'items', width: 42 },
      { header: 'Ghi chú logistics', key: 'note', width: 36 },
      { header: 'Tổng tiền', key: 'amount', width: 18 },
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

    visibleOrders.forEach((order) => {
      const items = (order.items || [])
        .map((item) => `${item.product_name || 'Sản phẩm'}${item.product_sku ? ` (${item.product_sku})` : ''} x${item.quantity}`)
        .join('\n');
      const row = worksheet.addRow({
        order_no: order.order_no || '-',
        date: formatDateForReport(getDisplayDate(order)),
        customer: order.customer_name || '—',
        warehouse: getWarehouseDisplay(order),
        status: statusStyle(order.order_status || order.status).label,
        items: items || 'Không có sản phẩm',
        note: order.delivery_note || order.note || '—',
        amount: `${getTotalAmount(order).toLocaleString('vi-VN')} đ`,
      });

      row.height = Math.max(24, Math.ceil(Math.max(items.length, (order.delivery_note || order.note || '—').length) / 36) * 18);
      row.eachCell((cell) => {
        if (cell.value === order.order_no || cell.value === formatDateForReport(getDisplayDate(order))) {
          cell.font = { color: { argb: 'FF0F172A' } };
        }
        if (cell.value === order.customer_name || cell.value === getWarehouseDisplay(order)) {
          cell.font = { color: { argb: 'FF334155' } };
        }
        cell.alignment = { vertical: 'top', wrapText: true };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      });

      const statusCell = row.getCell(5);
      const statusPalette = {
        'Chờ xuất': 'FFF59E0B',
        'Kho đang xử lý': 'FF3B82F6',
        'Logistics duyệt': 'FFA855F7',
        'Bị từ chối': 'FFEF4444',
        'Đã xuất': 'FF10B981',
      };
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: statusPalette[statusCell.value] || 'FFF3F4F6' } };
      statusCell.font = { bold: true, color: { argb: statusCell.value === 'Chờ xuất' || statusCell.value === 'Logistics duyệt' ? 'FF1F2937' : 'FFFFFFFF' } };
      statusCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

      const amountCell = row.getCell(8);
      amountCell.font = { bold: true, color: { argb: 'FF0F172A' } };
      amountCell.alignment = { horizontal: 'right', vertical: 'top', wrapText: true };
    });

    const totalRowIndex = worksheet.lastRow.number + 2;
    worksheet.mergeCells(`A${totalRowIndex}:G${totalRowIndex}`);
    worksheet.getCell(`A${totalRowIndex}`).value = 'TỔNG CỘNG';
    worksheet.getCell(`A${totalRowIndex}`).font = { bold: true, size: 12 };
    worksheet.getCell(`A${totalRowIndex}`).alignment = { horizontal: 'right' };
    worksheet.getCell(`A${totalRowIndex}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
    worksheet.getCell(`A${totalRowIndex}`).border = {
      top: { style: 'thin', color: { argb: 'FFBFDBFE' } },
      left: { style: 'thin', color: { argb: 'FFBFDBFE' } },
      bottom: { style: 'thin', color: { argb: 'FFBFDBFE' } },
      right: { style: 'thin', color: { argb: 'FFBFDBFE' } },
    };
    worksheet.getCell(`H${totalRowIndex}`).value = `${totalAmount.toLocaleString('vi-VN')} đ`;
    worksheet.getCell(`H${totalRowIndex}`).font = { bold: true, size: 12, color: { argb: 'FF1D4ED8' } };
    worksheet.getCell(`H${totalRowIndex}`).alignment = { horizontal: 'right' };
    worksheet.getCell(`H${totalRowIndex}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
    worksheet.getCell(`H${totalRowIndex}`).border = {
      top: { style: 'thin', color: { argb: 'FFBFDBFE' } },
      left: { style: 'thin', color: { argb: 'FFBFDBFE' } },
      bottom: { style: 'thin', color: { argb: 'FFBFDBFE' } },
      right: { style: 'thin', color: { argb: 'FFBFDBFE' } },
    };

    worksheet.autoFilter = { from: 'A4', to: 'H4' };
    worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 4 }];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bao-cao-xuat-kho-${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const iconButtonStyle = {
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
    transition: 'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease, background 160ms ease',
  };

  const actionButtonStyle = {
    padding: '10px 14px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: 700,
    boxShadow: '0 8px 18px rgba(37, 99, 235, 0.18)',
    whiteSpace: 'nowrap',
    transition: 'transform 160ms ease, box-shadow 160ms ease, filter 160ms ease',
  };

  const rowBaseStyle = {
    borderTop: '1px solid #eef2f7',
    transition: 'transform 160ms ease, box-shadow 160ms ease, background 160ms ease, opacity 220ms ease',
    opacity: isContentVisible ? 1 : 0,
  };

  const rowHoverStyle = {
    background: '#ffffff',
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

  const tableStyle = {
    width: '100%',
    minWidth: '1320px',
    borderCollapse: 'separate',
    borderSpacing: 0,
  };

  const cellStyle = {
    padding: '16px 18px',
    verticalAlign: 'top',
    color: '#334155',
    fontSize: '14px',
  };

  const skeletonRows = Array.from({ length: 6 }, (_, index) => index);
  const skeletonCellStyle = {
    height: '14px',
    borderRadius: '999px',
    background: 'linear-gradient(90deg, #e8eef5 25%, #f4f7fb 37%, #e8eef5 63%)',
    backgroundSize: '400% 100%',
    animation: 'shimmer 1.4s ease infinite',
  };

  const statIcons = {
    total: (<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: '22px', height: '22px' }}><path d="M4 7.5C4 6.12 5.12 5 6.5 5h11C18.88 5 20 6.12 20 7.5v9c0 1.38-1.12 2.5-2.5 2.5h-11C5.12 19 4 17.88 4 16.5v-9Z" stroke="currentColor" strokeWidth="1.8" /><path d="M8 9h8M8 12h8M8 15h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>),
    processing: (<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: '22px', height: '22px' }}><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" /></svg>),
    completed: (<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: '22px', height: '22px' }}><path d="M20 7 10 17l-5-5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /><path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>),
    warehouse: (<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: '22px', height: '22px' }}><path d="M4 7.5 12 4l8 3.5-8 3.5-8-3.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M4 7.5V16.5L12 20l8-3.5V7.5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>),
  };

  const stats = [
    {
      id: 'total',
      label: 'Tổng đơn',
      value: orders.length,
      color: '#2563eb',
      icon: statIcons.total
    },
    {
      id: 'pending',
      label: 'Chờ xử lý',
      // Chỉ đếm đơn: Kho đang xử lý (warehouse_processing) + Đang giao (shipping)
      value: orders.filter((o) => ['warehouse_processing', 'shipping'].includes(o.order_status || o.status)).length,
      color: '#f59e0b',
      icon: statIcons.processing
    },
    {
      id: 'completed',
      label: 'Đã hoàn tất',
      // Những đơn đã xong thực sự: Giao thành công (completed) + Hủy đơn (canceled)
      value: orders.filter((o) => ['completed', 'canceled'].includes(o.order_status || o.status)).length,
      color: '#10b981',
      icon: statIcons.completed
    },
    {
      id: 'issues',
      label: 'Kho khả dụng',
      value: warehouses.length,
      color: '#0f172a',
      icon: statIcons.warehouse
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f6f8fc 0%, #eef3f9 100%)', padding: '20px' }}>
      <style>{`
        @keyframes rowFadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
            filter: blur(2px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
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

        .modal-animate {
          animation: modalFadeIn 180ms ease-out;
        }

        .modal-panel-animate {
          animation: modalScaleIn 220ms ease-out;
        }
      `}</style>
      <div style={{ maxWidth: '1480px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '12px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '28px', color: '#0f172a', letterSpacing: '-0.02em' }}>Xuất kho</h2>
            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px', lineHeight: 1.6 }}>Danh sách đơn chờ xuất, tối ưu cho thao tác nhanh</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              style={{ background: '#fff', border: '1px solid #dbe3ee', borderRadius: '12px', padding: '10px 16px', fontWeight: 700, cursor: refreshing ? 'wait' : 'pointer', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)', display: 'inline-flex', alignItems: 'center', gap: '8px', opacity: refreshing ? 0.85 : 1, fontFamily: 'inherit', transition: 'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease, background 160ms ease, filter 160ms ease' }}
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
              }}
            >
              <i className="ri-refresh-line" style={{ fontSize: '16px', animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
              <span>{refreshing ? 'Đang làm mới...' : 'Làm mới'}</span>
            </button>
            <button
              type="button"
              onClick={exportOutboundsExcel}
              style={{
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                padding: '10px 16px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 10px 22px rgba(34, 197, 94, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'transform 160ms ease, box-shadow 160ms ease, filter 160ms ease',
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
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '14px', marginBottom: '16px' }}>
          {stats.map((stat) => {
            const statHoverStyles = {
              total: { boxShadow: '0 18px 34px rgba(37,99,235,0.14)', borderColor: 'rgba(37,99,235,0.22)' },
              pending: { boxShadow: '0 18px 34px rgba(245,158,11,0.14)', borderColor: 'rgba(245,158,11,0.22)' },
              completed: { boxShadow: '0 18px 34px rgba(22,163,74,0.14)', borderColor: 'rgba(22,163,74,0.22)' },
              issues: { boxShadow: '0 18px 34px rgba(220,38,38,0.14)', borderColor: 'rgba(220,38,38,0.22)' },
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
                  <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: stat.color, color: '#fff', display: 'grid', placeItems: 'center', transition: 'transform 0.2s ease' }}>{stat.icon}</div>
                  <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 700 }}>{stat.label}</div>
                </div>
                <div style={{ fontSize: '34px', lineHeight: 1, fontWeight: 800, color: stat.color }}>{stat.value}</div>
              </div>
            );
          })}
        </div>

        <div style={tableWrapStyle}>
          <div style={{ padding: '18px 20px 10px', borderBottom: '1px solid #eef2f7' }}>
            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '18px' }}>Bảng xuất kho</div>
            <div style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>Bộ lọc phía dưới sẽ được áp dụng khi xuất Excel.</div>
          </div>

          <div style={{ padding: '16px 20px', borderBottom: '1px solid #eef2f7', background: '#fff' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) repeat(2, minmax(180px, 1fr)) auto', gap: '12px', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <i className="ri-search-line" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm sản phẩm, đơn hàng..."
                  style={{ width: '100%', padding: '12px 14px 12px 40px', borderRadius: '12px', border: '1px solid #dbe3ee', outline: 'none', fontSize: '14px', background: '#fff' }}
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #dbe3ee', outline: 'none', fontSize: '14px', background: '#fff' }}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="shipping">Đang giao</option>
                <option value="warehouse_processing">Kho đang xử lý</option>
                <option value="returned">Bị từ chối</option>
                <option value="canceled">Hủy đơn</option>
                <option value="completed">Giao thành công</option>
              </select>

              <select
                value={warehouseFilter}
                onChange={(e) => setWarehouseFilter(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #dbe3ee', outline: 'none', fontSize: '14px', background: '#fff' }}
              >
                <option value="all">Tất cả kho</option>
                {warehouseOptions.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>{warehouse.label}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setWarehouseFilter('all');
                }}
                style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid #dbe3ee', background: '#f8fafc', fontWeight: 700, cursor: 'pointer', color: '#0f172a', whiteSpace: 'nowrap' }}
              >
                Xóa lọc
              </button>

            </div>
          </div>

          {loading ? (
            <div style={{ overflowX: 'auto', padding: '16px 20px 20px' }}>
              <table style={tableStyle} aria-hidden="true">
                <thead>
                  <tr style={{ textAlign: 'left', color: '#64748b', fontSize: '12px', background: '#f8fafc' }}>
                    <th style={{ ...cellStyle, width: '120px', whiteSpace: 'nowrap' }}>Mã đơn</th>
                    <th style={{ ...cellStyle, width: '110px', whiteSpace: 'nowrap' }}>Ngày</th>
                    <th style={{ ...cellStyle, width: '180px', whiteSpace: 'nowrap' }}>Khách hàng</th>
                    <th style={{ ...cellStyle, width: '180px' }}>Kho</th>
                    <th style={{ ...cellStyle, width: '170px', whiteSpace: 'nowrap' }}>Trạng thái</th>
                    <th style={{ ...cellStyle, minWidth: '320px' }}>Sản phẩm</th>
                    <th style={{ ...cellStyle, width: '140px', whiteSpace: 'nowrap' }}>Tổng tiền</th>
                    <th style={{ ...cellStyle, width: '120px', whiteSpace: 'nowrap' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {skeletonRows.map((row) => (
                    <tr key={row} style={{ borderTop: '1px solid #eef2f7' }}>
                      <td style={cellStyle}><div style={{ ...skeletonCellStyle, width: '92px' }} /></td>
                      <td style={cellStyle}><div style={{ ...skeletonCellStyle, width: '72px' }} /></td>
                      <td style={cellStyle}><div style={{ ...skeletonCellStyle, width: '132px' }} /></td>
                      <td style={cellStyle}><div style={{ ...skeletonCellStyle, width: '118px' }} /></td>
                      <td style={cellStyle}><div style={{ ...skeletonCellStyle, width: '108px', height: '30px' }} /></td>
                      <td style={cellStyle}>
                        <div style={{ display: 'grid', gap: '10px' }}>
                          <div style={{ ...skeletonCellStyle, width: '85%' }} />
                          <div style={{ ...skeletonCellStyle, width: '68%' }} />
                        </div>
                      </td>
                      <td style={cellStyle}><div style={{ ...skeletonCellStyle, width: '98px' }} /></td>
                      <td style={{ ...cellStyle, textAlign: 'center' }}>
                        <div style={{ ...skeletonCellStyle, width: '96px', height: '38px', margin: '0 auto' }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr style={{ textAlign: 'left', color: '#64748b', fontSize: '12px', background: '#f8fafc' }}>
                    <th style={{ ...cellStyle, width: '120px', whiteSpace: 'nowrap' }}>Mã đơn</th>
                    <th style={{ ...cellStyle, width: '110px', whiteSpace: 'nowrap' }}>Ngày</th>
                    <th style={{ ...cellStyle, width: '180px', whiteSpace: 'nowrap' }}>Khách hàng</th>
                    <th style={{ ...cellStyle, width: '180px' }}>Kho</th>
                    <th style={{ ...cellStyle, width: '170px', whiteSpace: 'nowrap' }}>Trạng thái</th>
                    <th style={{ ...cellStyle, minWidth: '320px' }}>Sản phẩm</th>
                    <th style={{ ...cellStyle, width: '140px', whiteSpace: 'nowrap' }}>Tổng tiền</th>
                    <th style={{ ...cellStyle, width: '120px', whiteSpace: 'nowrap' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>Chưa có phiếu yêu cầu xuất kho nào.</td>
                    </tr>
                  ) : (
                    filteredOrders.map((o, index) => {
                      const s = statusStyle(o.order_status || o.status);
                      const isHovered = hoveredOrderId === o.id;

                      return (
                        <tr
                          key={o.id}
                          onMouseEnter={() => setHoveredOrderId(o.id)}
                          onMouseLeave={() => setHoveredOrderId(null)}
                          style={{
                            ...rowBaseStyle,
                            ...(isHovered ? rowHoverStyle : {}),
                            transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
                            boxShadow: isHovered ? '0 8px 20px rgba(15, 23, 42, 0.04)' : 'none',
                            animation: isContentVisible ? `rowFadeIn 420ms ease ${Math.min(240, index * 45)}ms both` : 'none',
                          }}
                        >
                          <td style={{ ...cellStyle, fontWeight: 800, color: '#2563eb' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span>{o.order_no}</span>
                            </div>
                          </td>
                          <td style={cellStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' }}>
                              <i className="ri-calendar-line" style={{ color: '#94a3b8' }} />
                              <span>{String(getDisplayDate(o)).slice(0, 10)}</span>
                            </div>
                          </td>
                          <td style={{ ...cellStyle, color: '#0f172a', fontWeight: 500 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <i className="ri-user-3-line" style={{ color: '#94a3b8' }} />
                              <span>{o.customer_name || '—'}</span>
                            </div>
                          </td>
                          <td style={cellStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <i className="ri-store-2-line" style={{ color: '#94a3b8' }} />
                              <span>{getWarehouseDisplay(o)}</span>
                            </div>
                          </td>
                          <td style={cellStyle}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                              {/* Thẻ hiển thị Trạng Thái (giữ nguyên của bạn bà) */}
                              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '7px 11px', borderRadius: '999px', background: s.bg, color: s.color, fontSize: '12px', fontWeight: 700, boxShadow: isHovered ? '0 6px 14px rgba(15,23,42,0.08)' : 'none', transition: 'all 160ms ease' }}>
                                {s.label}
                              </span>
                              
                              {/* 👉 CHÈN THÊM: Ngày xuất kho (Chỉ hiện khi đơn đã được Kho xuất) */}
                              {o.export_date && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f0fdf4', color: '#166534', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, border: '1px solid #bbf7d0' }}>
                                    <i className="ri-calendar-check-line"></i> Xuất: {new Date(o.export_date).toLocaleDateString('vi-VN')}
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ ...cellStyle, color: '#475569', lineHeight: 1.6 }}>
                            <div style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', whiteSpace: 'normal' }}>{getItemsPreview(o)}</div>
                          </td>
                          <td style={{ ...cellStyle, fontWeight: 800, color: '#0f172a' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <i className="ri-coins-line" style={{ color: '#94a3b8' }} />
                              <span>{getTotalAmount(o).toLocaleString('vi-VN')} đ</span>
                            </div>
                          </td>
                          <td style={{ ...cellStyle, textAlign: 'center' }}>
                            {/* 👉 ĐÃ SỬA: Chỉ hiện nút Xuất khi trạng thái đích danh là Kho đang xử lý */}
                            {(o.order_status || o.status) === 'warehouse_processing' ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedOrder(o);
                                  setTargetWarehouse('');
                                  setIsConfirmOpen(true);
                                }}
                                style={actionButtonStyle}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                  e.currentTarget.style.boxShadow = '0 12px 22px rgba(37, 99, 235, 0.22)';
                                  e.currentTarget.style.filter = 'brightness(1.02)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'translateY(0)';
                                  e.currentTarget.style.boxShadow = '0 8px 18px rgba(37, 99, 235, 0.18)';
                                  e.currentTarget.style.filter = 'brightness(1)';
                                }}
                              >
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                  <i className="ri-truck-line" />
                                  <span>Chọn kho & xuất</span>
                                </span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenDetail(o)}
                                style={iconButtonStyle}
                                title="Xem chi tiết"
                                aria-label="Xem chi tiết"
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'translateY(-1px) scale(1.03)';
                                  e.currentTarget.style.boxShadow = '0 10px 20px rgba(15, 23, 42, 0.10)';
                                  e.currentTarget.style.borderColor = '#bcd0ea';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                  e.currentTarget.style.boxShadow = '0 1px 2px rgba(15, 23, 42, 0.05)';
                                  e.currentTarget.style.borderColor = '#dbe3ee';
                                }}
                              >
                                <i className="ri-eye-line" style={{ fontSize: '18px' }} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {isConfirmOpen && (
        <div className="modal-animate" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.55)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="modal-panel-animate" style={{ background: 'white', padding: '30px', borderRadius: '15px', width: '420px', transformOrigin: 'center' }}>
            <h3 style={{ marginTop: 0, color: '#38a169' }}>Xác nhận xuất kho</h3>
            <p>Đơn hàng: <b>{selectedOrder?.order_no}</b></p>
            <p>Khách hàng: <b>{selectedOrder?.customer_name}</b></p>
            <form onSubmit={handleExport}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Chọn kho xuất:</label>
              <select required value={targetWarehouse} onChange={(e) => setTargetWarehouse(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '20px', borderRadius: '5px' }}>
                <option value="">-- Chọn kho --</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ flex: 1, padding: '12px', background: '#38a169', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>Xuất kho</button>
                <button type="button" onClick={() => setIsConfirmOpen(false)} style={{ flex: 1, padding: '12px', background: '#edf2f7', borderRadius: '5px', border: 'none', cursor: 'pointer' }}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDetailOpen && selectedOrder && (
        <div className="modal-animate" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.55)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="modal-panel-animate" style={{ background: 'white', padding: '28px', borderRadius: '18px', width: 'min(720px, 92vw)', maxHeight: '88vh', overflowY: 'auto', transformOrigin: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, color: '#0f172a' }}>Chi tiết đơn hàng</h3>
              <button type="button" onClick={() => setIsDetailOpen(false)} style={{ ...iconButtonStyle, width: '40px', height: '40px' }} aria-label="Đóng">
                <i className="ri-close-line" style={{ fontSize: '18px' }} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
              <div><b>Mã đơn:</b> {selectedOrder.order_no}</div>
              <div><b>Trạng thái:</b> {statusStyle(selectedOrder.order_status || selectedOrder.status).label}</div>
              <div><b>Khách hàng:</b> {selectedOrder.customer_name || '—'}</div>
              <div><b>Kho liên quan:</b> {getWarehouseDisplay(selectedOrder)}</div>
              <div><b>Ngày:</b> {String(getDisplayDate(selectedOrder)).slice(0, 10)}</div>
              <div><b>Tổng tiền:</b> {getTotalAmount(selectedOrder).toLocaleString('vi-VN')} đ</div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <b>Ghi chú logistics:</b>
              <div style={{ whiteSpace: 'pre-line', marginTop: '6px', color: '#475569' }}>{selectedOrder.delivery_note || selectedOrder.note || '—'}</div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <b>Sản phẩm</b>
              <div style={{ marginTop: '8px', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                      <th style={{ padding: '12px 14px' }}>Tên</th>
                      <th>Số lượng</th>
                      <th>Đơn giá</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedOrder.items || []).map((item) => (
                      <tr key={item.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 14px' }}>{item.product_name || 'Sản phẩm'}</td>
                        <td>{item.quantity}</td>
                        <td>{Number(item.unit_price || 0).toLocaleString('vi-VN')} đ</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
