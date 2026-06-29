export const MENU_ITEMS = [
  // --- HỆ THỐNG DASHBOARD ---
  // Mỗi vai trò sẽ có một trang Dashboard riêng để theo dõi số liệu
  { path: '/', name: 'Dashboard Tổng', icon: '📊', roles: [1] },
  { path: '/sales-dashboard', name: 'Đơn hàng của tôi', icon: '📈', roles: [2] },
  { path: '/warehouse-dashboard', name: 'Tổng quan Kho', icon: '🏢', roles: [4] },

  // --- QUẢN LÝ DANH MỤC ---
  // Nơi quản lý dữ liệu gốc của hệ thống
  { path: '/products', name: 'Sản phẩm', icon: '📦', roles: [1, 2, 4, 5] },
  { path: '/customers', name: 'Khách hàng', icon: '🤝', roles: [1, 2] },
  
  // Mục này cực kỳ quan trọng: Chỉ Admin (Role 1) mới có quyền truy cập
  { path: '/accounts', name: 'Quản lý Tài khoản', icon: '👥', roles: [1] },

  // --- NGHIỆP VỤ KHO & BÁN HÀNG ---
  // Các luồng xử lý nhập xuất và giao nhận hàng hóa
  { path: '/sales-orders', name: 'Quản lý Đơn hàng', icon: '🛒', roles: [1, 2] },
  { path: '/logistics', name: 'Tiếp nhận Giao hàng', icon: '🚚', roles: [1, 3] },
  
  // Phiếu nhập: Nhà máy (5) tạo yêu cầu, Kho (4) hoặc Admin (1) xét duyệt
  { path: '/receipts', name: 'Phiếu Nhập Kho', icon: '📥', roles: [1, 4, 5] },
  
  // Phiếu xuất: Dành cho thủ kho để xuất hàng đi giao
  { path: '/outbounds', name: 'Phiếu Xuất Kho', icon: '📤', roles: [1, 4] },
  
  // --- BÁO CÁO & THỐNG KÊ ---
  { path: '/reports', name: 'Báo cáo Tồn kho', icon: '📋', roles: [1, 4] }
];