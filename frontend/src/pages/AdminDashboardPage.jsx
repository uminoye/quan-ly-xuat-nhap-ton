import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import { exportAdminDashboard } from '../utils/excelExport';

const BLUE = '#2563eb';
const PIE_COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b'];

const fmtCurrency = (v) => new Intl.NumberFormat('vi-VN').format(Number(v || 0));
const fmtDate = (v) => { if (!v) return '--'; const d = new Date(v); return Number.isNaN(d.getTime()) ? '--' : d.toLocaleDateString('vi-VN'); };
const fmtMonth = (v) => {
  if (!v) return '--';
  const m = String(v).slice(0, 7);
  const d = new Date(`${m}-01`);
  return Number.isNaN(d.getTime()) ? m : d.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' });
};

function cardStyle(hovered, accent = BLUE) {
  return {
    background: '#fff',
    borderRadius: 20,
    padding: '18px 20px',
    border: hovered ? `1.5px solid ${accent}55` : '1px solid #e0e7ff',
    boxShadow: hovered ? `0 18px 44px ${accent}18` : '0 10px 30px rgba(15,23,42,0.05)',
    transition: 'all 220ms ease',
    transform: hovered ? 'translateY(-5px)' : 'translateY(0)',
  };
}

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [hover, setHover] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/reports/dashboard?period=${period}`);
        setData(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [period]);

  const s = data?.summary || {};
  const recentOrders = Array.isArray(data?.tables?.recent_orders) ? data.tables.recent_orders : [];
  const topProducts = Array.isArray(data?.tables?.top_products) ? data.tables.top_products : [];
  const returnStats = Array.isArray(data?.tables?.return_stats) ? data.tables.return_stats : [];
  const whUtil = Array.isArray(data?.tables?.warehouse_utilization) ? data.tables.warehouse_utilization : [];

  const revData = (data?.charts?.revenue_by_day || []).map(r => ({ ...r, value: Number(r.revenue || 0), name: r.date }));
  const ordData = (data?.charts?.orders_by_day || []).map(r => ({ ...r, orders: Number(r.orders || 0), name: r.date }));

  const stats = [
    { key: 'revenue',    label: 'Tổng doanh thu',   value: `${fmtCurrency(s.total_revenue)} đ`,   accent: '#2563eb', icon: 'ri-money-cny-circle-line' },
    { key: 'orders',     label: 'Đơn đã xử lý',    value: `${s.completed_orders || 0} / ${s.total_orders || 0}`, accent: '#10b981', icon: 'ri-shopping-bag-3-line' },
    { key: 'pending',    label: 'Đơn đang chờ',    value: s.pending_orders || 0,                  accent: '#f59e0b', icon: 'ri-time-line' },
    { key: 'lowStock',   label: 'Tồn kho thấp',    value: s.low_stock_count || 0,                 accent: '#ef4444', icon: 'ri-alert-line' },
    { key: 'receipts',   label: 'Phiếu nhập',      value: s.total_receipts || 0,                  accent: '#0ea5e9', icon: 'ri-inbox-archive-line' },
    { key: 'outbounds',  label: 'Phiếu xuất',      value: s.total_outbounds || 0,                 accent: '#7c3aed', icon: 'ri-send-plane-line' },
    { key: 'returns',    label: 'Yêu cầu hoàn',    value: s.return_pending || 0,                  accent: '#f97316', icon: 'ri-arrow-go-back-line' },
    { key: 'users',      label: 'Người dùng',      value: s.total_users || 0,                     accent: '#059669', icon: 'ri-team-line' },
  ];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#94a3b8' }}>
      <i className="ri-loader-4-line" style={{ fontSize: 28, marginRight: 12, animation: 'spin 1s linear infinite' }} />Đang tải...
    </div>
  );

  return (
    <div style={{ padding: 20, minHeight: '100vh', background: 'linear-gradient(160deg, #eff6ff, #f0f4ff 40%, #fafbff)', opacity: mounted ? 1 : 0, transition: 'opacity 320ms' }}>
      <style>{`@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#0f172a' }}>Dashboard Tổng quan</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>{data?.period || 'Tất cả'}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['day', 'week', 'month', 'quarter'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid #dbe3ee', background: period === p ? BLUE : '#fff', color: period === p ? '#fff' : '#475569', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
              {p === 'day' ? 'Ngày' : p === 'week' ? 'Tuần' : p === 'month' ? 'Tháng' : 'Quý'}
            </button>
          ))}
          <button onClick={() => data && exportAdminDashboard(data)}
            style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid #dbe3ee', background: '#fff', color: BLUE, fontWeight: 700, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}>
            <i className="ri-file-excel-2-line" style={{ fontSize: 15 }} />Xuất Excel
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14, marginBottom: 18 }}>
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

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14, marginBottom: 18 }}>
        <div style={cardStyle(false, BLUE)}>
          <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 800 }}>Doanh thu & Đơn hàng theo ngày</h3>
          {revData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revData} barCategoryGap={14}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e7ff" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={v => `${v/1000000}tr`} />
                <Tooltip formatter={(v) => [`${fmtCurrency(v)} đ`, 'Doanh thu']} />
                <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div>}
        </div>

        <div style={cardStyle(false, '#7c3aed')}>
          <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 800 }}>Phân bổ tồn kho</h3>
          {whUtil.length > 0 ? (() => {
            const total = whUtil.reduce((s, w) => s + Number(w.total_qty), 0);
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {whUtil.map((w, i) => {
                  const pct = total > 0 ? Math.round(Number(w.total_qty) / total * 100) : 0;
                  return (
                    <div key={w.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <span style={{ width: 9, height: 9, borderRadius: 3, background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0, display: 'inline-block' }} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{w.name}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                          <span style={{ fontSize: 12, color: '#94a3b8' }}>{Number(w.product_count).toLocaleString()} SKU</span>
                          <span style={{ fontSize: 14, fontWeight: 800, color: '#7c3aed', minWidth: 50, textAlign: 'right' }}>
                            {Number(w.total_qty).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div style={{ background: '#f1f5f9', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                        <div style={{ background: PIE_COLORS[i % PIE_COLORS.length], borderRadius: 6, height: '100%', width: `${pct}%`, transition: 'width 600ms ease' }} />
                      </div>
                      <div style={{ textAlign: 'right', fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{pct}%</div>
                    </div>
                  );
                })}
                <div style={{ borderTop: '1px solid #e0e7ff', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 14, color: '#334155' }}>
                  <span>Tổng cộng</span>
                  <span style={{ color: '#7c3aed' }}>{total.toLocaleString()} sản phẩm</span>
                </div>
              </div>
            );
          })() : <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div>}
        </div>
      </div>

      {/* Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={cardStyle(false, BLUE)}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800 }}>Đơn hàng gần nhất</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ fontSize: 12, color: '#94a3b8', borderBottom: '1px solid #e0e7ff' }}>
              <th style={{ padding: '8px 0', textAlign: 'left' }}>Mã đơn</th>
              <th style={{ padding: '8px 0', textAlign: 'left' }}>Khách hàng</th>
              <th style={{ padding: '8px 0', textAlign: 'left' }}>Trạng thái</th>
              <th style={{ padding: '8px 0', textAlign: 'left' }}>Ngày</th>
            </tr></thead>
            <tbody>
              {recentOrders.length === 0 ? <tr><td colSpan="4" style={{ padding: 16, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</td></tr> :
                recentOrders.map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '9px 0', fontWeight: 700, color: '#2563eb' }}>{o.order_no}</td>
                    <td style={{ fontSize: 13, color: '#334155' }}>{o.customer_name || '—'}</td>
                    <td style={{ fontSize: 12, padding: '9px 0' }}>
                      <span style={{ padding: '3px 8px', borderRadius: 999, background: o.status === 'completed' ? '#d1fae5' : o.status === 'pending' ? '#fef3c7' : '#e0e7ff', color: o.status === 'completed' ? '#047857' : o.status === 'pending' ? '#92400e' : '#334155', fontWeight: 700 }}>
                        {o.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: '#94a3b8' }}>{fmtDate(o.created_at)}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>

        <div style={cardStyle(false, '#7c3aed')}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800 }}>Sản phẩm bán chạy</h3>
          {topProducts.length === 0 ? <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div> :
            <div style={{ display: 'grid', gap: 8 }}>
              {topProducts.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e0e7ff' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{p.sku}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: '#2563eb', fontSize: 14 }}>{fmtCurrency(p.total_revenue)} đ</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{p.total_qty || 0} SL</div>
                  </div>
                </div>
              ))}
            </div>
          }
        </div>
      </div>
    </div>
  );
}
