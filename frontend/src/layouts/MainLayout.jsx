import { useEffect, useMemo, useState, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { MENU_ITEMS } from '../config/menuConfig';
import 'remixicon/fonts/remixicon.css';

const logoSrc = 'https://cdn.haitrieu.com/wp-content/uploads/2023/03/Logo-Truong-Cao-dang-nghe-Cong-nghe-cao-Dong-An.png';

const menuGroups = [
  { title: 'Dashboard', path: '/', icon: 'ri-dashboard-line' },
  { title: 'Sản phẩm', path: '/products', icon: 'ri-box-3-line' },
  { title: 'Khách hàng', path: '/customers', icon: 'ri-team-line' },
  { title: 'Đơn hàng', path: '/sales-orders', icon: 'ri-shopping-cart-2-line' },
  { title: 'Báo cáo', path: '/reports', icon: 'ri-bar-chart-box-line' },
  { title: 'Dashboard (Admin + Kho)', path: '/admin-dashboard', icon: 'ri-admin-line' },
];

const warehouseItems = [
  { title: 'Phiếu Nhập kho', path: '/receipts', icon: 'ri-inbox-archive-line' },
  { title: 'Phiếu Xuất kho', path: '/outbounds', icon: 'ri-send-plane-line' },
  { title: 'Giao hàng (Logistics)', path: '/logistics', icon: 'ri-truck-line' },
  { title: 'Xử lý hàng hoàn / lỗi', path: '/returns', icon: 'ri-arrow-go-back-line' },
];

function safeParseUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const roleNames = { 1: 'Admin', 2: 'Sales', 3: 'Logistics', 4: 'Kho', 5: 'Nhà máy' };
function getRoleLabel(user) {
  return user?.role_name || roleNames[user?.role_id] || 'Người dùng';
}

// ── Colors ──────────────────────────────────────────────────────
const C = {
  sidebarBg:       '#0f1e3d',
  sidebarWidth:    200,
  sidebarCollapsed: 52,
  blue:            '#1d4ed8',
  blueMid:         '#2563eb',
  blueSoft:        '#eff6ff',
  blueBorder:      '#dbeafe',
  blueLight:       '#bfdbfe',
  white:           '#ffffff',
  bg:              '#f1f5fb',
  text:            '#0f172a',
  muted:           '#94a3b8',
  border:          '#e2e8f0',
};

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(window.innerWidth <= 1100);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [warehouseOpen, setWarehouseOpen] = useState(false);

  // Determine viewport layout mode and compute padding
  const { layoutMode, paddingLeft } = useMemo(() => {
    const w = window.innerWidth;
    if (w <= 900)  return { layoutMode: 'mobile',  paddingLeft: 0 };
    if (w <= 1100) return { layoutMode: 'tablet',  paddingLeft: C.sidebarCollapsed };
    return              { layoutMode: 'desktop', paddingLeft: collapsed ? C.sidebarCollapsed : C.sidebarWidth };
  }, [collapsed]);

  // Sync collapsed state when viewport changes (keeps state in sync)
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth <= 1100) setCollapsed(true);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const user = useMemo(() => safeParseUser(), []);

  const hasPermission = (item) => !item.roles || item.roles.includes(user?.role_id);
  const visibleMenus = MENU_ITEMS.filter(hasPermission);
  const visiblePaths = new Set(visibleMenus.map((m) => m.path));

  const activePath = location.pathname === '/' ? '/' : `/${location.pathname.split('/')[1]}`;
  const isWarehouseActive = ['/receipts', '/outbounds', '/logistics', '/returns'].includes(activePath);
  const breadcrumbs = [
    { label: 'Trang chủ', path: '/' },
    ...(activePath !== '/' ? [{ label: menuGroups.find((m) => m.path === activePath)?.title || 'Trang', path: activePath }] : []),
  ];

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; overflow-x: hidden; }

        /* Hide scrollbars */
        .ml-nav-scroll::-webkit-scrollbar { display: none; }
        .ml-nav-scroll { scrollbar-width: none; -ms-overflow-style: none; }
        .ml-main.with-sidebar::-webkit-scrollbar { display: none; }
        .ml-main.with-sidebar { scrollbar-width: none; -ms-overflow-style: none; }

        /* Mobile: sidebar fixed + slides in/out */
        @media (max-width: 900px) {
          .ml-sidebar { transform: translateX(-100%); transition: transform 280ms ease; }
          .ml-sidebar.open { transform: translateX(0); }
          .ml-main     { width: 100% !important; }
          .ml-topbar-h { display: none !important; }
          .ml-topbar-m { display: flex !important; }
        }

        @media (min-width: 901px) {
          .ml-topbar-m { display: none !important; }
          .ml-topbar-h { display: flex !important; }
        }

        /* Tablet: nav styling */
        @media (min-width: 901px) and (max-width: 1100px) {
          .ml-sidebar .ml-logo-text  { display: none !important; }
          .ml-sidebar .ml-group-lbl  { display: none !important; }
          .ml-sidebar .ml-nav-item   { justify-content: center !important; padding: 7px 0 !important; }
          .ml-sidebar .ml-nav-lbl    { display: none !important; }
          .ml-sidebar .ml-collapse-btn { justify-content: center !important; padding-left: 0 !important; }
          .ml-sidebar .ml-collapse-lbl { display: none !important; }
        }

        /* Mobile: sidebar slides in/out */
        @media (max-width: 900px) {
          .ml-sidebar { transform: translateX(-100%); }
          .ml-sidebar.open { transform: translateX(0); }
          .ml-topbar-h { display: none !important; }
          .ml-topbar-m { display: flex !important; }
        }

        @media (min-width: 901px) {
          .ml-topbar-m { display: none !important; }
          .ml-topbar-h { display: flex !important; }
        }

        /* Overlay */
        .ml-overlay {
          display: none;
          position: fixed; inset: 0; z-index: 40;
          background: rgba(15,23,42,0.5);
        }
        @media (max-width: 900px) {
          .ml-overlay.open { display: block; }
        }
      `}</style>

      {/* Mobile overlay */}
      <div className={`ml-overlay ${mobileOpen ? 'open' : ''}`} onClick={() => setMobileOpen(false)} />

      <div style={{ display: 'flex', minHeight: '100dvh', width: '100%', fontFamily: 'Inter, system-ui, sans-serif' }}>

        {/* ── SIDEBAR (fixed so it's always stable at any zoom level) ── */}
        <aside
          className={`ml-sidebar${mobileOpen ? ' open' : ''}`}
          style={{
            width: layoutMode === 'mobile' ? (mobileOpen ? C.sidebarWidth : 0) : layoutMode === 'tablet' ? C.sidebarCollapsed : (collapsed ? C.sidebarCollapsed : C.sidebarWidth),
            minWidth: layoutMode === 'mobile' ? (mobileOpen ? C.sidebarWidth : 0) : layoutMode === 'tablet' ? C.sidebarCollapsed : (collapsed ? C.sidebarCollapsed : C.sidebarWidth),
            transition: 'width 280ms ease, min-width 280ms ease, transform 280ms ease',
            background: C.sidebarBg,
            color: C.white,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '2px 0 16px rgba(0,0,0,0.25)',
            overflow: layoutMode === 'mobile' ? (mobileOpen ? 'auto' : 'hidden') : 'hidden',
            height: '100dvh',
            position: 'fixed',
            left: 0,
            top: 0,
            zIndex: 50,
          }}
        >
          {/* Logo */}
          <div style={{ padding: collapsed ? '12px 6px' : '12px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 24, height: 24, borderRadius: 5, background: 'rgba(255,255,255,0.08)', display: 'grid', placeItems: 'center', overflow: 'hidden', flexShrink: 0 }}>
              <img src={logoSrc} alt="STEEL STOCK" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            {!collapsed && (
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: '#fff', letterSpacing: 0.3 }}>STEEL STOCK</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Quản lý kho</div>
              </div>
            )}
          </div>

          {/* User info */}
          {!collapsed && (
            <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(37,99,235,0.25)', display: 'grid', placeItems: 'center', overflow: 'hidden', flexShrink: 0 }}>
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || 'U')}&background=1d4ed8&color=fff&bold=true&size=28`}
                    alt="User avatar"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#fff' }}>{user?.full_name || 'Người dùng'}</div>
                  <div style={{ fontSize: 10, color: '#60a5fa' }}>{getRoleLabel(user)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Nav */}
          <nav style={{ flex: 1, padding: collapsed ? '8px 4px' : '10px 6px', display: 'flex', flexDirection: 'column', gap: 1, overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="ml-nav-scroll">
            {menuGroups
              .filter((item) => visiblePaths.has(item.path))
              .map((item) => {
                const isActive = activePath === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    title={collapsed ? item.title : undefined}
                    onClick={() => { setMobileOpen(false); setWarehouseOpen(false); }}
                    className="ml-nav-item"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      gap: collapsed ? 0 : 8,
                      padding: collapsed ? '8px 0' : '8px 10px',
                      borderRadius: 7,
                      textDecoration: 'none',
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                      background: isActive ? '#1d4ed8' : 'transparent',
                      transition: 'all 150ms ease',
                      fontSize: 12.5,
                      fontWeight: 500,
                    }}
                    onMouseEnter={(e) => {
                      if (isActive) return;
                      e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                      e.currentTarget.style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                      if (isActive) return;
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.55)';
                    }}
                  >
                    <i className={item.icon} style={{ fontSize: 15, width: 18, textAlign: 'center', flexShrink: 0 }} />
                    {!collapsed && <span className="ml-nav-lbl">{item.title}</span>}
                  </Link>
                );
              })}

            {/* Kho dropdown */}
            {!collapsed && (
              <div>
                <button
                  onClick={() => setWarehouseOpen((p) => !p)}
                  className="ml-nav-item ml-warehouse-header"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    gap: 8,
                    padding: '8px 10px',
                    borderRadius: 7,
                    textDecoration: 'none',
                    color: isWarehouseActive ? '#fff' : 'rgba(255,255,255,0.55)',
                    background: isWarehouseActive ? '#1d4ed8' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    width: '100%',
                    transition: 'all 150ms ease',
                    fontSize: 12.5,
                    fontWeight: 500,
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={(e) => {
                    if (isWarehouseActive) return;
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    if (isWarehouseActive) return;
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.55)';
                  }}
                >
                  <i className="ri-warehouse-line" style={{ fontSize: 15, width: 18, textAlign: 'center', flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>Kho</span>
                  <i
                    className="ri-arrow-down-s-line"
                    style={{
                      fontSize: 14,
                      transition: 'transform 200ms ease',
                      transform: warehouseOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      flexShrink: 0,
                    }}
                  />
                </button>

                {/* Sub-items */}
                {warehouseOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginTop: 2, marginBottom: 4 }}>
                    {warehouseItems
                      .filter((item) => visiblePaths.has(item.path))
                      .map((item) => {
                        const isSubActive = activePath === item.path;
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => { setMobileOpen(false); setWarehouseOpen(false); }}
                            className="ml-nav-item"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-start',
                              gap: 8,
                              padding: '7px 10px 7px 36px',
                              borderRadius: 7,
                              textDecoration: 'none',
                              color: isSubActive ? '#fff' : 'rgba(255,255,255,0.5)',
                              background: isSubActive ? 'rgba(37,99,235,0.35)' : 'transparent',
                              transition: 'all 150ms ease',
                              fontSize: 12,
                              fontWeight: isSubActive ? 500 : 400,
                            }}
                            onMouseEnter={(e) => {
                              if (isSubActive) return;
                              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                              e.currentTarget.style.color = '#fff';
                            }}
                            onMouseLeave={(e) => {
                              if (isSubActive) return;
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                            }}
                          >
                            <i className={item.icon} style={{ fontSize: 13, width: 16, textAlign: 'center', flexShrink: 0 }} />
                            <span>{item.title}</span>
                          </Link>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            {/* Kho collapsed (icon only) */}
            {collapsed && (
              <button
                onClick={() => setWarehouseOpen((p) => !p)}
                title="Kho"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0,
                  padding: '8px 0',
                  borderRadius: 7,
                  border: 'none',
                  cursor: 'pointer',
                  color: isWarehouseActive ? '#fff' : 'rgba(255,255,255,0.55)',
                  background: isWarehouseActive ? '#1d4ed8' : 'transparent',
                  transition: 'all 150ms ease',
                  width: '100%',
                }}
                onMouseEnter={(e) => {
                  if (isWarehouseActive) return;
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  if (isWarehouseActive) return;
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.55)';
                }}
              >
                <i className="ri-warehouse-line" style={{ fontSize: 15, width: 18, textAlign: 'center' }} />
              </button>
            )}
          </nav>

          {/* Collapse toggle */}
          <div style={{ padding: '6px 6px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <button
              onClick={() => setCollapsed((p) => !p)}
              className="ml-collapse-btn"
              style={{
                width: '100%', height: 34, border: 'none', borderRadius: 7,
                cursor: 'pointer', background: 'transparent', color: 'rgba(255,255,255,0.35)',
                display: 'flex', alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                gap: 8, paddingLeft: collapsed ? 0 : 10,
                transition: 'background 150ms, color 150ms',
                fontSize: 11, fontWeight: 500,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}
            >
              <i className={collapsed ? 'ri-arrow-right-s-line' : 'ri-arrow-left-s-line'} style={{ fontSize: 15 }} />
              {!collapsed && <span className="ml-collapse-lbl">Thu gọn</span>}
            </button>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <div className="ml-main with-sidebar" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, paddingLeft, transition: 'padding-left 280ms ease' }}>

          {/* Desktop Topbar */}
          <header className="ml-topbar-h" style={{ height: 64, flexShrink: 0, background: C.white, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', boxShadow: '0 2px 18px rgba(37,99,235,0.06)', borderBottom: '1.5px solid #e0e7ff', position: 'relative', zIndex: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.muted, fontSize: 13, minWidth: 0 }}>
                {breadcrumbs.map((item, index) => (
                  <div key={item.path} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    {index > 0 && <i className="ri-arrow-right-s-line" />}
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160, color: index === breadcrumbs.length - 1 ? C.text : C.muted, fontWeight: index === breadcrumbs.length - 1 ? 700 : 500 }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
              <button onClick={() => setShowUserMenu((p) => !p)} style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #e0e7ff', background: C.white, borderRadius: 999, padding: '6px 10px 6px 6px', cursor: 'pointer' }}>
                <div style={{ width: 30, height: 30, borderRadius: '999px', background: `linear-gradient(135deg, ${C.blue}, ${C.blueMid})`, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800, fontSize: 12 }}>
                  {user?.full_name?.slice(0, 1)?.toUpperCase() || 'U'}
                </div>
                <span style={{ fontWeight: 600, color: C.text }}>{user?.full_name || 'Người dùng'}</span>
                <i className="ri-arrow-down-s-line" style={{ color: C.muted }} />
              </button>
              {showUserMenu && (
                <div style={{ position: 'absolute', right: 0, top: 48, width: 180, background: C.white, borderRadius: 14, boxShadow: '0 18px 32px rgba(37,99,235,0.12)', border: '1px solid #e0e7ff', padding: 8 }}>
                  <button onClick={handleLogout} style={{ width: '100%', textAlign: 'left', border: 'none', background: 'transparent', padding: '10px 12px', borderRadius: 10, cursor: 'pointer', color: '#ef4444', fontWeight: 600 }}>
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </header>

          {/* Mobile Topbar */}
          <header className="ml-topbar-m" style={{ height: 60, flexShrink: 0, background: C.white, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', boxShadow: '0 2px 12px rgba(37,99,235,0.08)', borderBottom: '1.5px solid #e0e7ff', position: 'relative', zIndex: 30 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => setMobileOpen(true)} style={{ border: 'none', background: C.blueSoft, color: C.blue, width: 36, height: 36, borderRadius: 10, display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
                <i className="ri-menu-line" style={{ fontSize: 18 }} />
              </button>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: C.text, letterSpacing: 0.4 }}>STEEL STOCK</div>
                <div style={{ fontSize: 11, color: C.muted }}>{menuGroups.find((m) => m.path === activePath)?.title || 'Kho'}</div>
              </div>
            </div>
            <button onClick={() => setShowUserMenu((p) => !p)} style={{ border: '1px solid #e0e7ff', background: C.white, borderRadius: 999, padding: '4px 8px 4px 4px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: `linear-gradient(135deg, ${C.blue}, ${C.blueMid})`, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800, fontSize: 11 }}>
                {user?.full_name?.slice(0, 1)?.toUpperCase() || 'U'}
              </div>
              <i className="ri-arrow-down-s-line" style={{ color: C.muted, fontSize: 16 }} />
            </button>
            {showUserMenu && (
              <div style={{ position: 'absolute', right: 16, top: 56, width: 180, background: C.white, borderRadius: 14, boxShadow: '0 18px 32px rgba(37,99,235,0.12)', border: '1px solid #e0e7ff', padding: 8 }}>
                <button onClick={handleLogout} style={{ width: '100%', textAlign: 'left', border: 'none', background: 'transparent', padding: '10px 12px', borderRadius: 10, cursor: 'pointer', color: '#ef4444', fontWeight: 600 }}>
                  Đăng xuất
                </button>
              </div>
            )}
          </header>

          <main style={{ flex: 1, overflowY: 'auto', background: C.bg }}>
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}
