import { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../services/api';
import { getDashboardStats } from '../services/reportService';
import { getImports } from '../services/receiptService';
import { getExports } from '../services/outboundService';

const statIcons = {
  waitOutbound: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: '22px', height: '22px' }}>
      <path d="M4 8h16l-1.2 6.5A2 2 0 0 1 16.83 16H7.17a2 2 0 0 1-1.97-1.5L4 8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M7 4h2l1 4M12 4h2l1 4M17 4h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  lowStock: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: '22px', height: '22px' }}>
      <path d="m10.29 4.86-7.43 12.8A2 2 0 0 0 4.58 21h14.84a2 2 0 0 0 1.72-3.34l-7.43-12.8a2 2 0 0 0-3.44 0Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 9v4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M12 17h.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),
  product: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: '22px', height: '22px' }}>
      <path d="M4 7.5 12 4l8 3.5-8 3.5L4 7.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M4 7.5V16.5L12 20l8-3.5V7.5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 11v9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  stock: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: '22px', height: '22px' }}>
      <path d="M5 8.5 12 5l7 3.5-7 3.5-7-3.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M5 8.5V15.5L12 19l7-3.5V8.5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 10.5v7M15 10.5v7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
};

const PIE_COLORS = ['#2563eb', '#0ea5e9', '#10b981', '#7c3aed', '#f59e0b', '#ef4444'];
const formatNumber = (value) => new Intl.NumberFormat('vi-VN').format(Number(value || 0));
const formatDate = (value) => {
  if (!value) return '--';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '--' : date.toLocaleDateString('vi-VN');
};
const formatMonthLabel = (value) => {
  if (!value) return '--';
  const date = new Date(`${value}-01`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('vi-VN', { month: 'short', year: 'numeric' }).format(date);
};

function parseStockBreakdown(breakdown = '') {
  return String(breakdown)
    .split(' | ')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [warehouseName, qtyText] = entry.split(': ');
      return {
        warehouseName: warehouseName?.trim() || '',
        quantity: Number.parseInt(qtyText, 10) || 0,
      };
    })
    .filter((entry) => entry.warehouseName);
}

function getMinStockValue(product) {
  return Number(product?.min_stock ?? 50);
}

function isBelowMinStock(quantity, product) {
  const minStock = getMinStockValue(product);
  return Number(quantity || 0) > 0 && Number(quantity || 0) < minStock;
}

function StatCard({ title, value, desc, icon, tone, accent = '#2563eb', delay = 0 }) {
  return (
    <div
      className="warehouse-hover-card"
      style={{
        background: 'rgba(255,255,255,0.98)',
        borderRadius: 24,
        padding: 20,
        border: '1px solid rgba(226,232,240,0.95)',
        boxShadow: '0 16px 36px rgba(15, 23, 42, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        opacity: 0,
        transform: 'translateY(18px) scale(0.98)',
        animation: `whFadeIn 620ms ease ${delay}ms forwards`,
        transition: 'transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease, background 220ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-5px) scale(1.01)';
        e.currentTarget.style.boxShadow = `0 24px 54px ${accent}22`;
        e.currentTarget.style.borderColor = `${accent}55`;
        e.currentTarget.style.background = 'linear-gradient(180deg, #FFFDF7 0%, #FFFFFF 100%)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = '0 16px 36px rgba(15, 23, 42, 0.08)';
        e.currentTarget.style.borderColor = 'rgba(226,232,240,0.95)';
        e.currentTarget.style.background = 'rgba(255,255,255,0.98)';
      }}
    >
      <div style={{ width: 48, height: 48, borderRadius: 16, display: 'grid', placeItems: 'center', color: '#fff', background: tone, boxShadow: '0 10px 20px rgba(0,0,0,0.08)', transition: 'transform 220ms ease' }}>{icon}</div>
      <div>
        <div style={{ fontSize: 13, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{title}</div>
        <div style={{ fontSize: 30, lineHeight: 1.1, fontWeight: 800, color: '#0F172A', marginTop: 6 }}>{value}</div>
        {desc ? <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 6 }}>{desc}</div> : null}
      </div>
    </div>
  );
}

function SectionCard({ title, subtitle, accent = '#E2E8F0', children, action, className = '', delay = 0 }) {
  return (
    <div
      className={`warehouse-hover-card ${className}`.trim()}
      style={{
        background: 'rgba(255,255,255,0.98)',
        borderRadius: 24,
        border: '1px solid rgba(226,232,240,0.95)',
        boxShadow: '0 18px 42px rgba(15, 23, 42, 0.08)',
        padding: 20,
        opacity: 0,
        transform: 'translateY(18px) scale(0.98)',
        animation: `whFadeIn 620ms ease ${delay}ms forwards`,
        transition: 'transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease, background 220ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-5px) scale(1.005)';
        e.currentTarget.style.boxShadow = `0 26px 60px ${accent}18`;
        e.currentTarget.style.borderColor = `${accent}44`;
        e.currentTarget.style.background = 'linear-gradient(180deg, #FFFDF7 0%, #FFFFFF 100%)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = '0 18px 42px rgba(15, 23, 42, 0.08)';
        e.currentTarget.style.borderColor = 'rgba(226,232,240,0.95)';
        e.currentTarget.style.background = 'rgba(255,255,255,0.98)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', paddingBottom: 12, marginBottom: 16, borderBottom: `2px solid ${accent}` }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>{title}</div>
          {subtitle ? <div style={{ fontSize: 13, color: '#64748B', marginTop: 4, lineHeight: 1.5 }}>{subtitle}</div> : null}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ text }) {
  return <div style={{ padding: 18, textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: 16 }}>{text}</div>;
}

export default function WarehouseDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [imports, setImports] = useState([]);
  const [exports, setExports] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, ordRes, importRes, exportRes, dashboardRes] = await Promise.all([
          api.get('/products'),
          api.get('/orders'),
          getImports().catch(() => []),
          getExports().catch(() => []),
          getDashboardStats().catch(() => null),
        ]);
        setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
        setOrders(Array.isArray(ordRes.data) ? ordRes.data : []);
        setImports(Array.isArray(importRes) ? importRes : []);
        setExports(Array.isArray(exportRes) ? exportRes : []);
        setDashboardStats(dashboardRes);
      } catch (err) {
        setError(`Không thể tải dữ liệu kho. ${err?.response?.data?.message || err.message || ''}`.trim());
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const stats = useMemo(() => {
    const pendingOutbounds = orders.filter((o) => o.status === 'warehouse_processing' || o.status === 'pending');
    const lowStockProducts = products
      .filter((p) => isBelowMinStock(p.stock ?? p.total_stock ?? 0, p))
      .sort((a, b) => Number(a.stock || a.total_stock || 0) - Number(b.stock || b.total_stock || 0));
    const totalProductTypes = products.length;
    const totalPhysicalItems = products.reduce((sum, p) => sum + Number(p.stock || 0), 0);
    const avgStock = totalProductTypes ? Math.round(totalPhysicalItems / totalProductTypes) : 0;
    const topStockProducts = [...products].sort((a, b) => Number(b.stock || 0) - Number(a.stock || 0)).slice(0, 5);

    const chartData = Array.isArray(dashboardStats?.monthly_import_export)
      ? dashboardStats.monthly_import_export.map((item) => ({ name: formatMonthLabel(item.name), Nhập: Number(item.Nhập || 0), Xuất: Number(item.Xuất || 0) }))
      : [];

    const warehouseDistributionMap = products.reduce((acc, product) => {
      const price = Number(product.sale_price || product.price || 0);
      const totalQty = Number(product.total_stock ?? product.stock ?? 0);
      const breakdownRows = parseStockBreakdown(product.stock_breakdown);

      if (breakdownRows.length > 0) {
        breakdownRows.forEach((row) => {
          const name = row.warehouseName || 'Không xác định';
          const quantity = Number(row.quantity || 0);
          if (!acc[name]) acc[name] = { name, total_quantity: 0, value: 0, low_stock_products: [] };
          acc[name].total_quantity += quantity;
          acc[name].value += quantity * price;
          if (isBelowMinStock(quantity, product)) {
            acc[name].low_stock_products.push({
              id: `${product.id}-${name}`,
              sku: product.sku,
              name: product.name,
              stock: quantity,
              unit: product.unit,
              min_stock: Number(product.min_stock || 50),
            });
          }
        });
        return acc;
      }

      const fallbackName = 'Không xác định';
      if (!acc[fallbackName]) acc[fallbackName] = { name: fallbackName, total_quantity: 0, value: 0, low_stock_products: [] };
      acc[fallbackName].total_quantity += totalQty;
      acc[fallbackName].value += totalQty * price;
      if (isBelowMinStock(totalQty, product)) {
        acc[fallbackName].low_stock_products.push({
          id: `${product.id}-${fallbackName}`,
          sku: product.sku,
          name: product.name,
          stock: totalQty,
          unit: product.unit,
          min_stock: Number(product.min_stock || 50),
        });
      }
      return acc;
    }, {});

    const warehouseDistribution = Object.values(warehouseDistributionMap).sort((a, b) => b.value - a.value);
    const totalWarehouseValue = warehouseDistribution.reduce((sum, item) => sum + Number(item.value || 0), 0);
    const warehouseLowStockMap = warehouseDistribution.reduce((acc, warehouse) => {
      acc[warehouse.name] = (warehouse.low_stock_products || []).sort((a, b) => a.stock - b.stock);
      return acc;
    }, {});

    return { pendingOutbounds, lowStockProducts, totalProductTypes, totalPhysicalItems, avgStock, topStockProducts, chartData, warehouseDistribution, totalWarehouseValue, warehouseLowStockMap };
  }, [dashboardStats, orders, products]);

  if (loading) return <div style={{ padding: 24, color: '#64748B' }}>Đang nạp dữ liệu kho...</div>;
  if (error) return <div style={{ padding: 24, color: '#B91C1C', background: '#FEF2F2', borderRadius: 16 }}>{error}</div>;

  return (
    <div style={{ minHeight: '100vh', padding: 24, background: 'radial-gradient(circle at top left, rgba(59,130,246,0.12), transparent 28%), radial-gradient(circle at top right, rgba(16,185,129,0.12), transparent 24%), linear-gradient(180deg, #FFF7ED 0%, #F8FAFC 28%, #EEF4FB 100%)' }}>
      <style>{`
        @keyframes whFadeIn {
          from { opacity: 0; transform: translateY(18px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes whPageFadeIn {
          from { opacity: 0; transform: scale(0.985); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <div style={{ maxWidth: 1440, margin: '0 auto', opacity: mounted ? 1 : 0, transform: mounted ? 'scale(1)' : 'scale(0.985)', animation: 'whPageFadeIn 520ms ease forwards' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap', marginBottom: 20 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 999, background: '#ECFDF5', color: '#059669', fontWeight: 700, fontSize: 12, marginBottom: 10 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: '#10B981' }} />
              Dashboard Kho
            </div>
            <h2 style={{ margin: 0, fontSize: 32, color: '#0F172A', letterSpacing: '-0.03em' }}>Tổng quan kho hàng</h2>
            <p style={{ color: '#64748B', margin: '8px 0 0', maxWidth: 760 }}>Một màn hình gọn gàng, ưu tiên thông tin quan trọng trước: đơn chờ xuất, tồn kho thấp, phân bổ giá trị và các thống kê cần hành động ngay.</p>
          </div>
          <div style={{ display: 'grid', gap: 4, textAlign: 'right', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 18, padding: '12px 14px', boxShadow: '0 10px 24px rgba(15,23,42,0.06)' }}>
            <span style={{ color: '#94A3B8', fontSize: 12 }}>Dữ liệu tải từ hệ thống</span>
            <strong style={{ color: '#0F172A' }}>{new Date().toLocaleString('vi-VN')}</strong>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16, marginBottom: 20 }}>
          <StatCard delay={0} title="Chờ xuất kho" value={`${stats.pendingOutbounds.length} đơn`} desc="Đơn cần soạn hàng và đóng gói" icon={statIcons.waitOutbound} tone="linear-gradient(135deg, #F59E0B, #D97706)" accent="#F59E0B" />
          <StatCard delay={70} title="Sắp cạn kho" value={`${stats.lowStockProducts.length} mã`} desc="Tồn dưới min_stock của từng sản phẩm" icon={statIcons.lowStock} tone="linear-gradient(135deg, #EF4444, #DC2626)" accent="#EF4444" />
          <StatCard delay={140} title="Mã sản phẩm" value={stats.totalProductTypes} desc="Tổng số mặt hàng đang quản lý" icon={statIcons.product} tone="linear-gradient(135deg, #3B82F6, #2563EB)" accent="#3B82F6" />
          <StatCard delay={210} title="Tổng tồn vật lý" value={formatNumber(stats.totalPhysicalItems)} desc={`Trung bình ${stats.avgStock} / mã`} icon={statIcons.stock} tone="linear-gradient(135deg, #10B981, #059669)" accent="#10B981" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: 16, marginBottom: 16, alignItems: 'stretch' }}>
          <SectionCard delay={280} title="Biểu đồ nhập / xuất kho" subtitle="Dữ liệu đồng bộ từ báo cáo tổng hợp của Admin Dashboard" accent="#3B82F6">
            <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', gap: 14, minHeight: 520 }}>
              <div style={{ minHeight: 240 }}>
                {stats.chartData.length === 0 ? (
                  <EmptyState text="Chưa có dữ liệu biểu đồ nhập xuất từ dashboard." />
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={stats.chartData} barCategoryGap={18} margin={{ top: 8, right: 6, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} width={34} />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="Nhập" fill="#10B981" radius={[10, 10, 0, 0]} />
                      <Bar dataKey="Xuất" fill="#3B82F6" radius={[10, 10, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
                  <strong style={{ color: '#0F172A' }}>Tổng hợp tháng gần nhất</strong>
                  <span style={{ fontSize: 12, color: '#64748B' }}>{stats.chartData.length} tháng</span>
                </div>
                {stats.chartData.slice(-4).map((item) => (
                  <div key={item.name} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, alignItems: 'center', padding: '10px 12px', borderRadius: 14, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontWeight: 700, color: '#0F172A' }}>{item.name}</div>
                    <div style={{ color: '#059669', fontWeight: 800 }}>Nhập {formatNumber(item.Nhập)}</div>
                    <div style={{ color: '#2563EB', fontWeight: 800 }}>Xuất {formatNumber(item.Xuất)}</div>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>

          <SectionCard
            delay={340}
            title="Phân bổ giá trị theo kho"
            subtitle="Biểu đồ donut và danh sách tỷ trọng giá trị tồn kho giữa các kho"
            accent="#8B5CF6"
            action={<span style={{ padding: '8px 10px', borderRadius: 999, background: '#EEF2FF', color: '#4338CA', fontSize: 12, fontWeight: 700 }}>{stats.warehouseDistribution.length} kho</span>}
          >
            {stats.warehouseDistribution.length === 0 ? (
              <EmptyState text="Chưa có dữ liệu phân bổ giá trị theo kho." />
            ) : (
              <>
                <div style={{ display: 'grid', placeItems: 'center', padding: '6px 0 18px' }}>
                  <div style={{ width: '100%', height: 260, maxWidth: 340 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={stats.warehouseDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={76} outerRadius={108} paddingAngle={2} stroke="#fff" strokeWidth={3}>
                          {stats.warehouseDistribution.map((entry, index) => (
                            <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(value) => `${formatNumber(value)} đ`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: 10 }}>
                  {stats.warehouseDistribution.map((item, index) => {
                    const totalValue = stats.totalWarehouseValue || 1;
                    const percent = ((Number(item.value || 0) / totalValue) * 100).toFixed(1);
                    const color = PIE_COLORS[index % PIE_COLORS.length];
                    return (
                      <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 16, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                        <span style={{ width: 12, height: 12, borderRadius: 999, background: color, flexShrink: 0 }} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>
                            <span style={{ fontSize: 13, fontWeight: 800, color: '#059669' }}>{percent}%</span>
                          </div>
                          <div style={{ marginTop: 6, height: 8, borderRadius: 999, background: '#E2E8F0', overflow: 'hidden' }}>
                            <div style={{ width: `${percent}%`, height: '100%', borderRadius: 999, background: color }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12, color: '#64748B' }}>
                            <span>{formatNumber(item.total_quantity)} sp</span>
                            <strong>{formatNumber(item.value)} đ</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </SectionCard>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'stretch', marginBottom: 16 }}>
          <SectionCard title="Top tồn kho hiện tại" subtitle="Những sản phẩm đang chiếm nhiều diện tích kho nhất" accent="#8B5CF6" action={<span style={{ fontSize: 12, color: '#64748B' }}>5 sản phẩm</span>}>
            {stats.topStockProducts.length === 0 ? (
              <EmptyState text="Chưa có dữ liệu sản phẩm." />
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {stats.topStockProducts.map((product, index) => {
                  const max = stats.topStockProducts[0]?.stock || 1;
                  const percent = Math.max(8, Math.round((Number(product.stock || 0) / max) * 100));
                  return (
                    <div key={product.id || product.sku || index} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 16, padding: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0F172A' }}>{index + 1}. {product.name || 'Không tên'}</div>
                          <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>{product.sku || '—'}</div>
                        </div>
                        <strong style={{ color: '#2563EB' }}>{formatNumber(product.stock)}</strong>
                      </div>
                      <div style={{ height: 8, borderRadius: 999, background: '#E2E8F0', overflow: 'hidden' }}>
                        <div style={{ width: `${percent}%`, height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, #3B82F6, #60A5FA)' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Cảnh báo tồn kho thấp" subtitle="Các mặt hàng cần nhập bổ sung sớm theo từng kho" accent="#EF4444" action={<span style={{ fontSize: 12, color: '#64748B' }}>theo kho</span>}>
            {stats.warehouseDistribution.length === 0 ? (
              <EmptyState text="Kho đang đủ hàng, chưa có cảnh báo tồn thấp." />
            ) : (
              <div style={{ display: 'grid', gap: 14, maxHeight: 540, overflow: 'auto', paddingRight: 4 }}>
                {stats.warehouseDistribution.map((warehouse) => {
                  const productsLow = stats.warehouseLowStockMap[warehouse.name] || [];
                  return (
                    <div key={warehouse.name} style={{ background: '#FFF7F7', border: '1px solid #FECACA', borderRadius: 18, padding: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <div style={{ fontWeight: 800, color: '#0F172A' }}>{warehouse.name}</div>
                        <div style={{ fontSize: 12, color: '#B91C1C', fontWeight: 700 }}>{productsLow.length} sản phẩm</div>
                      </div>

                      {productsLow.length === 0 ? (
                        <div style={{ padding: '10px 12px', borderRadius: 14, background: '#FFFFFF', color: '#64748B', fontSize: 13 }}>Không có sản phẩm dưới ngưỡng cảnh báo tại kho này.</div>
                      ) : (
                        <div style={{ display: 'grid', gap: 8 }}>
                          {productsLow.slice(0, 6).map((product) => (
                            <div key={product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 14, background: '#FFFFFF', border: '1px solid #FCA5A5' }}>
                              <div>
                                <div style={{ fontWeight: 700, color: '#0F172A' }}>{product.name || 'Không tên'}</div>
                                <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>{product.sku || '—'} {product.unit ? `• ${product.unit}` : ''}</div>
                              </div>
                              <div style={{ padding: '8px 10px', borderRadius: 12, background: '#FFF1F2', color: '#B91C1C', fontWeight: 800, border: '1px solid #FECACA', whiteSpace: 'nowrap' }}>{formatNumber(product.stock)} / {formatNumber(getMinStockValue(product))}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
