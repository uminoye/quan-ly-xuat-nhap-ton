import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ExcelJS from 'exceljs';
import { getDashboardStats } from '../services/reportService';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const ACCENT_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899'];

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
  revenue: (<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: '22px', height: '22px' }}><path d="M12 2v20M17 6.5c0-1.93-2.24-3.5-5-3.5S7 4.57 7 6.5 9.24 10 12 10s5 1.57 5 3.5S14.76 17 12 17s-5-1.57-5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>),
  stock: (<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: '22px', height: '22px' }}><path d="M4 7.5 12 4l8 3.5-8 3.5-8-3.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M4 7.5V16.5L12 20l8-3.5V7.5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>),
  processing: (<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: '22px', height: '22px' }}><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" /></svg>),
  alert: (<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: '22px', height: '22px' }}><path d="m10.29 4.86-7.43 12.8A2 2 0 0 0 4.58 21h14.84a2 2 0 0 0 1.72-3.34l-7.43-12.8a2 2 0 0 0-3.44 0Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M12 9v4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" /><path d="M12 17h.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>),
};

const statusMeta = {
  completed: { label: 'Hoàn tất', bg: '#DCFCE7', color: '#166534' },
  pending: { label: 'Chờ xử lý', bg: '#FEF3C7', color: '#92400E' },
  warehouse_processing: { label: 'Đang xử lý', bg: '#DBEAFE', color: '#1D4ED8' },
  rejected: { label: 'Từ chối', bg: '#FEE2E2', color: '#B91C1C' },
  delayed: { label: 'Dời ngày', bg: '#FFEDD5', color: '#C2410C' },
  returned: { label: 'Hoàn trả', bg: '#F3E8FF', color: '#7C3AED' },
};

function StatButtonCard({ label, value, hint, icon, accent, hoverColor, hovered, onMouseEnter, onMouseLeave }) {
  return (
    <div
      className="dashboard-hover-card dashboard-stat-card"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        background: hovered ? 'linear-gradient(180deg, #FFFDF6 0%, #FFFFFF 100%)' : '#fff',
        borderRadius: 20,
        padding: 20,
        boxShadow: hovered ? '0 18px 40px rgba(15, 23, 42, 0.12)' : '0 10px 30px rgba(15, 23, 42, 0.06)',
        border: hovered ? `1px solid ${hoverColor}` : '1px solid #EEF2F7',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        textAlign: 'left',
        width: '100%',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        cursor: 'default',
      }}
    >
      <div style={{ width: 46, height: 46, borderRadius: 14, background: accent, color: '#fff', display: 'grid', placeItems: 'center', transition: 'transform 0.2s ease, background 0.2s ease', overflow: 'hidden', boxShadow: hovered ? '0 10px 20px rgba(15, 23, 42, 0.12)' : 'none' }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 13, color: hovered ? '#0F172A' : '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: hovered ? '0.02em' : '0' }}>{label}</div>
        <div style={{ fontSize: 30, fontWeight: 800, color: '#0F172A', marginTop: 6 }}>{value}</div>
        {hint ? <div style={{ fontSize: 12, color: hovered ? '#475569' : '#94A3B8', marginTop: 6 }}>{hint}</div> : null}
      </div>
    </div>
  );
}

function SectionCard({ title, subtitle, children }) {
  return (
    <div
      className="dashboard-hover-card"
      style={{
        background: '#fff',
        borderRadius: 24,
        padding: 20,
        border: '1px solid #EEF2F7',
        boxShadow: '0 18px 42px rgba(15, 23, 42, 0.10)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease',
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>{title}</div>
        {subtitle ? <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>{subtitle}</div> : null}
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
        setError(`Không thể tải dữ liệu dashboard từ API tổng hợp. ${err?.response?.data?.message || err.message || ''}`.trim());
      } finally {
        setLoading(false);
      }
    };

    const runEnterAnimation = () => {
      setPageLoaded(false);
      requestAnimationFrame(() => requestAnimationFrame(() => setPageLoaded(true)));
    };

    fetchAllData();
    runEnterAnimation();

    window.addEventListener('pageshow', runEnterAnimation);
    return () => window.removeEventListener('pageshow', runEnterAnimation);
  }, []);

  const totalRevenue = dashboard?.total_revenue || 0;
  const totalStock = dashboard?.total_products || 0;
  const lowStockCount = dashboard?.low_stock || 0;
  const processingOrdersCount = dashboard?.processing_orders || 0;
  const recentOrders = safeArray(dashboard?.recent_orders);
  const recentActivities = safeArray(dashboard?.recent_activities);
  const monthlyImportExportData = safeArray(dashboard?.monthly_import_export).map((item) => ({ name: formatMonthLabel(item.name), Nhập: item.Nhập || 0, Xuất: item.Xuất || 0 }));
  const revenueTrend = safeArray(dashboard?.revenue_trend).map((item) => ({ name: formatMonthLabel(item.month), month: item.month, DoanhThu: item.revenue || 0 }));
  const topProductsData = safeArray(dashboard?.top_selling_products).map((item) => ({ name: item.name, value: item.value || 0 }));
  const completedOrderCount = recentOrders.filter((order) => order.status === 'completed').length;
  const lastUpdatedText = getTodayTimestamp();

  const dashboardOverviewRows = [
    ['BÁO CÁO DASHBOARD ADMIN', ''],
    ['Cập nhật lúc', lastUpdatedText],
    ['Tổng doanh thu', formatExcelCurrency(totalRevenue)],
    ['Tổng sản phẩm trong kho', formatExcelCurrency(totalStock)],
    ['Đơn đang xử lý', formatExcelCurrency(processingOrdersCount)],
    ['Sản phẩm sắp hết', formatExcelCurrency(lowStockCount)],
    ['Đơn hoàn tất gần nhất', formatExcelCurrency(completedOrderCount)],
  ];
  const reportMetadataRows = [
    ['Mục', 'Giá trị'],
    ['Dashboard', 'Admin tổng quan'],
    ['Nguồn dữ liệu', 'API /reports/dashboard'],
    ['Cập nhật lúc', lastUpdatedText],
  ];
  const inventorySummaryRows = monthlyImportExportData.map((item) => [item.name, item.Nhập, item.Xuất]);
  const revenueRows = revenueTrend.map((item) => [item.name, item.DoanhThu]);
  const recentOrdersRows = recentOrders.map((order) => [order.order_no || order.id || '-', order.customer_name || '-', statusMeta[order.status]?.label || order.status || 'Không rõ', formatDate(order.expected_delivery_date), order.completed_at ? formatDate(order.completed_at) : '--']);
  const recentActivitiesRows = recentActivities.map((activity) => [activity.type || '-', activity.code || activity.reference_no || activity.order_no || 'N/A', activity.warehouse_name || '-', formatDate(activity.activity_date), activity.status || 'logged']);
  const topProductsRows = topProductsData.map((item, index) => [index + 1, item.name, item.value]);
  const handleExportReport = async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Inventory Management';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.company = 'Admin Dashboard';
    workbook.subject = 'Báo cáo tổng quan dashboard';
    workbook.title = 'Báo cáo dashboard';

    const applySheetBase = (sheet, title, subtitle) => {
      sheet.mergeCells('A1:F1');
      sheet.getCell('A1').value = title;
      sheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
      sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
      sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
      sheet.mergeCells('A2:F2');
      sheet.getCell('A2').value = subtitle;
      sheet.getCell('A2').font = { italic: true, size: 10, color: { argb: 'FFD1D5DB' } };
      sheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };
      sheet.getCell('A2').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    };

    const styleHeaders = (sheet, rowNumber = 4) => {
      const row = sheet.getRow(rowNumber);
      row.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });
    };

    const applyBorders = (sheet) => {
      sheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = { top: { style: 'thin', color: { argb: 'FFE2E8F0' } }, left: { style: 'thin', color: { argb: 'FFE2E8F0' } }, bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }, right: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
          if (rowNumber > 3) cell.alignment = { vertical: 'middle' };
        });
      });
    };

    const overviewSheet = workbook.addWorksheet('Tong quan');
    applySheetBase(overviewSheet, 'BÁO CÁO DASHBOARD ADMIN', `Cập nhật lúc: ${lastUpdatedText}`);
    overviewSheet.columns = [{ width: 28 }, { width: 22 }];
    overviewSheet.addRow(['Chỉ số', 'Giá trị']);
    dashboardOverviewRows.slice(1).forEach(([label, value]) => overviewSheet.addRow([label, value]));
    overviewSheet.getColumn(2).numFmt = '#,##0';
    styleHeaders(overviewSheet, 4);
    applyBorders(overviewSheet);

    const metadataSheet = workbook.addWorksheet('Thong tin');
    applySheetBase(metadataSheet, 'THÔNG TIN BÁO CÁO', 'Nguồn dữ liệu và phạm vi xuất file');
    metadataSheet.columns = [{ width: 26 }, { width: 30 }];
    metadataSheet.addRows(reportMetadataRows);
    styleHeaders(metadataSheet, 4);
    applyBorders(metadataSheet);

    const revenueSheet = workbook.addWorksheet('Doanh thu');
    applySheetBase(revenueSheet, 'XU HƯỚNG DOANH THU', `Dữ liệu theo tháng - ${reportMonthLabel}`);
    revenueSheet.columns = [{ width: 16 }, { width: 18 }];
    revenueSheet.addRow(['Tháng', 'Doanh thu']);
    revenueRows.forEach(([month, revenue]) => revenueSheet.addRow([month, revenue]));
    revenueSheet.getColumn(2).numFmt = '#,##0';
    styleHeaders(revenueSheet, 4);
    applyBorders(revenueSheet);

    const inventorySheet = workbook.addWorksheet('Nhap xuat');
    applySheetBase(inventorySheet, 'NHẬP XUẤT KHO', `Tổng hợp nhập xuất theo tháng - ${reportMonthLabel}`);
    inventorySheet.columns = [{ width: 16 }, { width: 14 }, { width: 14 }];
    inventorySheet.addRow(['Tháng', 'Nhập', 'Xuất']);
    inventorySummaryRows.forEach(([month, importQty, exportQty]) => inventorySheet.addRow([month, importQty, exportQty]));
    inventorySheet.getColumn(2).numFmt = '#,##0';
    inventorySheet.getColumn(3).numFmt = '#,##0';
    styleHeaders(inventorySheet, 4);
    applyBorders(inventorySheet);

    const topProductsSheet = workbook.addWorksheet('San pham ban chay');
    applySheetBase(topProductsSheet, 'SẢN PHẨM BÁN CHẠY', 'Top sản phẩm được bán nhiều nhất');
    topProductsSheet.columns = [{ width: 10 }, { width: 30 }, { width: 14 }];
    topProductsSheet.addRow(['Top', 'Sản phẩm', 'Số lượng']);
    topProductsRows.forEach(([rank, name, value]) => topProductsSheet.addRow([rank, name, value]));
    topProductsSheet.getColumn(3).numFmt = '#,##0';
    styleHeaders(topProductsSheet, 4);
    applyBorders(topProductsSheet);

    const ordersSheet = workbook.addWorksheet('Don hang gan nhat');
    applySheetBase(ordersSheet, 'ĐƠN HÀNG GẦN NHẤT', 'Danh sách đơn hàng mới cập nhật');
    ordersSheet.columns = [{ width: 20 }, { width: 28 }, { width: 18 }, { width: 16 }, { width: 16 }];
    ordersSheet.addRow(['Mã đơn', 'Khách hàng', 'Trạng thái', 'Ngày dự kiến', 'Ngày hoàn tất']);
    recentOrdersRows.forEach((row) => ordersSheet.addRow(row));
    styleHeaders(ordersSheet, 4);
    applyBorders(ordersSheet);

    const activitiesSheet = workbook.addWorksheet('Nhap xuat gan nhat');
    applySheetBase(activitiesSheet, 'NHẬP XUẤT GẦN NHẤT', 'Lịch sử nhập/xuất kho gần đây');
    activitiesSheet.columns = [{ width: 18 }, { width: 20 }, { width: 22 }, { width: 18 }, { width: 16 }];
    activitiesSheet.addRow(['Loại', 'Mã tham chiếu', 'Kho', 'Thời gian', 'Trạng thái']);
    recentActivitiesRows.forEach((row) => activitiesSheet.addRow(row));
    styleHeaders(activitiesSheet, 4);
    applyBorders(activitiesSheet);

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `dashboard-bao-cao-${reportMonth}.xlsx`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (loading) return <div style={{ padding: 24, color: '#64748B' }}>Đang tải dữ liệu tổng quan...</div>;
  if (error) return <div style={{ padding: 24, color: '#B91C1C', background: '#FEF2F2', borderRadius: 16 }}>{error}</div>;

  return (
    <div
      className="dashboard-enter"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        padding: 4,
        background: 'linear-gradient(180deg, #F7FAFC 0%, #EEF4FB 100%)',
        borderRadius: 28,
        opacity: pageLoaded ? 1 : 0,
        transform: pageLoaded ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 320ms ease, transform 320ms ease'
      }}
    >
      <div className="dashboard-block-enter dashboard-block-delay-1" style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap', padding: '0 20px', marginBottom: 4 }}>
        <div style={{ paddingLeft: 4 }}>
          <h2 style={{ margin: 0, fontSize: 26, lineHeight: 1.2, color: '#0F172A' }}>Tổng quan hệ thống</h2>
          <p style={{ margin: '8px 0 0', color: '#64748B' }}>Cập nhật lần cuối: {lastUpdatedText}</p>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', paddingRight: 4 }}>
          <button
            type="button"
            onClick={handleExportReport}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              border: '1px solid #0F9D8E',
              borderRadius: 12,
              padding: '10px 16px',
              background: 'linear-gradient(135deg,rgb(45, 212, 114) 0%,rgb(91, 170, 26) 100%)',
              color: '#FFFFFF',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 14px 28px rgba(13, 148, 136, 0.22)',
            }}
          >
            <i className="ri-download-2-line" />
            Xuất báo cáo
          </button>
        </div>
      </div>

      <div className="dashboard-block-enter dashboard-block-delay-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16 }}>
        <StatButtonCard label="Tổng doanh thu" value={`${formatCurrency(totalRevenue)} đ`} hint={`${completedOrderCount} đơn hoàn tất`} icon={statIcons.revenue} accent="linear-gradient(135deg, #10B981, #059669)" hoverColor="#10B981" hovered={hoveredCard === 'revenue'} onMouseEnter={() => setHoveredCard('revenue')} onMouseLeave={() => setHoveredCard(null)} />
        <StatButtonCard label="Tổng sản phẩm trong kho" value={formatCurrency(totalStock)} hint="Dữ liệu từ báo cáo tổng hợp" icon={statIcons.stock} accent="linear-gradient(135deg, #3B82F6, #2563EB)" hoverColor="#3B82F6" hovered={hoveredCard === 'stock'} onMouseEnter={() => setHoveredCard('stock')} onMouseLeave={() => setHoveredCard(null)} />
        <StatButtonCard label="Đơn đang xử lý" value={processingOrdersCount} hint="Chờ xử lý / đang xử lý / kho" icon={statIcons.processing} accent="linear-gradient(135deg, #F59E0B, #D97706)" hoverColor="#F59E0B" hovered={hoveredCard === 'processing'} onMouseEnter={() => setHoveredCard('processing')} onMouseLeave={() => setHoveredCard(null)} />
        <StatButtonCard label="Sản phẩm sắp hết" value={lowStockCount} hint="Cần nhập bổ sung" icon={statIcons.alert} accent="linear-gradient(135deg, #EF4444, #DC2626)" hoverColor="#EF4444" hovered={hoveredCard === 'alert'} onMouseEnter={() => setHoveredCard('alert')} onMouseLeave={() => setHoveredCard(null)} />
      </div>

      <div className="dashboard-block-enter dashboard-block-delay-3" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <SectionCard title="Nhập kho và xuất kho" subtitle="Biến động hàng tháng từ dữ liệu thật">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={monthlyImportExportData} barCategoryGap={18}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <RechartsTooltip cursor={{ fill: '#F8FAFC' }} />
              <Bar dataKey="Nhập" fill="#10B981" radius={[10, 10, 0, 0]} />
              <Bar dataKey="Xuất" fill="#60A5FA" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Sản phẩm bán chạy nhất" subtitle="Theo số lượng từ đơn hoàn tất">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={topProductsData} dataKey="value" nameKey="name" innerRadius={64} outerRadius={90} paddingAngle={4}>
                  {topProductsData.map((entry, index) => <Cell key={entry.name} fill={ACCENT_COLORS[index % ACCENT_COLORS.length]} />)}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ width: '100%', display: 'grid', gap: 8, marginTop: 4 }}>
              {topProductsData.map((item, index) => (
                <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#475569' }}>
                  <span><span style={{ color: ACCENT_COLORS[index % ACCENT_COLORS.length] }}>●</span> {item.name}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="dashboard-block-enter dashboard-block-delay-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <SectionCard title="Xu hướng doanh thu" subtitle="Doanh thu theo tháng từ đơn hoàn tất">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenueTrend} barCategoryGap={18}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <RechartsTooltip formatter={(value) => `${formatCurrency(value)} đ`} />
              <Bar dataKey="DoanhThu" fill="#8B5CF6" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Sức khỏe vận hành" subtitle="Tổng hợp chỉ số nhanh">
          <div style={{ display: 'grid', gap: 12 }}>
            {[
              { label: 'Tổng doanh thu', value: `${formatCurrency(totalRevenue)} đ`, color: '#10B981' },
              { label: 'Tổng tồn kho', value: `${formatCurrency(totalStock)} SP`, color: '#3B82F6' },
              { label: 'Đơn hoàn tất', value: `${completedOrderCount} đơn`, color: '#8B5CF6' },
              { label: 'Đơn đang xử lý', value: `${processingOrdersCount} đơn`, color: '#EF4444' },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 16, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <span style={{ color: '#475569', fontWeight: 600 }}>{item.label}</span>
                <span style={{ fontWeight: 800, color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="dashboard-block-enter dashboard-block-delay-5" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <SectionCard title="Đơn hàng gần nhất" subtitle="Hoạt động đơn hàng mới nhất">
          <div style={{ display: 'grid', gap: 10 }}>
            {recentOrders.length === 0 ? (
              <div style={{ padding: 18, textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: 16 }}>Chưa có dữ liệu đơn hàng.</div>
            ) : (
              recentOrders.map((order) => {
                const meta = statusMeta[order.status] || { label: order.status || 'Không rõ', bg: '#E2E8F0', color: '#334155' };
                return (
                  <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 16, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#0F172A' }}>{order.order_no}</div>
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>{order.customer_name} • {formatDate(order.expected_delivery_date)}</div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, padding: '6px 10px', borderRadius: 999, background: meta.bg, color: meta.color }}>{meta.label}</span>
                  </div>
                );
              })
            )}
          </div>
        </SectionCard>

        <SectionCard title="Nhập xuất gần nhất" subtitle="Lịch sử vận chuyển kho">
          <div style={{ display: 'grid', gap: 10 }}>
            {recentActivities.length === 0 ? (
              <div style={{ padding: 18, textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: 16 }}>Chưa có hoạt động nhập xuất.</div>
            ) : (
              recentActivities.map((activity, index) => (
                <div key={`${activity.type}-${activity.id || index}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 16, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0F172A' }}>{activity.type}</div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>{activity.code || activity.reference_no || activity.order_no || 'N/A'} • {formatDate(activity.activity_date)}</div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0EA5E9' }}>{activity.status || 'logged'}</div>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
