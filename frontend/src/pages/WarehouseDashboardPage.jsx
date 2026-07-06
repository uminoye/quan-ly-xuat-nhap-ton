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

export default function WarehouseDashboardPage() {
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
  const whBreakdown = Array.isArray(data?.tables?.warehouse_breakdown) ? data.tables.warehouse_breakdown : [];
  const lowStock = Array.isArray(data?.tables?.low_stock_products) ? data.tables.low_stock_products : [];
  const recentReceipts = Array.isArray(data?.tables?.recent_receipts) ? data.tables.recent_receipts : [];
  const recentOutbounds = Array.isArray(data?.tables?.recent_outbounds) ? data.tables.recent_outbounds : [];
  const recData = (data?.charts?.receipts_by_day || []).map(r => ({ ...r, receipts: Number(r.receipts || 0), name: r.date }));
  const outData = (data?.charts?.outbounds_by_day || []).map(r => ({ ...r, outbounds: Number(r.outbounds || 0), name: r.date }));

  const stats = [
    { key: 'stock',    label: 'Loại SP có tồn',  value: s.total_product_types || 0,        accent: '#2563eb', icon: 'ri-box-3-line' },
    { key: 'totalQty', label: 'Tổng tồn kho',    value: fmtNum(s.total_stock),              accent: '#0ea5e9', icon: 'ri-stack-line' },
    { key: 'lowStock', label: 'Cảnh báo tồn thấp', value: s.low_stock_count || 0,            accent: '#ef4444', icon: 'ri-alert-line' },
    { key: 'receipts', label: 'Phiếu nhập',       value: s.total_receipts || 0,              accent: '#10b981', icon: 'ri-inbox-archive-line' },
    { key: 'outbounds',label: 'Phiếu xuất',       value: s.total_outbounds || 0,             accent: '#7c3aed', icon: 'ri-send-plane-line' },
    { key: 'pendingRec',label:'Chờ nhập',          value: s.pending_receipts || 0,            accent: '#f59e0b', icon: 'ri-time-line' },
    { key: 'pendingOut',label:'Chờ xuất',          value: s.pending_outbounds || 0,           accent: '#f97316', icon: 'ri-truck-line' },
    { key: 'completed',label: 'Hoàn tất',         value: s.completed_receipts || 0,          accent: '#059669', icon: 'ri-check-line' },
  ];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#94a3b8' }}>
      <i className="ri-loader-4-line" style={{ fontSize: 28, marginRight: 12, animation: 'spin 1s linear infinite' }} />Đang tải...
    </div>
  );

  return (
    <div style={{ padding: 20, minHeight: '100vh', background: 'linear-gradient(160deg, #f0fdf4, #f0f9ff 40%, #fafbff)', opacity: mounted ? 1 : 0, transition: 'opacity 320ms' }}>
      <style>{`@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }`}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#0f172a' }}>Dashboard Kho</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>{data?.period || 'Tất cả'}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['day', 'week', 'month', 'quarter'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid #dbe3ee', background: period === p ? '#2563eb' : '#fff', color: period === p ? '#fff' : '#475569', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
              {p === 'day' ? 'Ngày' : p === 'week' ? 'Tuần' : p === 'month' ? 'Tháng' : 'Quý'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14, marginBottom: 18 }}>
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

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
        <div style={cardStyle(false, '#10b981')}>
          <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 800 }}>Nhập kho theo ngày</h3>
          {recData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={recData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e7ff" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
                <Tooltip /><Bar dataKey="receipts" fill="#10b981" radius={[8, 8, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          ) : <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div>}
        </div>
        <div style={cardStyle(false, '#7c3aed')}>
          <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 800 }}>Xuất kho theo ngày</h3>
          {outData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={outData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e7ff" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
                <Tooltip /><Bar dataKey="outbounds" fill="#7c3aed" radius={[8, 8, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          ) : <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu</div>}
        </div>
      </div>

      {/* Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={cardStyle(false, '#ef4444')}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800 }}>Tồn kho thấp</h3>
          {lowStock.length === 0 ? <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8' }}>Kho đủ hàng</div> :
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ fontSize: 12, color: '#94a3b8', borderBottom: '1px solid #e0e7ff' }}>
                <th style={{ padding: '6px 0', textAlign: 'left' }}>SKU</th><th style={{ padding: '6px 0' }}>Tồn</th><th style={{ padding: '6px 0' }}>Min</th><th style={{ padding: '6px 0', textAlign: 'left' }}>Kho</th>
              </tr></thead>
              <tbody>{lowStock.map((p, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '7px 0', fontWeight: 700, fontSize: 13 }}>{p.sku}</td>
                  <td style={{ padding: '7px 0', color: '#ef4444', fontWeight: 800, textAlign: 'center' }}>{p.on_hand || 0}</td>
                  <td style={{ padding: '7px 0', color: '#94a3b8', textAlign: 'center' }}>{p.min_stock}</td>
                  <td style={{ padding: '7px 0', fontSize: 12, color: '#64748b' }}>{p.warehouse_name || '—'}</td>
                </tr>
              ))}</tbody>
            </table>
          }
        </div>

        <div style={cardStyle(false, '#2563eb')}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800 }}>Hoạt động gần đây</h3>
          <div style={{ display: 'grid', gap: 6 }}>
            {recentReceipts.length === 0 && recentOutbounds.length === 0 ? (
              <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8' }}>Chưa có hoạt động</div>
            ) : [...recentReceipts.map(r => ({ ...r, type: 'Nhập' })), ...recentOutbounds.map(r => ({ ...r, type: 'Xuất' }))].slice(0, 8).map((act, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e0e7ff', fontSize: 13 }}>
                <div>
                  <span style={{ fontWeight: 700, color: act.type === 'Nhập' ? '#10b981' : '#7c3aed', marginRight: 8 }}>{act.type}</span>
                  <span>{act.receipt_no || act.outbound_no || '—'}</span>
                </div>
                <span style={{ color: '#94a3b8', fontSize: 12 }}>{fmtDate(act.receipt_date || act.export_date)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
