// roles: 1=Admin, 2=Sales, 3=Logistics, 4=Warehouse, 5=Factory
// parent: null = menu item thường; parent = path của parent item
export const MENU_ITEMS = [
  // --- QUẢN LÝ DANH MỤC ---
  { path: '/accounts',   name: 'Quản lý Tài khoản', icon: 'ri-user-settings-line', roles: [1] },

  { path: '/customers',  name: 'Quản lý Khách hàng', icon: 'ri-team-line',         roles: [1, 2, 3] },

  { path: '/products',   name: 'Quản lý Kho',         icon: 'ri-box-3-line',         roles: [1, 2, 3, 4, 5] },

  // --- KHO (group: Nhập Kho / Xuất Kho / Giao hàng / Trả hàng) ---
  { path: '/receipts',   name: 'Nhập Kho',            icon: 'ri-inbox-archive-line', roles: [1, 4, 5], groupParent: '/receipts' },
  { path: '/outbounds',  name: 'Xuất Kho',             icon: 'ri-send-plane-line',    roles: [1, 4],     groupParent: '/receipts' },
  { path: '/logistics',  name: 'Giao hàng',            icon: 'ri-truck-line',         roles: [1, 3],     groupParent: '/receipts' },
  { path: '/returns',    name: 'Trả hàng / Hoàn hàng', icon: 'ri-arrow-go-back-line', roles: [1, 2, 3, 4, 5], groupParent: '/receipts' },

  // --- NGHIỆP VỤ ---
  { path: '/sales-orders', name: 'Quản lý Đơn hàng',  icon: 'ri-shopping-bag-3-line', roles: [1, 2] },

  // --- BÁO CÁO ---
  { path: '/reports',    name: 'Báo cáo & Thống kê', icon: 'ri-bar-chart-box-line', roles: [1, 2, 3, 4, 5] },
];

// Dashboard items — hiện 1 cái phù hợp role
export const DASHBOARD_ITEMS = [
  { path: '/admin-dashboard',      title: 'Dashboard',         icon: 'ri-dashboard-line',     roles: [1] },
  { path: '/sales-dashboard',      title: 'Dashboard Sales',  icon: 'ri-line-chart-line',     roles: [2] },
  { path: '/logistics',            title: 'Dashboard GT',      icon: 'ri-truck-line',          roles: [3] },
  { path: '/warehouse-dashboard',  title: 'Dashboard Kho',    icon: 'ri-archive-line',       roles: [4] },
  { path: '/factory-dashboard',    title: 'Dashboard NM',     icon: 'ri-building-4-line',    roles: [5] },
];

export const KHO_GROUP_LABEL = 'Kho';
