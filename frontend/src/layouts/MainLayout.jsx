import { useState, useMemo, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { MENU_ITEMS } from '../config/menuConfig';
import 'remixicon/fonts/remixicon.css';

const logoSrc = 'https://cdn.haitrieu.com/wp-content/uploads/2023/03/Logo-Truong-Cao-dang-nghe-Cong-nghe-cao-Dong-An.png';

const roleNames = { 1: 'Admin', 2: 'Sales', 3: 'Logistics', 4: 'Kho', 5: 'Nhà máy' };
function getRoleLabel(user) {
  return user?.role_name || roleNames[user?.role_id] || 'Người dùng';
}

function safeParseUser() {
  try {
    const raw = sessionStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getMode(width) {
  if (width <= 768) return 'mobile';
  if (width <= 1100) return 'tablet';
  return 'desktop';
}

const SIDEBAR_FULL = 210;
const SIDEBAR_ICON = 56;

// Dashboard paths theo role — chỉ hiện 1 cái phù hợp
const DASHBOARD_ITEMS = [
  { path: '/admin-dashboard',     title: 'Dashboard',       icon: 'ri-dashboard-line',       roles: [1] },
  { path: '/sales-dashboard',     title: 'Dashboard Sales', icon: 'ri-line-chart-line',      roles: [2] },
  { path: '/logistics',           title: 'Dashboard GT',    icon: 'ri-truck-line',           roles: [3] },
  { path: '/warehouse-dashboard', title: 'Dashboard Kho',   icon: 'ri-archive-line',         roles: [4] },
  { path: '/factory-dashboard',   title: 'Dashboard NM',    icon: 'ri-building-4-line',      roles: [5] },
];


export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const user = useMemo(() => {
    try {
      const raw = sessionStorage.getItem('user');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // Normalize role_id to number so role checks work regardless of how it was stored
      if (parsed && typeof parsed.role_id === 'string') {
        parsed.role_id = Number(parsed.role_id);
      }
      return parsed;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const mode = getMode(width);
  const isMobile = mode === 'mobile';
  const isTablet = mode === 'tablet';
  const isDesktop = mode === 'desktop';

  const sidebarWidth = isMobile ? SIDEBAR_FULL : isTablet ? SIDEBAR_ICON : collapsed ? SIDEBAR_ICON : SIDEBAR_FULL;
  const paddingLeft = isMobile ? 0 : sidebarWidth;
  const sidebarTranslateX = isMobile && !mobileOpen ? '-100%' : '0';

  const hasPermission = (item) => !item.roles || item.roles.includes(user?.role_id);
  const visibleMenus = MENU_ITEMS.filter(hasPermission);

  // Phân loại menu: dashboard / top-level / kho-group
  const myDashboardItem = DASHBOARD_ITEMS.find(item => item.roles.includes(user?.role_id));
  const activePath = location.pathname === '/' ? '/' : `/${location.pathname.split('/')[1]}`;

  // groupParent = null → top-level; groupParent = path → thuộc Kho group
  const khoGroupPaths = new Set(
    MENU_ITEMS.filter(m => m.groupParent === '/receipts').map(m => m.path)
  );

  const topLevelItems = visibleMenus.filter(m => !m.groupParent);
  const khoGroupItems = visibleMenus.filter(m => m.groupParent === '/receipts');
  const showKhoGroup = khoGroupItems.length > 0;

  const closeMobile = () => setMobileOpen(false);
  const showLabels = !(isTablet || (isDesktop && collapsed));

  const renderNavLink = (item) => {
    const isActive = activePath === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={closeMobile}
        title={showLabels ? undefined : item.name}
        className="ml-nav-item"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: showLabels ? 'flex-start' : 'center',
          gap: showLabels ? 8 : 0, padding: showLabels ? '8px 10px' : '8px 0',
          borderRadius: 7, textDecoration: 'none', color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
          background: isActive ? '#1d4ed8' : 'transparent', transition: 'all 150ms ease',
          fontSize: 12.5, fontWeight: 500,
        }}
        onMouseEnter={(e) => { if (isActive) return; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; }}
        onMouseLeave={(e) => { if (isActive) return; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
      >
        <i className={item.icon} style={{ fontSize: 15, width: 18, textAlign: 'center', flexShrink: 0 }} />
        {showLabels && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>}
      </Link>
    );
  };

  const handleLogout = () => {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div style={{ minHeight: '100dvh', width: '100%', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; overflow-x: hidden; }
        .ml-nav-scroll::-webkit-scrollbar { display: none; }
        .ml-nav-scroll { scrollbar-width: none; -ms-overflow-style: none; }
        .ml-sidebar {
          position: fixed; top: 0; left: 0; height: 100dvh;
          background: #0f1e3d; color: #fff;
          display: flex; flex-direction: column;
          box-shadow: 2px 0 16px rgba(0,0,0,0.25);
          z-index: 50; transition: width 280ms ease, transform 280ms ease;
          overflow: hidden;
        }
        .ml-overlay {
          position: fixed; inset: 0; background: rgba(15,23,42,0.5);
          z-index: 40; opacity: 0; pointer-events: none; transition: opacity 280ms ease;
        }
        .ml-overlay.open { opacity: 1; pointer-events: auto; }
      `}</style>

      <div className={`ml-overlay${mobileOpen ? ' open' : ''}`} onClick={closeMobile} />

      <aside className="ml-sidebar" style={{ width: sidebarWidth, transform: `translateX(${sidebarTranslateX})` }}>
        {/* Logo */}
        <div style={{ padding: '12px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 7, minHeight: 50 }}>
          <div style={{ width: 26, height: 26, borderRadius: 5, background: 'rgba(255,255,255,0.08)', display: 'grid', placeItems: 'center', overflow: 'hidden', flexShrink: 0 }}>
            <img src={logoSrc} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          {showLabels && (
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: '#fff', letterSpacing: 0.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>STEEL STOCK</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Quản lý kho</div>
            </div>
          )}
        </div>

        {/* User info */}
          {showLabels && (
            <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(37,99,235,0.25)', display: 'grid', placeItems: 'center', overflow: 'hidden', flexShrink: 0 }}>
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || 'U')}&background=1d4ed8&color=fff&bold=true&size=28`}
                  alt="avatar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <div style={{ fontWeight: 600, fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#fff' }}>{user?.full_name || 'Người dùng'}</div>
                <div style={{ fontSize: 10, color: '#60a5fa' }}>{getRoleLabel(user)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="ml-nav-scroll" style={{ flex: 1, padding: '10px 6px', display: 'flex', flexDirection: 'column', gap: 1, overflowY: 'auto', overflow: 'hidden', minWidth: 0 }}>

          {/* Dashboard */}
          {myDashboardItem && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {showLabels && (
                <div style={{ width: '100%', padding: '8px 10px 4px', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.5, textTransform: 'uppercase', overflow: 'hidden' }}>
                  Dashboard
                </div>
              )}
              <Link
                key={myDashboardItem.path}
                to={myDashboardItem.path}
                onClick={closeMobile}
                title={myDashboardItem.title}
                className="ml-nav-item"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: showLabels ? 'flex-start' : 'center',
                  gap: 8, padding: showLabels ? '7px 10px' : '10px 0',
                  borderRadius: 7, textDecoration: 'none', width: '100%',
                  color: activePath === myDashboardItem.path ? '#fff' : 'rgba(255,255,255,0.6)',
                  background: activePath === myDashboardItem.path ? '#1d4ed8' : 'transparent',
                  transition: 'all 150ms ease', fontSize: 12.5, fontWeight: activePath === myDashboardItem.path ? 600 : 500,
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => { if (activePath === myDashboardItem.path) return; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={(e) => { if (activePath === myDashboardItem.path) return; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
              >
                <i className={myDashboardItem.icon} style={{ fontSize: 15, width: 18, textAlign: 'center', flexShrink: 0 }} />
                {showLabels && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{myDashboardItem.title}</span>}
              </Link>
            </div>
          )}

          {/* Quản lý Tài khoản */}
          {topLevelItems.filter(m => m.path === '/accounts').map(renderNavLink)}

          {/* Quản lý Khách hàng */}
          {topLevelItems.filter(m => m.path === '/customers').map(renderNavLink)}

          {/* Quản lý Kho */}
          {topLevelItems.filter(m => m.path === '/products').map(renderNavLink)}

          {/* Kho group */}
          {showKhoGroup && (
            <>
              {showLabels && (
                <div style={{ marginTop: 4, padding: '8px 10px 2px', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.5, textTransform: 'uppercase', overflow: 'hidden' }}>
                  Kho
                </div>
              )}
              {/* indent items */}
              {khoGroupItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeMobile}
                  title={showLabels ? undefined : item.name}
                  className="ml-nav-item"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: showLabels ? 'flex-start' : 'center',
                    gap: showLabels ? 8 : 0, padding: showLabels ? '7px 10px 7px 28px' : '8px 0',
                    borderRadius: 7, textDecoration: 'none',
                    color: activePath === item.path ? '#fff' : 'rgba(255,255,255,0.5)',
                    background: activePath === item.path ? 'rgba(37,99,235,0.3)' : 'transparent',
                    transition: 'all 150ms ease', fontSize: 12, fontWeight: activePath === item.path ? 600 : 400,
                    overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => { if (activePath === item.path) return; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={(e) => { if (activePath === item.path) return; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
                >
                  <i className={item.icon} style={{ fontSize: 14, width: 18, textAlign: 'center', flexShrink: 0 }} />
                  {showLabels && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>}
                </Link>
              ))}
            </>
          )}

          {/* Quản lý Đơn hàng */}
          {topLevelItems.filter(m => m.path === '/sales-orders').map(renderNavLink)}

          {/* Báo cáo */}
          {topLevelItems.filter(m => m.path === '/reports').map(renderNavLink)}
        </nav>

        {/* Bottom: logout + collapse */}
        <div style={{ padding: '6px 6px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button
            onClick={handleLogout}
            title={showLabels ? undefined : 'Đăng xuất'}
            style={{
              width: '100%', height: 34, border: 'none', borderRadius: 7,
              cursor: 'pointer', background: 'transparent', color: 'rgba(255,255,255,0.4)',
              display: 'flex', alignItems: 'center',
              justifyContent: showLabels ? 'flex-start' : 'center',
              gap: 8, paddingLeft: showLabels ? 10 : 0,
              transition: 'background 150ms, color 150ms',
              fontSize: 11, fontWeight: 500, overflow: 'hidden',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = 'rgba(239,68,68,0.9)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
          >
            <i className="ri-logout-box-r-line" style={{ fontSize: 15, flexShrink: 0 }} />
            {showLabels && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Đăng xuất</span>}
          </button>

          {isDesktop && (
            <button
              onClick={() => setCollapsed((p) => !p)}
              title={collapsed ? 'Mở rộng' : 'Thu gọn'}
              style={{
                width: '100%', height: 34, border: 'none', borderRadius: 7,
                cursor: 'pointer', background: 'transparent', color: 'rgba(255,255,255,0.4)',
                display: 'flex', alignItems: 'center',
                justifyContent: showLabels ? 'flex-start' : 'center',
                gap: 8, paddingLeft: showLabels ? 10 : 0, marginTop: 2,
                transition: 'background 150ms, color 150ms',
                fontSize: 11, fontWeight: 500, overflow: 'hidden',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
            >
              <i className={collapsed ? 'ri-arrow-right-s-line' : 'ri-arrow-left-s-line'} style={{ fontSize: 15, flexShrink: 0 }} />
              {showLabels && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{collapsed ? 'Mở rộng' : 'Thu gọn'}</span>}
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div style={{ marginLeft: paddingLeft, minHeight: '100dvh', display: 'flex', flexDirection: 'column', transition: 'margin-left 280ms ease' }}>
        <header
          style={{
            height: 64, flexShrink: 0, background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: isMobile ? '0 12px' : '0 24px',
            boxShadow: '0 2px 18px rgba(37,99,235,0.06)',
            borderBottom: '1.5px solid #e0e7ff', position: 'sticky', top: 0, zIndex: 30,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
            {isMobile && (
              <button
                onClick={() => setMobileOpen(true)}
                style={{
                  border: 'none', background: '#eff6ff', color: '#1d4ed8',
                  width: 36, height: 36, borderRadius: 10,
                  display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0,
                }}
              >
                <i className="ri-menu-line" style={{ fontSize: 18 }} />
              </button>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: 13, minWidth: 0 }}>
              {myDashboardItem && (
                <Link to={myDashboardItem.path} style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 13 }}>
                  <i className="ri-dashboard-line" style={{ marginRight: 4 }} />{myDashboardItem.title}
                </Link>
              )}
              {activePath !== '/' && activePath !== (myDashboardItem?.path?.replace(/^\//, '') || '') && (
                <>
                  <i className="ri-arrow-right-s-line" style={{ color: '#cbd5e1' }} />
                  <span style={{ color: '#0f172a', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {MENU_ITEMS.find(m => m.path === activePath)?.name || MENU_ITEMS.find(m => m.path === `/${location.pathname.split('/')[1]}`)?.name || 'Trang'}
                  </span>
                </>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', flexShrink: 0 }}>
            <button onClick={() => setShowUserMenu((p) => !p)} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              borderWidth: '1px', borderStyle: 'solid', borderColor: '#e0e7ff', background: '#fff', borderRadius: 999,
              padding: isMobile ? '3px 7px 3px 3px' : '6px 10px 6px 6px', cursor: 'pointer',
            }}>
              <div style={{
                width: isMobile ? 26 : 30, height: isMobile ? 26 : 30, borderRadius: '50%',
                background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800,
                fontSize: isMobile ? 10 : 12,
              }}>
                {user?.full_name?.slice(0, 1)?.toUpperCase() || 'U'}
              </div>
              {!isMobile && <span style={{ fontWeight: 600, color: '#0f172a' }}>{user?.full_name || 'Người dùng'}</span>}
              <i className="ri-arrow-down-s-line" style={{ color: '#94a3b8', fontSize: isMobile ? 15 : 16 }} />
            </button>
            {showUserMenu && (
              <div style={{
                position: 'absolute', right: 0, top: isMobile ? 48 : 50,
                width: 180, background: '#fff', borderRadius: 14,
                boxShadow: '0 18px 32px rgba(37,99,235,0.12)',
                border: '1px solid #e0e7ff', padding: 8, zIndex: 60,
              }}>
                <div style={{ padding: '8px 12px', fontSize: 12, color: '#64748b', borderBottom: '1px solid #f1f5f9', marginBottom: 4 }}>
                  {getRoleLabel(user)}
                </div>
                <button onClick={handleLogout} style={{ width: '100%', textAlign: 'left', border: 'none', background: 'transparent', padding: '10px 12px', borderRadius: 10, cursor: 'pointer', color: '#ef4444', fontWeight: 600 }}>
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', background: '#f1f5fb' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
