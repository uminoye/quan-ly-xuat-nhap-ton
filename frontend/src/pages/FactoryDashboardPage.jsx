import { useEffect, useState } from 'react';
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import api from '../services/api';

const ROSE   = '#e11d48';
const INDIGO = '#4f46e5';
const ORANGE = '#f59e0b';
const GREEN  = '#10b981';

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

export default function FactoryDashboardPage() {
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
  const pendingReceipts = Array.isArray(data?.tables?.pending_receipts) ? data.tables.pending_receipts : [];
  const pendingComps = Array.isArray(data?.tables?.pending_compensations) ? data.tables.pending_compensations : [];

  const recData = (data?.charts?.receipts_by_day || []).map(r => ({ name: fmtDate(r.date), receipts: Number(r.receipts || 0) }));

  if (loading && !data) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc', color: '#94a3b8' }}>
      <i className="ri-loader-4-line" style={{ fontSize: 32, marginRight: 12, animation: 'spin 1s linear infinite' }} />
      <span style={{ fontSize: 16, fontWeight: 600 }}>Đang tổng hợp dữ liệu nhà máy...</span>
      <style>{`@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ padding: '32px 40px', minHeight: '100vh', background: '#f8fafc', opacity: mounted ? 1 : 0, transition: 'opacity 400ms ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em' }}>Factory Dashboard</h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 14 }}>Quản lý sản xuất và tiến độ xử lý hàng bù</p>
        </div>
        <div style={{ display: 'flex', gap: 4, background: '#fff', padding: 6, borderRadius: 14, boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              style={{
                padding: '10px 18px', borderRadius: 10, border: 'none',
                background: period === p.value ? INDIGO : 'transparent',
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
        <KPI label="Phiếu Nhập Chờ Duyệt" value={s.pending_receipts || 0} sub={`Trong tổng số ${s.total_receipts || 0} phiếu nhập kho`} accent={ORANGE} icon="ri-time-line" />
        <KPI label="Phiếu Nhập Hoàn Thành" value={s.completed_receipts || 0} sub="Sản phẩm đã được nhập thành công" accent={GREEN} icon="ri-checkbox-circle-fill" />
        <KPI label="Yêu Cầu Bù Lỗi (Pending)" value={s.pending_compensations || 0} sub={`Trong tổng số ${s.total_compensations || 0} yêu cầu bù lỗi`} accent={ROSE} icon="ri-tools-fill" />
        <KPI label="Yêu Cầu Đã Duyệt" value={s.approved_compensations || 0} sub="Đã chốt phương án bù hàng" accent={INDIGO} icon="ri-check-double-fill" />
      </div>

      {/* Main Chart */}
      <div style={{ marginBottom: 24 }}>
        <ChartCard title="Tiến độ sản xuất (Phiếu nhập mới)" subtitle="Số lượng phiếu nhập kho hàng hóa mới theo thời gian">
          {recData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={recData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradRecF" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={INDIGO} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={INDIGO} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v) => [v, 'Phiếu nhập']}
                  contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '12px 16px' }}
                  labelStyle={{ fontWeight: 700, color: '#0f172a', marginBottom: 4 }}
                />
                <Area type="monotone" dataKey="receipts" stroke={INDIGO} strokeWidth={3} fill="url(#gradRecF)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu trong kỳ này</div>}
        </ChartCard>
      </div>

      {/* Tables Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <ChartCard title="Phiếu nhập chờ duyệt" subtitle="Danh sách hàng hóa cần kho duyệt">
          {pendingReceipts.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Không có phiếu nhập chờ duyệt</div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {pendingReceipts.slice(0, 6).map((r) => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 12, borderRadius: 16, background: '#fffbeb', border: '1px solid #fef3c7' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 12, background: '#fde68a', color: '#d97706', display: 'grid', placeItems: 'center', fontSize: 16, flexShrink: 0 }}>
                    <i className="ri-inbox-archive-line" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#92400e' }}>{r.receipt_no}</div>
                    <div style={{ fontSize: 12, color: '#b45309' }}>Kho: {r.warehouse_name || 'Chưa định kho'}</div>
                    <div style={{ fontSize: 11, color: '#d97706', marginTop: 4 }}>Số mặt hàng: {r.item_count}</div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#b45309', padding: '4px 10px', background: '#fff', borderRadius: 999 }}>
                    Chờ duyệt
                  </div>
                </div>
              ))}
            </div>
          )}
        </ChartCard>

        <ChartCard title="Yêu cầu bù lỗi chờ xử lý" subtitle="Các sản phẩm lỗi từ khách hàng cần bù">
          {pendingComps.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Không có yêu cầu bù lỗi</div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {pendingComps.slice(0, 6).map((c) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 12, borderRadius: 16, background: '#fef2f2', border: '1px solid #fee2e2' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 12, background: '#fecaca', color: ROSE, display: 'grid', placeItems: 'center', fontSize: 16, flexShrink: 0 }}>
                    <i className="ri-tools-fill" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: ROSE }}>Đơn: {c.order_no}</div>
                    <div style={{ fontSize: 12, color: '#b91c1c' }}>Loại lỗi: {c.defect_type || 'Khác'}</div>
                    <div style={{ fontSize: 11, color: '#f43f5e', marginTop: 4 }}>Bởi: {c.customer_name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: '#fff', color: ROSE, display: 'inline-block' }}>
                      Chờ bù hàng
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
