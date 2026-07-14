import { useEffect, useMemo, useState } from 'react';
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import api from '../services/api';

const BLUE   = '#3b82f6';
const GREEN  = '#10b981';
const ORANGE = '#f59e0b';
const PURPLE = '#8b5cf6';

const fmtCurrency = (v) => new Intl.NumberFormat('vi-VN').format(Number(v || 0));
const fmtDate = (v) => { if (!v) return '--'; const d = new Date(v); return Number.isNaN(d.getTime()) ? '--' : d.toLocaleDateString('vi-VN'); };

const STATUS_LABELS = {
  pending: 'Chờ duyệt', shipping: 'Đang giao', completed: 'Hoàn thành',
  returned: 'Hoàn trả', canceled: 'Đã hủy', return_pending: 'Chờ hoàn',
  return_to_sales: 'Hoàn về Sales', logistics_review: 'Kho báo lỗi',
  customer_rejected: 'Khách từ chối', warehouse_processing: 'Kho đang xuất',
  waiting_sales: 'Chờ Sales xử lý', return_completed: 'Hoàn xong',
};

const STATUS_COLORS = {
  pending: '#f59e0b', shipping: '#8b5cf6', completed: '#10b981',
  returned: '#f97316', canceled: '#ef4444', return_pending: '#dc2626',
  warehouse_processing: '#0ea5e9', waiting_sales: '#facc15',
};

const PERIODS = [
  { value: 'day',     label: 'Hôm nay' },
  { value: 'month',   label: 'Tháng này' },
  { value: 'quarter', label: 'Quý này' },
  { value: 'all',     label: 'Tất cả' },
];

function KPI({ label, value, sub, accent, icon }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 20, padding: 24,
      border: '1px solid #f1f5f9',
      boxShadow: '0 10px 25px rgba(15,23,42,0.03)',
      position: 'relative', overflow: 'hidden',
      transition: 'transform 200ms ease, box-shadow 200ms ease',
      cursor: 'pointer'
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 20px 40px ${accent}20`; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(15,23,42,0.03)'; }}
    >
      <div style={{ position: 'absolute', right: -20, top: -20, width: 90, height: 90, borderRadius: '50%', background: `${accent}15`, opacity: 0.8 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: accent, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 20, boxShadow: `0 8px 16px ${accent}33` }}>
          <i className={icon} />
        </div>
        <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6, fontWeight: 500 }}>{sub}</div>}
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 24, padding: 24, border: '1px solid #f1f5f9', boxShadow: '0 10px 30px rgba(15,23,42,0.02)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>{title}</h3>
          {subtitle && <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{subtitle}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

export default function MyDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true); setError('');
      try {
        const res = await api.get(`/reports/dashboard?period=${period}`);
        if (!cancelled) setData(res.data);
      } catch (e) {
        if (!cancelled) setError('Không thể tải dữ liệu dashboard.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [period]);

  const s = data?.summary || {};
  const recentOrders = Array.isArray(data?.tables?.recent_orders) ? data.tables.recent_orders : [];
  const topProducts = Array.isArray(data?.tables?.top_products) ? data.tables.top_products : [];

  const revDayData = (data?.charts?.revenue_by_day || []).map(r => ({ name: fmtDate(r.date), revenue: Number(r.revenue || 0) }));

  if (loading && !data) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc', color: '#94a3b8' }}>
      <i className="ri-loader-4-line" style={{ fontSize: 32, marginRight: 12, animation: 'spin 1s linear infinite' }} />
      <span style={{ fontSize: 16, fontWeight: 600 }}>Đang tải dữ liệu của bạn...</span>
      <style>{`@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ padding: '32px 40px', minHeight: '100vh', background: '#f8fafc', opacity: mounted ? 1 : 0, transition: 'opacity 400ms ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em' }}>Sales Dashboard</h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 14 }}>Theo dõi doanh thu và đơn hàng của tôi</p>
        </div>
        <div style={{ display: 'flex', gap: 4, background: '#fff', padding: 6, borderRadius: 14, boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              style={{
                padding: '10px 18px', borderRadius: 10, border: 'none',
                background: period === p.value ? BLUE : 'transparent',
                color: period === p.value ? '#fff' : '#64748b',
                fontWeight: 600, cursor: 'pointer', fontSize: 13,
                transition: 'all 200ms ease'
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ padding: 16, background: '#fee2e2', color: '#991b1b', borderRadius: 14, marginBottom: 24, fontWeight: 500 }}>
          <i className="ri-error-warning-fill" style={{ marginRight: 8 }} />{error}
        </div>
      )}

      {/* 4 Core KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 24 }}>
        <KPI label="Doanh thu của tôi" value={`${fmtCurrency(s.total_revenue)} ₫`} sub={`Tỷ lệ hoàn thành: ${s.completion_rate || 0}%`} accent={BLUE} icon="ri-money-dollar-circle-fill" />
        <KPI label="Tổng đơn hàng" value={s.total_orders || 0} sub={`${s.completed_orders || 0} đơn đã hoàn tất`} accent={GREEN} icon="ri-shopping-bag-3-fill" />
        <KPI label="Đang chờ xử lý" value={s.pending_orders || 0} sub="Đơn hàng đang giao hoặc kho xử lý" accent={ORANGE} icon="ri-time-fill" />
        <KPI label="Khách hàng" value={s.total_customers || 0} sub="Khách hàng đã mua hàng" accent={PURPLE} icon="ri-user-smile-fill" />
      </div>

      {/* Main Chart */}
      <div style={{ marginBottom: 24 }}>
        <ChartCard title="Doanh thu cá nhân" subtitle="Biến động doanh thu của bạn theo thời gian">
          {revDayData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={revDayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradRev2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={BLUE} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={BLUE} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={v => `${(v/1000000).toFixed(0)}M`} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v, n) => [`${fmtCurrency(v)} ₫`, 'Doanh thu']}
                  contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '12px 16px' }}
                  labelStyle={{ fontWeight: 700, color: '#0f172a', marginBottom: 4 }}
                />
                <Area type="monotone" dataKey="revenue" stroke={BLUE} strokeWidth={3} fill="url(#gradRev2)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu trong kỳ này</div>}
        </ChartCard>
      </div>

      {/* Tables Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
        <ChartCard title="Đơn hàng gần đây" subtitle="Các giao dịch mới nhất của bạn">
          {recentOrders.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
                <thead>
                  <tr style={{ fontSize: 12, color: '#64748b', borderBottom: '2px solid #f1f5f9' }}>
                    <th style={{ padding: '12px 0', textAlign: 'left', fontWeight: 600 }}>Mã đơn</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Khách hàng</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600 }}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.slice(0, 6).map(o => (
                    <tr key={o.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '14px 0', fontWeight: 700, color: '#0f172a', fontSize: 13 }}>{o.order_no}</td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#475569' }}>{o.customer_name || '—'}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                          background: `${STATUS_COLORS[o.status] || '#64748b'}15`,
                          color: STATUS_COLORS[o.status] || '#334155',
                        }}>{STATUS_LABELS[o.status] || o.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Sản phẩm tôi bán chạy" subtitle="Top 5 sản phẩm nổi bật">
          {topProducts.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {topProducts.slice(0, 5).map((p, i) => (
                <div key={p.sku} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 12, borderRadius: 16, background: '#f8fafc' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 12, background: i === 0 ? '#fef3c7' : i === 1 ? '#f1f5f9' : '#fff7ed', color: i === 0 ? '#d97706' : i === 1 ? '#64748b' : '#c2410c', display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 800, flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>Doanh thu: <span style={{ fontWeight: 700, color: GREEN }}>{fmtCurrency(p.total_revenue)} ₫</span></div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 14 }}>{Number(p.total_qty || 0).toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Sản phẩm</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
