import { useEffect, useMemo, useState } from 'react';
import {
  Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import api from '../services/api';

const BLUE   = '#3b82f6';
const RED    = '#ef4444';
const ORANGE = '#f59e0b';
const INDIGO = '#6366f1';

const fmtDate = (v) => { if (!v) return '--'; const d = new Date(v); return Number.isNaN(d.getTime()) ? '--' : d.toLocaleDateString('vi-VN'); };

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

export default function WarehouseDashboardPage() {
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
  const lowStock = Array.isArray(data?.tables?.low_stock_products) ? data.tables.low_stock_products : [];
  const recentReceipts = Array.isArray(data?.tables?.recent_receipts) ? data.tables.recent_receipts : [];
  const recentOutbounds = Array.isArray(data?.tables?.recent_outbounds) ? data.tables.recent_outbounds : [];

  const recData = (data?.charts?.receipts_by_day || []).map(r => ({ name: fmtDate(r.date), receipts: Number(r.receipts || 0) }));
  const outData = (data?.charts?.outbounds_by_day || []).map(r => ({ name: fmtDate(r.date), outbounds: Number(r.outbounds || 0) }));

  const dayLabels = useMemo(() => {
    const map = new Map();
    recData.forEach(r => map.set(r.name, { name: r.name, receipts: r.receipts, outbounds: 0 }));
    outData.forEach(r => {
      if (!map.has(r.name)) map.set(r.name, { name: r.name, receipts: 0, outbounds: r.outbounds });
      else map.get(r.name).outbounds = r.outbounds;
    });
    return Array.from(map.values()).sort((a, b) => {
      const da = a.name.split('/').reverse().join('-');
      const db = b.name.split('/').reverse().join('-');
      return da.localeCompare(db);
    });
  }, [recData, outData]);

  if (loading && !data) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc', color: '#94a3b8' }}>
      <i className="ri-loader-4-line" style={{ fontSize: 32, marginRight: 12, animation: 'spin 1s linear infinite' }} />
      <span style={{ fontSize: 16, fontWeight: 600 }}>Đang tổng hợp dữ liệu kho...</span>
      <style>{`@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ padding: '32px 40px', minHeight: '100vh', background: '#f8fafc', opacity: mounted ? 1 : 0, transition: 'opacity 400ms ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em' }}>Warehouse Dashboard</h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 14 }}>Quản lý lưu lượng nhập xuất và tồn kho</p>
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
        <KPI label="Tổng tồn kho" value={Number(s.total_stock || 0).toLocaleString('vi-VN')} sub={`${s.total_product_types || 0} mã sản phẩm`} accent={BLUE} icon="ri-archive-fill" />
        <KPI label="Cảnh báo sắp hết" value={s.low_stock_count || 0} sub="Sản phẩm dưới định mức" accent={RED} icon="ri-alert-fill" />
        <KPI label="Chờ nhập kho" value={s.pending_receipts || 0} sub={`${s.total_receipts || 0} phiếu nhập trong kỳ`} accent={ORANGE} icon="ri-download-2-fill" />
        <KPI label="Chờ xuất kho" value={s.pending_outbounds || 0} sub={`${s.total_outbounds || 0} phiếu xuất trong kỳ`} accent={INDIGO} icon="ri-upload-2-fill" />
      </div>

      {/* Main Chart */}
      <div style={{ marginBottom: 24 }}>
        <ChartCard title="Lưu lượng Nhập / Xuất" subtitle="So sánh số lượng phiếu nhập và phiếu xuất theo thời gian">
          {dayLabels.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={dayLabels} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradRec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={BLUE} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={BLUE} stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="gradOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={INDIGO} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={INDIGO} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '12px 16px' }}
                  labelStyle={{ fontWeight: 700, color: '#0f172a', marginBottom: 4 }}
                />
                <Legend wrapperStyle={{ fontSize: 13, paddingTop: 10 }} iconType="circle" />
                <Area type="monotone" dataKey="receipts" name="Phiếu nhập" stroke={BLUE} strokeWidth={3} fill="url(#gradRec)" />
                <Area type="monotone" dataKey="outbounds" name="Phiếu xuất" stroke={INDIGO} strokeWidth={3} fill="url(#gradOut)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu trong kỳ này</div>}
        </ChartCard>
      </div>

      {/* Tables Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
        <ChartCard title="Sản phẩm dưới định mức" subtitle="Cần lên kế hoạch nhập hàng">
          {lowStock.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Không có sản phẩm nào thiếu hụt</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
                <thead>
                  <tr style={{ fontSize: 12, color: '#64748b', borderBottom: '2px solid #f1f5f9' }}>
                    <th style={{ padding: '12px 0', textAlign: 'left', fontWeight: 600 }}>Sản phẩm</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600 }}>Tồn kho</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600 }}>Định mức</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.slice(0, 6).map(p => (
                    <tr key={p.sku} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '14px 0', fontSize: 13 }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{p.sku} • {p.warehouse_name}</div>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 14, textAlign: 'center', fontWeight: 800, color: RED }}>{p.on_hand}</td>
                      <td style={{ padding: '14px 16px', fontSize: 14, textAlign: 'center', fontWeight: 600, color: '#64748b' }}>{p.min_stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ChartCard>

        <div style={{ display: 'grid', gap: 24 }}>
          <ChartCard title="Hoạt động xuất/nhập kho gần đây" subtitle="Các phiếu đang chờ xử lý hoặc vừa hoàn thành">
            <div style={{ display: 'grid', gap: 12 }}>
              {recentReceipts.slice(0, 3).map(r => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, background: '#f8fafc' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 12, background: `${BLUE}15`, color: BLUE, display: 'grid', placeItems: 'center', fontSize: 16 }}>
                    <i className="ri-download-2-line" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{r.receipt_no}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Nhập • {r.item_count} loại hàng</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: r.status === 'completed' ? GREEN : ORANGE }}>{r.status === 'completed' ? 'Hoàn thành' : 'Đang chờ'}</span>
                </div>
              ))}
              {recentOutbounds.slice(0, 3).map(o => (
                <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, background: '#f8fafc' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 12, background: `${INDIGO}15`, color: INDIGO, display: 'grid', placeItems: 'center', fontSize: 16 }}>
                    <i className="ri-upload-2-line" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{o.outbound_no}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Xuất • {o.item_count} loại hàng</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: o.status === 'completed' ? GREEN : ORANGE }}>{o.status === 'completed' ? 'Hoàn thành' : 'Đang chờ'}</span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
