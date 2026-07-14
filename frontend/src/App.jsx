import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import MainLayout from './layouts/MainLayout';
import ProductsPage from './pages/ProductsPage';
import WarehousesPage from './pages/WarehousesPage';
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
import LogisticsDashboardPage from './pages/LogisticsDashboardPage';
import FactoryDashboardPage from './pages/FactoryDashboardPage';
import ReturnsPage from './pages/ReturnsPage';

const ProtectedRoute = ({ children }) => {
  const token = sessionStorage.getItem('accessToken');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

const HomeRedirect = () => {
  const userStr = sessionStorage.getItem('user');
  if (!userStr) return <Navigate to="/login" replace />;
  const user = JSON.parse(userStr);
  const roleId = user.role_id;

  switch (roleId) {
    case 1: return <AdminDashboardPage />;                  // Admin
    case 2: return <MyDashboardPage />;                     // Sales
    case 3: return <LogisticsDashboardPage />;              // Logistics
    case 4: return <WarehouseDashboardPage />;              // Warehouse
    case 5: return <FactoryDashboardPage />;                // Factory
    default: return <div style={{ padding: '20px' }}>Chào mừng bạn đến với hệ thống!</div>;
  }
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          {/* Home redirect theo role */}
          <Route index element={<HomeRedirect />} />

          {/* Dashboards */}
          <Route path="sales-dashboard"    element={<MyDashboardPage />} />
          <Route path="admin-dashboard"     element={<AdminDashboardPage />} />
          <Route path="warehouse-dashboard" element={<WarehouseDashboardPage />} />
          <Route path="factory-dashboard"   element={<FactoryDashboardPage />} />

          {/* Danh mục */}
          <Route path="products"   element={<WarehousesPage />} />
          <Route path="customers"  element={<CustomersPage />} />
          <Route path="accounts"   element={<AccountsPage />} />

          {/* Nghiệp vụ */}
          <Route path="receipts"   element={<ReceiptsPage />} />
          <Route path="outbounds"  element={<OutboundsPage />} />
          <Route path="logistics"  element={<LogisticsPage />} />
          <Route path="returns"    element={<ReturnsPage />} />

          {/* Đơn hàng */}
          <Route path="sales-orders" element={<SalesOrdersPage />} />

          {/* Báo cáo */}
          <Route path="reports"    element={<ReportsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
