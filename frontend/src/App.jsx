import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import MainLayout from './layouts/MainLayout';
import ProductsPage from './pages/ProductsPage';
import CustomersPage from './pages/CustomersPage';
import SalesOrdersPage from './pages/SalesOrdersPage';
import LogisticsPage from './pages/LogisticsPage';
import OutboundsPage from './pages/OutboundsPage';
import ReceiptsPage from './pages/ReceiptsPage';
import AccountsPage from './pages/AccountsPage';
import ReportsPage from './pages/ReportsPage';
import MyDashboardPage from './pages/MyDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import WarehouseDashboardPage from './pages/WarehouseDashboardPage';

// 1. Kiểm tra đăng nhập
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// 2. NGÃ TƯ ĐIỀU PHỐI (Dành riêng cho trang chủ)
const HomeRedirect = () => {
  // Lấy thông tin user từ localStorage ra để soi Role
  const userStr = localStorage.getItem('user');
  if (!userStr) return <Navigate to="/login" replace />;
  
  const user = JSON.parse(userStr);
  const roleId = user.role_id;

  // Dựa vào chức vụ để đẩy về đúng màn hình nhà của người đó
  switch (roleId) {
    case 1: return <AdminDashboardPage />;              // Admin -> Xem tổng quan
    case 2: return <MyDashboardPage />;                 // Sales -> Xem KPI cá nhân
    case 3: return <Navigate to="/logistics" replace />;// Logistics -> Vô làm việc luôn
    case 4: return <Navigate to="/warehouse-dashboard" replace />;// Kho -> Vô làm việc luôn
    case 5: return <Navigate to="/products" replace />; // Nhà máy -> Vô làm việc luôn
    default: return <div style={{padding: '20px'}}>Chào mừng bạn đến với hệ thống!</div>;
  }
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        {/* Mọi đường dẫn nằm trong MainLayout đều phải đi qua ProtectedRoute */}
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          
          {/* --- TRANG CHỦ MẶC ĐỊNH SẼ ĐI QUA NGÃ TƯ ĐIỀU PHỐI --- */}
          <Route index element={<HomeRedirect />} />
          
          <Route path="sales-dashboard" element={<MyDashboardPage />} />
          <Route path="admin-dashboard" element={<AdminDashboardPage />} />
          <Route path="warehouse-dashboard" element={<WarehouseDashboardPage />} />

          {/* --- DANH MỤC --- */}
          <Route path="products" element={<ProductsPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="accounts" element={<AccountsPage />} />

          {/* --- NGHIỆP VỤ --- */}
          <Route path="sales-orders" element={<SalesOrdersPage />} />
          <Route path="logistics" element={<LogisticsPage />} />
          <Route path="receipts" element={<ReceiptsPage />} />
          <Route path="outbounds" element={<OutboundsPage />} />
          
          {/* --- BÁO CÁO --- */}
          <Route path="reports" element={<ReportsPage />} />

        </Route>
      </Routes>
    </BrowserRouter>
  );
}