import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ExcelJS from 'exceljs';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import api from '../services/api';
import { getDashboardStats } from '../services/reportService';

const statIcons = {
  orders: 'ri-shopping-bag-3-line',
  revenue: 'ri-line-chart-line',
  quantity: 'ri-stack-line',
  lowStock: 'ri-alert-line',
};

const money = new Intl.NumberFormat('vi-VN');
const chartColors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

const safeDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const cardBaseStyle = {
  background: '#fff',
  borderRadius: 18,
  padding: 20,
  boxShadow: '0 10px 30px rgba(15,23,42,0.06)',
  border: '1px solid #eef2f7',
  transition: 'transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease',
};

const handleCardHover = (e, accent) => {
  e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)';
  e.currentTarget.style.boxShadow = `0 22px 56px ${accent}22`;
  e.currentTarget.style.borderColor = `${accent}55`;
};

const handleCardLeave = (e) => {
  e.currentTarget.style.transform = 'translateY(0) scale(1)';
  e.currentTarget.style.boxShadow = '0 10px 30px rgba(15,23,42,0.06)';
  e.currentTarget.style.borderColor = '#eef2f7';
};

const getEnterStyle = (delay = 0, offset = 16) => ({
  opacity: 0,
  transform: `translateY(${offset}px) scale(0.98)`,
  animation: `dashboardFadeIn 520ms ease ${delay}ms forwards`,
});

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
            ? dashboardRes.monthly_import_export.map((item) => ({
                name: item.name,
                Nhập: Number(item.Nhập || 0),
                Xuất: Number(item.Xuất || 0),
              }))
            : [],
        );
      } catch (error) {
        console.error('Lỗi tải dữ liệu dashboard Sales', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const completedOrders = useMemo(() => orders.filter((o) => o.status === 'completed'), [orders]);
  const pendingOrders = useMemo(
    () => orders.filter((o) => ['pending', 'warehouse_processing', 'processing'].includes(o.status)),
    [orders],
  );
  const issueOrders = useMemo(
    () => orders.filter((o) => ['rejected', 'delayed', 'cancelled'].includes(o.status)),
    [orders],
  );

  const totalOrders = orders.length;
  const totalRevenue = completedOrders.reduce((sum, order) => {
    const fallbackTotal = Number(order.total_amount || order.total || 0);
    if (fallbackTotal > 0) return sum + fallbackTotal;

    const itemTotal = Array.isArray(order.items)
      ? order.items.reduce(
        (itemSum, item) => itemSum + Number(item.quantity || 0) * Number(item.unit_price || item.price || 0),
        0,
      )
      : 0;

    return sum + itemTotal;
  }, 0);

  const totalQuantity = completedOrders.reduce((sum, order) => {
    if (Array.isArray(order.items)) {
      return sum + order.items.reduce((itemSum, item) => itemSum + Number(item.quantity || 0), 0);
    }
    return sum + Number(order.total_quantity || 0);
  }, 0);

  const lowStockProducts = products
    .filter((product) => Number(product.stock || 0) <= 20)
    .sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0));
  const totalProducts = products.length;
  const lowStockCount = lowStockProducts.length;

  const recentOrders = [...orders]
    .sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0))
    .slice(0, 5);

  const monthSeries = useMemo(() => monthlyImportExportData, [monthlyImportExportData]);

  const categoryData = useMemo(() => {
    const typeMap = new Map();
    products.forEach((product) => {
      const key = product.category_name || product.category || 'Khác';
      const stock = Number(product.stock || 0);
      typeMap.set(key, (typeMap.get(key) || 0) + stock);
    });

    const totalStock = Array.from(typeMap.values()).reduce((sum, value) => sum + value, 0) || 1;

    return Array.from(typeMap.entries())
      .map(([name, value]) => ({ name, value, percent: Math.round((value / totalStock) * 100) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [products]);

  const filteredMonthlyData = useMemo(() => {
    if (!exportMonth) return monthlyImportExportData;
    return monthlyImportExportData.filter((item) => String(item.name || '').includes(exportMonth.slice(5)) || String(item.name || '').includes(exportMonth));
  }, [exportMonth, monthlyImportExportData]);

  const handleExportReport = async () => {
    try {
      setExporting(true);

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Inventory Management';
      workbook.created = new Date();
      workbook.modified = new Date();
      workbook.company = 'Inventory Management';
      workbook.title = 'Sales Dashboard Report';
      workbook.subject = 'Báo cáo dashboard Sales';

      const applyTitle = (sheet, title, subtitle) => {
        sheet.mergeCells('A1:H1');
        sheet.getCell('A1').value = title;
        sheet.getCell('A1').font = { bold: true, size: 18, color: { argb: 'FFFFFFFF' } };
        sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
        sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };

        sheet.mergeCells('A2:H2');
        sheet.getCell('A2').value = subtitle;
        sheet.getCell('A2').font = { italic: true, size: 11, color: { argb: 'FFD1D5DB' } };
        sheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };
        sheet.getCell('A2').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
      };

      const applyTableStyle = (sheet, startRow = 3) => {
        sheet.eachRow((row, rowNumber) => {
          if (rowNumber < startRow) return;
          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            };
            cell.alignment = { vertical: 'middle', wrapText: true };
          });
        });
      };

      const styleHeaderRow = (sheet, rowNumber) => {
        sheet.getRow(rowNumber).eachCell((cell) => {
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
        });
      };

      const addBorders = (sheet, startRow = 1) => {
        sheet.eachRow((row, rowNumber) => {
          if (rowNumber < startRow) return;
          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            };
          });
        });
      };

      const summarySheet = workbook.addWorksheet('Tong quan');
      applyTitle(summarySheet, 'BÁO CÁO DASHBOARD SALES', `Xuất lúc: ${new Date().toLocaleString('vi-VN')}`);
      summarySheet.columns = [
        { width: 28 },
        { width: 18 },
        { width: 40 },
      ];
      summarySheet.addRow(['Chỉ số', 'Giá trị', 'Ghi chú']);
      [
        ['Tổng đơn hàng', totalOrders, `${completedOrders.length} đơn hoàn tất`],
        ['Doanh thu', totalRevenue, 'Từ đơn completed'],
        ['Số lượng bán', totalQuantity, 'Tổng items đã bán'],
        ['Sản phẩm sắp hết', lowStockCount, `${totalProducts} sản phẩm đang quản lý`],
        ['Đơn đang chờ xử lý', pendingOrders.length, 'Pending / warehouse_processing / processing'],
        ['Đơn có vấn đề', issueOrders.length, 'rejected / delayed / cancelled'],
      ].forEach((row) => summarySheet.addRow(row));
      summarySheet.getRow(3).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });
      summarySheet.getColumn(2).numFmt = '#,##0';
      applyTableStyle(summarySheet, 3);

      const monthlySheet = workbook.addWorksheet('Nhap xuat thang');
      applyTitle(monthlySheet, 'NHẬP XUẤT THEO THÁNG', 'Dữ liệu tổng hợp từ báo cáo dashboard');
      monthlySheet.columns = [
        { width: 18 },
        { width: 16 },
        { width: 16 },
      ];
      monthlySheet.addRow(['Tháng', 'Nhập', 'Xuất']);
      filteredMonthlyData.forEach((item) => monthlySheet.addRow([item.name, item.Nhập, item.Xuất]));
      monthlySheet.getRow(3).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });
      monthlySheet.getColumn(2).numFmt = '#,##0';
      monthlySheet.getColumn(3).numFmt = '#,##0';
      applyTableStyle(monthlySheet, 3);

      const ordersSheet = workbook.addWorksheet('Trang thai don hang');
      applyTitle(ordersSheet, 'DANH SÁCH TRẠNG THÁI ĐƠN HÀNG', `Dữ liệu theo tháng ${exportMonth || 'Tất cả'}`);
      ordersSheet.columns = [
        { width: 16 },
        { width: 22 },
        { width: 24 },
        { width: 18 },
        { width: 16 },
        { width: 16 },
        { width: 18 },
      ];
      ordersSheet.addRow(['Mã đơn', 'Khách hàng', 'Sản phẩm', 'Số lượng', 'Đơn giá', 'Thành tiền', 'Trạng thái']);

      orders.forEach((order) => {
        const items = Array.isArray(order.items) ? order.items : [];

        items.forEach((item, index) => {
          const productName = item.product_name || item.name || item.product?.name || `#${item.product_id || ''}`;
          const quantity = Number(item.quantity || 0);
          const unitPrice = Number(item.unit_price || item.sale_price || item.price || item.product?.sale_price || item.product?.price || 0);
          const lineTotal = quantity * unitPrice;
          ordersSheet.addRow([
            index === 0 ? order.order_no || `#${order.id}` : '',
            index === 0 ? (order.customer_name || order.customer?.name || 'Khách lẻ') : '',
            productName,
            quantity,
            unitPrice,
            lineTotal,
            index === 0 ? (order.status || 'pending') : '',
          ]);
        });

        if (items.length === 0) {
          ordersSheet.addRow([
            order.order_no || `#${order.id}`,
            order.customer_name || order.customer?.name || 'Khách lẻ',
            'Chưa có sản phẩm',
            0,
            0,
            0,
            order.status || 'pending',
          ]);
        }
      });

      ordersSheet.getRow(3).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });
      ordersSheet.getColumn(5).numFmt = '#,##0';
      ordersSheet.getColumn(6).numFmt = '#,##0';
      applyTableStyle(ordersSheet, 3);

      const productsSheet = workbook.addWorksheet('San pham sap het');
      applyTitle(productsSheet, 'SẢN PHẨM SẮP HẾT', 'Danh sách sản phẩm tồn kho thấp');
      productsSheet.columns = [
        { width: 16 },
        { width: 30 },
        { width: 18 },
        { width: 14 },
        { width: 18 },
      ];
      productsSheet.addRow(['SKU', 'Tên sản phẩm', 'Danh mục', 'Tồn kho', 'Trạng thái']);
      lowStockProducts.forEach((product) => productsSheet.addRow([
        product.sku || product.product_sku || '-',
        product.name || product.title || 'Không tên',
        product.category_name || product.category || 'Khác',
        Number(product.stock || 0),
        Number(product.stock || 0) <= 10 ? 'Cần nhập gấp' : 'Sắp hết',
      ]));
      productsSheet.getRow(3).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEF4444' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });
      applyTableStyle(productsSheet, 3);

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `sales-dashboard-report-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Lỗi xuất báo cáo Sales Dashboard', error);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 24 }}>Đang tải dashboard Sales...</div>;
  }

  return (
    <div
      style={{
        padding: 24,
        background: '#f7f9fc',
        minHeight: '100vh',
        opacity: pageLoaded ? 1 : 0,
        transform: pageLoaded ? 'scale(1)' : 'scale(0.985)',
        transition: 'opacity 420ms ease, transform 420ms ease',
      }}
    >
      <div style={{ ...getEnterStyle(0, 18), display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ color: '#64748b', fontSize: 14, marginBottom: 8 }}>Dashboard</div>
          <h2 style={{ margin: 0, color: '#0f172a', fontSize: 28, fontWeight: 800 }}>Tổng quan Sales</h2>
          <p style={{ margin: '6px 0 0', color: '#64748b' }}>Dữ liệu được tổng hợp từ đơn hàng và sản phẩm trong hệ thống.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 14px', color: '#334155', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <i className="ri-calendar-line" style={{ color: '#64748b' }} />
            <input
              type="month"
              value={exportMonth}
              onChange={(e) => setExportMonth(e.target.value)}
              style={{ border: 'none', outline: 'none', font: 'inherit', color: '#334155', background: 'transparent' }}
            />
          </label>
          <button
            onClick={handleExportReport}
            disabled={exporting}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 20px',
              border: 'none',
              borderRadius: 999,
              background: exporting ? 'linear-gradient(135deg, #86efac, #22c55e)' : 'linear-gradient(135deg, #22c55e, #16a34a)',
              color: '#fff',
              fontWeight: 800,
              fontSize: 14,
              cursor: exporting ? 'not-allowed' : 'pointer',
              boxShadow: exporting ? '0 10px 24px rgba(34,197,94,0.24)' : '0 14px 30px rgba(34,197,94,0.32)',
              transition: 'transform 180ms ease, box-shadow 180ms ease, filter 180ms ease',
              opacity: exporting ? 0.85 : 1,
            }}
            onMouseEnter={(e) => {
              if (exporting) return;
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.filter = 'brightness(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.filter = 'brightness(1)';
            }}
          >
            <i className="ri-download-2-line" style={{ fontSize: 16 }} />
            {exporting ? 'Đang xuất...' : 'Xuất Excel'}
          </button>
        </div>
      </div>

      <div style={{ ...getEnterStyle(80, 18), display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Tổng đơn hàng', value: totalOrders, sub: `${completedOrders.length} đơn hoàn tất`, color: '#10b981', icon: statIcons.orders, to: '/sales-orders' },
          { label: 'Doanh thu', value: `${money.format(totalRevenue)} đ`, sub: 'Từ đơn completed', color: '#3b82f6', icon: statIcons.revenue, to: '/reports' },
          { label: 'Số lượng bán', value: totalQuantity, sub: 'Tổng items đã bán', color: '#f59e0b', icon: statIcons.quantity, to: '/sales-orders' },
          { label: 'Sản phẩm sắp hết', value: lowStockCount, sub: `${totalProducts} sản phẩm đang quản lý`, color: '#ef4444', icon: statIcons.lowStock, to: '/products' },
        ].map((card) => (
          <div
            key={card.label}
            onClick={card.to ? () => navigate(card.to) : undefined}
            onKeyDown={card.to ? (e) => e.key === 'Enter' && navigate(card.to) : undefined}
            role={card.to ? 'button' : undefined}
            tabIndex={card.to ? 0 : undefined}
            onMouseEnter={(e) => handleCardHover(e, card.color)}
            onMouseLeave={handleCardLeave}
            style={{
              ...cardBaseStyle,
              cursor: card.to ? 'pointer' : 'default',
            }}
          >
            <div style={{ width: 42, height: 42, borderRadius: 12, background: card.color, opacity: 0.92, marginBottom: 24, display: 'grid', placeItems: 'center', color: '#fff', fontSize: 20 }}>
              <i className={card.icon} />
            </div>
            <div style={{ color: '#0f172a', fontSize: 30, fontWeight: 800, marginBottom: 6 }}>{card.value}</div>
            <div style={{ color: '#475569', fontWeight: 600 }}>{card.label}</div>
            <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 6 }}>{card.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ ...getEnterStyle(160, 18), display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
        <div onMouseEnter={(e) => handleCardHover(e, '#10b981')} onMouseLeave={handleCardLeave} style={cardBaseStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, color: '#0f172a' }}>Thống kê xuất nhập theo tháng</h3>
              <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: 13 }}>Dữ liệu 7 tháng gần nhất từ đơn hàng hiện có</p>
            </div>
            <div style={{ display: 'flex', gap: 18, color: '#475569', fontSize: 13 }}>
              <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: '#10b981', marginRight: 6 }} />Nhập kho</span>
              <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: '#60a5fa', marginRight: 6 }} />Xuất kho</span>
            </div>
          </div>
          <div style={{ height: 340 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthSeries} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Nhập" fill="#10b981" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Xuất" fill="#60a5fa" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div onMouseEnter={(e) => handleCardHover(e, '#8b5cf6')} onMouseLeave={handleCardLeave} style={cardBaseStyle}>
          <h3 style={{ margin: 0, color: '#0f172a' }}>Danh mục sản phẩm</h3>
          <p style={{ margin: '6px 0 18px', color: '#94a3b8', fontSize: 13 }}>Tỷ lệ theo tồn kho hiện tại</p>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={90} paddingAngle={3}>
                  {categoryData.map((entry, index) => (
                    <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ marginTop: 8 }}>
            {categoryData.length === 0 ? (
              <div style={{ color: '#94a3b8', textAlign: 'center', padding: '16px 0' }}>Chưa có dữ liệu danh mục</div>
            ) : (
              categoryData.map((item, index) => (
                <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, color: '#334155', fontSize: 14 }}>
                  <div><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 999, background: chartColors[index % chartColors.length], marginRight: 8 }} />{item.name}</div>
                  <div>{item.percent}%</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div style={{ ...getEnterStyle(240, 18), display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div onMouseEnter={(e) => handleCardHover(e, '#0ea5e9')} onMouseLeave={handleCardLeave} style={cardBaseStyle}>
          <h3 style={{ marginTop: 0, color: '#0f172a' }}>Đơn hàng gần đây</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#94a3b8', fontSize: 13 }}>
                <th style={{ paddingBottom: 12 }}>Mã đơn</th>
                <th style={{ paddingBottom: 12 }}>Khách hàng</th>
                <th style={{ paddingBottom: 12 }}>Ngày giao</th>
                <th style={{ paddingBottom: 12 }}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr><td colSpan="4" style={{ padding: '18px 0', textAlign: 'center', color: '#94a3b8' }}>Chưa có đơn hàng</td></tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} style={{ borderTop: '1px solid #eef2f7' }}>
                    <td style={{ padding: '14px 0', fontWeight: 700, color: '#2563eb' }}>{order.order_no || `#${order.id}`}</td>
                    <td style={{ color: '#334155' }}>{order.customer_name || order.customer?.name || 'Khách lẻ'}</td>
                    <td style={{ color: '#64748b' }}>{safeDate(order.expected_delivery_date || order.created_at)?.toLocaleDateString('vi-VN') || '---'}</td>
                    <td>
                      <span
                        style={{
                          padding: '5px 10px',
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 700,
                          background: order.status === 'completed' ? '#dcfce7' : order.status === 'rejected' ? '#fee2e2' : '#e0f2fe',
                          color: order.status === 'completed' ? '#166534' : order.status === 'rejected' ? '#991b1b' : '#075985',
                        }}
                      >
                        {(order.status || 'pending').toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div onMouseEnter={(e) => handleCardHover(e, '#f59e0b')} onMouseLeave={handleCardLeave} style={{ ...cardBaseStyle, background: '#fff7ed', border: '1px solid #fed7aa' }}>
          <h3 style={{ marginTop: 0, color: '#c2410c' }}>Cần xử lý gấp</h3>
          {issueOrders.length === 0 ? (
            <p style={{ color: '#16a34a', fontWeight: 700, textAlign: 'center', marginTop: 24 }}>Không có đơn bị kẹt.</p>
          ) : (
            <div style={{ maxHeight: 310, overflowY: 'auto' }}>
              {issueOrders.map((order) => (
                <div key={order.id} style={{ background: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, border: '1px solid #ffedd5' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
                    <strong style={{ color: '#b91c1c' }}>{order.order_no || `#${order.id}`}</strong>
                    <span style={{ fontSize: 12, color: '#c2410c' }}>{order.status?.toUpperCase()}</span>
                  </div>
                  <div style={{ color: '#475569', fontSize: 13, marginBottom: 6 }}>Khách: {order.customer_name || order.customer?.name || 'Khách lẻ'}</div>
                  <div style={{ color: '#64748b', fontSize: 12, fontStyle: 'italic' }}>{order.note || 'Không có ghi chú'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes dashboardFadeIn {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
