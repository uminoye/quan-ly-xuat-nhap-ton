import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ExcelJS from 'exceljs';
import { getDashboardStats } from '../services/reportService';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

const ACCENT_COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#0ea5e9'];

const formatCurrency = (value) => new Intl.NumberFormat('vi-VN').format(value || 0);
const formatDate = (value) => (value ? new Date(value).toLocaleDateString('vi-VN') : '--');
const formatMonthLabel = (value) => {
  if (!value) return '--';
  const date = new Date(`${value}-01`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('vi-VN', { month: 'short', year: 'numeric' }).format(date);
};
const getTodayTimestamp = () => new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date());
const safeArray = (value) => (Array.isArray(value) ? value : []);
const formatExcelCurrency = (value) => Number(value || 0);

const statIcons = {
  revenue:    (<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: 22, height: 22 }}><path d="M12 2v20M17 6.5c0-1.93-2.24-3.5-5-3.5S7 4.57 7 6.5 9.24 10 12 10s5 1.57 5 3.5S14.76 17 12 17s-5-1.57-5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>),
  stock:      (<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: 22, height: 22 }}><path d="M4 7.5 12 4l8 3.5-8 3.5-8-3.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M4 7.5V16.5L12 20l8-3.5V7.5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>),
  processing: (<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: 22, height: 22 }}><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" /></svg>),
  alert:     (<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: 22, height: 22 }}><path d="m10.29 4.86-7.43 12.8A2 2 0 0 0 4.58 21h14.84a2 2 0 0 0 1.72-3.34l-7.43-12.8a2 2 0 0 0-3.44 0Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" /></svg>),
};

const statusMeta = {
  completed:            { label: 'Hoàn tất',       bg: '#dbeafe', color: '#1d4ed8' },
  pending:              { label: 'Chờ xử lý',      bg: '#fef3c7', color: '#92400e' },
  warehouse_processing:  { label: 'Đang xử lý',    bg: '#dbeafe', color: '#1d4ed8' },
  rejected:             { label: 'Từ chối',        bg: '#fee2e2', color: '#b91c1c' },
  delayed:              { label: 'Dời ngày',       bg: '#ffedd5', color: '#c2410c' },
  returned:             { label: 'Hoàn trả',        bg: '#f3e8ff', color: '#7c3aed' },
};

// ── Shared card style ────────────────────────────────────────────
const cardBase = {
  background: '#fff',
  borderRadius: 20,
  padding: 20,
  border: '1px solid #e0e7ff',
  boxShadow: '0 10px 30px rgba(37,99,235,0.06)',
};

function StatCard({ label, value, hint, icon, accent, hovered, onMouseEnter, onMouseLeave }) {
  return (
    <div
      className="stat-card"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        ...cardBase,
        background: hovered ? 'linear-gradient(160deg, #eff6ff 0%, #fff 100%)' : '#fff',
        boxShadow: hovered ? '0 18px 40px rgba(37,99,235,0.14)' : '0 10px 30px rgba(37,99,235,0.06)',
        border: hovered ? `1.5px solid ${accent}` : '1px solid #e0e7ff',
        transition: 'all 220ms ease',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        cursor: 'default',
      }}
    >
      <div style={{
        width: 46, height: 46, borderRadius: 14,
        background: accent, color: '#fff',
        display: 'grid', placeItems: 'center',
        transition: 'transform 220ms ease',
        transform: hovered ? 'scale(1.08)' : 'scale(1)',
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}>{label}</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginTop: 6, lineHeight: 1.1 }}>{value}</div>
        {hint ? <div style={{ fontSize: 12, color: '#64748b', marginTop: 5 }}>{hint}</div> : null}
      </div>
    </div>
  );
}

function SectionCard({ title, subtitle, children }) {
  return (
    <div style={{ ...cardBase }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>{title}</div>
        {subtitle ? <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>{subtitle}</div> : null}
      </div>
      {children}
    </div>
  );
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');
  const [pageLoaded, setPageLoaded] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const res = await getDashboardStats();
        setDashboard(res || {});
      } catch (err) {
        setError(`Không thể tải dữ liệu dashboard. ${err?.response?.data?.message || err.message || ''}`.trim());
      } finally {
        setLoading(false);
      }
    };
    const run = () => { setPageLoaded(false); requestAnimationFrame(() => requestAnimationFrame(() => setPageLoaded(true))); };
    fetchAllData();
    run();
    window.addEventListener('pageshow', run);
    return () => window.removeEventListener('pageshow', run);
  }, []);

  const totalRevenue = dashboard?.total_revenue || 0;
  const totalStock = dashboard?.total_products || 0;
  const lowStockCount = dashboard?.low_stock || 0;
  const processingOrdersCount = dashboard?.processing_orders || 0;
  const recentOrders = safeArray(dashboard?.recent_orders);
  const recentActivities = safeArray(dashboard?.recent_activities);
  const monthlyImportExportData = safeArray(dashboard?.monthly_import_export).map((item) => ({
    name: formatMonthLabel(item.name), Nhập: item.Nhập || 0, Xuất: item.Xuất || 0,
  }));
  const revenueTrend = safeArray(dashboard?.revenue_trend).map((item) => ({
    name: formatMonthLabel(item.month), month: item.month, DoanhThu: item.revenue || 0,
  }));
  const topProductsData = safeArray(dashboard?.top_selling_products).map((item) => ({ name: item.name, value: item.value || 0 }));
  const completedOrderCount = recentOrders.filter((o) => o.status === 'completed').length;
  const lastUpdatedText = getTodayTimestamp();

  const handleExportReport = async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'STEEL STOCK'; workbook.created = new Date();
    workbook.modified = new Date(); workbook.company = 'STEEL STOCK';
    workbook.title = 'Báo cáo dashboard'; workbook.subject = 'Dashboard Admin';

    const styleSheet = (sheet) => {
      sheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = { top: { style: 'thin', color: { argb: 'FFE2E8F0' } }, left: { style: 'thin', color: { argb: 'FFE2E8F0' } }, bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }, right: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
          if (rowNumber > 3) cell.alignment = { vertical: 'middle' };
        });
      });
    };

    const titleRow = (sheet, rowNum, title, subtitle) => {
      sheet.mergeCells(`A${rowNum}:F${rowNum}`);
      sheet.getCell(`A${rowNum}`).value = title;
      sheet.getCell(`A${rowNum}`).font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
      sheet.getCell(`A${rowNum}`).alignment = { horizontal: 'center', vertical: 'middle' };
      sheet.getCell(`A${rowNum}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563eb' } };
    };

    const headerRow = (sheet, rowNum, headers) => {
      headers.forEach((h, i) => { const c = sheet.getCell(`${String.fromCharCode(65 + i)}${rowNum}`); c.value = h; c.font = { bold: true, color: { argb: 'FFFFFFFF' } }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1d4ed8' } }; c.alignment = { horizontal: 'center', vertical: 'middle' }; });
    };

    const s1 = workbook.addWorksheet('Tong quan');
    titleRow(s1, 1, 'BÁO CÁO DASHBOARD ADMIN', `Cập nhật: ${lastUpdatedText}`);
    s1.mergeCells('A2:B2'); s1.getCell('A2').value = 'STEEL STOCK'; s1.getCell('A2').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563eb' } };
    s1.columns = [{ width: 30 }, { width: 22 }]; s1.addRows([['Chỉ số', 'Giá trị'], ...[
      ['Tổng doanh thu', formatExcelCurrency(totalRevenue)], ['Tổng sản phẩm', formatExcelCurrency(totalStock)],
      ['Đơn đang xử lý', formatExcelCurrency(processingOrdersCount)], ['Sản phẩm sắp hết', formatExcelCurrency(lowStockCount)],
    ]]); s1.getColumn(2).numFmt = '#,##0'; headerRow(s1, 3, ['Chỉ số', 'Giá trị']); styleSheet(s1);

    const s2 = workbook.addWorksheet('Nhap xuat');
    titleRow(s2, 1, 'NHẬP XUẤT THEO THÁNG', 'Dữ liệu từ dashboard');
    s2.columns = [{ width: 16 }, { width: 14 }, { width: 14 }];
    s2.addRows([['Tháng', 'Nhập', 'Xuất'], ...monthlyImportExportData.map(i => [i.name, i.Nhập, i.Xuất])]);
    s2.getColumn(2).numFmt = '#,##0'; s2.getColumn(3).numFmt = '#,##0';
    headerRow(s2, 3, ['Tháng', 'Nhập', 'Xuất']); styleSheet(s2);

    const s3 = workbook.addWorksheet('San pham');
    titleRow(s3, 1, 'SẢN PHẨM BÁN CHẠY', 'Top sản phẩm');
    s3.columns = [{ width: 8 }, { width: 32 }, { width: 14 }];
    s3.addRows([['Top', 'Sản phẩm', 'SL'], ...topProductsData.map((p, i) => [i + 1, p.name, p.value])]);
    s3.getColumn(3).numFmt = '#,##0'; headerRow(s3, 3, ['Top', 'Sản phẩm', 'Số lượng']); styleSheet(s3);

    const s4 = workbook.addWorksheet('Don hang');
    titleRow(s4, 1, 'ĐƠN HÀNG GẦN NHẤT', 'Hoạt động đơn hàng');
    s4.columns = [{ width: 20 }, { width: 28 }, { width: 18 }, { width: 16 }, { width: 16 }];
    s4.addRows([['Mã đơn', 'Khách hàng', 'Trạng thái', 'Ngày dự kiến', 'Ngày hoàn tất'],
      ...recentOrders.map(o => [o.order_no || o.id || '-', o.customer_name || '-', statusMeta[o.status]?.label || o.status || '', formatDate(o.expected_delivery_date), o.completed_at ? formatDate(o.completed_at) : '--'])]);
    headerRow(s4, 3, ['Mã đơn', 'Khách hàng', 'Trạng thái', 'Ngày dự kiến', 'Ngày hoàn tất']); styleSheet(s4);

    const buf = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `dashboard-admin-${new Date().toISOString().slice(0, 10)}.xlsx`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#94a3b8', fontSize: 15 }}>
      <i className="ri-loader-4-line" style={{ fontSize: 24, marginRight: 10, animation: 'spin 1s linear infinite' }} />
      Đang tải dashboard...
    </div>
  );
  if (error) return (
    <div style={{ padding: 24, color: '#b91c1c', background: '#fee2e2', borderRadius: 16, border: '1px solid #fecaca' }}>
      {error}
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
        @media (max-width: 1024px) {
          .adm-stat-row  { grid-template-columns: repeat(2, 1fr) !important; }
          .adm-chart-row { grid-template-columns: 1fr !important; }
          .adm-row-2col  { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .adm-stat-row  { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
          .adm-chart-row { grid-template-columns: 1fr !important; }
          .adm-row-2col  { grid-template-columns: 1fr !important; }
          .stat-card { padding: 14px !important; }
        }
        .fade-up-1 { animation: fadeUp 400ms ease 0ms   both; }
        .fade-up-2 { animation: fadeUp 400ms ease 80ms  both; }
        .fade-up-3 { animation: fadeUp 400ms ease 160ms both; }
        .fade-up-4 { animation: fadeUp 400ms ease 240ms both; }
        .fade-up-5 { animation: fadeUp 400ms ease 320ms both; }
      `}</style>

      <div style={{
        padding: 20,
        background: 'linear-gradient(160deg, #eff6ff 0%, #f0f4ff 40%, #fafbff 100%)',
        borderRadius: 24,
        opacity: pageLoaded ? 1 : 0,
        transition: 'opacity 320ms ease',
      }}>

        {/* Header */}
        <div className="fade-up-1" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a' }}>Tổng quan hệ thống</h2>
            <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: 13 }}>Cập nhật: {lastUpdatedText}</p>
          </div>
          <button
            onClick={handleExportReport}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              border: 'none', borderRadius: 12, padding: '10px 16px',
              background: 'linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)',
              color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(37,99,235,0.28)',
              transition: 'transform 150ms, box-shadow 150ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(37,99,235,0.36)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(37,99,235,0.28)'; }}
          >
            <i className="ri-download-2-line" />
            Xuất báo cáo
          </button>
        </div>

        {/* Stat cards */}
        <div className="adm-stat-row fade-up-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 16 }}>
          <StatCard label="Tổng doanh thu" value={`${formatCurrency(totalRevenue)} đ`} hint={`${completedOrderCount} đơn hoàn tất`} icon={statIcons.revenue} accent="linear-gradient(135deg, #2563eb, #3b82f6)" hovered={hoveredCard === 'revenue'} onMouseEnter={() => setHoveredCard('revenue')} onMouseLeave={() => setHoveredCard(null)} />
          <StatCard label="Sản phẩm trong kho" value={formatCurrency(totalStock)} hint="Từ báo cáo tổng hợp" icon={statIcons.stock} accent="linear-gradient(135deg, #0ea5e9, #38bdf8)" hovered={hoveredCard === 'stock'} onMouseEnter={() => setHoveredCard('stock')} onMouseLeave={() => setHoveredCard(null)} />
          <StatCard label="Đơn đang xử lý" value={processingOrdersCount} hint="Chờ / đang xử lý / kho" icon={statIcons.processing} accent="linear-gradient(135deg, #f59e0b, #fbbf24)" hovered={hoveredCard === 'processing'} onMouseEnter={() => setHoveredCard('processing')} onMouseLeave={() => setHoveredCard(null)} />
          <StatCard label="Sản phẩm sắp hết" value={lowStockCount} hint="Cần nhập bổ sung" icon={statIcons.alert} accent="linear-gradient(135deg, #ef4444, #f87171)" hovered={hoveredCard === 'alert'} onMouseEnter={() => setHoveredCard('alert')} onMouseLeave={() => setHoveredCard(null)} />
        </div>

        {/* Charts row */}
        <div className="adm-chart-row fade-up-3" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 14 }}>
          <SectionCard title="Nhập kho & Xuất kho" subtitle="Biến động hàng tháng">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyImportExportData} barCategoryGap={18}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e7ff" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <RechartsTooltip cursor={{ fill: '#f0f4ff' }} />
                <Bar dataKey="Nhập" fill="#2563eb" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Xuất" fill="#60a5fa" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>

          <SectionCard title="Sản phẩm bán chạy" subtitle="Theo số lượng bán">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={topProductsData} dataKey="value" nameKey="name" innerRadius={56} outerRadius={82} paddingAngle={4}>
                  {topProductsData.map((entry, index) => <Cell key={entry.name} fill={ACCENT_COLORS[index % ACCENT_COLORS.length]} />)}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'grid', gap: 7, marginTop: 4 }}>
              {topProductsData.map((item, index) => (
                <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#475569' }}>
                  <span><span style={{ color: ACCENT_COLORS[index % ACCENT_COLORS.length] }}>●</span> {item.name}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Revenue + Health row */}
        <div className="adm-row-2col fade-up-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <SectionCard title="Xu hướng doanh thu" subtitle="Doanh thu theo tháng">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={revenueTrend} barCategoryGap={18}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e7ff" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <RechartsTooltip formatter={(v) => `${formatCurrency(v)} đ`} />
                <Bar dataKey="DoanhThu" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>

          <SectionCard title="Sức khỏe vận hành" subtitle="Tổng hợp chỉ số nhanh">
            <div style={{ display: 'grid', gap: 10 }}>
              {[
                { label: 'Tổng doanh thu', value: `${formatCurrency(totalRevenue)} đ`, color: '#2563eb' },
                { label: 'Tổng tồn kho', value: `${formatCurrency(totalStock)} SP`, color: '#0ea5e9' },
                { label: 'Đơn hoàn tất', value: `${completedOrderCount} đơn`, color: '#10b981' },
                { label: 'Đơn đang xử lý', value: `${processingOrdersCount} đơn`, color: '#f59e0b' },
              ].map((item) => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 14, background: '#f0f4ff', border: '1px solid #e0e7ff' }}>
                  <span style={{ color: '#475569', fontWeight: 600, fontSize: 14 }}>{item.label}</span>
                  <span style={{ fontWeight: 800, color: item.color, fontSize: 14 }}>{item.value}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Orders + Activities row */}
        <div className="adm-row-2col fade-up-5" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <SectionCard title="Đơn hàng gần nhất" subtitle="Hoạt động đơn hàng mới nhất">
            <div style={{ display: 'grid', gap: 10 }}>
              {recentOrders.length === 0 ? (
                <div style={{ padding: 18, textAlign: 'center', color: '#94a3b8', background: '#f0f4ff', borderRadius: 14 }}>Chưa có dữ liệu đơn hàng.</div>
              ) : recentOrders.map((order) => {
                const meta = statusMeta[order.status] || { label: order.status || 'Không rõ', bg: '#f1f5f9', color: '#334155' };
                return (
                  <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 14, background: '#f0f4ff', border: '1px solid #e0e7ff' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{order.order_no}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>{order.customer_name} • {formatDate(order.expected_delivery_date)}</div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: meta.bg, color: meta.color }}>{meta.label}</span>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard title="Nhập xuất gần nhất" subtitle="Lịch sử vận chuyển kho">
            <div style={{ display: 'grid', gap: 10 }}>
              {recentActivities.length === 0 ? (
                <div style={{ padding: 18, textAlign: 'center', color: '#94a3b8', background: '#f0f4ff', borderRadius: 14 }}>Chưa có hoạt động nhập xuất.</div>
              ) : recentActivities.map((act, index) => (
                <div key={`${act.type}-${act.id || index}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 14, background: '#f0f4ff', border: '1px solid #e0e7ff' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{act.type}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>{act.code || act.reference_no || act.order_no || 'N/A'} • {formatDate(act.activity_date)}</div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#2563eb' }}>{act.status || 'logged'}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

      </div>
    </>
  );
}
