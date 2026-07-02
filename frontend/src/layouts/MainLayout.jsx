import { useMemo, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { MENU_ITEMS } from '../config/menuConfig';
import 'remixicon/fonts/remixicon.css';

const logoSrc = 'https://cdn.haitrieu.com/wp-content/uploads/2023/03/Logo-Truong-Cao-dang-nghe-Cong-nghe-cao-Dong-An.png';

const menuGroups = [
  { title: 'TỔNG QUAN', items: ['/', '/sales-dashboard', '/warehouse-dashboard'] },
  {
    title: 'NGHIỆP VỤ',
    items: ['/products', '/receipts', '/outbounds', '/sales-orders', '/logistics', '/reports', '/customers'],
  },
  { title: 'HỆ THỐNG', items: ['/accounts'] },
];

const menuMeta = {
  '/': { label: 'Dashboard', icon: 'ri-line-chart-line' },
  '/sales-dashboard': { label: 'Dashboard Sales', icon: 'ri-line-chart-line' },
  '/warehouse-dashboard': { label: 'Tổng Quan Kho', icon: 'ri-line-chart-line' },
  '/products': { label: 'Quản lý sản phẩm', icon: 'ri-box-3-line' },
  '/receipts': { label: 'Nhập kho', icon: 'ri-inbox-line' },
  '/outbounds': { label: 'Xuất kho', icon: 'ri-send-plane-line' },
  '/sales-orders': { label: 'Quản lý đơn hàng', icon: 'ri-shopping-cart-2-line' },
  '/logistics': { label: 'Tiếp nhận giao hàng', icon: 'ri-truck-line' },
  '/reports': { label: 'Báo cáo', icon: 'ri-bar-chart-box-line' },
  '/customers': { label: 'Khách Hàng', icon: 'ri-team-line' },
  '/accounts': { label: 'Quản lý tài khoản', icon: 'ri-shield-user-line' },
};

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
  sidebarBg:    'linear-gradient(180deg, #1e3a5f 0%, #2563eb 100%)',
  sidebarWidth: 256,
  sidebarCollapsed: 64,
  blue:         '#2563eb',
  blueMid:      '#3b82f6',
  blueSoft:     '#eff6ff',
  blueBorder:   '#bfdbfe',
  blueLight:    '#dbeafe',
  white:        '#ffffff',
  bg:           '#f0f4ff',
  text:         '#0f172a',
  muted:        '#94a3b8',
  border:       '#e2e8f0',
};

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = useMemo(() => safeParseUser(), []);

  const hasPermission = (item) => !item.roles || item.roles.includes(user?.role_id);
  const visibleMenus = MENU_ITEMS.filter(hasPermission);
  const groupedMenus = menuGroups
    .map((group) => ({
      ...group,
      items: group.items.map((path) => visibleMenus.find((item) => item.path === path)).filter(Boolean),
    }))
    .filter((group) => group.items.length > 0);

  const activePath = location.pathname === '/' ? '/' : `/${location.pathname.split('/')[1]}`;
  const breadcrumbs = [
    { label: 'Trang chủ', path: '/' },
    ...(activePath !== '/' ? [{ label: menuMeta[activePath]?.label || 'Trang', path: activePath }] : []),
  ];

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const sidebarW = collapsed ? C.sidebarCollapsed : C.sidebarWidth;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }

        /* Mobile: hide sidebar, show hamburger */
        @media (max-width: 900px) {
          .ml-sidebar  { transform: translateX(${collapsed ? -64 : -256}px) !important; }
          .ml-main     { margin-left: 0 !important; width: 100% !important; }
          .ml-topbar-h { display: none !important; }
          .ml-topbar-m { display: flex !important; }
          .ml-main     { padding: 16px !important; }
        }
        @media (min-width: 901px) {
          .ml-topbar-m { display: none !important; }
          .ml-topbar-h { display: flex !important; }
        }

        /* Tablet: collapse sidebar */
        @media (min-width: 901px) and (max-width: 1200px) {
          .ml-sidebar  { width: 64px !important; min-width: 64px !important; }
          .ml-sidebar .ml-logo-text  { display: none !important; }
          .ml-sidebar .ml-group-lbl  { display: none !important; }
          .ml-sidebar .ml-nav-item   { justify-content: center !important; padding: 12px 0 !important; }
          .ml-sidebar .ml-nav-lbl    { display: none !important; }
          .ml-sidebar .ml-collapse-btn { justify-content: center !important; padding-left: 0 !important; }
          .ml-sidebar .ml-collapse-lbl { display: none !important; }
        }

        @media (max-width: 640px) {
          .ml-stat-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .ml-chart-row { grid-template-columns: 1fr !important; }
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

      <div style={{ display: 'flex', height: '100dvh', width: '100%', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' }}>

        {/* ── SIDEBAR ── */}
        <aside
          className="ml-sidebar"
          style={{
            width: sidebarW,
            minWidth: sidebarW,
            transition: 'all 300ms ease',
            background: C.sidebarBg,
            color: C.white,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '12px 0 30px rgba(15,28,46,0.18)',
            overflow: 'hidden',
            height: '100dvh',
            position: 'sticky',
            top: 0,
            zIndex: 50,
          }}
        >
          {/* Logo */}
          <div style={{ padding: collapsed ? '18px 12px' : '20px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.12)', display: 'grid', placeItems: 'center', overflow: 'hidden', flexShrink: 0 }}>
                <img src={logoSrc} alt="STEEL STOCK" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div className="ml-logo-text" style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, letterSpacing: 0.4, fontSize: 15, lineHeight: 1.1 }}>STEEL STOCK</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Quản lý xuất nhập tồn</div>
              </div>
            </div>
          </div>

          {/* User info */}
          {!collapsed && (
            <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: '999px', background: 'rgba(96,165,250,0.2)', display: 'grid', placeItems: 'center', overflow: 'hidden', flexShrink: 0 }}>
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || 'User')}&background=3b82f6&color=fff`}
                    alt="User avatar"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 14 }}>{user?.full_name || 'Nguyễn Văn An'}</div>
                  <div style={{ fontSize: 12, color: '#93c5fd' }}>{getRoleLabel(user)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Nav */}
          <nav style={{ flex: 1, padding: collapsed ? '14px 8px' : '16px 12px', display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>
            {groupedMenus.map((group) => (
              <div key={group.title} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="ml-group-lbl" style={{ padding: '0 10px', fontSize: 11, fontWeight: 800, letterSpacing: 1.1, color: 'rgba(255,255,255,0.35)' }}>{group.title}</div>
                {group.items.map((menu) => {
                  const meta = menuMeta[menu.path] || { label: menu.name, icon: 'ri-circle-line' };
                  const isActive = activePath === menu.path;
                  return (
                    <Link
                      key={menu.path}
                      to={menu.path}
                      title={collapsed ? meta.label : undefined}
                      onClick={() => setMobileOpen(false)}
                      className="ml-nav-item"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        gap: collapsed ? 0 : 12,
                        padding: collapsed ? '12px 0' : '12px 14px',
                        borderRadius: 14,
                        textDecoration: 'none',
                        color: '#fff',
                        background: isActive ? 'rgba(37,99,235,0.9)' : 'transparent',
                        boxShadow: isActive ? '0 8px 20px rgba(37,99,235,0.28)' : 'none',
                        marginBottom: 2,
                        transition: 'all 180ms ease',
                      }}
                      onMouseEnter={(e) => {
                        if (isActive) return;
                        e.currentTarget.style.transform = 'translateX(4px)';
                        e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                      }}
                      onMouseLeave={(e) => {
                        if (isActive) return;
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <i className={meta.icon} style={{ fontSize: 17, width: 18, textAlign: 'center', flexShrink: 0 }} />
                      {!collapsed && <span className="ml-nav-lbl" style={{ fontSize: 14, fontWeight: 600 }}>{meta.label}</span>}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Collapse toggle */}
          <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button
              onClick={() => setCollapsed((p) => !p)}
              className="ml-collapse-btn"
              style={{
                width: '100%', height: 40, border: 'none', borderRadius: 12,
                cursor: 'pointer', background: 'transparent', color: 'rgba(255,255,255,0.78)',
                display: 'flex', alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                gap: 10, paddingLeft: collapsed ? 0 : 12,
                transition: 'background 180ms ease, color 180ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.78)'; }}
            >
              <i className={collapsed ? 'ri-arrow-right-s-line' : 'ri-arrow-left-s-line'} style={{ fontSize: 18 }} />
              {!collapsed && <span className="ml-collapse-lbl" style={{ fontWeight: 500, fontSize: 13 }}>Thu gọn</span>}
            </button>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <div className="ml-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100dvh', overflow: 'hidden' }}>

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
                <div style={{ fontSize: 11, color: C.muted }}>{menuMeta[activePath]?.label || 'Trang chủ'}</div>
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
