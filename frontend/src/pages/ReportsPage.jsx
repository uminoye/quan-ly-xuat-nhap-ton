import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import api from '../services/api';
import ExcelJS from 'exceljs';

const PIE_COLORS = ['#2563eb', '#0ea5e9', '#10b981', '#7c3aed', '#f59e0b', '#ef4444'];

export default function ReportsPage() {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [skuFilter, setSkuFilter] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const fetchReport = async () => {
    try {
      setError('');
      const res = await api.get('/reports/inventory');
      setReportData(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Lỗi tải báo cáo', err);
      setError('Không thể tải dữ liệu báo cáo. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const normalizedSkuFilter = skuFilter.trim().toLowerCase();

  const warehouseOptions = useMemo(() => {
    const names = new Set(reportData.map((item) => item.warehouse_name).filter(Boolean));
    return Array.from(names).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [reportData]);

  const filteredData = useMemo(() => {
    return reportData.filter((item) => {
      const matchesWarehouse = warehouseFilter === 'all' || item.warehouse_name === warehouseFilter;
      const matchesSku = !normalizedSkuFilter || String(item.sku || '').toLowerCase().includes(normalizedSkuFilter);
      return matchesWarehouse && matchesSku;
    });
  }, [normalizedSkuFilter, reportData, warehouseFilter]);

  const summary = useMemo(() => {
    const totalItems = filteredData.length;
    const totalQuantity = filteredData.reduce((sum, item) => sum + Number(item.on_hand_qty || 0), 0);
    const totalValue = filteredData.reduce((sum, item) => sum + Number(item.total_value || 0), 0);
    const lowStock = filteredData.filter((item) => Number(item.on_hand_qty || 0) <= 10).length;
    return { totalItems, totalQuantity, totalValue, lowStock };
  }, [filteredData]);

  const chartData = useMemo(() => {
    return [...filteredData]
      .sort((a, b) => Number(b.total_value || 0) - Number(a.total_value || 0))
      .slice(0, 6)
      .map((item) => ({
        label: item.sku,
        name: item.product_name,
        warehouse: item.warehouse_name,
        value: Number(item.total_value || 0),
        quantity: Number(item.on_hand_qty || 0),
      }));
  }, [filteredData]);

  const warehouseChartData = useMemo(() => {
    const totals = filteredData.reduce((acc, item) => {
      const warehouse = item.warehouse_name || 'Không xác định';
      acc[warehouse] = (acc[warehouse] || 0) + Number(item.total_value || 0);
      return acc;
    }, {});

    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  const formatCurrency = (value) => new Intl.NumberFormat('vi-VN').format(Number(value || 0));
  const formatDate = () => new Date().toISOString().split('T')[0];

  const getEnterStyle = (delay = 0, offset = 16) => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'translateY(0)' : `translateY(${offset}px)`,
    transition: `opacity 600ms ease ${delay}ms, transform 600ms ease ${delay}ms`,
  });

  const getRowStyle = (index) => ({
    opacity: mounted && !loading ? 1 : 0,
    transform: mounted && !loading ? 'translateY(0)' : 'translateY(12px)',
    transition: `opacity 420ms ease ${120 + index * 45}ms, transform 420ms ease ${120 + index * 45}ms`,
  });

  const getStockTone = (qty) => {
    const value = Number(qty || 0);
    if (value <= 10) {
      return {
        color: '#f97316',
      };
    }

    return {
      color: '#22c55e',
    };
  };

  const chartCardBaseStyle = {
    background: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(14px)',
    border: '1px solid rgba(148,163,184,0.16)',
    borderRadius: '24px',
    padding: '20px 22px',
    boxShadow: '0 18px 50px rgba(15, 23, 42, 0.08)',
    transition: 'transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease',
  };

  const handlePulseHover = (e, accent = '#2563eb') => {
    e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)';
    e.currentTarget.style.boxShadow = `0 22px 56px ${accent}22`;
    e.currentTarget.style.borderColor = `${accent}55`;
    const pulse = e.currentTarget.querySelector('[data-pulse]');
    if (pulse) pulse.style.animationPlayState = 'running';
  };

  const handlePulseLeave = (e) => {
    e.currentTarget.style.transform = 'translateY(0) scale(1)';
    e.currentTarget.style.boxShadow = '0 18px 50px rgba(15, 23, 42, 0.08)';
    e.currentTarget.style.borderColor = 'rgba(148,163,184,0.16)';
    const pulse = e.currentTarget.querySelector('[data-pulse]');
    if (pulse) pulse.style.animationPlayState = 'paused';
  };

  const exportToExcel = async () => {
    if (filteredData.length === 0) return alert('Không có dữ liệu để xuất!');

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Inventory Management';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.company = 'Inventory Management';
    workbook.subject = 'Báo cáo tồn kho tổng hợp';
    workbook.title = 'BÁO CÁO TỒN KHO TỔNG HỢP';
    workbook.properties.date1904 = true;

    const reportTitle = 'BÁO CÁO TỒN KHO TỔNG HỢP';
    const reportSubtitle = 'Inventory Overview & Stock Intelligence';
    const generatedAt = new Date().toLocaleString('vi-VN');
    const selectedWarehouse = warehouseFilter === 'all' ? 'Tất cả kho' : warehouseFilter;
    const totalItems = filteredData.length;
    const totalQuantity = filteredData.reduce((sum, item) => sum + Number(item.on_hand_qty || 0), 0);
    const totalValue = filteredData.reduce((sum, item) => sum + Number(item.total_value || 0), 0);
    const lowStock = filteredData.filter((item) => Number(item.on_hand_qty || 0) <= 10).length;

    const inventorySheet = workbook.addWorksheet('Bao_Cao_Ton_Kho', {
      views: [{ state: 'frozen', ySplit: 9 }],
      properties: { defaultRowHeight: 22 },
    });

    inventorySheet.columns = [
      { header: 'Mã SKU', key: 'sku', width: 18 },
      { header: 'Tên Sản Phẩm', key: 'product_name', width: 30 },
      { header: 'Kho', key: 'warehouse_name', width: 24 },
      { header: 'Số Lượng Tồn', key: 'on_hand_qty', width: 16 },
      { header: 'Đơn Vị', key: 'unit', width: 12 },
      { header: 'Đơn Giá', key: 'sale_price', width: 16 },
      { header: 'Thành Tiền (VND)', key: 'total_value', width: 20 },
    ];

    inventorySheet.mergeCells('A1:G1');
    inventorySheet.getCell('A1').value = reportTitle;
    inventorySheet.getCell('A1').font = { bold: true, size: 18, color: { argb: 'FFFFFF' } };
    inventorySheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    inventorySheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1D4ED8' } };

    inventorySheet.mergeCells('A2:G2');
    inventorySheet.getCell('A2').value = reportSubtitle;
    inventorySheet.getCell('A2').font = { italic: true, size: 12, color: { argb: 'DBEAFE' } };
    inventorySheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };
    inventorySheet.getCell('A2').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1D4ED8' } };

    inventorySheet.mergeCells('A4:C4');
    inventorySheet.mergeCells('D4:F4');
    inventorySheet.mergeCells('G4:G4');
    inventorySheet.mergeCells('A5:C5');
    inventorySheet.mergeCells('D5:F5');
    inventorySheet.mergeCells('G5:G5');

    inventorySheet.getCell('A4').value = `Thời điểm xuất: ${generatedAt}`;
    inventorySheet.getCell('D4').value = `Kho đang lọc: ${selectedWarehouse}`;
    inventorySheet.getCell('G4').value = `Tổng mặt hàng: ${totalItems}`;
    inventorySheet.getCell('A5').value = `Tổng số lượng tồn: ${totalQuantity}`;
    inventorySheet.getCell('D5').value = `Giá trị tồn kho: ${formatCurrency(totalValue)} đ`;
    inventorySheet.getCell('G5').value = `Cảnh báo tồn thấp: ${lowStock}`;

    ['A4', 'D4', 'G4', 'A5', 'D5', 'G5'].forEach((cellRef) => {
      const cell = inventorySheet.getCell(cellRef);
      cell.font = { bold: true, color: { argb: '0F172A' } };
      cell.alignment = { vertical: 'middle' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EFF6FF' } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'BFDBFE' } },
        left: { style: 'thin', color: { argb: 'BFDBFE' } },
        bottom: { style: 'thin', color: { argb: 'BFDBFE' } },
        right: { style: 'thin', color: { argb: 'BFDBFE' } },
      };
    });

    const headerRow = inventorySheet.getRow(9);
    headerRow.values = ['Mã SKU', 'Tên Sản Phẩm', 'Kho', 'Số Lượng Tồn', 'Đơn Vị', 'Đơn Giá', 'Thành Tiền (VND)'];
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1D4ED8' } };

    filteredData.forEach((item) => {
      const row = inventorySheet.addRow({
        sku: item.sku,
        product_name: item.product_name,
        warehouse_name: item.warehouse_name,
        on_hand_qty: Number(item.on_hand_qty || 0),
        unit: item.unit,
        sale_price: Number(item.sale_price || 0),
        total_value: Number(item.total_value || 0),
      });

      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'E2E8F0' } },
          left: { style: 'thin', color: { argb: 'E2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
          right: { style: 'thin', color: { argb: 'E2E8F0' } },
        };
        cell.alignment = { vertical: 'middle' };
        if (colNumber === 4 || colNumber === 6 || colNumber === 7) cell.numFmt = '#,##0';
      });

      if (Number(item.on_hand_qty || 0) <= 10) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF2F2' } };
          cell.font = { color: { argb: 'B91C1C' } };
        });
      }
    });

    const summaryRowIndex = inventorySheet.lastRow.number + 2;
    inventorySheet.mergeCells(`A${summaryRowIndex}:G${summaryRowIndex}`);
    const summaryCell = inventorySheet.getCell(`A${summaryRowIndex}`);
    summaryCell.value = `Tổng kết: ${totalItems} mặt hàng • ${totalQuantity} số lượng tồn • ${formatCurrency(totalValue)} đ giá trị • ${lowStock} cảnh báo tồn thấp`;
    summaryCell.font = { bold: true, color: { argb: '0F172A' } };
    summaryCell.alignment = { horizontal: 'center' };
    summaryCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DBEAFE' } };
    summaryCell.border = {
      top: { style: 'thin', color: { argb: '93C5FD' } },
      left: { style: 'thin', color: { argb: '93C5FD' } },
      bottom: { style: 'thin', color: { argb: '93C5FD' } },
      right: { style: 'thin', color: { argb: '93C5FD' } },
    };

    const warehouseSheet = workbook.addWorksheet('Thong_Ke_Theo_Kho', {
      properties: { defaultRowHeight: 22 },
    });

    warehouseSheet.columns = [
      { header: 'Kho', key: 'warehouse_name', width: 28 },
      { header: 'Số mặt hàng', key: 'item_count', width: 14 },
      { header: 'Tổng số lượng', key: 'total_quantity', width: 16 },
      { header: 'Tổng giá trị', key: 'total_value', width: 18 },
      { header: 'Tồn thấp', key: 'low_stock_count', width: 12 },
    ];

    const warehouseSummaryRows = warehouseChartData.map((warehouse) => {
      const warehouseItems = filteredData.filter((item) => (item.warehouse_name || 'Không xác định') === warehouse.name);
      return {
        warehouse_name: warehouse.name,
        item_count: warehouseItems.length,
        total_quantity: warehouseItems.reduce((sum, item) => sum + Number(item.on_hand_qty || 0), 0),
        total_value: warehouse.value,
        low_stock_count: warehouseItems.filter((item) => Number(item.on_hand_qty || 0) <= 10).length,
      };
    });

    warehouseSummaryRows.forEach((row) => {
      const excelRow = warehouseSheet.addRow(row);
      excelRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'E2E8F0' } },
          left: { style: 'thin', color: { argb: 'E2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
          right: { style: 'thin', color: { argb: 'E2E8F0' } },
        };
      });
    });

    warehouseSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    warehouseSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '059669' } };
    warehouseSheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };
    warehouseSheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        const valueCell = row.getCell(4);
        if (Number(valueCell.value || 0) > 0) valueCell.numFmt = '#,##0';
      }
    });

    await workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Bao_Cao_Ton_Kho_${formatDate()}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    });
  };

  return (
    <div style={{ minHeight: '100%', padding: '24px', background: 'radial-gradient(circle at top left, rgba(59,130,246,0.14), transparent 28%), radial-gradient(circle at top right, rgba(16,185,129,0.12), transparent 24%), #f5f7fb' }}>
      <style>{`@keyframes reportsPulse { 0% { box-shadow: 0 0 0 0 rgba(37,99,235,0.18); } 70% { box-shadow: 0 0 0 14px rgba(37,99,235,0); } 100% { box-shadow: 0 0 0 0 rgba(37,99,235,0); } }`}</style>
      <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
        <div style={{ ...getEnterStyle(0, 18), display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '22px', flexWrap: 'wrap' }}>
          <div style={{ display: 'grid', gap: '6px' }}>
            <h1 style={{ margin: 0, color: '#0f172a', fontSize: '30px', lineHeight: 1.05, letterSpacing: '-0.04em' }}>
              BÁO CÁO TỒN KHO TỔNG HỢP
            </h1>
            <p style={{ margin: 0, color: '#64748b', fontSize: '15px', fontWeight: 600, letterSpacing: '0.01em' }}>
              Inventory Overview &amp; Stock Intelligence
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={exportToExcel} style={{ padding: '14px 18px', background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', color: 'white', border: 'none', borderRadius: '16px', cursor: 'pointer', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '10px', boxShadow: '0 10px 30px rgba(34,197,94,0.22)' }}>
              <i className="ri-download-2-line" style={{ fontSize: '16px' }} />
              Xuất Excel
            </button>
          </div>
        </div>

        <div style={{ ...getEnterStyle(80, 18), display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '16px', marginBottom: '22px' }}>
          {[
            { label: 'Mặt hàng', value: summary.totalItems, accent: '#2563eb', icon: 'ri-box-3-line' },
            { label: 'Tổng số lượng', value: summary.totalQuantity, accent: '#7c3aed', icon: 'ri-stack-line' },
            { label: 'Giá trị tồn kho', value: `${formatCurrency(summary.totalValue)} đ`, accent: '#059669', icon: 'ri-coins-line' },
            { label: 'Cảnh báo tồn thấp', value: summary.lowStock, accent: '#ea580c', icon: 'ri-alarm-warning-line' },
          ].map((item) => (
            <div key={item.label} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = `0 18px 40px ${item.accent}22`; e.currentTarget.style.borderColor = `${item.accent}55`; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(15,23,42,0.06)'; e.currentTarget.style.borderColor = 'rgba(148,163,184,0.18)'; }} style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.92))', backdropFilter: 'blur(12px)', border: '1px solid rgba(148,163,184,0.18)', borderRadius: '20px', padding: '18px', boxShadow: '0 12px 32px rgba(15,23,42,0.06)', transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease', cursor: 'default' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '14px', display: 'grid', placeItems: 'center', marginBottom: '12px', background: `${item.accent}14`, color: item.accent, fontSize: '20px' }}>
                <i className={item.icon} />
              </div>
              <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '10px', fontWeight: 600 }}>{item.label}</div>
              <div style={{ color: item.accent, fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em' }}>{item.value}</div>
            </div>
          ))}
        </div>

        <div style={{ ...getEnterStyle(160, 18), background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(14px)', border: '1px solid rgba(148,163,184,0.16)', borderRadius: '24px', padding: '20px 22px', boxShadow: '0 18px 50px rgba(15, 23, 42, 0.08)', marginBottom: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '18px' }}>Bộ lọc báo cáo</h3>
              <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>Lọc theo kho hoặc SKU để tập trung vào nhóm dữ liệu cần xem.</p>
            </div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>{filteredData.length} bản ghi phù hợp</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px' }}>
            <label style={{ display: 'grid', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>Kho</span>
              <select value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)} style={{ padding: '12px 14px', borderRadius: '14px', border: '1px solid #cbd5e1', background: 'white', color: '#0f172a', outline: 'none' }}>
                <option value="all">Tất cả kho</option>
                {warehouseOptions.map((warehouse) => (
                  <option key={warehouse} value={warehouse}>{warehouse}</option>
                ))}
              </select>
            </label>

            <label style={{ display: 'grid', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>SKU</span>
              <input value={skuFilter} onChange={(e) => setSkuFilter(e.target.value)} placeholder="Nhập SKU cần tìm" style={{ padding: '12px 14px', borderRadius: '14px', border: '1px solid #cbd5e1', background: 'white', color: '#0f172a', outline: 'none' }} />
            </label>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
            <button onClick={() => { setWarehouseFilter('all'); setSkuFilter(''); }} style={{ padding: '10px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontWeight: 700, color: '#334155' }}>
              Xóa bộ lọc
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '22px' }}>
          <div onMouseEnter={(e) => handlePulseHover(e, '#2563eb')} onMouseLeave={handlePulseLeave} style={{ ...getEnterStyle(240, 18), ...chartCardBaseStyle, position: 'relative', overflow: 'hidden' }}>
            <div data-pulse style={{ position: 'absolute', inset: '-2px', borderRadius: '24px', pointerEvents: 'none', boxShadow: '0 0 0 0 rgba(37,99,235,0.18)', animation: 'reportsPulse 2.4s ease-out infinite', animationPlayState: 'paused' }} />
            <div style={{ position: 'relative' }}>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '18px' }}>Biểu đồ cột top 6</h3>
              <p style={{ margin: '6px 0 14px', color: '#64748b', fontSize: '14px' }}>So sánh các mặt hàng có giá trị tồn cao nhất trong dữ liệu đã lọc.</p>
              {chartData.length > 0 ? (
                <div style={{ width: '100%', height: 320 }}>
                  <ResponsiveContainer>
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => `${value / 1000000}tr`} />
                      <Tooltip formatter={(value) => `${formatCurrency(value)} đ`} labelFormatter={(label) => `SKU: ${label}`} />
                      <Bar dataKey="value" name="Giá trị tồn" radius={[12, 12, 0, 0]} fill="#2563eb" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ padding: '24px 0', textAlign: 'center', color: '#94a3b8' }}>Không có dữ liệu phù hợp để vẽ biểu đồ.</div>
              )}
            </div>
          </div>

          <div onMouseEnter={(e) => handlePulseHover(e, '#7c3aed')} onMouseLeave={handlePulseLeave} style={{ ...chartCardBaseStyle, position: 'relative', overflow: 'hidden' }}>
            <div data-pulse style={{ position: 'absolute', inset: '-2px', borderRadius: '24px', pointerEvents: 'none', boxShadow: '0 0 0 0 rgba(124,58,237,0.18)', animation: 'reportsPulse 2.4s ease-out infinite', animationPlayState: 'paused' }} />
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#0f172a', fontSize: '18px' }}>Phân bổ giá trị theo kho</h3>
                  <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px', lineHeight: 1.6 }}>Biểu đồ donut giúp nhìn nhanh tỷ trọng giá trị tồn kho giữa các kho.</p>
                </div>
                <div style={{ padding: '8px 10px', borderRadius: '999px', background: '#eff6ff', color: '#1d4ed8', fontSize: '12px', fontWeight: 700 }}>
                  {warehouseChartData.length} kho
                </div>
              </div>

              <div style={{ width: '100%', height: 280, marginTop: '8px' }}>
                {warehouseChartData.length > 0 ? (
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={warehouseChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={74} outerRadius={108} paddingAngle={3} stroke="rgba(255,255,255,0.9)" strokeWidth={2}>
                        {warehouseChartData.map((entry, index) => (
                          <Cell key={`cell-${entry.name}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${formatCurrency(value)} đ`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: '#94a3b8', textAlign: 'center' }}>Không có dữ liệu phù hợp để vẽ biểu đồ donut.</div>
                )}
              </div>

              {warehouseChartData.length > 0 && (
                <div style={{ display: 'grid', gap: '10px', marginTop: '14px' }}>
                  {warehouseChartData.map((item) => {
                    const total = warehouseChartData.reduce((sum, current) => sum + current.value, 0) || 1;
                    const percent = ((item.value / total) * 100).toFixed(1);
                    return (
                      <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '14px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <span style={{ width: '12px', height: '12px', borderRadius: '999px', background: PIE_COLORS[warehouseChartData.indexOf(item) % PIE_COLORS.length], flexShrink: 0 }} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'baseline' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: '#059669' }}>{percent}%</span>
                          </div>
                          <div style={{ marginTop: '6px', height: '8px', borderRadius: '999px', background: '#e2e8f0', overflow: 'hidden' }}>
                            <div style={{ width: `${percent}%`, height: '100%', borderRadius: '999px', background: PIE_COLORS[warehouseChartData.indexOf(item) % PIE_COLORS.length] }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div onMouseEnter={(e) => handlePulseHover(e, '#059669')} onMouseLeave={handlePulseLeave} style={{ ...getEnterStyle(320, 18), ...chartCardBaseStyle, position: 'relative', overflow: 'hidden', marginBottom: '22px' }}>
          <div data-pulse style={{ position: 'absolute', inset: '-2px', borderRadius: '24px', pointerEvents: 'none', boxShadow: '0 0 0 0 rgba(5,150,105,0.18)', animation: 'reportsPulse 2.4s ease-out infinite', animationPlayState: 'paused' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ padding: '20px 22px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: '18px' }}>Chi tiết báo cáo tồn kho</h3>
                <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>Danh sách sản phẩm, kho và giá trị tồn hiện tại.</p>
              </div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>{filteredData.length} bản ghi</div>
            </div>

            {error ? (
              <div style={{ padding: '28px', textAlign: 'center', color: '#b91c1c', background: '#fef2f2' }}>{error}</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                  <thead>
                    <tr style={{ textAlign: 'left', background: '#f8fafc', color: '#475569' }}>
                      {['SKU', 'Sản phẩm', 'Kho', 'Số lượng', 'Đơn giá', 'Thành tiền'].map((header) => (
                        <th key={header} style={{ padding: '16px 18px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #e2e8f0' }}>
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="6" style={{ padding: '34px 18px', textAlign: 'center', color: '#64748b' }}>
                          Đang tổng hợp dữ liệu...
                        </td>
                      </tr>
                    ) : filteredData.length > 0 ? (
                      filteredData.map((item, index) => {
                      const stockTone = getStockTone(item.on_hand_qty);
                      return (
                        <tr
                          key={`${item.sku}-${index}`}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateX(6px)';
                            e.currentTarget.style.boxShadow = 'inset 4px 0 0 #2563eb';
                            e.currentTarget.style.background = '#f8fbff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateX(0)';
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.background = '#fff';
                          }}
                          style={{
                            ...getRowStyle(index),
                            borderBottom: '1px solid #eef2f7',
                            transition: 'transform 180ms ease, background 180ms ease, box-shadow 180ms ease',
                            background: '#fff',
                          }}
                        >
                          <td style={{ padding: '16px 18px', fontWeight: 700, color: '#0f172a' }}>{item.sku}</td>
                          <td style={{ padding: '16px 18px', color: '#1e293b' }}>{item.product_name}</td>
                          <td style={{ padding: '16px 18px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '7px 10px', borderRadius: '999px', background: '#eff6ff', color: '#2563eb', fontSize: '12px', fontWeight: 700 }}>
                              {item.warehouse_name}
                            </span>
                          </td>
                          <td style={{ padding: '16px 18px', fontWeight: 700, color: stockTone.color }}>
                            {Number(item.on_hand_qty || 0)} {item.unit}
                          </td>
                          <td style={{ padding: '16px 18px', color: '#334155' }}>{formatCurrency(item.sale_price)} đ</td>
                          <td style={{ padding: '16px 18px', color: '#059669', fontWeight: 800 }}>{formatCurrency(item.total_value)} đ</td>
                        </tr>
                      );
                    })
                    ) : (
                      <tr>
                        <td colSpan="6" style={{ padding: '42px 18px', textAlign: 'center', color: '#94a3b8' }}>
                          Không tìm thấy dữ liệu phù hợp với bộ lọc hiện tại.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
