import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';

const BLUE = '#2563eb';
const fmtCurrency = (v) => new Intl.NumberFormat('vi-VN').format(Number(v || 0));
const fmtDate = (v) => { if (!v) return '--'; const d = new Date(v); return Number.isNaN(d.getTime()) ? '--' : d.toLocaleDateString('vi-VN'); };

function cardStyle(hovered, accent = BLUE) {
  return {
    background: '#fff', borderRadius: 20, padding: '18px 20px',
    border: hovered ? `1.5px solid ${accent}55` : '1px solid #e0e7ff',
    boxShadow: hovered ? `0 18px 44px ${accent}18` : '0 10px 30px rgba(15,23,42,0.05)',
    transition: 'all 220ms ease', transform: hovered ? 'translateY(-5px)' : 'translateY(0)',
  };
}

export default function SalesDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [hover, setHover] = useState(null);
  const [mounted, setMounted] = useState(false);
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/reports/dashboard?period=${period}`);
        setData(res.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [period]);

  const s = data?.summary || {};
  const recentOrders = Array.isArray(data?.tables?.recent_orders) ? data.tables.recent_orders : [];
  const topProducts = Array.isArray(data?.tables?.top_products) ? data.tables.top_products : [];
  const revData = (data?.charts?.revenue_by_day || []).map(r => ({ ...r, revenue: Number(r.revenue || 0), name: r.date }));

  const completionRate = s.total_orders > 0 ? Math.round((s.completed_orders / s.total_orders) * 100) : 0;

  const stats = [
    { key: 'revenue',    label: 'Doanh thu',        value: `${fmtCurrency(s.total_revenue)} đ`,   accent: '#2563eb', icon: 'ri-line-chart-line' },
    { key: 'orders',     label: 'Tổng đơn',          value: s.total_orders || 0,                   accent: '#0ea5e9', icon: 'ri-shopping-bag-3-line' },
    { key: 'completed',  label: 'Đơn hoàn tất',      value: `${s.completed_orders || 0} (${completionRate}%)`, accent: '#10b981', icon: 'ri-checkbox-circle-line' },
    { key: 'pending',    label: 'Đơn đang chờ',      value: s.pending_orders || 0,                 accent: '#f59e0b', icon: 'ri-time-line' },
    { key: 'customers',  label: 'Khách hàng',        value: s.total_customers || 0,                accent: '#7c3aed', icon: 'ri-team-line' },
    { key: 'avgValue',   label: 'Giá TB/đơn',       value: `${fmtCurrency(s.avg_order_value)} đ`, accent: '#059669', icon: 'ri-calculator-line' },
  ];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#94a3b8' }}>
      <i className="ri-loader-4-line" style={{ fontSize: 28, marginRight: 12, animation: 'spin 1s linear infinite' }} />Đang tải...
    </div>
  );

  return (
    <div style={{ padding: 20, minHeight: '100vh', background: 'linear-gradient(160deg, #eff6ff, #f0f4ff 40%, #fafbff)', opacity: mounted ? 1 : 0, transition: 'opacity 320ms' }}>
      <style>{`@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }`}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#0f172a' }}>Dashboard Sales — {user.full_name || 'Tôi'}</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>{data?.period || 'Tất cả'}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['day', 'month', 'quarter'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid #dbe3ee', background: period === p ? BLUE : '#fff', color: period === p ? '#fff' : '#475569', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
              {p === 'day' ? 'Ngày' : p === 'month' ? 'Tháng' : 'Quý'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14, marginBottom: 18 }}>
        {stats.map(st => (
          <div key={st.key} onMouseEnter={() => setHover(st.key)} onMouseLeave={() => setHover(null)} style={cardStyle(hover === st.key, st.accent)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: st.accent, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 18 }}>
                <i className={st.icon} />
              </div>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>{st.label}</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>{st.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14, marginBottom: 18 }}>
        <div style={cardStyle(false, BLUE)}>
          <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 800 }}>Doanh thu theo ngày</h3>
          {revData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revData} barCategoryGap={14}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e7ff" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={v => `${v/1000000}tr`} />
                <Tooltip formatter={(v) => [`${fmtCurrency(v)} đ`, 'Doanh thu']} />
                <Bar dataKey="revenue" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div>}
        </div>

        <div style={cardStyle(false, '#10b981')}>
          <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 800 }}>Sản phẩm bán chạy</h3>
          {topProducts.length === 0 ? <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div> :
            <div style={{ display: 'grid', gap: 8 }}>
              {topProducts.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e0e7ff' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{p.sku}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: '#10b981' }}>{fmtCurrency(p.total_revenue)} đ</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{p.total_qty || 0} SL</div>
                  </div>
                </div>
              ))}
            </div>
          }
        </div>
      </div>

      <div style={cardStyle(false, '#7c3aed')}>
        <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800 }}>Đơn hàng gần đây</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ fontSize: 12, color: '#94a3b8', borderBottom: '1px solid #e0e7ff' }}>
            <th style={{ padding: '8px 0', textAlign: 'left' }}>Mã đơn</th>
            <th style={{ padding: '8px 0', textAlign: 'left' }}>Khách hàng</th>
            <th style={{ padding: '8px 0', textAlign: 'left' }}>Trạng thái</th>
            <th style={{ padding: '8px 0', textAlign: 'left' }}>Ngày tạo</th>
          </tr></thead>
          <tbody>
            {recentOrders.length === 0 ? <tr><td colSpan="4" style={{ padding: 16, textAlign: 'center', color: '#94a3b8' }}>Chưa có đơn hàng</td></tr> :
              recentOrders.map(o => (
                <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '9px 0', fontWeight: 700, color: BLUE }}>{o.order_no}</td>
                  <td style={{ fontSize: 13 }}>{o.customer_name || '—'}</td>
                  <td style={{ fontSize: 12, padding: '9px 0' }}>
                    <span style={{ padding: '3px 8px', borderRadius: 999, background: o.status === 'completed' ? '#d1fae5' : '#fef3c7', color: o.status === 'completed' ? '#047857' : '#92400e', fontWeight: 700 }}>{o.status}</span>
                  </td>
                  <td style={{ fontSize: 12, color: '#94a3b8' }}>{fmtDate(o.created_at)}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
