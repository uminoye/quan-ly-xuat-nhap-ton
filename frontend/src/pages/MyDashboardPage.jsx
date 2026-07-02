import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ExcelJS from 'exceljs';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import api from '../services/api';
import { getDashboardStats } from '../services/reportService';

const BLUE = '#2563eb';
const BLUE_MID = '#3b82f6';
const BLUE_SOFT = '#eff6ff';
const BLUE_BORDER = '#e0e7ff';
const chartColors = ['#2563eb', '#3b82f6', '#60a5fa', '#8b5cf6', '#0ea5e9'];

const statMeta = {
  orders:    { icon: 'ri-shopping-bag-3-line', color: '#2563eb', label: 'Tổng đơn hàng' },
  revenue:   { icon: 'ri-line-chart-line',      color: '#0ea5e9', label: 'Doanh thu' },
  quantity:  { icon: 'ri-stack-line',           color: '#8b5cf6', label: 'Số lượng bán' },
  lowStock:  { icon: 'ri-alert-line',           color: '#ef4444', label: 'Sản phẩm sắp hết' },
};

const safeDate = (v) => { if (!v) return null; const d = new Date(v); return Number.isNaN(d.getTime()) ? null : d; };
const money = new Intl.NumberFormat('vi-VN');

const cardBase = {
  background: '#fff', borderRadius: 20, padding: 20,
  boxShadow: '0 10px 30px rgba(37,99,235,0.06)',
  border: '1px solid #e0e7ff',
  transition: 'transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease',
};

function StatCard({ meta, value, sub, onMouseEnter, onMouseLeave }) {
  return (
    <div
      onClick={meta.to ? () => navigate(meta.to) : undefined}
      onKeyDown={meta.to ? (e) => e.key === 'Enter' && navigate(meta.to) : undefined}
      role={meta.to ? 'button' : undefined}
      tabIndex={meta.to ? 0 : undefined}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)'; e.currentTarget.style.boxShadow = '0 22px 56px rgba(37,99,235,0.14)'; e.currentTarget.style.borderColor = `${meta.color}55`; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(37,99,235,0.06)'; e.currentTarget.style.borderColor = '#e0e7ff'; }}
      style={{ ...cardBase, cursor: meta.to ? 'pointer' : 'default' }}
    >
      <div style={{ width: 42, height: 42, borderRadius: 12, background: meta.color, display: 'grid', placeItems: 'center', color: '#fff', fontSize: 20, marginBottom: 20 }}>
        <i className={meta.icon} />
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginBottom: 4, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontWeight: 600, color: '#334155', marginBottom: 4 }}>{meta.label}</div>
      <div style={{ fontSize: 12, color: '#94a3b8' }}>{sub}</div>
    </div>
  );
}

export default function MyDashboardPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [monthlyImportExportData, setMonthlyImportExportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportMonth, setExportMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [pageLoaded, setPageLoaded] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setPageLoaded(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, productsRes, dashboardRes] = await Promise.all([
          api.get('/orders'),
          api.get('/products'),
          getDashboardStats(),
        ]);
        setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
        setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
        setMonthlyImportExportData(
          Array.isArray(dashboardRes?.monthly_import_export)
            ? dashboardRes.monthly_import_export.map((item) => ({ name: item.name, Nhập: Number(item.Nhập || 0), Xuất: Number(item.Xuất || 0) }))
            : [],
        );
      } catch (error) {
        console.error('Lỗi tải dashboard Sales', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const completedOrders = useMemo(() => orders.filter((o) => o.status === 'completed'), [orders]);
  const pendingOrders = useMemo(() => orders.filter((o) => ['pending', 'warehouse_processing', 'processing'].includes(o.status)), [orders]);
  const issueOrders = useMemo(() => orders.filter((o) => ['rejected', 'delayed', 'cancelled'].includes(o.status)), [orders]);

  const totalOrders = orders.length;
  const totalRevenue = completedOrders.reduce((sum, order) => {
    const fallbackTotal = Number(order.total_amount || order.total || 0);
    if (fallbackTotal > 0) return sum + fallbackTotal;
    const itemTotal = Array.isArray(order.items)
      ? order.items.reduce((s, item) => s + Number(item.quantity || 0) * Number(item.unit_price || item.price || 0), 0) : 0;
    return sum + itemTotal;
  }, 0);
  const totalQuantity = completedOrders.reduce((sum, order) => {
    if (Array.isArray(order.items)) return sum + order.items.reduce((s, item) => s + Number(item.quantity || 0), 0);
    return sum + Number(order.total_quantity || 0);
  }, 0);

  const lowStockProducts = products.filter((p) => Number(p.stock || 0) <= 20).sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0));
  const totalProducts = products.length;
  const lowStockCount = lowStockProducts.length;
  const recentOrders = [...orders].sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0)).slice(0, 6);

  const categoryData = useMemo(() => {
    const typeMap = new Map();
    products.forEach((p) => {
      const key = p.category_name || p.category || 'Khác';
      typeMap.set(key, (typeMap.get(key) || 0) + Number(p.stock || 0));
    });
    const total = Array.from(typeMap.values()).reduce((s, v) => s + v, 0) || 1;
    return Array.from(typeMap.entries())
      .map(([name, value]) => ({ name, value, percent: Math.round((value / total) * 100) }))
      .sort((a, b) => b.value - a.value).slice(0, 5);
  }, [products]);

  const handleExportReport = async () => {
    try {
      setExporting(true);
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'STEEL STOCK'; workbook.created = new Date();
      workbook.modified = new Date(); workbook.company = 'STEEL STOCK';
      workbook.title = 'Báo cáo Dashboard Sales'; workbook.subject = 'Sales Dashboard';

      const titleRow = (sheet, r, title, sub) => {
        sheet.mergeCells(`A1:${String.fromCharCode(64 + (sheet.columns?.length || 3))}${r}`);
        sheet.getCell(`A${r}`).value = title;
        sheet.getCell(`A${r}`).font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
        sheet.getCell(`A${r}`).alignment = { horizontal: 'center', vertical: 'middle' };
        sheet.getCell(`A${r}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563eb' } };
      };
      const styleHeader = (sheet, rowNum, count) => {
        for (let i = 0; i < count; i++) {
          const c = sheet.getCell(`${String.fromCharCode(65 + i)}${rowNum}`);
          c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1d4ed8' } };
          c.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      };
      const applyBorders = (sheet) => {
        sheet.eachRow((row, rn) => {
          row.eachCell((cell) => {
            cell.border = { top: { style: 'thin', color: { argb: 'FFE2E8F0' } }, left: { style: 'thin', color: { argb: 'FFE2E8F0' } }, bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }, right: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
            if (rn > 3) cell.alignment = { vertical: 'middle', wrapText: true };
          });
        });
      };

      const s1 = workbook.addWorksheet('Tong quan');
      s1.columns = [{ width: 28 }, { width: 18 }, { width: 40 }];
      titleRow(s1, 1, 'BÁO CÁO DASHBOARD SALES', `Xuất: ${new Date().toLocaleString('vi-VN')}`);
      s1.addRows([['Chỉ số', 'Giá trị', 'Ghi chú']]);
      [['Tổng đơn hàng', totalOrders, `${completedOrders.length} đơn hoàn tất`],
       ['Doanh thu', totalRevenue, 'Từ đơn completed'],
       ['Số lượng bán', totalQuantity, 'Tổng items đã bán'],
       ['Sản phẩm sắp hết', lowStockCount, `${totalProducts} sản phẩm đang quản lý`],
      ].forEach(r => s1.addRow(r));
      s1.getColumn(2).numFmt = '#,##0';
      styleHeader(s1, 3, 3);
      applyBorders(s1);

      const s2 = workbook.addWorksheet('Nhap xuat thang');
      s2.columns = [{ width: 18 }, { width: 16 }, { width: 16 }];
      titleRow(s2, 1, 'NHẬP XUẤT THEO THÁNG', 'Dữ liệu từ dashboard');
      s2.addRows([['Tháng', 'Nhập', 'Xuất'], ...monthlyImportExportData.map(i => [i.name, i.Nhập, i.Xuất])]);
      s2.getColumn(2).numFmt = '#,##0'; s2.getColumn(3).numFmt = '#,##0';
      styleHeader(s2, 3, 3);
      applyBorders(s2);

      const s3 = workbook.addWorksheet('Trang thai don hang');
      s3.columns = [{ width: 16 }, { width: 24 }, { width: 32 }, { width: 14 }, { width: 16 }, { width: 16 }];
      titleRow(s3, 1, 'TRẠNG THÁI ĐƠN HÀNG', `Tháng ${exportMonth || 'Tất cả'}`);
      s3.addRows([['Mã đơn', 'Khách hàng', 'Sản phẩm', 'Số lượng', 'Đơn giá', 'Thành tiền']]);
      orders.forEach(order => {
        const items = Array.isArray(order.items) ? order.items : [];
        items.forEach((item, idx) => {
          s3.addRow([
            idx === 0 ? (order.order_no || `#${order.id}`) : '',
            idx === 0 ? (order.customer_name || order.customer?.name || 'Khách lẻ') : '',
            item.product_name || item.name || item.product?.name || `#${item.product_id || ''}`,
            Number(item.quantity || 0),
            Number(item.unit_price || item.sale_price || item.price || item.product?.sale_price || 0),
            Number(item.quantity || 0) * Number(item.unit_price || item.sale_price || item.price || item.product?.sale_price || 0),
          ]);
        });
        if (items.length === 0) s3.addRow([order.order_no || `#${order.id}`, order.customer_name || 'Khách lẻ', 'Chưa có sản phẩm', 0, 0, 0]);
      });
      s3.getColumn(5).numFmt = '#,##0'; s3.getColumn(6).numFmt = '#,##0';
      styleHeader(s3, 3, 6);
      applyBorders(s3);

      const s4 = workbook.addWorksheet('San pham sap het');
      s4.columns = [{ width: 16 }, { width: 30 }, { width: 18 }, { width: 14 }, { width: 18 }];
      titleRow(s4, 1, 'SẢN PHẨM SẮP HẾT', 'Danh sách tồn kho thấp');
      s4.addRows([['SKU', 'Tên sản phẩm', 'Danh mục', 'Tồn kho', 'Trạng thái']]);
      lowStockProducts.forEach(p => s4.addRow([p.sku || p.product_sku || '-', p.name || 'Không tên', p.category_name || 'Khác', Number(p.stock || 0), Number(p.stock || 0) <= 10 ? 'Cần nhập gấp' : 'Sắp hết']));
      styleHeader(s4, 3, 5);
      applyBorders(s4);

      const buf = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `sales-dashboard-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Lỗi xuất báo cáo', error);
    } finally {
      setExporting(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#94a3b8', fontSize: 15 }}>
      <i className="ri-loader-4-line" style={{ fontSize: 24, marginRight: 10, animation: 'spin 1s linear infinite' }} />
      Đang tải dashboard Sales...
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(18px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }
        @media (max-width: 1024px) {
          .sale-stat-row   { grid-template-columns: repeat(2, 1fr) !important; }
          .sale-chart-row { grid-template-columns: 1fr !important; }
          .sale-bot-row   { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .sale-stat-row   { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
          .sale-chart-row { grid-template-columns: 1fr !important; }
          .sale-bot-row   { grid-template-columns: 1fr !important; }
        }
        .fade-up-1 { animation: fadeUp 400ms ease 0ms   both; }
        .fade-up-2 { animation: fadeUp 400ms ease 80ms  both; }
        .fade-up-3 { animation: fadeUp 400ms ease 160ms both; }
        .fade-up-4 { animation: fadeUp 400ms ease 240ms both; }
      `}</style>

      <div style={{
        padding: 20,
        background: 'linear-gradient(160deg, #eff6ff 0%, #f0f4ff 50%, #fafbff 100%)',
        borderRadius: 24,
        opacity: pageLoaded ? 1 : 0,
        transition: 'opacity 420ms ease',
      }}>

        {/* Header */}
        <div className="fade-up-1" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>Dashboard Sales</div>
            <h2 style={{ margin: 0, color: '#0f172a', fontSize: 24, fontWeight: 800 }}>Tổng quan Sales</h2>
            <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: 13 }}>Dữ liệu tổng hợp từ đơn hàng và sản phẩm trong hệ thống.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ background: '#fff', border: '1px solid #e0e7ff', borderRadius: 12, padding: '9px 14px', color: '#334155', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <i className="ri-calendar-line" style={{ color: '#94a3b8' }} />
              <input type="month" value={exportMonth} onChange={(e) => setExportMonth(e.target.value)}
                style={{ border: 'none', outline: 'none', font: 'inherit', color: '#334155', background: 'transparent', fontSize: 13 }} />
            </label>
            <button
              onClick={handleExportReport}
              disabled={exporting}
              onMouseEnter={e => { if (!exporting) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.filter = 'brightness(1.04)'; } }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.filter = 'brightness(1)'; }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', border: 'none', borderRadius: 999,
                background: exporting ? `linear-gradient(135deg, #93c5fd, ${BLUE_MID})` : `linear-gradient(135deg, ${BLUE}, ${BLUE_MID})`,
                color: '#fff', fontWeight: 700, fontSize: 14, cursor: exporting ? 'not-allowed' : 'pointer',
                boxShadow: '0 10px 28px rgba(37,99,235,0.28)',
                opacity: exporting ? 0.85 : 1,
                transition: 'transform 180ms ease, filter 180ms ease',
              }}
            >
              <i className="ri-download-2-line" style={{ fontSize: 16 }} />
              {exporting ? 'Đang xuất...' : 'Xuất Excel'}
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="sale-stat-row fade-up-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 16 }}>
          <StatCard meta={{ ...statMeta.orders, to: '/sales-orders' }} value={totalOrders} sub={`${completedOrders.length} đơn hoàn tất`} />
          <StatCard meta={{ ...statMeta.revenue, to: '/reports' }} value={`${money.format(totalRevenue)} đ`} sub="Từ đơn completed" />
          <StatCard meta={{ ...statMeta.quantity, to: '/sales-orders' }} value={totalQuantity} sub="Tổng items đã bán" />
          <StatCard meta={{ ...statMeta.lowStock, to: '/products' }} value={lowStockCount} sub={`${totalProducts} sản phẩm đang quản lý`} />
        </div>

        {/* Charts row */}
        <div className="sale-chart-row fade-up-3" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 16 }}>
          {/* Bar chart */}
          <div style={{ ...cardBase }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
              <div>
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: 16, fontWeight: 800 }}>Thống kê xuất nhập theo tháng</h3>
                <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: 12 }}>Dữ liệu 7 tháng gần nhất</p>
              </div>
              <div style={{ display: 'flex', gap: 14, color: '#64748b', fontSize: 12 }}>
                <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: BLUE, marginRight: 5 }} />Nhập kho</span>
                <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: '#60a5fa', marginRight: 5 }} />Xuất kho</span>
              </div>
            </div>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyImportExportData} barGap={8}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e7ff" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Nhập" fill={BLUE} radius={[8, 8, 0, 0]} />
                  <Bar dataKey="Xuất" fill="#60a5fa" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie chart */}
          <div style={{ ...cardBase }}>
            <h3 style={{ margin: 0, color: '#0f172a', fontSize: 16, fontWeight: 800 }}>Danh mục sản phẩm</h3>
            <p style={{ margin: '4px 0 14px', color: '#94a3b8', fontSize: 12 }}>Tỷ lệ theo tồn kho hiện tại</p>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={3}>
                    {categoryData.map((entry, index) => <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div>
              {categoryData.length === 0 ? (
                <div style={{ color: '#94a3b8', textAlign: 'center', padding: '12px 0', fontSize: 13 }}>Chưa có dữ liệu danh mục</div>
              ) : categoryData.map((item, index) => (
                <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 13, color: '#334155' }}>
                  <div><span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 999, background: chartColors[index % chartColors.length], marginRight: 6 }} />{item.name}</div>
                  <strong style={{ color: chartColors[index % chartColors.length] }}>{item.percent}%</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom row: recent orders + urgent */}
        <div className="sale-bot-row fade-up-4" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
          {/* Recent orders */}
          <div style={{ ...cardBase }}>
            <h3 style={{ margin: '0 0 14px', color: '#0f172a', fontSize: 16, fontWeight: 800 }}>Đơn hàng gần đây</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#94a3b8', fontSize: 12 }}>
                  <th style={{ paddingBottom: 10 }}>Mã đơn</th>
                  <th style={{ paddingBottom: 10 }}>Khách hàng</th>
                  <th style={{ paddingBottom: 10 }}>Ngày giao</th>
                  <th style={{ paddingBottom: 10 }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr><td colSpan="4" style={{ padding: '18px 0', textAlign: 'center', color: '#94a3b8' }}>Chưa có đơn hàng</td></tr>
                ) : recentOrders.map((order) => (
                  <tr key={order.id} style={{ borderTop: '1px solid #e0e7ff' }}>
                    <td style={{ padding: '12px 0', fontWeight: 700, color: BLUE }}>{order.order_no || `#${order.id}`}</td>
                    <td style={{ color: '#334155', fontSize: 13 }}>{order.customer_name || order.customer?.name || 'Khách lẻ'}</td>
                    <td style={{ color: '#94a3b8', fontSize: 12 }}>{safeDate(order.expected_delivery_date || order.created_at)?.toLocaleDateString('vi-VN') || '---'}</td>
                    <td>
                      <span style={{
                        padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                        background: order.status === 'completed' ? '#dbeafe' : order.status === 'rejected' ? '#fee2e2' : BLUE_SOFT,
                        color: order.status === 'completed' ? '#1d4ed8' : order.status === 'rejected' ? '#b91c1c' : '#2563eb',
                      }}>
                        {(order.status || 'pending').toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Urgent / Issues */}
          <div style={{ ...cardBase, background: '#fff7ed', border: '1px solid #fed7aa' }}>
            <h3 style={{ margin: '0 0 4px', color: '#c2410c', fontSize: 16, fontWeight: 800 }}>Cần xử lý gấp</h3>
            <p style={{ margin: '0 0 14px', color: '#94a3b8', fontSize: 12 }}>{issueOrders.length} đơn cần theo dõi</p>
            {issueOrders.length === 0 ? (
              <div style={{ padding: '18px 0', textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
                <p style={{ color: '#16a34a', fontWeight: 700, margin: 0 }}>Không có đơn bị kẹt!</p>
              </div>
            ) : (
              <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                {issueOrders.map((order) => (
                  <div key={order.id} style={{ background: '#fff', borderRadius: 12, padding: 12, marginBottom: 10, border: '1px solid #ffedd5' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <strong style={{ color: '#b91c1c', fontSize: 13 }}>{order.order_no || `#${order.id}`}</strong>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#c2410c', padding: '2px 8px', background: '#ffedd5', borderRadius: 999 }}>{order.status?.toUpperCase()}</span>
                    </div>
                    <div style={{ color: '#475569', fontSize: 12, marginBottom: 3 }}>Khách: {order.customer_name || order.customer?.name || 'Khách lẻ'}</div>
                    <div style={{ color: '#94a3b8', fontSize: 11, fontStyle: 'italic' }}>{order.note || 'Không có ghi chú'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </>
  );
}
