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

const roleNames = {
  1: 'Admin',
  2: 'Sales',
  3: 'Logistics',
  4: 'Kho',
  5: 'Nhà máy',
};

function getRoleLabel(user) {
  return user?.role_name || roleNames[user?.role_id] || 'Người dùng';
}

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
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

  return (
    <div style={{ display: 'flex', height: '100dvh', width: '100%', backgroundColor: '#eef2f7', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' }}>
      <aside
        style={{
          width: collapsed ? 64 : 256,
          minWidth: collapsed ? 64 : 256,
          transition: 'all 300ms ease',
          background: 'linear-gradient(180deg, #0F1C2E 0%, #1A2D45 100%)',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '12px 0 30px rgba(15,28,46,0.18)',
          overflow: 'hidden',
          height: '100dvh',
          position: 'sticky',
          top: 0,
        }}
      >
        <div style={{ padding: collapsed ? '18px 12px' : '20px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 26, height: 26, borderRadius: 999, background: 'rgba(255,255,255,0.08)', display: 'grid', placeItems: 'center', overflow: 'hidden', flexShrink: 0 }}>
              <img src={logoSrc} alt="STEEL STOCK" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            {!collapsed && (
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, letterSpacing: 0.4, fontSize: 15, lineHeight: 1.1 }}>STEEL STOCK</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Quản lý xuất nhập tồn</div>
              </div>
            )}
          </div>
        </div>

        {!collapsed && (
          <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: '999px', background: 'linear-gradient(135deg, #22c55e, #10b981)', display: 'grid', placeItems: 'center', fontWeight: 800, color: '#082112', overflow: 'hidden' }}>
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || 'User')}&background=0ea5e9&color=fff`}
                  alt="User avatar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.full_name || 'Nguyễn Văn An'}</div>
                <div style={{ fontSize: 12, color: '#34d399' }}>{getRoleLabel(user)}</div>
              </div>
            </div>
          </div>
        )}

        <nav style={{ flex: 1, padding: collapsed ? '14px 8px' : '16px 12px', display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>
          {groupedMenus.map((group) => (
            <div key={group.title} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {!collapsed && <div style={{ padding: '0 10px', fontSize: 11, fontWeight: 800, letterSpacing: 1.1, color: 'rgba(255,255,255,0.35)' }}>{group.title}</div>}
              {group.items.map((menu) => {
                const meta = menuMeta[menu.path] || { label: menu.name, icon: 'ri-circle-line' };
                const isActive = activePath === menu.path;
                return (
                  <Link
                    key={menu.path}
                    to={menu.path}
                    title={collapsed ? meta.label : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      gap: collapsed ? 0 : 12,
                      padding: collapsed ? '12px 0' : '12px 14px',
                      borderRadius: 14,
                      textDecoration: 'none',
                      color: '#fff',
                      background: isActive ? 'rgba(16,185,129,0.95)' : 'transparent',
                      transition: 'transform 180ms ease, box-shadow 180ms ease, background 180ms ease, color 180ms ease, filter 180ms ease',
                      boxShadow: isActive ? '0 12px 20px rgba(16,185,129,0.18)' : 'none',
                      marginBottom: 2,
                    }}
                    onMouseEnter={(e) => {
                      if (isActive) return;
                      e.currentTarget.style.transform = 'translateX(4px)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                      e.currentTarget.style.boxShadow = '0 10px 18px rgba(15,23,42,0.14)';
                      e.currentTarget.style.filter = 'brightness(1.04)';
                    }}
                    onMouseLeave={(e) => {
                      if (isActive) return;
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.filter = 'brightness(1)';
                    }}
                  >
                    <i className={meta.icon} style={{ fontSize: 17, width: 18, textAlign: 'center' }} />
                    {!collapsed && <span style={{ fontSize: 14, fontWeight: 600 }}>{meta.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => setCollapsed((prev) => !prev)}
            style={{
              width: '100%',
              height: 40,
              border: 'none',
              borderRadius: 12,
              cursor: 'pointer',
              background: 'transparent',
              color: 'rgba(255,255,255,0.78)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 10,
              paddingLeft: collapsed ? 0 : 12,
              transition: 'background 180ms ease, color 180ms ease, transform 180ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(255,255,255,0.78)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <i className={collapsed ? 'ri-arrow-right-s-line' : 'ri-arrow-left-s-line'} style={{ fontSize: 18 }} />
            {!collapsed && <span style={{ fontWeight: 500, fontSize: 13 }}>Thu gọn</span>}
          </button>
        </div>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100dvh', overflow: 'hidden' }}>
        <header style={{ height: 64, flexShrink: 0, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', boxShadow: '0 2px 18px rgba(15,23,42,0.06)', position: 'relative', zIndex: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 13, minWidth: 0 }}>
              {breadcrumbs.map((item, index) => (
                <div key={item.path} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  {index > 0 && <i className="ri-arrow-right-s-line" />}
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160, color: index === breadcrumbs.length - 1 ? '#0f172a' : '#64748b', fontWeight: index === breadcrumbs.length - 1 ? 700 : 500 }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
            <button onClick={() => setShowUserMenu((prev) => !prev)} style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #e2e8f0', background: '#fff', borderRadius: 999, padding: '6px 10px 6px 6px', cursor: 'pointer' }}>
              <div style={{ width: 30, height: 30, borderRadius: '999px', background: 'linear-gradient(135deg, #10b981, #22c55e)', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800, fontSize: 12 }}>
                {user?.full_name?.slice(0, 1)?.toUpperCase() || 'U'}
              </div>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{user?.full_name || 'Người dùng'}</span>
              <i className="ri-arrow-down-s-line" style={{ color: '#64748b' }} />
            </button>
            {showUserMenu && (
              <div style={{ position: 'absolute', right: 0, top: 48, width: 180, background: '#fff', borderRadius: 14, boxShadow: '0 18px 32px rgba(15,23,42,0.12)', border: '1px solid #e2e8f0', padding: 8 }}>
                <button onClick={handleLogout} style={{ width: '100%', textAlign: 'left', border: 'none', background: 'transparent', padding: '10px 12px', borderRadius: 10, cursor: 'pointer', color: '#ef4444', fontWeight: 600 }}>
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: 24, minHeight: 0 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
