import { useEffect, useMemo, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import api from '../services/api';
import { getSalesReport, getLogisticsReport, getWarehouseReport, getFactoryReport, getInventoryReport } from '../services/reportService';
import { exportInventoryReport, exportSalesReport, exportLogisticsReport, exportWarehouseReport, exportFactoryReport } from '../utils/excelExport';

const PIE_COLORS = ['#2563eb', '#0ea5e9', '#10b981', '#7c3aed', '#f59e0b', '#ef4444'];
const fmtCurrency = (value) => new Intl.NumberFormat('vi-VN').format(value || 0);

const PERIOD_OPTIONS = [
  { value: 'day',     label: 'Ngày' },
  { value: 'month',   label: 'Tháng' },
  { value: 'quarter', label: 'Quý' },
  { value: 'all',     label: 'Tất cả' },
];

function StatCard({ label, value, accent, icon }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 20, padding: '18px 20px',
      border: '1px solid #e0e7ff', boxShadow: '0 10px 30px rgba(15,23,42,0.05)',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{ width: 44, height: 44, borderRadius: 14, background: accent, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 20 }}>
        <i className={icon} />
      </div>
      <div>
        <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>{label}</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>{value}</div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const roleId = user?.role_id;
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        let res;
        switch (roleId) {
          case 2: res = await getSalesReport(period); break;
          case 3: res = await getLogisticsReport(period); break;
          case 4: res = await getWarehouseReport(period); break;
          case 5: res = await getFactoryReport(period); break;
          default: res = await getInventoryReport(); break;
        }
        setData(res || {});
      } catch (err) {
        console.error('Lỗi tải báo cáo', err);
        setError('Không thể tải dữ liệu báo cáo.');
      } finally {
        setLoading(false);
      }
    })();
  }, [roleId, period]);

  const roleTitle = roleId === 1 ? 'Báo cáo Tổng quan' : roleId === 2 ? 'Báo cáo Doanh thu (Sales)' : roleId === 3 ? 'Báo cáo Vận chuyển (Logistics)' : roleId === 4 ? 'Báo cáo Kho (Warehouse)' : roleId === 5 ? 'Báo cáo Sản xuất (Nhà máy)' : 'Báo cáo';
  const roleColor = roleId === 1 ? '#2563eb' : roleId === 2 ? '#10b981' : roleId === 3 ? '#f97316' : roleId === 4 ? '#7c3aed' : roleId === 5 ? '#f59e0b' : '#64748b';

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#94a3b8' }}>
      <i className="ri-loader-4-line" style={{ fontSize: 28, marginRight: 12, animation: 'spin 1s linear infinite' }} />Đang tải báo cáo...
    </div>
  );

  const renderInventoryReport = () => {
    const items = Array.isArray(data) ? data : [];
    const summary = {
      totalItems: items.length,
      totalQty: items.reduce((s, i) => s + Number(i.on_hand_qty || 0), 0),
      totalValue: items.reduce((s, i) => s + Number((i.on_hand_qty || 0) * (i.sale_price || 0)), 0),
    };
    const warehouseMap = {};
    items.forEach(it => {
      const wh = it.warehouse_name || 'Khác';
      if (!warehouseMap[wh]) warehouseMap[wh] = { name: wh, value: 0, qty: 0 };
      warehouseMap[wh].value += (it.on_hand_qty || 0) * (it.sale_price || 0);
      warehouseMap[wh].qty += Number(it.on_hand_qty || 0);
    });
    const whChart = Object.values(warehouseMap).sort((a, b) => b.value - a.value);

    return (
      <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14, marginBottom: 18 }}>
          <StatCard label="Mã SP" value={summary.totalItems} accent={roleColor} icon="ri-box-3-line" />
          <StatCard label="Tổng tồn" value={summary.totalQty} accent="#10b981" icon="ri-stack-line" />
          <StatCard label="Giá trị tồn" value={`${fmtCurrency(summary.totalValue)} đ`} accent="#f59e0b" icon="ri-coins-line" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1px solid #e0e7ff', boxShadow: '0 10px 30px rgba(15,23,42,0.05)' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 800 }}>Top 6 giá trị tồn cao</h3>
            {items.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={[...items].sort((a, b) => (b.on_hand_qty * b.sale_price) - (a.on_hand_qty * a.sale_price)).slice(0, 6)} barCategoryGap={14}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e7ff" />
                  <XAxis dataKey="sku" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v/1000000}tr`} />
                  <Tooltip formatter={(v) => [`${fmtCurrency(v)} đ`, 'Giá trị']} />
                  <Bar dataKey="sale_price" name="Đơn giá" radius={[8, 8, 0, 0]} fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            ) : <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div>}
          </div>

          <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1px solid #e0e7ff', boxShadow: '0 10px 30px rgba(15,23,42,0.05)' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 800 }}>Phân bổ theo kho</h3>
            {whChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={whChart} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3}>
                    {whChart.map((entry, i) => <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [`${fmtCurrency(v)} đ`, 'Giá trị']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div>}
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1px solid #e0e7ff', boxShadow: '0 10px 30px rgba(15,23,42,0.05)' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800 }}>Chi tiết tồn kho</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ fontSize: 12, color: '#94a3b8', borderBottom: '1px solid #e0e7ff' }}>
              <th style={{ padding: '8px 0', textAlign: 'left' }}>SKU</th>
              <th style={{ padding: '8px 0', textAlign: 'left' }}>Sản phẩm</th>
              <th style={{ padding: '8px 0', textAlign: 'left' }}>Kho</th>
              <th style={{ padding: '8px 0', textAlign: 'right' }}>Tồn</th>
              <th style={{ padding: '8px 0', textAlign: 'right' }}>Đơn giá</th>
              <th style={{ padding: '8px 0', textAlign: 'right' }}>Thành tiền</th>
            </tr></thead>
            <tbody>
              {items.length === 0 ? <tr><td colSpan="6" style={{ padding: 16, textAlign: 'center', color: '#94a3b8' }}>Không có dữ liệu</td></tr> :
                items.map((it, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '9px 0', fontWeight: 700 }}>{it.sku}</td>
                    <td style={{ padding: '9px 0', fontSize: 13 }}>{it.product_name}</td>
                    <td style={{ padding: '9px 0', fontSize: 13 }}>{it.warehouse_name}</td>
                    <td style={{ padding: '9px 0', textAlign: 'right', fontWeight: 700 }}>{it.on_hand_qty} {it.unit}</td>
                    <td style={{ padding: '9px 0', textAlign: 'right', fontSize: 13 }}>{fmtCurrency(it.sale_price)} đ</td>
                    <td style={{ padding: '9px 0', textAlign: 'right', fontWeight: 800, color: roleColor }}>{fmtCurrency(it.total_value)} đ</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </>
    );
  };

  const renderSalesReport = () => {
    const charts = data?.charts || {};
    const tables = data?.tables || {};
    const s = data?.summary || {};

    const revenueData = (charts.revenue_by_period || []).map(r => ({ ...r, revenue: Number(r.revenue || 0), name: r.period }));
    const topProducts = Array.isArray(tables.top_products) ? tables.top_products : [];
    const topCustomers = Array.isArray(tables.top_customers) ? tables.top_customers : [];
    const orderStats = Array.isArray(tables.order_stats) ? tables.order_stats : [];

    return (
      <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14, marginBottom: 18 }}>
          <StatCard label="Tổng đơn" value={s.total_orders || 0} accent={roleColor} icon="ri-shopping-bag-3-line" />
          <StatCard label="Tổng doanh thu" value={`${fmtCurrency(s.total_revenue)} đ`} accent="#10b981" icon="ri-money-cny-circle-line" />
          <StatCard label="Kỳ báo cáo" value={data?.period || '—'} accent="#7c3aed" icon="ri-calendar-line" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1px solid #e0e7ff', boxShadow: '0 10px 30px rgba(15,23,42,0.05)' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 800 }}>Doanh thu theo {data?.group_by === 'month' ? 'tháng' : 'ngày'}</h3>
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={revenueData} barCategoryGap={14}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e7ff" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v/1000000}tr`} />
                  <Tooltip formatter={(v) => [`${fmtCurrency(v)} đ`, 'Doanh thu']} />
                  <Bar dataKey="revenue" radius={[8, 8, 0, 0]} fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            ) : <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div>}
          </div>

          <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1px solid #e0e7ff', boxShadow: '0 10px 30px rgba(15,23,42,0.05)' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 800 }}>Trạng thái đơn hàng</h3>
            {orderStats.length > 0 ? (
              <div style={{ display: 'grid', gap: 8 }}>
                {orderStats.map((st, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e0e7ff', fontSize: 13 }}>
                    <span style={{ fontWeight: 700 }}>{st.status}</span>
                    <span style={{ color: '#64748b' }}>{st.count} đơn • {fmtCurrency(st.revenue)} đ</span>
                  </div>
                ))}
              </div>
            ) : <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div>}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1px solid #e0e7ff', boxShadow: '0 10px 30px rgba(15,23,42,0.05)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800 }}>Top sản phẩm bán chạy</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ fontSize: 12, color: '#94a3b8', borderBottom: '1px solid #e0e7ff' }}>
                <th style={{ padding: '6px 0', textAlign: 'left' }}>SP</th><th style={{ padding: '6px 0', textAlign: 'right' }}>SL</th><th style={{ padding: '6px 0', textAlign: 'right' }}>Doanh thu</th>
              </tr></thead>
              <tbody>{topProducts.slice(0, 8).map((p, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '7px 0', fontSize: 13, fontWeight: 600 }}>{p.name}</td>
                  <td style={{ padding: '7px 0', textAlign: 'right', fontSize: 13 }}>{p.total_qty || 0}</td>
                  <td style={{ padding: '7px 0', textAlign: 'right', fontSize: 13, fontWeight: 700, color: roleColor }}>{fmtCurrency(p.total_revenue)} đ</td>
                </tr>
              ))}</tbody>
            </table>
          </div>

          <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1px solid #e0e7ff', boxShadow: '0 10px 30px rgba(15,23,42,0.05)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800 }}>Top khách hàng</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ fontSize: 12, color: '#94a3b8', borderBottom: '1px solid #e0e7ff' }}>
                <th style={{ padding: '6px 0', textAlign: 'left' }}>Khách hàng</th><th style={{ padding: '6px 0', textAlign: 'right' }}>Đơn</th><th style={{ padding: '6px 0', textAlign: 'right' }}>Chi tiêu</th>
              </tr></thead>
              <tbody>{topCustomers.slice(0, 8).map((c, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '7px 0', fontSize: 13, fontWeight: 600 }}>{c.company_name}</td>
                  <td style={{ padding: '7px 0', textAlign: 'right', fontSize: 13 }}>{c.order_count || 0}</td>
                  <td style={{ padding: '7px 0', textAlign: 'right', fontSize: 13, fontWeight: 700, color: '#10b981' }}>{fmtCurrency(c.total_spent)} đ</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      </>
    );
  };

  const renderLogisticsReport = () => {
    const t = data?.tables || {};
    const charts = data?.charts || {};
    const delStats = Array.isArray(t.delivery_stats) ? t.delivery_stats : [];
    const retStats = Array.isArray(t.return_stats) ? t.return_stats : [];
    const compStats = Array.isArray(t.compensation_stats) ? t.compensation_stats : [];
    const carrierStats = Array.isArray(t.carrier_stats) ? t.carrier_stats : [];
    const delData = (charts.deliveries_by_day || []).map(r => ({ ...r, deliveries: Number(r.deliveries || 0), name: r.date }));

    return (
      <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14, marginBottom: 18 }}>
          <StatCard label="Giao hàng" value={delStats.reduce((s, r) => s + Number(r.count || 0), 0)} accent={roleColor} icon="ri-truck-line" />
          <StatCard label="Hoàn hàng" value={retStats.reduce((s, r) => s + Number(r.count || 0), 0)} accent="#f97316" icon="ri-arrow-go-back-line" />
          <StatCard label="Phiếu bù" value={compStats.reduce((s, r) => s + Number(r.count || 0), 0)} accent="#ef4444" icon="ri-file-list-3-line" />
        </div>
        <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1px solid #e0e7ff', marginBottom: 14 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 800 }}>Giao hàng theo ngày</h3>
          {delData.length > 0 ? <ResponsiveContainer width="100%" height={260}><BarChart data={delData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e7ff" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="deliveries" fill={roleColor} radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer> : <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1px solid #e0e7ff' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800 }}>Đơn vị vận chuyển</h3>
            {carrierStats.length === 0 ? <div style={{ padding: 16, color: '#94a3b8', textAlign: 'center' }}>Chưa có dữ liệu</div> :
              carrierStats.map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 10, background: '#f8fafc', marginBottom: 6, fontSize: 13 }}>
                  <span style={{ fontWeight: 700 }}>{c.carrier_code}</span>
                  <span style={{ color: '#64748b' }}>{c.shipments} đơn • {c.delivered} giao thành công</span>
                </div>
              ))}
          </div>
          <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1px solid #e0e7ff' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800 }}>Phiếu bù theo loại lỗi</h3>
            {compStats.length === 0 ? <div style={{ padding: 16, color: '#94a3b8', textAlign: 'center' }}>Chưa có dữ liệu</div> :
              compStats.map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 10, background: '#f8fafc', marginBottom: 6, fontSize: 13 }}>
                  <span style={{ fontWeight: 700 }}>{c.defect_type}</span>
                  <span style={{ color: '#64748b' }}>{c.count} phiếu • {c.total_items} SP • {c.status}</span>
                </div>
              ))}
          </div>
        </div>
      </>
    );
  };

  const renderWarehouseReport = () => {
    const t = data?.tables || {};
    const charts = data?.charts || {};
    const recStats = Array.isArray(t.receipt_stats) ? t.receipt_stats : [];
    const outStats = Array.isArray(t.outbound_stats) ? t.outbound_stats : [];
    const whSummary = Array.isArray(t.warehouse_summary) ? t.warehouse_summary : [];
    const productMove = Array.isArray(t.product_movement) ? t.product_movement : [];
    const recData = (charts.receipts_by_day || []).map(r => ({ ...r, receipts: Number(r.receipts || 0), name: r.date }));
    const outData = (charts.outbounds_by_day || []).map(r => ({ ...r, outbounds: Number(r.outbounds || 0), name: r.date }));

    return (
      <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14, marginBottom: 18 }}>
          {recStats.map((st, i) => (
            <StatCard key={i} label={`Nhập: ${st.status}`} value={`${st.count} phiếu`} accent={roleColor} icon="ri-inbox-archive-line" />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1px solid #e0e7ff' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 800 }}>Nhập kho theo ngày</h3>
            {recData.length > 0 ? <ResponsiveContainer width="100%" height={260}><BarChart data={recData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e7ff" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="receipts" fill="#10b981" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer> : <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div>}
          </div>
          <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1px solid #e0e7ff' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 800 }}>Xuất kho theo ngày</h3>
            {outData.length > 0 ? <ResponsiveContainer width="100%" height={260}><BarChart data={outData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e7ff" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="outbounds" fill="#7c3aed" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer> : <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div>}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1px solid #e0e7ff' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800 }}>Biến động hàng hóa</h3>
            {productMove.length === 0 ? <div style={{ padding: 16, color: '#94a3b8', textAlign: 'center' }}>Chưa có dữ liệu</div> :
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ fontSize: 12, color: '#94a3b8', borderBottom: '1px solid #e0e7ff' }}>
                  <th style={{ padding: '6px 0', textAlign: 'left' }}>SP</th><th style={{ padding: '6px 0', textAlign: 'right' }}>Nhập</th><th style={{ padding: '6px 0', textAlign: 'right' }}>Xuất</th><th style={{ padding: '6px 0', textAlign: 'right' }}>Tồn</th>
                </tr></thead>
                <tbody>{productMove.slice(0, 10).map((p, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '7px 0', fontSize: 13, fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: '7px 0', textAlign: 'right', color: '#10b981' }}>{p.total_in || 0}</td>
                    <td style={{ padding: '7px 0', textAlign: 'right', color: '#ef4444' }}>{p.total_out || 0}</td>
                    <td style={{ padding: '7px 0', textAlign: 'right', fontWeight: 700 }}>{p.current_stock || 0}</td>
                  </tr>
                ))}</tbody>
              </table>
            }
          </div>
          <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1px solid #e0e7ff' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800 }}>Tổng hợp theo kho</h3>
            {whSummary.length === 0 ? <div style={{ padding: 16, color: '#94a3b8', textAlign: 'center' }}>Chưa có dữ liệu</div> :
              whSummary.map((w, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 12, background: '#f8fafc', marginBottom: 6, fontSize: 13, border: '1px solid #e0e7ff' }}>
                  <div><div style={{ fontWeight: 700 }}>{w.name}</div><div style={{ fontSize: 11, color: '#94a3b8' }}>{w.product_types} loại SP</div></div>
                  <div style={{ textAlign: 'right' }}><div style={{ fontWeight: 800 }}>{w.total_qty || 0} SP</div><div style={{ fontSize: 11, color: '#64748b' }}>Nhập: {w.receipt_count || 0} • Xuất: {w.outbound_count || 0}</div></div>
                </div>
              ))
            }
          </div>
        </div>
      </>
    );
  };

  const renderFactoryReport = () => {
    const t = data?.tables || {};
    const charts = data?.charts || {};
    const recStats = Array.isArray(t.receipt_stats) ? t.receipt_stats : [];
    const compStats = Array.isArray(t.compensation_stats) ? t.compensation_stats : [];
    const pendingRec = Array.isArray(t.pending_receipts) ? t.pending_receipts : [];
    const pendingComp = Array.isArray(t.pending_compensations) ? t.pending_compensations : [];
    const recData = (charts.receipts_by_day || []).map(r => ({ ...r, receipts: Number(r.receipts || 0), name: r.date }));

    return (
      <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14, marginBottom: 18 }}>
          <StatCard label="Phiếu nhập" value={recStats.reduce((s, r) => s + Number(r.count || 0), 0)} accent={roleColor} icon="ri-inbox-archive-line" />
          <StatCard label="Phiếu bù" value={compStats.reduce((s, r) => s + Number(r.count || 0), 0)} accent="#ef4444" icon="ri-file-list-3-line" />
          <StatCard label="Kỳ báo cáo" value={data?.period || '—'} accent="#7c3aed" icon="ri-calendar-line" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1px solid #e0e7ff' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 800 }}>Phiếu nhập theo ngày</h3>
            {recData.length > 0 ? <ResponsiveContainer width="100%" height={260}><BarChart data={recData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e7ff" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="receipts" fill={roleColor} radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer> : <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div>}
          </div>
          <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1px solid #e0e7ff' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 800 }}>Trạng thái phiếu bù</h3>
            {compStats.length === 0 ? <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div> :
              <div style={{ display: 'grid', gap: 8 }}>
                {compStats.map((c, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e0e7ff', fontSize: 13 }}>
                    <span style={{ fontWeight: 700 }}>{c.defect_type} — {c.status}</span>
                    <span style={{ color: '#64748b' }}>{c.count} phiếu • {c.total_items || 0} SP</span>
                  </div>
                ))}
              </div>
            }
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1px solid #e0e7ff' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800 }}>Phiếu nhập chờ duyệt</h3>
            {pendingRec.length === 0 ? <div style={{ padding: 16, color: '#94a3b8', textAlign: 'center' }}>Không có phiếu chờ</div> :
              pendingRec.map(r => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 12, background: '#fffbeb', border: '1px solid #fde68a', marginBottom: 6, fontSize: 13 }}>
                  <div><div style={{ fontWeight: 700 }}>{r.receipt_no}</div><div style={{ fontSize: 11, color: '#94a3b8' }}>{r.warehouse_name || '—'} • {r.item_count || 0} SP</div></div>
                  <span style={{ fontSize: 12, color: '#92400e' }}>{r.note?.slice(0, 25) || '—'}</span>
                </div>
              ))
            }
          </div>
          <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1px solid #e0e7ff' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800 }}>Phiếu bù chờ xử lý</h3>
            {pendingComp.length === 0 ? <div style={{ padding: 16, color: '#94a3b8', textAlign: 'center' }}>Không có phiếu bù chờ</div> :
              pendingComp.map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 12, background: '#fef2f2', border: '1px solid #fecaca', marginBottom: 6, fontSize: 13 }}>
                  <div><div style={{ fontWeight: 700, color: '#ef4444' }}>{c.compensation_no}</div><div style={{ fontSize: 11, color: '#94a3b8' }}>{c.order_no} • {c.customer_name || '—'}</div></div>
                  <span style={{ padding: '3px 8px', borderRadius: 999, background: '#fee2e2', color: '#b91c1c', fontWeight: 700, fontSize: 11 }}>{c.defect_type}</span>
                </div>
              ))
            }
          </div>
        </div>
      </>
    );
  };

  return (
    <div style={{ padding: 24, minHeight: '100vh', background: 'linear-gradient(160deg, #f5f7fb, #eef3f9)', opacity: mounted ? 1 : 0, transition: 'opacity 320ms' }}>
      <style>{`@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }`}</style>

      <div style={{ maxWidth: 1440, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#0f172a' }}>{roleTitle}</h1>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>Chu kỳ: <strong>{data?.period || 'Tất cả'}</strong></p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {PERIOD_OPTIONS.map(p => (
              <button key={p.value} onClick={() => setPeriod(p.value)}
                style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid #dbe3ee', background: period === p.value ? roleColor : '#fff', color: period === p.value ? '#fff' : '#475569', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                {p.label}
              </button>
            ))}
            <button
              onClick={() => roleId === 1 || !roleId ? exportInventoryReport(data)
                : roleId === 2 ? exportSalesReport(data)
                : roleId === 3 ? exportLogisticsReport(data)
                : roleId === 4 ? exportWarehouseReport(data)
                : exportFactoryReport(data)}
              style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid #dbe3ee', background: '#fff', color: roleColor, fontWeight: 700, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}>
              <i className="ri-file-excel-2-line" style={{ fontSize: 15 }} />Xuất Excel
            </button>
          </div>
        </div>

        {error ? (
          <div style={{ padding: 24, color: '#b91c1c', background: '#fee2e2', borderRadius: 16, border: '1px solid #fecaca' }}>{error}</div>
        ) : roleId === 1 || !roleId ? renderInventoryReport() :
          roleId === 2 ? renderSalesReport() :
          roleId === 3 ? renderLogisticsReport() :
          roleId === 4 ? renderWarehouseReport() :
          roleId === 5 ? renderFactoryReport() :
          <div style={{ padding: 24, color: '#64748b' }}>Không có báo cáo phù hợp với vai trò của bạn.</div>
        }
      </div>
    </div>
  );
}
