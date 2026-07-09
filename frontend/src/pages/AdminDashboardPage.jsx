import { useEffect, useMemo, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart,
} from 'recharts';
import api from '../services/api';
import { exportAdminDashboard } from '../utils/excelExport';

const BLUE   = '#2563eb';
const GREEN  = '#10b981';
const PURPLE = '#7c3aed';
const ORANGE = '#f59e0b';
const RED    = '#ef4444';
const CYAN   = '#06b6d4';
const PINK   = '#ec4899';

const PIE_COLORS = [BLUE, GREEN, PURPLE, ORANGE, RED, CYAN, PINK, '#0ea5e9', '#8b5cf6', '#22c55e'];

const fmtCurrency = (v) => new Intl.NumberFormat('vi-VN').format(Number(v || 0));
const fmtDate = (v) => { if (!v) return '--'; const d = new Date(v); return Number.isNaN(d.getTime()) ? '--' : d.toLocaleDateString('vi-VN'); };
const fmtMonth = (v) => {
  if (!v) return '--';
  const m = String(v).slice(0, 7);
  const d = new Date(`${m}-01`);
  return Number.isNaN(d.getTime()) ? m : d.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' });
};

const STATUS_LABELS = {
  pending: 'Chờ duyệt',
  shipping: 'Đang giao',
  completed: 'Hoàn thành',
  returned: 'Hoàn trả',
  canceled: 'Đã hủy',
  return_pending: 'Chờ hoàn',
  return_to_sales: 'Hoàn về Sales',
  logistics_review: 'Kho báo lỗi',
  customer_rejected: 'Khách từ chối',
  warehouse_processing: 'Kho đang xuất',
  waiting_sales: 'Chờ Sales xử lý',
  return_completed: 'Hoàn xong',
};
const STATUS_COLORS = {
  pending: '#f59e0b',
  shipping: '#7c3aed',
  completed: '#10b981',
  returned: '#f97316',
  canceled: '#ef4444',
  return_pending: '#dc2626',
  return_to_sales: '#a16207',
  logistics_review: '#9333ea',
  customer_rejected: '#be123c',
  warehouse_processing: '#0ea5e9',
  waiting_sales: '#facc15',
  return_completed: '#059669',
};

const PERIODS = [
  { value: 'day',     label: 'Hôm nay' },
  { value: 'month',   label: 'Tháng này' },
  { value: 'quarter', label: 'Quý này' },
  { value: 'all',     label: 'Tất cả' },
];

function cardStyle(hovered, accent = BLUE) {
  return {
    background: '#fff',
    borderRadius: 16,
    padding: 18,
    border: hovered ? `1.5px solid ${accent}55` : '1px solid #e0e7ff',
    boxShadow: hovered ? `0 18px 44px ${accent}22` : '0 8px 22px rgba(15,23,42,0.05)',
    transition: 'all 220ms ease',
    transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
  };
}

function KPI({ label, value, sub, accent, icon, onMouseEnter, onMouseLeave, hovered }) {
  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        ...cardStyle(hovered, accent),
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
      }}
    >
      <div style={{ position: 'absolute', right: -20, top: -20, width: 80, height: 80, borderRadius: '50%', background: `${accent}15`, opacity: 0.7 }} />
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 11, background: accent, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 17, boxShadow: `0 4px 12px ${accent}33` }}>
            <i className={icon} />
          </div>
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{sub}</div>}
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, accent, children, action }) {
  return (
    <div style={cardStyle(false, accent)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{title}</h3>
          {subtitle && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{subtitle}</div>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [hover, setHover] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/reports/dashboard?period=${period}`);
        if (!cancelled) setData(res.data);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError('Không thể tải dữ liệu dashboard.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [period]);

  const s = data?.summary || {};
  const recentOrders  = Array.isArray(data?.tables?.recent_orders)  ? data.tables.recent_orders  : [];
  const topProducts   = Array.isArray(data?.tables?.top_products)   ? data.tables.top_products   : [];
  const topCustomers  = Array.isArray(data?.tables?.top_customers)  ? data.tables.top_customers  : [];
  const whUtil        = Array.isArray(data?.tables?.warehouse_utilization) ? data.tables.warehouse_utilization : [];
  const returnStats   = Array.isArray(data?.tables?.return_stats)   ? data.tables.return_stats   : [];

  const revDayData     = (data?.charts?.revenue_by_day     || []).map(r => ({ name: fmtDate(r.date), value: Number(r.revenue || 0) }));
  const ordDayData     = (data?.charts?.orders_by_day      || []).map(r => ({ name: fmtDate(r.date), value: Number(r.orders || 0) }));
  const revMonthData   = (data?.charts?.revenue_by_month   || []).map(r => ({ name: fmtMonth(r.period), value: Number(r.revenue || 0), orders: Number(r.orders || 0) }));
  const ordersByStatus = (data?.charts?.orders_by_status   || []).map(r => ({ name: STATUS_LABELS[r.status] || r.status, value: Number(r.count || 0), revenue: Number(r.revenue || 0), status: r.status }));
  const ordersByCategory = (data?.charts?.orders_by_category || []).map(r => ({ name: r.name || 'Khác', value: Number(r.revenue || 0), qty: Number(r.qty || 0), orders: Number(r.orders || 0) }));
  const revByCarrier   = (data?.charts?.revenue_by_carrier || []).map(r => ({ name: r.name, value: Number(r.shipments || 0), revenue: Number(r.revenue || 0) }));
  const returnReasons  = (data?.charts?.return_reasons     || []).map(r => ({ name: r.reason || 'Khác', value: Number(r.count || 0) }));

  // Tính % hoàn thành
  const completionRate = s.total_orders > 0 ? Math.round((s.completed_orders / s.total_orders) * 100) : 0;

  // Combine day data thành 1 chart (revenue + orders)
  const dayLabels = useMemo(() => {
    const map = new Map();
    revDayData.forEach(r => map.set(r.name, { name: r.name, revenue: r.value, orders: 0 }));
    ordDayData.forEach(r => {
      if (!map.has(r.name)) map.set(r.name, { name: r.name, revenue: 0, orders: r.value });
      else map.get(r.name).orders = r.value;
    });
    return Array.from(map.values()).sort((a, b) => {
      const da = a.name.split('/').reverse().join('-');
      const db = b.name.split('/').reverse().join('-');
      return da.localeCompare(db);
    });
  }, [revDayData, ordDayData]);

  if (loading && !data) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#94a3b8' }}>
      <i className="ri-loader-4-line" style={{ fontSize: 28, marginRight: 12, animation: 'spin 1s linear infinite' }} />Đang tải dữ liệu...
    </div>
  );

  return (
    <div style={{ padding: 20, minHeight: '100vh', background: 'linear-gradient(160deg, #eff6ff, #f0f4ff 40%, #fafbff)', opacity: mounted ? 1 : 0, transition: 'opacity 320ms' }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
        .db-tab { transition: all 180ms ease; }
        .db-tab:hover { transform: translateY(-1px); }
        .db-row:hover { background: #f8fafc; }
        @media (max-width: 1100px) {
          .db-grid-kpi { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
        }
        @media (max-width: 900px) {
          .db-grid-kpi { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .db-grid-2   { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 520px) {
          .db-grid-kpi { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            <i className="ri-dashboard-3-line" style={{ marginRight: 10, color: BLUE }} />Dashboard Tổng quan
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
            Chu kỳ: <strong style={{ color: BLUE }}>{data?.period || 'Tất cả'}</strong> • Cập nhật theo thời gian thực
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {PERIODS.map(p => (
            <button
              key={p.value}
              className="db-tab"
              onClick={() => setPeriod(p.value)}
              style={{
                padding: '8px 14px', borderRadius: 10,
                border: `1px solid ${period === p.value ? BLUE : '#dbe3ee'}`,
                background: period === p.value ? BLUE : '#fff',
                color: period === p.value ? '#fff' : '#475569',
                fontWeight: 700, cursor: 'pointer', fontSize: 13,
                boxShadow: period === p.value ? `0 6px 14px ${BLUE}33` : 'none',
              }}
            >
              {p.label}
            </button>
          ))}
          <button
            className="db-tab"
            onClick={() => data && exportAdminDashboard(data)}
            style={{
              padding: '8px 16px', borderRadius: 10, border: '1px solid #dbe3ee',
              background: '#fff', color: GREEN, fontWeight: 700, cursor: 'pointer', fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 5,
              boxShadow: '0 4px 10px rgba(16,185,129,0.15)',
            }}
          >
            <i className="ri-file-excel-2-line" style={{ fontSize: 15 }} />Xuất Excel
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: 16, background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 12, marginBottom: 14 }}>
          <i className="ri-error-warning-line" style={{ marginRight: 8 }} />{error}
        </div>
      )}

      {/* KPI Grid - 8 cards */}
      <div
        className="db-grid-kpi"
        style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: 14, marginBottom: 18,
        }}
      >
        <KPI label="Tổng doanh thu"  value={`${fmtCurrency(s.total_revenue)} đ`}  sub={`${s.completed_orders || 0} đơn hoàn thành`} accent={BLUE}   icon="ri-money-cny-circle-line" hovered={hover === 'r'} onMouseEnter={() => setHover('r')} onMouseLeave={() => setHover(null)} />
        <KPI label="Đơn hàng"         value={`${s.total_orders || 0}`}            sub={`${completionRate}% hoàn thành`}               accent={GREEN}  icon="ri-shopping-bag-3-line"   hovered={hover === 'o'} onMouseEnter={() => setHover('o')} onMouseLeave={() => setHover(null)} />
        <KPI label="Đơn chờ xử lý"    value={`${s.pending_orders || 0}`}          sub="Cần theo dõi"                                  accent={ORANGE} icon="ri-time-line"            hovered={hover === 'p'} onMouseEnter={() => setHover('p')} onMouseLeave={() => setHover(null)} />
        <KPI label="Tồn kho thấp"     value={`${s.low_stock_count || 0}`}         sub="SP dưới định mức"                              accent={RED}    icon="ri-alert-line"           hovered={hover === 'l'} onMouseEnter={() => setHover('l')} onMouseLeave={() => setHover(null)} />
        <KPI label="Phiếu nhập"        value={`${s.total_receipts || 0}`}         sub="Từ nhà máy"                                    accent={CYAN}   icon="ri-inbox-archive-line"   hovered={hover === 'rc'} onMouseEnter={() => setHover('rc')} onMouseLeave={() => setHover(null)} />
        <KPI label="Phiếu xuất"        value={`${s.total_outbounds || 0}`}        sub={`${s.outbound_pending || 0} chờ xử lý`}        accent={PURPLE} icon="ri-send-plane-line"      hovered={hover === 'ob'} onMouseEnter={() => setHover('ob')} onMouseLeave={() => setHover(null)} />
        <KPI label="Yêu cầu hoàn"     value={`${s.return_pending || 0}`}         sub="Đang chờ xử lý"                                accent={PINK}   icon="ri-arrow-go-back-line"   hovered={hover === 'rt'} onMouseEnter={() => setHover('rt')} onMouseLeave={() => setHover(null)} />
        <KPI label="Khách hàng"        value={`${s.total_customers || 0}`}        sub={`${s.total_users || 0} người dùng`}            accent="#0d9488" icon="ri-team-line"           hovered={hover === 'c'} onMouseEnter={() => setHover('c')} onMouseLeave={() => setHover(null)} />
      </div>

      {/* Row 1: Doanh thu & đơn hàng theo ngày (Area+Line combo) */}
      <ChartCard
        title="Xu hướng doanh thu & đơn hàng theo ngày"
        subtitle="Kết hợp doanh thu (vùng) + số đơn (đường)"
        accent={BLUE}
        action={<span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>{dayLabels.length} ngày</span>}
      >
        {dayLabels.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dayLabels}>
              <defs>
                <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={BLUE} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={BLUE} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e7ff" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={v => `${(v/1000000).toFixed(1)}tr`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip
                formatter={(v, n) => n === 'Doanh thu' ? [`${fmtCurrency(v)} đ`, n] : [v, n]}
                labelStyle={{ fontWeight: 700 }}
                contentStyle={{ borderRadius: 10, border: '1px solid #e0e7ff' }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area yAxisId="left"  type="monotone" dataKey="revenue" name="Doanh thu" stroke={BLUE} strokeWidth={2.5} fill="url(#gradRev)" />
              <Line yAxisId="right" type="monotone" dataKey="orders"   name="Số đơn"   stroke={ORANGE} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu trong kỳ này</div>}
      </ChartCard>

      {/* Row 2: 12-month trend (full width) */}
      <div style={{ marginTop: 14, marginBottom: 14 }}>
        <ChartCard
          title="Doanh thu 12 tháng gần nhất"
          subtitle="Tổng quan tăng trưởng dài hạn"
          accent={PURPLE}
        >
          {revMonthData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revMonthData} barCategoryGap={20}>
                <defs>
                  <linearGradient id="gradBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={PURPLE} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={PURPLE} stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e7ff" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={v => `${(v/1000000).toFixed(0)}tr`} />
                <Tooltip formatter={v => [`${fmtCurrency(v)} đ`, 'Doanh thu']} contentStyle={{ borderRadius: 10, border: '1px solid #e0e7ff' }} />
                <Bar dataKey="value" fill="url(#gradBar)" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div>}
        </ChartCard>
      </div>

      {/* Row 3: 2 columns - Trạng thái đơn (donut) + Doanh thu theo danh mục (pie) */}
      <div className="db-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <ChartCard title="Phân bổ đơn hàng theo trạng thái" subtitle="Tỷ lệ các trạng thái đơn" accent={GREEN}>
          {ordersByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={ordersByStatus} dataKey="value" nameKey="name" innerRadius={55} outerRadius={100} paddingAngle={2}>
                  {ordersByStatus.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.status] || PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n, p) => [`${v} đơn`, p.payload.name]} contentStyle={{ borderRadius: 10, border: '1px solid #e0e7ff' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div>}
        </ChartCard>

        <ChartCard title="Doanh thu theo danh mục sản phẩm" subtitle="Phân bổ doanh thu" accent={ORANGE}>
          {ordersByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={ordersByCategory} dataKey="value" nameKey="name" innerRadius={55} outerRadius={100} paddingAngle={2}>
                  {ordersByCategory.map((entry, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [`${fmtCurrency(v)} đ`, n]} contentStyle={{ borderRadius: 10, border: '1px solid #e0e7ff' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div>}
        </ChartCard>
      </div>

      {/* Row 4: 2 columns - Phân bổ tồn kho (bar ngang) + Đơn vị vận chuyển (bar) */}
      <div className="db-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <ChartCard title="Phân bổ tồn kho theo kho" subtitle="Số lượng sản phẩm" accent={CYAN}>
          {whUtil.length > 0 ? (() => {
            const maxQty = Math.max(...whUtil.map(w => Number(w.total_qty) || 0), 1);
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {whUtil.map((w, i) => {
                  const qty = Number(w.total_qty) || 0;
                  const pct = Math.round((qty / maxQty) * 100);
                  return (
                    <div key={w.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 10, height: 10, borderRadius: 3, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{w.name}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>{Number(w.product_count).toLocaleString()} SKU</span>
                          <span style={{ fontSize: 14, fontWeight: 800, color: CYAN }}>{qty.toLocaleString()}</span>
                        </div>
                      </div>
                      <div style={{ background: '#f1f5f9', borderRadius: 6, height: 10, overflow: 'hidden' }}>
                        <div style={{ background: `linear-gradient(90deg, ${PIE_COLORS[i % PIE_COLORS.length]}, ${PIE_COLORS[i % PIE_COLORS.length]}aa)`, height: '100%', width: `${pct}%`, transition: 'width 800ms ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })() : <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div>}
        </ChartCard>

        <ChartCard title="Đơn vị vận chuyển" subtitle="Số chuyến đã giao" accent={PINK}>
          {revByCarrier.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={revByCarrier} layout="vertical" barCategoryGap={14}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e0e7ff" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#64748b' }} width={110} />
                <Tooltip formatter={(v) => [`${v} chuyến`, 'Số lượng']} contentStyle={{ borderRadius: 10, border: '1px solid #e0e7ff' }} />
                <Bar dataKey="value" fill={PINK} radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div>}
        </ChartCard>
      </div>

      {/* Row 5: 2 columns - Đơn hàng gần nhất + Top sản phẩm */}
      <div className="db-grid-2" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 14, marginBottom: 14 }}>
        <ChartCard title="Đơn hàng gần nhất" subtitle={`${recentOrders.length} đơn mới nhất`} accent={BLUE}>
          {recentOrders.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '2px solid #e0e7ff' }}>
                    <th style={{ padding: '8px 0', textAlign: 'left' }}>Mã đơn</th>
                    <th style={{ padding: '8px 8px', textAlign: 'left' }}>Khách hàng</th>
                    <th style={{ padding: '8px 8px', textAlign: 'center' }}>SP</th>
                    <th style={{ padding: '8px 8px', textAlign: 'right' }}>Tổng tiền</th>
                    <th style={{ padding: '8px 8px', textAlign: 'center' }}>Trạng thái</th>
                    <th style={{ padding: '8px 0', textAlign: 'right' }}>Ngày</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(o => (
                    <tr key={o.id} className="db-row" style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '9px 0', fontWeight: 700, color: BLUE, fontSize: 13 }}>{o.order_no}</td>
                      <td style={{ padding: '9px 8px', fontSize: 12, color: '#334155' }}>{o.customer_name || '—'}</td>
                      <td style={{ padding: '9px 8px', fontSize: 12, textAlign: 'center', fontWeight: 700 }}>{o.item_count || 0}</td>
                      <td style={{ padding: '9px 8px', fontSize: 12, textAlign: 'right', fontWeight: 700, color: GREEN }}>{fmtCurrency(o.total_amount)} đ</td>
                      <td style={{ padding: '9px 8px', textAlign: 'center' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                          background: `${STATUS_COLORS[o.status] || '#64748b'}22`,
                          color: STATUS_COLORS[o.status] || '#334155',
                        }}>{STATUS_LABELS[o.status] || o.status}</span>
                      </td>
                      <td style={{ padding: '9px 0', fontSize: 11, color: '#94a3b8', textAlign: 'right' }}>{fmtDate(o.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Top sản phẩm bán chạy" subtitle="Theo số lượng bán" accent={PURPLE}>
          {topProducts.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {topProducts.map((p, i) => (
                <div key={p.sku} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e0e7ff' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${PIE_COLORS[i % PIE_COLORS.length]}, ${PIE_COLORS[i % PIE_COLORS.length]}88)`, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>{p.sku} • {p.category}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: BLUE, fontSize: 13 }}>{fmtCurrency(p.total_revenue)} đ</div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>{Number(p.total_qty || 0).toLocaleString()} SP</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      </div>

      {/* Row 6: Top khách hàng + Lý do hoàn trả */}
      <div className="db-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <ChartCard title="Top khách hàng" subtitle="Theo tổng chi tiêu" accent={GREEN}>
          {topCustomers.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div>
          ) : (
            <div style={{ display: 'grid', gap: 6 }}>
              {topCustomers.map((c, i) => (
                <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, background: i % 2 === 0 ? '#f8fafc' : '#fff', border: '1px solid #f1f5f9' }}>
                  <div style={{ width: 26, height: 26, borderRadius: 7, background: GREEN, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: GREEN }}>{fmtCurrency(c.total_spent)} đ</div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>{c.orders} đơn</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ChartCard>

        <ChartCard title="Lý do hoàn trả" subtitle="Phân tích nguyên nhân" accent={RED}>
          {returnReasons.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={returnReasons} layout="vertical" barCategoryGap={12}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e0e7ff" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#64748b' }} width={120} />
                <Tooltip formatter={(v) => [`${v} phiếu`, 'Số lượng']} contentStyle={{ borderRadius: 10, border: '1px solid #e0e7ff' }} />
                <Bar dataKey="value" fill={RED} radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
