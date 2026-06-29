import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';

export default function ProductsPage() {
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewFilter, setViewFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWHModalOpen, setIsWHModalOpen] = useState(false);
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState(null);
  const skuInputRef = useRef(null);
  
  // State sản phẩm (Dùng chung cho Thêm mới & Sửa)
  const [editingId, setEditingId] = useState(null); // Track xem đang Thêm hay Sửa
  const [newSku, setNewSku] = useState('');
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newUnit, setNewUnit] = useState('cái');
  const [newCategory, setNewCategory] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newMinStock, setNewMinStock] = useState('50');
  const [searchText, setSearchText] = useState('');
  const [hoveredProductId, setHoveredProductId] = useState(null);
  
  // State quản lý tồn kho (initial_stock cho Thêm, adjust_stock cho Sửa)
  const [initialStock, setInitialStock] = useState('');
  const [targetWarehouse, setTargetWarehouse] = useState('all');
  const [filterMode, setFilterMode] = useState('all');

  // State thêm kho
  const [whName, setWhName] = useState('');
  const [whLocation, setWhLocation] = useState('');

  // Phân quyền: Role 1 (Admin) và 4 (Kho) được quyền sửa/xóa
  const user = JSON.parse(localStorage.getItem('user'));
  const canEdit = user?.role_id === 1 || user?.role_id === 4;

  const fetchData = async () => {
    try {
      const [pRes, wRes] = await Promise.all([api.get('/products'), api.get('/warehouses')]);
      const allProducts = pRes.data;
      setProducts(allProducts);
      setWarehouses(wRes.data);
      setViewFilter('all');
    } catch (error) { 
      console.error('Lỗi tải dữ liệu:', error); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (isModalOpen) {
      const timer = window.setTimeout(() => skuInputRef.current?.focus(), 80);
      const onKeyDown = (event) => {
        if (event.key === 'Escape') setIsModalOpen(false);
      };
      window.addEventListener('keydown', onKeyDown);
      return () => {
        window.clearTimeout(timer);
        window.removeEventListener('keydown', onKeyDown);
      };
    }

    if (isWHModalOpen) {
      const onKeyDown = (event) => {
        if (event.key === 'Escape') setIsWHModalOpen(false);
      };
      window.addEventListener('keydown', onKeyDown);
      return () => window.removeEventListener('keydown', onKeyDown);
    }

    return undefined;
  }, [isModalOpen, isWHModalOpen]);

  useEffect(() => {
    if (location.state?.filter === 'low-stock') setFilterMode('low-stock');
    if (location.state?.filter === 'all-stock') setFilterMode('all');
  }, [location.state]);

  // --- HÀM THÊM KHO MỚI ---
  const handleAddWarehouse = async (e) => {
    e.preventDefault();
    try {
      await api.post('/warehouses', { name: whName, location: whLocation });
      alert('Thêm kho thành công!');
      setIsWHModalOpen(false); 
      setWhName(''); setWhLocation('');
      fetchData();
    } catch (error) { 
      alert("Chi tiết lỗi: " + (error.response?.data?.message || error.message)); 
    }
  };

  // --- MỞ FORM THÊM SẢN PHẨM ---
  const openAddModal = () => {
    setEditingId(null);
    setNewSku(''); setNewName(''); setNewPrice(''); setNewUnit('cái');
    setNewCategory(''); setNewImageUrl(''); setNewMinStock('50');
    setInitialStock(0); setTargetWarehouse('all');
    setIsModalOpen(true);
  };

  // --- MỞ FORM SỬA SẢN PHẨM ---
  const openEditModal = (product) => {
    setEditingId(product.id);
    setNewSku(product.sku || ''); setNewName(product.name);
    setNewPrice(product.sale_price); setNewUnit(product.unit || 'cái');
    setNewCategory(product.category || '');
    setNewImageUrl(product.image_url || '');
    setNewMinStock(String(product.min_stock ?? 50));
    setInitialStock('');
    setTargetWarehouse(warehouses.length > 0 ? warehouses[0].id : '');
    setIsModalOpen(true);
  };

  // --- HÀM XÓA SẢN PHẨM ---
  const handleDeleteProduct = async (product) => {
    setDeleteConfirmProduct(product);
  };

  const confirmDeleteProduct = async () => {
    if (!deleteConfirmProduct) return;

    try {
      await api.delete(`/products/${deleteConfirmProduct.id}`);
      alert('Xóa sản phẩm thành công!');
      setDeleteConfirmProduct(null);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi khi xóa sản phẩm');
    }
  };

  // --- HÀM LƯU SẢN PHẨM (Gộp chung THÊM và SỬA) ---
  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // CALL API SỬA
        await api.put(`/products/${editingId}`, { 
          sku: newSku, name: newName, sale_price: newPrice, unit: newUnit,
          category: newCategory, image_url: newImageUrl, min_stock: newMinStock,
          adjust_stock: initialStock, target_warehouse: targetWarehouse 
        });
        alert('Cập nhật thông tin & tồn kho thành công!');
      } else {
        // CALL API THÊM MỚI
        await api.post('/products', { 
          sku: newSku, name: newName, sale_price: newPrice, unit: newUnit,
          category: newCategory, image_url: newImageUrl, min_stock: newMinStock,
          initial_stock: initialStock, warehouse_id: targetWarehouse 
        });
        alert('Thêm sản phẩm mới thành công!');
      }
      setIsModalOpen(false); 
      setNewSku(''); setNewName(''); setNewPrice(''); setNewUnit('cái');
      setNewCategory(''); setNewImageUrl(''); setNewMinStock('50'); setInitialStock('');
      fetchData();
    } catch (error) { 
      alert(error.response?.data?.message || 'Lỗi khi lưu sản phẩm'); 
    }
  };

  const parseStockBreakdown = (breakdown = '') => {
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
  };

  const selectedWarehouse = warehouses.find((w) => w.id.toString() === viewFilter);

  const getWarehouseStockRows = (item) => {
    const breakdownRows = parseStockBreakdown(item.stock_breakdown);

    if (viewFilter === 'all') {
      return breakdownRows;
    }

    return breakdownRows.filter((row) => row.warehouseName === selectedWarehouse?.name);
  };

  const getDisplayQty = (item) => {
    if (viewFilter === 'all') return Number(item.total_stock || item.stock || 0);

    const warehouseRow = getWarehouseStockRows(item)[0];
    return warehouseRow?.quantity || 0;
  };

  const getStockStatus = (qty, minStock) => {
    if (qty <= 0) return 'out-stock';
    if (qty < minStock) return 'low-stock';
    return 'in-stock';
  };

  const getWarehouseAlerts = (item) => {
    const minStock = Number(item.min_stock) || 50;
    return parseStockBreakdown(item.stock_breakdown)
      .map((row) => ({ ...row, status: getStockStatus(row.quantity, minStock), minStock }))
      .filter((row) => row.status !== 'in-stock');
  };

  const filteredProducts = products.filter((item) => {
    const minStock = Number(item.min_stock) || 50;
    const totalQty = Number(item.total_stock || item.stock || 0);
    const warehouseRows = getWarehouseStockRows(item);
    const viewQty = viewFilter === 'all' ? totalQty : (warehouseRows[0]?.quantity || 0);
    const viewStatus = getStockStatus(viewQty, minStock);
    const warehouseAlerts = getWarehouseAlerts(item);
    const hasLowWarehouse = warehouseAlerts.some((row) => row.status === 'low-stock');
    const hasOutWarehouse = warehouseAlerts.some((row) => row.status === 'out-stock');

    const matchesStatus =
      filterMode === 'all' ||
      (filterMode === 'low-stock' && (
        viewFilter === 'all'
          ? hasLowWarehouse
          : viewStatus === 'low-stock'
      )) ||
      (filterMode === 'out-stock' && (
        viewFilter === 'all'
          ? hasOutWarehouse
          : viewStatus === 'out-stock'
      ));

    const search = searchText.trim().toLowerCase();
    const matchesSearch = !search || [item.name, item.sku, item.category].some((value) => String(value || '').toLowerCase().includes(search));
    return matchesStatus && matchesSearch;
  });

  return (
    <div style={{ padding: '16px', background: '#f7fafc', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', gap: '16px' }}>
        <div>
          <h2 style={{ color: '#0f172a', margin: 0, fontSize: '28px' }}>Quản lý sản phẩm</h2>
          <p style={{ margin: '6px 0 0', color: '#64748b' }}>{products.length} sản phẩm trong hệ thống</p>
        </div>

        {canEdit && (
          <button
            onClick={openAddModal}
            style={{ padding: '12px 18px', background: '#10b981', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', boxShadow: '0 10px 20px rgba(16,185,129,0.18)' }}
          >
            + Thêm sản phẩm
          </button>
        )}
      </div>

      <div style={{ background: 'white', borderRadius: '18px', padding: '16px', boxShadow: '0 10px 30px rgba(15,23,42,0.06)', border: '1px solid #e2e8f0', marginBottom: '18px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 14px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc', height: '46px' }}>
            <span style={{ color: '#94a3b8' }}>⌕</span>
            <input
              placeholder="Tìm theo tên, mã SKU..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', color: '#334155' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => setFilterMode('all')} style={{ padding: '10px 14px', borderRadius: '12px', border: '1px solid transparent', background: filterMode === 'all' ? '#10b981' : '#f8fafc', color: filterMode === 'all' ? 'white' : '#334155', fontWeight: '600', cursor: 'pointer' }}>Tất cả</button>
            <button type="button" onClick={() => setFilterMode('low-stock')} style={{ padding: '10px 14px', borderRadius: '12px', border: '1px solid transparent', background: filterMode === 'low-stock' ? '#fb923c' : '#f8fafc', color: filterMode === 'low-stock' ? 'white' : '#334155', fontWeight: '600', cursor: 'pointer' }}>Sắp hết</button>
            <button type="button" onClick={() => setFilterMode('out-stock')} style={{ padding: '10px 14px', borderRadius: '12px', border: '1px solid transparent', background: filterMode === 'out-stock' ? '#ef4444' : '#f8fafc', color: filterMode === 'out-stock' ? 'white' : '#334155', fontWeight: '600', cursor: 'pointer' }}>Hết hàng</button>
          </div>

          <div>
            <select value={viewFilter} onChange={(e) => setViewFilter(e.target.value)} style={{ width: '100%', height: '46px', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '0 14px', background: '#fff', color: '#334155' }}>
              <option value="all">Tất cả kho</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
        </div>

        {filterMode === 'low-stock' && (
          <div style={{ marginTop: '12px', padding: '10px 12px', borderRadius: '12px', background: '#fff7ed', color: '#9a3412', border: '1px solid #fed7aa' }}>
            Đang lọc theo trạng thái tồn kho theo từng kho. Sản phẩm sẽ hiện nếu có ít nhất một kho đang sắp hết.
          </div>
        )}

        {canEdit && (
          <div style={{ marginTop: '12px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setIsWHModalOpen(true)}
              style={{
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid #c4b5fd',
                background: '#f5f3ff',
                color: '#6d28d9',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              + Thêm kho
            </button>
            <button
              type="button"
              onClick={() => {
                setViewFilter('all');
                setFilterMode('all');
                setSearchText('');
              }}
              disabled={viewFilter === 'all' && filterMode === 'all' && !searchText.trim()}
              title="Xóa trạng thái lọc hiện tại và quay về danh sách mặc định"
              style={{
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                background: viewFilter === 'all' && filterMode === 'all' && !searchText.trim() ? '#f8fafc' : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                color: viewFilter === 'all' && filterMode === 'all' && !searchText.trim() ? '#94a3b8' : '#334155',
                cursor: viewFilter === 'all' && filterMode === 'all' && !searchText.trim() ? 'not-allowed' : 'pointer',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: viewFilter === 'all' && filterMode === 'all' && !searchText.trim() ? 'none' : '0 6px 14px rgba(15,23,42,0.04)',
                opacity: viewFilter === 'all' && filterMode === 'all' && !searchText.trim() ? 0.75 : 1,
              }}
            >
              <span style={{ fontSize: '14px', lineHeight: 1 }}>↺</span>
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>

      <div style={{ background: 'white', borderRadius: '22px', padding: '18px', boxShadow: '0 14px 35px rgba(15,23,42,0.08)', border: '1px solid #e2e8f0' }}>
        {filterMode === 'low-stock' && viewFilter !== 'all' && (
          <div style={{ marginBottom: '12px', padding: '10px 12px', borderRadius: '12px', background: '#fff7ed', color: '#9a3412', border: '1px solid #fed7aa' }}>
            Đang lọc các sản phẩm có tag “Sắp hết” trong kho {selectedWarehouse?.name || ''}.
          </div>
        )}

        {loading ? (
          <p>Đang tải dữ liệu...</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '18px' }}>
            {filteredProducts.map((item) => {
              const minStock = Number(item.min_stock) || 50;
              const displayQty = getDisplayQty(item);
              const isLow = displayQty > 0 && displayQty < minStock;
              const isOut = displayQty <= 0;
              const warehouseAlerts = getWarehouseAlerts(item);
              const activeWarehouseName = viewFilter === 'all' ? null : selectedWarehouse?.name;
              const activeWarehouseAlert = activeWarehouseName
                ? warehouseAlerts.find((row) => row.warehouseName === activeWarehouseName)
                : null;
              const warehouseSummary = activeWarehouseAlert
                ? `${activeWarehouseAlert.warehouseName} đang ${activeWarehouseAlert.status === 'out-stock' ? 'hết hàng' : 'sắp hết'} (${activeWarehouseAlert.quantity}/${minStock})`
                : `${selectedWarehouse?.name || 'Kho này'} đang còn hàng`;

              return (
                <div key={item.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 8px 20px rgba(15,23,42,0.05)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '14px 14px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700' }}>{item.sku}</span>
                      <span style={{ fontSize: '12px', padding: '6px 10px', borderRadius: '999px', background: isOut ? '#fee2e2' : isLow ? '#ffedd5' : '#dcfce7', color: isOut ? '#b91c1c' : isLow ? '#c2410c' : '#166534', fontWeight: '700' }}>{isOut ? 'Hết hàng' : isLow ? 'Sắp hết' : 'Còn hàng'}</span>
                    </div>
                    <div
                      onMouseEnter={() => setHoveredProductId(item.id)}
                      onMouseLeave={() => setHoveredProductId(null)}
                      style={{
                        aspectRatio: '1.25',
                        background: item.image_url ? `url(${item.image_url}) center/cover no-repeat` : 'linear-gradient(180deg, #f8fafc, #eef2ff)',
                        borderRadius: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#94a3b8',
                        fontSize: '14px',
                        fontWeight: '600',
                        marginBottom: '12px',
                        overflow: 'hidden',
                        transition: 'transform 220ms ease, box-shadow 220ms ease',
                        transform: hoveredProductId === item.id ? 'scale(1.04)' : 'scale(1)',
                        boxShadow: hoveredProductId === item.id ? '0 14px 28px rgba(15, 23, 42, 0.12)' : 'none',
                        willChange: 'transform',
                        cursor: item.image_url ? 'zoom-in' : 'default',
                      }}
                    >
                      {!item.image_url && 'Hình sản phẩm'}
                    </div>
                    <h3 style={{ margin: '0 0 8px', color: '#0f172a', fontSize: '16px', lineHeight: 1.4 }}>{item.name}</h3>
                    <div style={{ display: 'inline-flex', marginBottom: '10px', padding: '5px 10px', borderRadius: '999px', background: '#eff6ff', color: '#2563eb', fontSize: '12px', fontWeight: '700' }}>
                      {item.category || 'Chưa có danh mục'}
                    </div>
                    {viewFilter !== 'all' && (
                      <div style={{ marginBottom: '10px', padding: '10px 12px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', fontSize: '12px', lineHeight: 1.5 }}>
                        <div style={{ fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>Tình trạng theo kho</div>
                        <div>{warehouseSummary}</div>
                      </div>
                    )}
                  </div>

                  <div style={{ padding: '0 14px 14px', marginTop: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '10px' }}>
                      <div>
                        <div style={{ fontSize: '13px', color: '#0f9d58', fontWeight: '800' }}>{new Intl.NumberFormat('vi-VN').format(item.sale_price)} đ</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>/{item.unit}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '22px', fontWeight: '800', color: isOut ? '#ef4444' : isLow ? '#f97316' : '#0f172a' }}>{displayQty}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Tồn kho</div>
                        <div style={{ fontSize: '11px', color: isOut ? '#ef4444' : isLow ? '#f97316' : '#16a34a', fontWeight: '700', marginTop: '4px' }}>{isOut ? 'Đã hết' : isLow ? 'Sắp hết' : 'Đủ hàng'}</div>
                      </div>
                    </div>

                    <div style={{ marginTop: '12px', display: 'flex', gap: '10px' }}>
                      {canEdit && (
                        <>
                          <button onClick={() => openEditModal(item)} style={{ flex: 1, height: '38px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', color: '#334155', cursor: 'pointer' }}>Sửa</button>
                          <button onClick={() => handleDeleteProduct(item)} style={{ width: '40px', height: '38px', borderRadius: '10px', border: '1px solid #fee2e2', background: '#fff5f5', color: '#ef4444', cursor: 'pointer' }}>🗑</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && filteredProducts.length === 0 && (
          <p style={{ color: '#94a3b8' }}>Chưa có sản phẩm nào phù hợp bộ lọc.</p>
        )}
      </div>

      {isWHModalOpen && (
        <div className="modal-animate" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, padding: '16px' }}>
          <div className="modal-panel-animate" style={{ background: 'white', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '380px', boxShadow: '0 20px 50px rgba(0,0,0,0.18)' }}>
            <h3 style={{ color: '#7c3aed', marginTop: 0 }}>Mở Kho Hàng Mới</h3>
            <form onSubmit={handleAddWarehouse}>
              <input required placeholder="Tên kho (VD: Kho 3)" value={whName} onChange={(e) => setWhName(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '10px', boxSizing: 'border-box', border: '1px solid #cbd5e0', borderRadius: '10px' }} />
              <input placeholder="Vị trí / Địa chỉ" value={whLocation} onChange={(e) => setWhLocation(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '20px', boxSizing: 'border-box', border: '1px solid #cbd5e0', borderRadius: '10px' }} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ flex: 1, padding: '10px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>Lưu Kho</button>
                <button type="button" onClick={() => setIsWHModalOpen(false)} style={{ flex: 1, padding: '10px', background: '#edf2f7', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-animate" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="modal-panel-animate" style={{ background: 'white', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '520px', boxShadow: '0 20px 50px rgba(0,0,0,0.18)' }}>
            <h3 style={{ color: editingId ? '#d97706' : '#16a34a', marginTop: 0, borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
              {editingId ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
            </h3>

            <form onSubmit={handleSubmitProduct}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>Mã SKU *</label>
                  <input ref={skuInputRef} required placeholder="SP003" value={newSku} onChange={(e) => setNewSku(e.target.value.toUpperCase())} style={{ width: '100%', padding: '12px 14px', boxSizing: 'border-box', border: '1px solid #dbe3ea', borderRadius: '12px', background: '#fff', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>Đơn vị *</label>
                  <select required value={newUnit} onChange={(e) => setNewUnit(e.target.value)} style={{ width: '100%', padding: '12px 14px', border: '1px solid #dbe3ea', borderRadius: '12px', background: '#fff', outline: 'none' }}>
                    <option value="Cái">Cái</option>
                    <option value="Bộ">Bộ</option>
                    <option value="Hộp">Hộp</option>
                    <option value="Kg">Kg</option>
                    <option value="Lít">Lít</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>Tên sản phẩm *</label>
                <input required placeholder="" value={newName} onChange={(e) => setNewName(e.target.value)} style={{ width: '100%', padding: '12px 14px', boxSizing: 'border-box', border: '1px solid #dbe3ea', borderRadius: '12px', background: '#fff', outline: 'none' }} />
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>Danh mục</label>
                <input list="product-categories" placeholder="" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} style={{ width: '100%', padding: '12px 14px', boxSizing: 'border-box', border: '1px solid #dbe3ea', borderRadius: '12px', background: '#fff', outline: 'none' }} />
                <datalist id="product-categories">
                  <option value="Ống thép" />
                  <option value="Phụ kiện" />
                  <option value="Vật tư" />
                  <option value="Thiết bị" />
                </datalist>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>Ảnh sản phẩm</label>
                <input placeholder="Dán link ảnh hoặc URL ảnh" value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)} style={{ width: '100%', padding: '12px 14px', boxSizing: 'border-box', border: '1px solid #dbe3ea', borderRadius: '12px', background: '#fff', outline: 'none' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>Đơn giá (đ)</label>
                  <input required type="number" placeholder="320000" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} style={{ width: '100%', padding: '12px 14px', border: '1px solid #dbe3ea', borderRadius: '12px', background: '#fff', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>Tồn kho</label>
                  <input type="number" min="0" placeholder="0" value={initialStock} onChange={(e) => setInitialStock(e.target.value)} style={{ width: '100%', padding: '12px 14px', border: '1px solid #dbe3ea', borderRadius: '12px', background: '#fff', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>Tồn tối thiểu</label>
                  <input type="number" min="0" placeholder="50" value={newMinStock} onChange={(e) => setNewMinStock(e.target.value)} style={{ width: '100%', padding: '12px 14px', border: '1px solid #dbe3ea', borderRadius: '12px', background: '#fff', outline: 'none' }} />
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>Trạng thái nhập kho</label>
                <select required value={targetWarehouse} onChange={(e) => setTargetWarehouse(e.target.value)} style={{ width: '100%', padding: '12px 14px', border: '1px solid #dbe3ea', borderRadius: '12px', background: '#fff', outline: 'none' }}>
                  {!editingId && <option value="all">Rải đều tất cả kho</option>}
                  {warehouses.map((w) => <option key={w.id} value={w.id}>{editingId ? 'Thay đổi tồn của:' : 'Chỉ nhập vào'} {w.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, height: '48px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer', color: '#64748b', fontWeight: '700' }}>Hủy</button>
                <button type="submit" style={{ flex: 1, height: '48px', background: '#10b981', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', boxShadow: '0 12px 24px rgba(16,185,129,0.22)' }}>
                  {editingId ? 'Lưu thay đổi' : 'Lưu sản phẩm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmProduct && (
        <div className="modal-animate" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1200, padding: '16px' }}>
          <div className="modal-panel-animate" style={{ background: 'white', padding: '28px', borderRadius: '16px', width: '100%', maxWidth: '460px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginTop: 0, color: '#b91c1c' }}>Xác nhận xóa sản phẩm</h3>
            <p style={{ color: '#334155', lineHeight: 1.6, marginBottom: '10px' }}>
              Bạn có chắc muốn xóa sản phẩm <strong>"{deleteConfirmProduct.name}"</strong> ({deleteConfirmProduct.sku}) không?
            </p>
            <p style={{ color: '#64748b', lineHeight: 1.6, marginTop: 0 }}>
              Chỉ có thể xóa khi sản phẩm chưa phát sinh tồn kho hoặc chứng từ liên quan.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button type="button" onClick={() => setDeleteConfirmProduct(null)} style={{ flex: 1, height: '46px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer', color: '#64748b', fontWeight: '700' }}>Hủy</button>
              <button type="button" onClick={confirmDeleteProduct} style={{ flex: 1, height: '46px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', boxShadow: '0 12px 24px rgba(239,68,68,0.22)' }}>Xóa sản phẩm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}