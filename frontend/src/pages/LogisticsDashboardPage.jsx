import { useEffect, useState } from 'react';
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import api from '../services/api';

const TEAL   = '#0d9488';
const BLUE   = '#3b82f6';
const ORANGE = '#f59e0b';
const RED    = '#ef4444';

const fmtDate = (v) => { if (!v) return '--'; const d = new Date(v); return Number.isNaN(d.getTime()) ? '--' : d.toLocaleDateString('vi-VN'); };

const STATUS_LABELS = {
  pending: 'Chờ duyệt', shipping: 'Đang giao', completed: 'Đã giao',
  returned: 'Hoàn trả', canceled: 'Đã hủy', return_pending: 'Yêu cầu hoàn',
  return_to_sales: 'Hoàn về Sales', logistics_handled: 'Đã tiếp nhận',
  customer_rejected: 'Khách từ chối', warehouse_processing: 'Kho đang xuất',
  waiting_sales: 'Chờ Sales xử lý', return_completed: 'Hoàn xong',
};

const STATUS_COLORS = {
  shipping: '#3b82f6', completed: '#10b981',
  returned: '#f97316', canceled: '#ef4444', return_pending: '#dc2626',
  customer_rejected: '#f43f5e', logistics_handled: '#8b5cf6',
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

export default function LogisticsDashboardPage() {
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
  const recentDeliveries = Array.isArray(data?.tables?.recent_deliveries) ? data.tables.recent_deliveries : [];
  const returnList = Array.isArray(data?.tables?.return_list) ? data.tables.return_list : [];

  const delivData = (data?.charts?.deliveries_by_day || []).map(r => ({ name: fmtDate(r.date), deliveries: Number(r.deliveries || 0) }));

  if (loading && !data) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc', color: '#94a3b8' }}>
      <i className="ri-loader-4-line" style={{ fontSize: 32, marginRight: 12, animation: 'spin 1s linear infinite' }} />
      <span style={{ fontSize: 16, fontWeight: 600 }}>Đang tổng hợp dữ liệu giao hàng...</span>
      <style>{`@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ padding: '32px 40px', minHeight: '100vh', background: '#f8fafc', opacity: mounted ? 1 : 0, transition: 'opacity 400ms ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em' }}>Logistics Dashboard</h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 14 }}>Điều phối vận chuyển và xử lý hoàn hàng</p>
        </div>
        <div style={{ display: 'flex', gap: 4, background: '#fff', padding: 6, borderRadius: 14, boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              style={{
                padding: '10px 18px', borderRadius: 10, border: 'none',
                background: period === p.value ? TEAL : 'transparent',
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
        <KPI label="Tổng Đơn Đã Giao" value={s.completed_deliveries || 0} sub={`Trong tổng số ${s.total_deliveries || 0} đơn xử lý`} accent={TEAL} icon="ri-truck-fill" />
        <KPI label="Giao đúng hạn" value={`${s.on_time_rate || 0}%`} sub="Tỷ lệ giao hàng đúng dự kiến" accent={BLUE} icon="ri-time-fill" />
        <KPI label="Đang Giao" value={s.pending_deliveries || 0} sub="Đơn hàng đang trên đường giao" accent={ORANGE} icon="ri-route-fill" />
        <KPI label="Chờ Xử Lý Hoàn" value={s.return_requests || 0} sub="Yêu cầu hoàn trả từ khách hàng" accent={RED} icon="ri-arrow-go-back-fill" />
      </div>

      {/* Main Chart */}
      <div style={{ marginBottom: 24 }}>
        <ChartCard title="Tiến độ giao hàng" subtitle="Số lượng đơn hàng giao thành công theo thời gian">
          {delivData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={delivData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradDeliv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={TEAL} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={TEAL} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v) => [v, 'Đơn giao']}
                  contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '12px 16px' }}
                  labelStyle={{ fontWeight: 700, color: '#0f172a', marginBottom: 4 }}
                />
                <Area type="monotone" dataKey="deliveries" stroke={TEAL} strokeWidth={3} fill="url(#gradDeliv)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu trong kỳ này</div>}
        </ChartCard>
      </div>

      {/* Tables Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
        <ChartCard title="Đơn hàng vận chuyển gần đây" subtitle="Trạng thái giao hàng hiện tại">
          {recentDeliveries.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có đơn hàng nào</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
                <thead>
                  <tr style={{ fontSize: 12, color: '#64748b', borderBottom: '2px solid #f1f5f9' }}>
                    <th style={{ padding: '12px 0', textAlign: 'left', fontWeight: 600 }}>Mã đơn</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Khách hàng</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Dự kiến giao</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600 }}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDeliveries.slice(0, 6).map(o => (
                    <tr key={o.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '14px 0', fontWeight: 700, color: '#0f172a', fontSize: 13 }}>
                        {o.order_no}
                        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400 }}>{o.tracking_no || 'Chưa có mã vận'}</div>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#475569' }}>{o.customer_name || '—'}</td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#475569' }}>{fmtDate(o.expected_delivery_date)}</td>
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

        <ChartCard title="Yêu cầu hoàn trả cần xử lý" subtitle="Các vấn đề báo lỗi từ khách">
          {returnList.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Không có yêu cầu hoàn trả</div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {returnList.slice(0, 5).map((r) => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 12, borderRadius: 16, background: '#fef2f2', border: '1px solid #fee2e2' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 12, background: '#fecaca', color: RED, display: 'grid', placeItems: 'center', fontSize: 16, flexShrink: 0 }}>
                    <i className="ri-error-warning-fill" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: RED }}>Đơn: {r.order_no}</div>
                    <div style={{ fontSize: 12, color: '#b91c1c' }}>{r.customer_reject_reason || 'Lý do khác'}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Bởi: {r.customer_name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: '#fff', color: RED, display: 'inline-block' }}>
                      {STATUS_LABELS[r.status] || r.status}
                    </span>
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
