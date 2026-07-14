import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { colors, spacing, radius, shadows, card, btn, input, badge, pageWrap } from '../styles/theme';

// ---- SVG Icons ----
const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);
const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);
const IconEdit = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconTrash = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);
const IconPackage = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" x2="12" y1="22" y2="12"/>
  </svg>
);
const IconWarehouse = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const IconClose = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconAlertTriangle = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/>
  </svg>
);
const IconDownload = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
  </svg>
);
const IconWarning = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/>
  </svg>
);

// ---- Formatted number ----
const fmtVND = (v) => new Intl.NumberFormat('vi-VN').format(Number(v || 0));
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

// ---- Status badge ----
const StockBadge = ({ status }) => {
  const map = {
    'in-stock':   { label: 'Còn hàng', bg: colors.successSoft, color: colors.success, border: colors.successBorder },
    'low-stock':  { label: 'Sắp hết',  bg: colors.warningSoft, color: colors.warning, border: colors.warningBorder },
    'out-stock':  { label: 'Hết hàng',  bg: colors.dangerSoft, color: colors.danger,  border: colors.dangerBorder },
  };
  const s = map[status] || map['in-stock'];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '4px 10px', borderRadius: radius.full,
      fontSize: 11, fontWeight: 700, border: `1px solid ${s.border}`,
      background: s.bg, color: s.color,
    }}>
      {status === 'in-stock' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors.success, display: 'inline-block' }} />}
      {status === 'low-stock' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors.warning, display: 'inline-block' }} />}
      {status === 'out-stock' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors.danger, display: 'inline-block' }} />}
      {s.label}
    </span>
  );
};

// ---- Defect type badge ----
const DefectBadge = ({ type }) => {
  const map = {
    'loi_van_tai': { label: 'Lỗi vận chuyển', bg: '#fff3e0', color: '#e65100', border: '#ffb74d' },
    'loi_nha_may': { label: 'Lỗi nhà máy', bg: '#fce4ec', color: '#c62828', border: '#ef9a9a' },
  };
  const s = map[type] || { label: type, bg: '#f5f5f5', color: '#757575', border: '#bdbdbd' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 8px', borderRadius: radius.full,
      fontSize: 11, fontWeight: 700, border: `1px solid ${s.border}`,
      background: s.bg, color: s.color,
    }}>
      {s.label}
    </span>
  );
};

// ---- Modal overlay ----
const Modal = ({ children, onClose, maxW = 560 }) => {
  const overlayStyle = {
    position: 'fixed', inset: 0,
    background: 'rgba(15,23,42,0.5)',
    backdropFilter: 'blur(4px)',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    zIndex: 1000, padding: spacing.md,
    animation: 'fadeIn 200ms ease',
  };
  const panelStyle = {
    background: colors.white, borderRadius: radius.xl,
    boxShadow: shadows.xl, width: '100%', maxWidth: maxW,
    maxHeight: '90vh', overflowY: 'auto',
    animation: 'slideUp 250ms ease',
  };
  return (
    <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={panelStyle}>{children}</div>
    </div>
  );
};

// ---- Modal Header ----
const ModalHeader = ({ title, subtitle, icon, onClose, color = colors.primary }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: `${spacing.lg} ${spacing.lg} ${spacing.md}`,
    borderBottom: `1.5px solid ${colors.border}`,
  }}>
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      {icon && (
        <div style={{
          width: 44, height: 44, borderRadius: radius.lg,
          background: color + '18', color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {icon}
        </div>
      )}
      <div>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: colors.text }}>{title}</h2>
        {subtitle && <p style={{ margin: '2px 0 0', fontSize: 13, color: colors.textMuted }}>{subtitle}</p>}
      </div>
    </div>
    <button onClick={onClose} style={{
      width: 36, height: 36, borderRadius: radius.md,
      background: colors.backgroundAlt, color: colors.textSecondary,
      border: 'none', cursor: 'pointer', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      transition: 'all 200ms ease',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = colors.dangerSoft; e.currentTarget.style.color = colors.danger; }}
      onMouseLeave={e => { e.currentTarget.style.background = colors.backgroundAlt; e.currentTarget.style.color = colors.textSecondary; }}
    >
      <IconClose />
    </button>
  </div>
);

// ---- Form Field ----
const Field = ({ label, required, children, hint }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 700, color: colors.textSecondary }}>
      {label} {required && <span style={{ color: colors.danger }}>*</span>}
    </label>
    {children}
    {hint && <p style={{ margin: '4px 0 0', fontSize: 12, color: colors.textMuted }}>{hint}</p>}
  </div>
);

// ---- Form Input ----
const FormInput = ({ style: extraStyle, ...props }) => (
  <input
    {...props}
    style={{
      width: '100%', padding: '10px 14px',
      borderRadius: radius.md,
      border: `1.5px solid ${colors.border}`,
      background: colors.white, color: colors.text,
      fontSize: 14, outline: 'none',
      boxSizing: 'border-box',
      transition: 'border-color 200ms ease',
      ...extraStyle,
    }}
    onFocus={e => { e.target.style.borderColor = colors.primary; e.target.style.boxShadow = `0 0 0 3px ${colors.primary}22`; }}
    onBlur={e => { e.target.style.borderColor = colors.border; e.target.style.boxShadow = 'none'; }}
  />
);

const FormSelect = ({ style: extraStyle, children, ...props }) => (
  <select
    {...props}
    style={{
      width: '100%', padding: '10px 14px',
      borderRadius: radius.md,
      border: `1.5px solid ${colors.border}`,
      background: colors.white, color: colors.text,
      fontSize: 14, outline: 'none',
      boxSizing: 'border-box',
      transition: 'border-color 200ms ease',
      cursor: 'pointer',
      ...extraStyle,
    }}
    onFocus={e => { e.target.style.borderColor = colors.primary; }}
    onBlur={e => { e.target.style.borderColor = colors.border; }}
  >
    {children}
  </select>
);

// ============================================================

export default function WarehousesPage() {
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [defectiveOrders, setDefectiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewFilter, setViewFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWHModalOpen, setIsWHModalOpen] = useState(false);
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState(null);
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'defective'
  const [defectiveSearch, setDefectiveSearch] = useState('');
  const [defectiveFilterType, setDefectiveFilterType] = useState('all');
  const skuInputRef = useRef(null);

  // Form state
  const [editingId, setEditingId] = useState(null);
  const [newSku, setNewSku] = useState('');
  const [nextSku, setNextSku] = useState('');
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newUnit, setNewUnit] = useState('Cái');
  const [newCategory, setNewCategory] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newMinStock, setNewMinStock] = useState('50');
  const [searchText, setSearchText] = useState('');
  const [hoveredProductId, setHoveredProductId] = useState(null);
  const [initialStock, setInitialStock] = useState('');
  const [targetWarehouse, setTargetWarehouse] = useState('all');
  const [filterMode, setFilterMode] = useState('all');

  // Category management
  const [categories, setCategories] = useState(['Ống thép', 'Phụ kiện', 'Vật tư', 'Thiết bị']);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  // Warehouse form
  const [whName, setWhName] = useState('');
  const [whLocation, setWhLocation] = useState('');

  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  const canEdit = user?.role_id === 1 || user?.role_id === 4;

  // ---- Fetch data ----
  const fetchData = async () => {
    try {
      const [pRes, wRes, dRes] = await Promise.all([
        api.get('/products'),
        api.get('/warehouses'),
        api.get('/warehouses/defective-orders'),
      ]);
      setProducts(pRes.data);
      setWarehouses(wRes.data);
      setDefectiveOrders(dRes.data);
    } catch (error) {
      console.error('Lỗi tải dữ liệu:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isModalOpen && !isWHModalOpen) return;
    const onKeyDown = (e) => { if (e.key === 'Escape') { setIsModalOpen(false); setIsWHModalOpen(false); } };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isModalOpen, isWHModalOpen]);

  useEffect(() => {
    if (location.state?.filter === 'low-stock') setFilterMode('low-stock');
    if (location.state?.filter === 'all-stock') setFilterMode('all');
  }, [location.state]);

  // ---- Helpers ----
  const parseStockBreakdown = (breakdown = '') =>
    String(breakdown).split(' | ').map(e => e.trim()).filter(Boolean).map(entry => {
      const [warehouseName, qtyText] = entry.split(': ');
      return { warehouseName: warehouseName?.trim() || '', quantity: Number.parseInt(qtyText, 10) || 0 };
    }).filter(e => e.warehouseName);

  const selectedWarehouse = warehouses.find(w => String(w.id) === String(viewFilter));

  const getWarehouseStockRows = (item) => {
    const rows = parseStockBreakdown(item.stock_breakdown);
    if (viewFilter === 'all') return rows;
    return rows.filter(r => r.warehouseName === selectedWarehouse?.name);
  };

  const getDisplayQty = (item) => {
    const totalQty = Number(item.total_stock || item.stock || 0);
    if (viewFilter === 'all') return totalQty;
    return getWarehouseStockRows(item)[0]?.quantity || 0;
  };

  const getStockStatus = (qty, minStock) => {
    if (qty <= 0) return 'out-stock';
    if (qty < minStock) return 'low-stock';
    return 'in-stock';
  };

  const getWarehouseAlerts = (item) => {
    const minStock = Number(item.min_stock) || 50;
    return parseStockBreakdown(item.stock_breakdown)
      .map(r => ({ ...r, status: getStockStatus(r.quantity, minStock), minStock }))
      .filter(r => r.status !== 'in-stock');
  };

  const filteredProducts = products.filter(item => {
    const minStock = Number(item.min_stock) || 50;
    const totalQty = Number(item.total_stock || item.stock || 0);
    const warehouseRows = getWarehouseStockRows(item);
    const viewQty = viewFilter === 'all' ? totalQty : (warehouseRows[0]?.quantity || 0);
    const viewStatus = getStockStatus(viewQty, minStock);
    const warehouseAlerts = getWarehouseAlerts(item);
    const hasLow = warehouseAlerts.some(r => r.status === 'low-stock');
    const hasOut = warehouseAlerts.some(r => r.status === 'out-stock');

    const matchesStatus =
      filterMode === 'all' ||
      (filterMode === 'low-stock' && (viewFilter === 'all' ? hasLow : viewStatus === 'low-stock')) ||
      (filterMode === 'out-stock' && (viewFilter === 'all' ? hasOut : viewStatus === 'out-stock'));

    const search = searchText.trim().toLowerCase();
    const matchesSearch = !search ||
      [item.name, item.sku, item.category].some(v => String(v || '').toLowerCase().includes(search));
    return matchesStatus && matchesSearch;
  });

  // ---- Defective orders filtering ----
  const filteredDefectiveOrders = defectiveOrders.filter(item => {
    const search = defectiveSearch.trim().toLowerCase();
    const matchesSearch = !search ||
      String(item.order_no || '').toLowerCase().includes(search) ||
      String(item.customer_name || '').toLowerCase().includes(search);
    const matchesType = defectiveFilterType === 'all' || item.logistics_action === defectiveFilterType;
    return matchesSearch && matchesType;
  });

  // ---- Actions ----
  const openAddModal = async () => {
    setEditingId(null);
    setNewSku('');
    setNewName(''); setNewPrice(''); setNewUnit('Cái');
    setNewCategory(''); setNewImageUrl(''); setNewMinStock('50');
    setInitialStock(0); setTargetWarehouse('all');
    try {
      const res = await api.get('/products/next-code');
      setNextSku(res.data.sku || '');
    } catch {
      setNextSku('');
    }
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingId(product.id);
    setNewSku(product.sku || '');
    setNewName(product.name);
    setNewPrice(product.sale_price);
    setNewUnit(product.unit || 'Cái');
    setNewCategory(product.category || '');
    setNewImageUrl(product.image_url || '');
    setNewMinStock(String(product.min_stock ?? 50));
    setInitialStock('');
    setTargetWarehouse(warehouses[0]?.id || '');
    setIsModalOpen(true);
  };

  const handleAddWarehouse = async (e) => {
    e.preventDefault();
    try {
      await api.post('/warehouses', { name: whName, location: whLocation });
      setIsWHModalOpen(false); setWhName(''); setWhLocation('');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    }
  };

  const handleAddCategory = () => {
    const name = newCategoryInput.trim();
    if (!name) return;
    if (categories.includes(name)) {
      alert('Danh mục này đã tồn tại!');
      return;
    }
    setCategories(prev => [...prev, name]);
    setNewCategory(name);
    setIsCategoryModalOpen(false);
    setNewCategoryInput('');
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, {
          sku: newSku, name: newName, sale_price: newPrice, unit: newUnit,
          category: newCategory, image_url: newImageUrl, min_stock: newMinStock,
          adjust_stock: initialStock, target_warehouse: targetWarehouse,
        });
      } else {
        await api.post('/products', {
          sku: nextSku,
          name: newName, sale_price: newPrice, unit: newUnit,
          category: newCategory, image_url: newImageUrl, min_stock: newMinStock,
          initial_stock: initialStock, warehouse_id: targetWarehouse,
        });
      }
      setIsModalOpen(false); fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi khi lưu sản phẩm');
    }
  };

  const confirmDeleteProduct = async () => {
    if (!deleteConfirmProduct) return;
    try {
      await api.delete(`/products/${deleteConfirmProduct.id}`);
      setDeleteConfirmProduct(null); fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi khi xóa sản phẩm');
    }
  };

  // ---- Excel Export for Defective Orders ----
  const handleExportDefective = () => {
    const headers = ['Mã đơn', 'Khách hàng', 'Loại lỗi', 'Ngày tạo', 'Kho gốc', 'Sản phẩm', 'Số lượng', 'Đơn giá', 'Thành tiền'];
    const rows = filteredDefectiveOrders.map(item => {
      const items = item.order_items || [];
      const productLines = items.map(i =>
        `${i.product_name || ''} (${i.sku || ''}) x${i.quantity}`
      ).join('; ');
      const total = items.reduce((sum, i) => sum + (Number(i.quantity) * Number(i.unit_price || 0)), 0);
      return [
        item.order_no || '',
        item.customer_name || '',
        item.logistics_action === 'loi_van_tai' ? 'Lỗi vận chuyển' : 'Lỗi nhà máy',
        fmtDate(item.created_at),
        item.warehouse_name || '—',
        productLines,
        items.reduce((sum, i) => sum + Number(i.quantity || 0), 0),
        fmtVND(total),
        fmtVND(total),
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `KhoLoi_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const isFiltered = viewFilter !== 'all' || filterMode !== 'all' || searchText.trim();

  return (
    <div style={pageWrap}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) scale(0.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
        .product-card:hover .card-actions { opacity: 1 !important; }
        @media (max-width: 640px) {
          .prod-wrap { padding: 8px !important; }
          .prod-header { flex-direction: column !important; align-items: flex-start !important; }
          .prod-header-btns { width: 100% !important; }
          .prod-header-btns > * { flex: 1 !important; }
          .prod-filter-row { grid-template-columns: 1fr !important; }
          .prod-filter-row > * { min-width: 0; }
          .prod-status-pills { flex-wrap: wrap !important; }
          .prod-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)) !important; gap: 10px !important; }
          .prod-card-img { height: 100px !important; }
          .prod-card-body { padding: 8px !important; }
          .prod-card-title { font-size: 12px !important; line-height: 1.2 !important; }
          .prod-card-price { font-size: 11px !important; }
          .prod-card-qty { font-size: 16px !important; }
          .prod-page-title { font-size: 20px !important; }
          .prod-filter-bar { padding: 12px !important; }
          .prod-header-btns > button { font-size: 12px !important; padding: 8px 12px !important; }
        }
        @media (min-width: 641px) and (max-width: 1024px) {
          .prod-grid { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)) !important; gap: 12px !important; }
          .prod-card-img { height: 150px !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1440, margin: '0 auto' }} className="prod-wrap">

        {/* ---- PAGE HEADER ---- */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          flexWrap: 'wrap', gap: 16, marginBottom: 24,
          animation: 'fadeUp 400ms ease both',
        }} className="prod-header">
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: radius.full,
              background: colors.primarySoft, color: colors.primary,
              fontSize: 12, fontWeight: 700, marginBottom: 10,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors.primary }} />
              Quản lý
            </div>
            <h1 className="prod-page-title" style={{ margin: 0, fontSize: 30, fontWeight: 900, color: colors.text, letterSpacing: '-0.03em' }}>
              Quản lý Kho
            </h1>
            <p style={{ margin: '6px 0 0', color: colors.textMuted, fontSize: 14 }}>
              {loading ? 'Đang tải...' : activeTab === 'inventory'
                ? `${filteredProducts.length} / ${products.length} sản phẩm`
                : `${filteredDefectiveOrders.length} đơn lỗi`}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }} className="prod-header-btns">
            {canEdit && (
              <>
                <button
                  onClick={() => setIsWHModalOpen(true)}
                  style={{
                    ...btn('secondary', 'md'),
                    borderColor: colors.purpleBorder,
                    color: colors.purple,
                  }}
                >
                  <IconWarehouse /> Kho
                </button>
                <button onClick={openAddModal} style={btn('primary', 'md')}>
                  <IconPlus /> Thêm sản phẩm
                </button>
              </>
            )}
          </div>
        </div>

        {/* ---- TAB SWITCHER ---- */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: 20,
          background: colors.backgroundAlt, padding: 4,
          borderRadius: radius.lg, width: 'fit-content',
          animation: 'fadeUp 400ms ease 40ms both',
        }}>
          {[
            { key: 'inventory', label: 'Tồn kho', icon: <IconPackage /> },
            { key: 'defective', label: 'Kho lỗi', icon: <IconWarning />, count: defectiveOrders.length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 18px',
                borderRadius: radius.md,
                border: 'none',
                background: activeTab === tab.key ? colors.white : 'transparent',
                color: activeTab === tab.key ? colors.primary : colors.textSecondary,
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                boxShadow: activeTab === tab.key ? shadows.sm : 'none',
                transition: 'all 200ms ease',
              }}
            >
              {tab.icon}
              {tab.label}
              {tab.count > 0 && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  minWidth: 20, height: 20, padding: '0 6px',
                  borderRadius: radius.full,
                  background: activeTab === tab.key ? colors.primarySoft : colors.dangerSoft,
                  color: activeTab === tab.key ? colors.primary : colors.danger,
                  fontSize: 11, fontWeight: 800,
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* =================== TAB: TỒN KHO =================== */}
        {activeTab === 'inventory' && (
          <>
        {/* ---- FILTER BAR ---- */}
        <div style={{
          ...card({ marginBottom: 20, padding: '16px 20px' }),
          animation: 'fadeUp 400ms ease 80ms both',
        }}>
          {/* Search + Filter Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0,2fr) minmax(0,1.5fr) minmax(0,1fr)',
            gap: 12, alignItems: 'center',
          }} className="prod-filter-row">
            {/* Search */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '0 14px',
              border: `1.5px solid ${colors.border}`,
              borderRadius: radius.md, background: colors.backgroundAlt,
              height: 44, transition: 'border-color 200ms',
            }}
              onFocus={e => e.currentTarget.style.borderColor = colors.primary}
              onBlur={e => e.currentTarget.style.borderColor = colors.border}
            >
              <span style={{ color: colors.textMuted, flexShrink: 0 }}><IconSearch /></span>
              <input
                placeholder="Tìm tên, mã SKU, danh mục..."
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                style={{
                  border: 'none', background: 'transparent', width: '100%',
                  outline: 'none', color: colors.text, fontSize: 14,
                }}
              />
              {searchText && (
                <button onClick={() => setSearchText('')} style={{
                  border: 'none', background: 'none', cursor: 'pointer',
                  color: colors.textMuted, padding: 0, display: 'flex',
                }}>
                  <IconClose size={14} />
                </button>
              )}
            </div>

            {/* Status filter pills */}
            <div style={{ display: 'flex', gap: 6 }} className="prod-status-pills">
              {[
                { key: 'all', label: 'Tất cả', color: colors.textSecondary },
                { key: 'low-stock', label: 'Sắp hết', color: colors.warning },
                { key: 'out-stock', label: 'Hết hàng', color: colors.danger },
              ].map(f => (
                <button key={f.key} onClick={() => setFilterMode(f.key)} style={{
                  padding: '8px 14px', borderRadius: radius.md,
                  border: `1.5px solid ${filterMode === f.key ? f.color : 'transparent'}`,
                  background: filterMode === f.key ? f.color + '15' : colors.backgroundAlt,
                  color: filterMode === f.key ? f.color : colors.textMuted,
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  transition: 'all 200ms ease',
                }}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* Warehouse filter */}
            <FormSelect
              value={viewFilter}
              onChange={e => setViewFilter(e.target.value)}
              style={{ height: 44 }}
            >
              <option value="all">Tất cả kho</option>
              {warehouses.filter(w => w.warehouse_code !== 'KHO-LOI').map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </FormSelect>
          </div>

          {/* Filter status bar */}
          {isFiltered && (
            <div style={{
              marginTop: 12, paddingTop: 12,
              borderTop: `1px solid ${colors.borderLight}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: 13, color: colors.textMuted }}>
                Đang lọc {filteredProducts.length} kết quả
              </span>
              <button
                onClick={() => { setViewFilter('all'); setFilterMode('all'); setSearchText(''); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '5px 12px', borderRadius: radius.md,
                  border: `1.5px solid ${colors.border}`,
                  background: colors.white, color: colors.textSecondary,
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                <IconClose size={12} /> Xóa lọc
              </button>
            </div>
          )}
        </div>

        {/* ---- PRODUCT GRID ---- */}
        {loading ? (
          <div style={{ ...card(), textAlign: 'center', padding: 60, color: colors.textMuted }}>
            <div style={{ marginBottom: 12, opacity: 0.5 }}><IconPackage /></div>
            <p>Đang tải dữ liệu sản phẩm...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{
            ...card(), textAlign: 'center', padding: 60,
            animation: 'fadeUp 400ms ease 120ms both',
          }}>
            <div style={{ color: colors.textMuted, marginBottom: 12, opacity: 0.4 }}><IconPackage /></div>
            <p style={{ fontWeight: 700, color: colors.text }}>Chưa có sản phẩm nào</p>
            <p style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>
              {isFiltered ? 'Thử thay đổi bộ lọc để xem thêm sản phẩm.' : 'Bấm "Thêm sản phẩm" để bắt đầu.'}
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 16, marginBottom: 32,
          }} className="prod-grid">
            {filteredProducts.map((item, i) => {
              const minStock = Number(item.min_stock) || 50;
              const displayQty = getDisplayQty(item);
              const status = getStockStatus(displayQty, minStock);
              const warehouseAlerts = getWarehouseAlerts(item);
              const activeWarehouseName = viewFilter === 'all' ? null : selectedWarehouse?.name;
              const activeAlert = activeWarehouseName
                ? warehouseAlerts.find(r => r.warehouseName === activeWarehouseName)
                : null;
              const warehouseSummary = activeAlert
                ? `${activeAlert.warehouseName}: ${activeAlert.status === 'out-stock' ? 'hết' : 'sắp hết'} (${activeAlert.quantity}/${minStock})`
                : null;

              return (
                <div
                  key={item.id}
                  className="product-card"
                  style={{
                    ...card({ padding: 0, overflow: 'hidden' }),
                    animation: `fadeUp 400ms ease ${80 + i * 40}ms both`,
                    transition: 'transform 220ms ease, box-shadow 220ms ease',
                    cursor: 'default',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = shadows.lg;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = shadows.md;
                  }}
                >
                  {/* Image */}
                  <div style={{
                    height: 220, position: 'relative', overflow: 'hidden',
                    background: item.image_url
                      ? `url(${item.image_url}) center/cover no-repeat`
                      : `linear-gradient(160deg, ${colors.primarySoft} 0%, #e8edf8 60%, ${colors.primarySoft}88 100%)`,
                    borderBottom: `1px solid ${colors.borderLight}`,
                  }} className="prod-card-img">
                    {!item.image_url && (
                      <div style={{
                        position: 'absolute', inset: 0, display: 'flex',
                        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        color: colors.primary, gap: 6,
                      }}>
                        <IconPackage />
                        <span style={{ fontSize: 11, fontWeight: 600, color: colors.primary, opacity: 0.6 }}>Chưa có ảnh</span>
                      </div>
                    )}
                    {/* SKU chip */}
                    <div style={{
                      position: 'absolute', top: 10, left: 10,
                      padding: '3px 8px', borderRadius: radius.full,
                      background: 'rgba(255,255,255,0.9)',
                      backdropFilter: 'blur(8px)',
                      fontSize: 11, fontWeight: 700, color: colors.text,
                      fontFamily: 'monospace',
                    }}>
                      {item.sku}
                    </div>
                    {/* Status badge */}
                    <div style={{ position: 'absolute', top: 10, right: 10 }}>
                      <StockBadge status={status} />
                    </div>
                  </div>

                  {/* Content */}
                  <div style={{ padding: '18px 18px 18px' }} className="prod-card-body">
                    <h3 className="prod-card-title" style={{
                      margin: '0 0 8px', fontSize: 15, fontWeight: 800,
                      color: colors.text, lineHeight: 1.3,
                      display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {item.name}
                    </h3>

                    {/* Category */}
                    {item.category && (
                      <span style={{
                        display: 'inline-block', marginBottom: 10,
                        padding: '3px 8px', borderRadius: radius.full,
                        background: colors.primarySoft, color: colors.primary,
                        fontSize: 11, fontWeight: 700,
                      }}>
                        {item.category}
                      </span>
                    )}

                    {/* Warehouse alert */}
                    {warehouseSummary && (
                      <div style={{
                        marginBottom: 10, padding: '7px 10px', borderRadius: radius.md,
                        background: colors.warningSoft, border: `1px solid ${colors.warningBorder}`,
                        fontSize: 11, color: colors.warning, fontWeight: 600,
                      }}>
                        <IconWarning /> {warehouseSummary}
                      </div>
                    )}

                    {/* Price + Stock row */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                      paddingTop: 10, borderTop: `1px solid ${colors.borderLight}`,
                      marginTop: 4,
                    }}>
                      <div>
                        <div style={{ fontSize: 11, color: colors.textMuted }}>Đơn giá</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: colors.success }} className="prod-card-price">{fmtVND(item.sale_price)} đ</div>
                        <div style={{ fontSize: 11, color: colors.textMuted }}>/{item.unit}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontSize: 22, fontWeight: 900,
                          color: status === 'out-stock' ? colors.danger : status === 'low-stock' ? colors.warning : colors.text,
                        }} className="prod-card-qty">
                          {displayQty}
                        </div>
                        <div style={{ fontSize: 11, color: colors.textMuted }}>Tồn kho</div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    {canEdit && (
                      <div
                        className="card-actions"
                        style={{
                          display: 'flex', gap: 8, marginTop: 12,
                          opacity: hoveredProductId === item.id ? 1 : 0,
                          transition: 'opacity 200ms ease',
                        }}
                      >
                        <button
                          onClick={() => openEditModal(item)}
                          style={{
                            flex: 1, height: 36, borderRadius: radius.md,
                            border: `1.5px solid ${colors.primaryBorder}`,
                            background: colors.primarySoft, color: colors.primary,
                            fontSize: 13, fontWeight: 700, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                          }}
                        >
                          <IconEdit /> Sửa
                        </button>
                        <button
                          onClick={() => setDeleteConfirmProduct(item)}
                          style={{
                            width: 38, height: 36, borderRadius: radius.md,
                            border: `1.5px solid ${colors.dangerBorder}`,
                            background: colors.dangerSoft, color: colors.danger,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <IconTrash />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
          </>
        )}

        {/* =================== TAB: KHO LỖI =================== */}
        {activeTab === 'defective' && (
          <div style={{ animation: 'fadeUp 400ms ease both' }}>
            {/* Filter bar for defective */}
            <div style={{
              ...card({ marginBottom: 20, padding: '16px 20px' }),
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                gap: 12, flexWrap: 'wrap',
              }}>
                <div style={{
                  display: 'flex', gap: 8, flexWrap: 'wrap', flex: 1,
                }}>
                  {/* Search */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '0 14px',
                    border: `1.5px solid ${colors.border}`,
                    borderRadius: radius.md, background: colors.backgroundAlt,
                    height: 40, minWidth: 220, flex: 1,
                    transition: 'border-color 200ms',
                  }}
                    onFocus={e => e.currentTarget.style.borderColor = colors.primary}
                    onBlur={e => e.currentTarget.style.borderColor = colors.border}
                  >
                    <span style={{ color: colors.textMuted, flexShrink: 0 }}><IconSearch /></span>
                    <input
                      placeholder="Tìm mã đơn, khách hàng..."
                      value={defectiveSearch}
                      onChange={e => setDefectiveSearch(e.target.value)}
                      style={{
                        border: 'none', background: 'transparent', width: '100%',
                        outline: 'none', color: colors.text, fontSize: 14,
                      }}
                    />
                    {defectiveSearch && (
                      <button onClick={() => setDefectiveSearch('')} style={{
                        border: 'none', background: 'none', cursor: 'pointer',
                        color: colors.textMuted, padding: 0, display: 'flex',
                      }}>
                        <IconClose size={14} />
                      </button>
                    )}
                  </div>

                  {/* Type filter */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[
                      { key: 'all', label: 'Tất cả' },
                      { key: 'loi_van_tai', label: 'Lỗi vận chuyển' },
                      { key: 'loi_nha_may', label: 'Lỗi nhà máy' },
                    ].map(f => (
                      <button key={f.key} onClick={() => setDefectiveFilterType(f.key)} style={{
                        padding: '7px 14px', borderRadius: radius.md,
                        border: `1.5px solid ${defectiveFilterType === f.key ? (f.key === 'loi_van_tai' ? '#e65100' : f.key === 'loi_nha_may' ? '#c62828' : colors.primary) : 'transparent'}`,
                        background: defectiveFilterType === f.key ? (f.key === 'loi_van_tai' ? '#fff3e0' : f.key === 'loi_nha_may' ? '#fce4ec' : colors.primarySoft) : colors.backgroundAlt,
                        color: defectiveFilterType === f.key ? (f.key === 'loi_van_tai' ? '#e65100' : f.key === 'loi_nha_may' ? '#c62828' : colors.primary) : colors.textMuted,
                        fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        transition: 'all 200ms ease',
                        whiteSpace: 'nowrap',
                      }}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Export Excel */}
                <button
                  onClick={handleExportDefective}
                  style={{
                    ...btn('secondary', 'md'),
                    display: 'flex', alignItems: 'center', gap: 6,
                    borderColor: colors.successBorder, color: colors.success,
                  }}
                >
                  <IconDownload /> Xuất Excel
                </button>
              </div>
            </div>

            {/* Defective orders table */}
            {loading ? (
              <div style={{ ...card(), textAlign: 'center', padding: 60, color: colors.textMuted }}>
                <p>Đang tải dữ liệu...</p>
              </div>
            ) : filteredDefectiveOrders.length === 0 ? (
              <div style={{ ...card(), textAlign: 'center', padding: 60 }}>
                <div style={{ color: colors.textMuted, marginBottom: 12, opacity: 0.4 }}><IconWarning /></div>
                <p style={{ fontWeight: 700, color: colors.text }}>Chưa có đơn lỗi nào</p>
                <p style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>
                  {defectiveSearch || defectiveFilterType !== 'all' ? 'Thử thay đổi bộ lọc.' : 'Các đơn lỗi sẽ xuất hiện tại đây khi có sự cố.'}
                </p>
              </div>
            ) : (
              <div style={{ ...card({ padding: 0 }), overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: colors.backgroundAlt }}>
                        {[
                          'Mã đơn', 'Khách hàng', 'Loại lỗi', 'Ngày tạo', 'Kho gốc', 'Sản phẩm', 'Tổng SL', 'Thành tiền', 'Trạng thái'
                        ].map(h => (
                          <th key={h} style={{
                            padding: '12px 16px', textAlign: 'left',
                            fontWeight: 700, color: colors.textSecondary,
                            borderBottom: `1.5px solid ${colors.border}`,
                            whiteSpace: 'nowrap',
                          }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDefectiveOrders.map((item, i) => {
                        const items = item.order_items || [];
                        const totalQty = items.reduce((s, it) => s + Number(it.quantity || 0), 0);
                        const totalAmount = items.reduce((s, it) => s + Number(it.quantity || 0) * Number(it.unit_price || 0), 0);
                        const isEven = i % 2 === 0;
                        return (
                          <tr key={item.id} style={{
                            background: isEven ? colors.white : colors.backgroundAlt,
                            transition: 'background 150ms',
                          }}
                            onMouseEnter={e => e.currentTarget.style.background = colors.primarySoft + '40'}
                            onMouseLeave={e => e.currentTarget.style.background = isEven ? colors.white : colors.backgroundAlt}
                          >
                            <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 700, color: colors.primary }}>
                              {item.order_no || '—'}
                            </td>
                            <td style={{ padding: '12px 16px', fontWeight: 600, color: colors.text }}>
                              {item.customer_name || '—'}
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <DefectBadge type={item.logistics_action} />
                            </td>
                            <td style={{ padding: '12px 16px', color: colors.textSecondary, whiteSpace: 'nowrap' }}>
                              {fmtDate(item.created_at)}
                            </td>
                            <td style={{ padding: '12px 16px', color: colors.textSecondary }}>
                              {item.warehouse_name || '—'}
                            </td>
                            <td style={{ padding: '12px 16px', maxWidth: 240 }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                {items.slice(0, 3).map((it, idx) => (
                                  <span key={idx} style={{ fontSize: 12, color: colors.text }}>
                                    {it.product_name || '—'} <span style={{ color: colors.textMuted }}>(x{it.quantity})</span>
                                  </span>
                                ))}
                                {items.length > 3 && (
                                  <span style={{ fontSize: 11, color: colors.textMuted, fontStyle: 'italic' }}>
                                    +{items.length - 3} sản phẩm khác
                                  </span>
                                )}
                              </div>
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: colors.danger }}>
                              {totalQty}
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: colors.success }}>
                              {fmtVND(totalAmount)} đ
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{
                                padding: '3px 10px', borderRadius: radius.full,
                                fontSize: 11, fontWeight: 700,
                                background: item.status === 'return_completed' ? colors.successSoft : colors.warningSoft,
                                color: item.status === 'return_completed' ? colors.success : colors.warning,
                                border: `1px solid ${item.status === 'return_completed' ? colors.successBorder : colors.warningBorder}`,
                              }}>
                                {item.status === 'return_completed' ? 'Đã xử lý' : 'Chờ xử lý'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Summary footer */}
                <div style={{
                  padding: '12px 20px', borderTop: `1.5px solid ${colors.border}`,
                  display: 'flex', justifyContent: 'flex-end', gap: 24,
                  background: colors.backgroundAlt, fontSize: 13,
                }}>
                  <span style={{ color: colors.textMuted }}>
                    Tổng cộng: <strong style={{ color: colors.text }}>{filteredDefectiveOrders.length} đơn lỗi</strong>
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---- MODAL: ADD / EDIT PRODUCT ---- */}
        {isModalOpen && (
          <Modal onClose={() => setIsModalOpen(false)} maxW={560}>
            <ModalHeader
              title={editingId ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
              subtitle={editingId ? 'Cập nhật thông tin và tồn kho' : 'Nhập thông tin sản phẩm mới'}
              icon={editingId ? <IconEdit /> : <IconPackage />}
              color={editingId ? colors.warning : colors.success}
              onClose={() => setIsModalOpen(false)}
            />
            <div style={{ padding: spacing.lg }}>
              <form onSubmit={handleSubmitProduct}>

                {/* SKU + Unit */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 4 }}>
                  <Field label="Mã SKU" required>
                    <FormInput
                      readOnly
                      value={editingId !== null ? newSku : nextSku}
                      placeholder="VD: SP-0001"
                      style={{
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        background: colors.primarySoft,
                        borderColor: colors.primaryBorder,
                        cursor: 'default',
                      }}
                    />
                  </Field>
                  <Field label="Đơn vị" required>
                    <FormSelect value={newUnit} onChange={e => setNewUnit(e.target.value)}>
                      {['Cái', 'Bộ', 'Hộp', 'Kg', 'Lít', 'Mét', 'Chiếc', 'Bó'].map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </FormSelect>
                  </Field>
                </div>

                <Field label="Tên sản phẩm" required>
                  <FormInput value={newName} onChange={e => setNewName(e.target.value)} placeholder="VD: Bàn phím cơ Logitech MX" />
                </Field>

                <Field label="Danh mục">
                  <div style={{ display: 'flex', gap: 8 }}>
                    <FormSelect
                      value={newCategory}
                      onChange={e => setNewCategory(e.target.value)}
                      style={{ flex: 1 }}
                    >
                      <option value="">-- Chọn danh mục --</option>
                      {categories.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </FormSelect>
                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(true)}
                      style={{
                        height: 42, padding: '0 14px',
                        borderRadius: radius.md,
                        border: `1.5px solid ${colors.primaryBorder}`,
                        background: colors.primarySoft, color: colors.primary,
                        fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 5,
                        flexShrink: 0,
                      }}
                    >
                      <IconPlus /> Thêm
                    </button>
                  </div>
                </Field>

                <Field label="Ảnh sản phẩm" hint="Dán URL ảnh sản phẩm">
                  <FormInput
                    type="url"
                    value={newImageUrl}
                    onChange={e => setNewImageUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </Field>

                {/* Price + Stock + MinStock */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <Field label="Đơn giá (đ)" required>
                    <FormInput
                      type="number" min="0"
                      value={newPrice}
                      onChange={e => setNewPrice(e.target.value)}
                      placeholder="320000"
                    />
                  </Field>
                  <Field label={editingId ? 'Tồn mới' : 'Tồn ban đầu'} hint={editingId ? 'Đặt lại tồn kho' : 'Nhập số lượng ban đầu'}>
                    <FormInput
                      type="number" min="0"
                      value={initialStock}
                      onChange={e => setInitialStock(e.target.value)}
                      placeholder="0"
                    />
                  </Field>
                  <Field label="Tồn tối thiểu" hint="Cảnh báo khi dưới mức">
                    <FormInput
                      type="number" min="0"
                      value={newMinStock}
                      onChange={e => setNewMinStock(e.target.value)}
                      placeholder="50"
                    />
                  </Field>
                </div>

                {/* Warehouse selector */}
                <Field label={editingId ? 'Kho điều chỉnh tồn' : 'Nhập kho ban đầu'}>
                  <FormSelect value={targetWarehouse} onChange={e => setTargetWarehouse(e.target.value)}>
                    {!editingId && <option value="all">Rải đều tất cả kho</option>}
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>
                        {editingId ? 'Kho: ' : 'Nhập vào: '}{w.name}
                      </option>
                    ))}
                  </FormSelect>
                </Field>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 10, marginTop: 24, paddingTop: 16, borderTop: `1px solid ${colors.border}` }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} style={btn('secondary', 'md')}>
                    Hủy bỏ
                  </button>
                  <button type="submit" style={{ ...btn(editingId ? 'primary' : 'success', 'md'), flex: 1 }}>
                    <IconCheck /> {editingId ? 'Lưu thay đổi' : 'Lưu sản phẩm'}
                  </button>
                </div>
              </form>
            </div>
          </Modal>
        )}

        {/* ---- MODAL: ADD WAREHOUSE ---- */}
        {isWHModalOpen && (
          <Modal onClose={() => setIsWHModalOpen(false)} maxW={420}>
            <ModalHeader
              title="Mở kho hàng mới"
              subtitle="Thêm một kho để phân bổ tồn kho"
              icon={<IconWarehouse />}
              color={colors.purple}
              onClose={() => setIsWHModalOpen(false)}
            />
            <div style={{ padding: spacing.lg }}>
              <form onSubmit={handleAddWarehouse}>
                <Field label="Tên kho" required>
                  <FormInput
                    value={whName}
                    onChange={e => setWhName(e.target.value)}
                    placeholder="VD: Kho Bình Dương 2"
                    autoFocus
                  />
                </Field>
                <Field label="Vị trí / Địa chỉ">
                  <FormInput
                    value={whLocation}
                    onChange={e => setWhLocation(e.target.value)}
                    placeholder="VD: Số 5, KCN Sóng Thần, Bình Dương"
                  />
                </Field>
                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <button type="button" onClick={() => setIsWHModalOpen(false)} style={btn('secondary', 'md')}>
                    Hủy
                  </button>
                  <button type="submit" style={{ ...btn('primary', 'md'), flex: 1, background: colors.purple }}>
                    <IconPlus /> Lưu kho
                  </button>
                </div>
              </form>
            </div>
          </Modal>
        )}

        {/* ---- MODAL: ADD CATEGORY ---- */}
        {isCategoryModalOpen && (
          <Modal onClose={() => { setIsCategoryModalOpen(false); setNewCategoryInput(''); }} maxW={380}>
            <ModalHeader
              title="Thêm danh mục mới"
              subtitle="Nhập tên danh mục sản phẩm"
              icon={<IconPlus />}
              color={colors.primary}
              onClose={() => { setIsCategoryModalOpen(false); setNewCategoryInput(''); }}
            />
            <div style={{ padding: spacing.lg }}>
              <Field label="Tên danh mục" required>
                <FormInput
                  value={newCategoryInput}
                  onChange={e => setNewCategoryInput(e.target.value)}
                  placeholder="VD: Thiết bị điện"
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); } }}
                />
              </Field>
              <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {categories.map(c => (
                  <span key={c} style={{
                    padding: '4px 10px', borderRadius: radius.full,
                    background: colors.backgroundAlt, color: colors.textSecondary,
                    fontSize: 12, fontWeight: 600,
                  }}>
                    {c}
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button
                  type="button"
                  onClick={() => { setIsCategoryModalOpen(false); setNewCategoryInput(''); }}
                  style={btn('secondary', 'md')}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleAddCategory}
                  style={{ ...btn('primary', 'md'), flex: 1 }}
                >
                  <IconPlus /> Thêm danh mục
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* ---- MODAL: DELETE CONFIRM ---- */}
        {deleteConfirmProduct && (
          <Modal onClose={() => setDeleteConfirmProduct(null)} maxW={440}>
            <div style={{ padding: spacing.lg }}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: colors.dangerSoft,
                  color: colors.danger,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <IconAlertTriangle />
                </div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: colors.text }}>Xóa sản phẩm?</h2>
                <p style={{ margin: '8px 0 0', fontSize: 14, color: colors.textMuted, lineHeight: 1.6 }}>
                  Bạn có chắc muốn xóa <strong style={{ color: colors.text }}>{deleteConfirmProduct.name}</strong>?<br />
                  Chỉ xóa được khi chưa phát sinh tồn kho.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setDeleteConfirmProduct(null)}
                  style={btn('secondary', 'md')}
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={confirmDeleteProduct}
                  style={{ ...btn('danger', 'md'), flex: 1 }}
                >
                  <IconTrash /> Xóa sản phẩm
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}
