import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const fmtNum = (v) => new Intl.NumberFormat('vi-VN').format(Number(v || 0));
const PIE_COLORS = ['#2563eb', '#0ea5e9', '#10b981', '#7c3aed', '#f59e0b', '#ef4444'];

function cardStyle(hovered, accent = '#2563eb') {
  return {
    background: '#fff', borderRadius: 20, padding: '18px 20px',
    border: hovered ? `1.5px solid ${accent}55` : '1px solid #e0e7ff',
    boxShadow: hovered ? `0 18px 44px ${accent}18` : '0 10px 30px rgba(15,23,42,0.05)',
    transition: 'all 220ms ease', transform: hovered ? 'translateY(-5px)' : 'translateY(0)',
  };
}

export default function LogisticsDashboardPage() {
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
        const res = await fetch(`/api/reports/dashboard?period=${period}`, { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } });
        const json = await res.json();
        setData(json);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [period]);

  const s = data?.summary || {};
  const recentDeliveries = Array.isArray(data?.tables?.recent_deliveries) ? data.tables.recent_deliveries : [];
  const returnList = Array.isArray(data?.tables?.return_list) ? data.tables.return_list : [];
  const compList = Array.isArray(data?.tables?.compensation_list) ? data.tables.compensation_list : [];
  const delData = (data?.charts?.deliveries_by_day || []).map(r => ({ ...r, deliveries: Number(r.deliveries || 0), name: r.date }));
  const returnReasons = Array.isArray(data?.charts?.return_reasons) ? data.charts.return_reasons : [];
  const carrierStats = Array.isArray(data?.tables?.carrier_stats) ? data.tables.carrier_stats : [];

  const stats = [
    { key: 'delivered',     label: 'Đơn đã giao',    value: s.completed_deliveries || 0,         accent: '#10b981', icon: 'ri-checkbox-circle-line' },
    { key: 'totalDel',      label: 'Tổng vận chuyển', value: s.total_deliveries || 0,              accent: '#2563eb', icon: 'ri-truck-line' },
    { key: 'pendingDel',    label: 'Đang vận chuyển', value: s.pending_deliveries || 0,            accent: '#f59e0b', icon: 'ri-navigation-line' },
    { key: 'returns',       label: 'Yêu cầu hoàn',   value: s.return_requests || 0,              accent: '#f97316', icon: 'ri-arrow-go-back-line' },
    { key: 'compPending',   label: 'Phiếu bù chờ',   value: s.compensation_pending || 0,          accent: '#ef4444', icon: 'ri-file-list-3-line' },
    { key: 'onTime',        label: 'Đúng hạn',       value: `${s.on_time_rate || 0}%`,            accent: '#059669', icon: 'ri-time-line' },
  ];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#94a3b8' }}>
      <i className="ri-loader-4-line" style={{ fontSize: 28, marginRight: 12, animation: 'spin 1s linear infinite' }} />Đang tải...
    </div>
  );

  return (
    <div style={{ padding: 20, minHeight: '100vh', background: 'linear-gradient(160deg, #fff7ed, #eff6ff 40%, #fafbff)', opacity: mounted ? 1 : 0, transition: 'opacity 320ms' }}>
      <style>{`@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }`}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#0f172a' }}>Dashboard Logistics</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>{data?.period || 'Tất cả'}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['day', 'month', 'quarter'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid #dbe3ee', background: period === p ? '#2563eb' : '#fff', color: period === p ? '#fff' : '#475569', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
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
            <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>{st.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
        <div style={cardStyle(false, '#2563eb')}>
          <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 800 }}>Giao hàng theo ngày</h3>
          {delData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={delData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e7ff" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
                <Tooltip /><Bar dataKey="deliveries" fill="#2563eb" radius={[8, 8, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          ) : <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div>}
        </div>

        <div style={cardStyle(false, '#f97316')}>
          <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 800 }}>Lý do hoàn hàng</h3>
          {returnReasons.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={returnReasons} dataKey="count" nameKey="customer_reject_reason" innerRadius={60} outerRadius={100} paddingAngle={3}>
                  {returnReasons.map((entry, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={cardStyle(false, '#ef4444')}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800 }}>Yêu cầu hoàn hàng</h3>
          {returnList.length === 0 ? <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8' }}>Không có yêu cầu hoàn</div> :
            <div style={{ display: 'grid', gap: 8 }}>
              {returnList.slice(0, 6).map(r => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 12, background: '#fef2f2', border: '1px solid #fecaca', fontSize: 13 }}>
                  <div><div style={{ fontWeight: 700 }}>{r.order_no}</div><div style={{ fontSize: 11, color: '#94a3b8' }}>{r.customer_name || '—'}</div></div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ padding: '3px 8px', borderRadius: 999, background: '#fee2e2', color: '#b91c1c', fontWeight: 700, fontSize: 11 }}>{r.status}</span>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{r.logistics_action || r.customer_reject_reason || '—'}</div>
                  </div>
                </div>
              ))}
            </div>
          }
        </div>

        <div style={cardStyle(false, '#7c3aed')}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800 }}>Phiếu bù chờ xử lý</h3>
          {compList.length === 0 ? <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8' }}>Không có phiếu bù chờ</div> :
            <div style={{ display: 'grid', gap: 8 }}>
              {compList.slice(0, 6).map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e0e7ff', fontSize: 13 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#7c3aed' }}>{c.compensation_no}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{c.order_no} • {c.customer_name || '—'}</div>
                  </div>
                  <span style={{ padding: '3px 8px', borderRadius: 999, background: '#fef3c7', color: '#92400e', fontWeight: 700, fontSize: 11 }}>{c.defect_type}</span>
                </div>
              ))}
            </div>
          }
        </div>
      </div>
    </div>
  );
}
