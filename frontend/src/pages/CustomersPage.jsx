import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import 'remixicon/fonts/remixicon.css';
import api from '../services/api';
import { exportListToExcel } from '../utils/exportList';

const initialFormData = {
    company_name: '',
    phone: '',
    address: '',
    contact_person: ''
};

// ── Shared styles ─────────────────────────────────────────────────────────────
const BASE_INPUT = {
    width: '100%',
    padding: '13px 14px',
    borderRadius: '14px',
    border: '1px solid #cbd5e1',
    background: '#fff',
    outline: 'none',
    fontSize: '14px',
    color: '#0f172a',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
};

const BASE_BTN = {
    border: 'none',
    borderRadius: '14px',
    fontWeight: 800,
    cursor: 'pointer',
    transition: 'transform 180ms ease, box-shadow 180ms ease, filter 180ms ease'
};

export default function CustomersPage() {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    const roleId = user?.role_id || 0;
    // Admin (1) + Sales (2): full quyền; Logistics (3): chỉ xem
    const canEdit = [1, 2].includes(roleId);

    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [pageLoaded, setPageLoaded] = useState(false);
    const [visibleTick, setVisibleTick] = useState(0);
    const [hoveredAddButton, setHoveredAddButton] = useState(false);
    const [hoveredRowId, setHoveredRowId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState(initialFormData);
    const [nextCode, setNextCode] = useState('');
    const [portalReady, setPortalReady] = useState(false);

    // ── Responsive ──────────────────────────────────────────────────────────
    const [isMobile, setIsMobile] = useState(
        typeof window !== 'undefined' ? window.innerWidth < 768 : false
    );
    const [isTablet, setIsTablet] = useState(
        typeof window !== 'undefined' ? window.innerWidth >= 768 && window.innerWidth < 1024 : false
    );

    useEffect(() => {
        const onResize = () => {
            const w = window.innerWidth;
            setIsMobile(w < 768);
            setIsTablet(w >= 768 && w < 1024);
        };
        onResize();
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    // ── Data fetching ───────────────────────────────────────────────────────
    const fetchCustomers = async () => {
        try {
            const response = await api.get('/customers');
            setCustomers(response.data);
        } catch {
            alert('Lỗi tải danh sách khách hàng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const runEnterAnimation = () => {
            setPageLoaded(false);
            setVisibleTick((v) => v + 1);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => setPageLoaded(true));
            });
        };
        fetchCustomers();
        runEnterAnimation();
        setPortalReady(true);
        const handleVisible = () => {
            if (document.visibilityState === 'visible') runEnterAnimation();
        };
        window.addEventListener('pageshow', runEnterAnimation);
        document.addEventListener('visibilitychange', handleVisible);
        return () => {
            window.removeEventListener('pageshow', runEnterAnimation);
            document.removeEventListener('visibilitychange', handleVisible);
        };
    }, []);

    // ── Computed ────────────────────────────────────────────────────────────
    const stats = useMemo(() => ({
        total: customers.length,
        withContact: customers.filter((item) => item.contact_person).length,
        recentlyAdded: customers.slice(0, 5).length
    }), [customers]);

    const filteredCustomers = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();
        if (!keyword) return customers;
        return customers.filter((item) =>
            [item.customer_code, item.company_name, item.contact_person, item.phone, item.address, item.creator_name]
                .filter(Boolean)
                .some((v) => String(v).toLowerCase().includes(keyword))
        );
    }, [customers, searchTerm]);

    // ── Handlers ────────────────────────────────────────────────────────────
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/customers', {
                company_name: formData.company_name,
                phone: formData.phone,
                address: formData.address,
                contact_person: formData.contact_person
            });
            alert('Thêm khách hàng thành công!');
            closeForm();
            fetchCustomers();
        } catch (error) {
            alert(error.response?.data?.message || 'Lỗi khi thêm khách hàng');
        } finally {
            setSubmitting(false);
        }
    };

    const openForm = async () => {
        setIsFormOpen(true);
        requestAnimationFrame(() => setIsFormVisible(true));
        try {
            const res = await api.get('/customers/next-code');
            setNextCode(res.data.next_code);
        } catch {
            setNextCode('');
        }
    };

    const closeForm = () => {
        setIsFormVisible(false);
        window.setTimeout(() => {
            setIsFormOpen(false);
            setNextCode('');
            setFormData(initialFormData);
        }, 220);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) {
            try {
                await api.delete(`/customers/${id}`);
                fetchCustomers();
            } catch (error) {
                alert(error.response?.data?.message || 'Lỗi khi xóa');
            }
        }
    };

    // ── Layout helpers ──────────────────────────────────────────────────────
    const pagePad = isMobile ? 14 : isTablet ? 18 : 20;
    const statCols = isMobile ? 1 : isTablet ? 2 : 3;

    // ── Modal ───────────────────────────────────────────────────────────────
    const renderFormModal = () => {
        if (!isFormOpen || !portalReady || typeof document === 'undefined') return null;
        return createPortal(
            <div
                style={{
                    position: 'fixed', inset: 0,
                    background: isFormVisible ? 'rgba(15,23,42,0.55)' : 'rgba(15,23,42,0)',
                    zIndex: 9999,
                    transition: 'background 220ms ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: pagePad
                }}
                onClick={closeForm}
            >
                <div
                    style={{
                        width: '100%',
                        maxWidth: 760,
                        maxHeight: 'calc(100dvh - 40px)',
                        overflowY: 'auto',
                        background: '#fff',
                        borderRadius: 24,
                        boxShadow: '0 30px 80px rgba(15,23,42,0.22)',
                        transform: isFormVisible ? 'scale(1)' : 'scale(0.97)',
                        opacity: isFormVisible ? 1 : 0,
                        transition: 'transform 220ms ease, opacity 220ms ease'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Modal Header */}
                    <div style={{
                        padding: isMobile ? '16px 16px 0' : '20px 20px 0',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                        gap: 12
                    }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: isMobile ? 17 : 18, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
                                Thêm khách hàng mới
                            </h3>
                            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 13, lineHeight: 1.6 }}>
                                Nhập đầy đủ thông tin để đội sales, kho và vận hành phối hợp liền mạch.
                            </p>
                        </div>
                        <button
                            type="button" onClick={closeForm}
                            style={{ ...BASE_BTN, padding: '10px 14px', background: '#f1f5f9', color: '#334155', flexShrink: 0 }}
                        >
                            Đóng
                        </button>
                    </div>

                    {/* Modal Body */}
                    <div style={{ padding: isMobile ? '16px' : 20 }}>
                        <form onSubmit={handleSubmit}>
                            {/* Mã KH — readonly */}
                            <div style={{ marginBottom: 14 }}>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                                    Mã khách hàng
                                </label>
                                <div style={{
                                    ...BASE_INPUT,
                                    background: '#f0f9ff',
                                    borderColor: '#bae6fd',
                                    color: nextCode ? '#2563eb' : '#94a3b8',
                                    fontWeight: nextCode ? 800 : 400,
                                    cursor: 'default'
                                }}>
                                    {nextCode ? `Tiếp theo: ${nextCode}` : 'Đang sinh mã...'}
                                </div>
                            </div>

                            {/* 2-col grid */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
                                gap: 14, marginBottom: 14
                            }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                                        Tên công ty
                                    </label>
                                    <input
                                        required name="company_name" value={formData.company_name}
                                        onChange={handleInputChange}
                                        placeholder="Tên doanh nghiệp..."
                                        style={BASE_INPUT}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                                        Số điện thoại
                                    </label>
                                    <input
                                        required name="phone" value={formData.phone}
                                        onChange={handleInputChange}
                                        placeholder="090..."
                                        style={BASE_INPUT}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                                        Người liên hệ
                                    </label>
                                    <input
                                        required name="contact_person" value={formData.contact_person}
                                        onChange={handleInputChange}
                                        placeholder="Người phụ trách mua hàng..."
                                        style={BASE_INPUT}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                                        Địa chỉ
                                    </label>
                                    <input
                                        required name="address" value={formData.address}
                                        onChange={handleInputChange}
                                        placeholder="Địa chỉ trụ sở hoặc chi nhánh..."
                                        style={BASE_INPUT}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                <button type="button" onClick={closeForm}
                                    style={{ ...BASE_BTN, padding: '12px 18px', background: '#fff', borderWidth: '1px', borderStyle: 'solid', borderColor: '#cbd5e1', color: '#0f172a' }}>
                                    Hủy
                                </button>
                                <button type="submit" disabled={submitting}
                                    style={{ ...BASE_BTN, padding: '12px 20px', background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)', color: '#fff', boxShadow: '0 14px 24px rgba(37,99,235,0.22)' }}>
                                    {submitting ? 'Đang lưu...' : 'Lưu khách hàng'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>,
            document.body
        );
    };

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div style={{
            minHeight: '100dvh',
            padding: `${pagePad}px`,
            background: 'radial-gradient(circle at top left, #eff6ff 0%, #f8fafc 38%, #f1f5f9 100%)',
            color: '#0f172a',
            boxSizing: 'border-box',
            opacity: pageLoaded ? 1 : 0,
            transform: pageLoaded ? 'translateY(0)' : 'translateY(16px)',
            transition: 'opacity 320ms ease, transform 320ms ease'
        }}>
            {/* ── Hero ── */}
            <div style={{ maxWidth: 1440, margin: '0 auto' }}>
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                    gap: 16, marginBottom: isMobile ? 14 : 20, flexWrap: 'wrap',
                    opacity: pageLoaded ? 1 : 0,
                    transform: pageLoaded ? 'translateY(0)' : 'translateY(14px)',
                    transition: 'opacity 420ms ease 80ms, transform 420ms ease 80ms'
                }}>
                    <div style={{ minWidth: 0 }}>
                        <h2 style={{ margin: 0, fontSize: isMobile ? 22 : 30, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.15 }}>
                            Quản lý khách hàng
                        </h2>
                        <p style={{ margin: '8px 0 0', maxWidth: 780, color: '#64748b', lineHeight: 1.7, fontSize: isMobile ? 12 : 14 }}>
                            Tập trung toàn bộ danh sách khách hàng trong một không gian làm việc trực quan, dễ theo dõi và sẵn sàng mở rộng.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexShrink: 0, alignItems: 'center', flexWrap: 'wrap' }}>
                        <button
                            type="button"
                            onClick={async () => {
                                const rows = filteredCustomers.map(c => [
                                    c.customer_code || '',
                                    c.company_name || '',
                                    c.contact_person || '',
                                    c.phone || '',
                                    c.address || '',
                                    c.creator_name || '',
                                    c.created_at ? new Date(c.created_at).toLocaleDateString('vi-VN') : '',
                                ]);
                                await exportListToExcel({
                                    filename: 'DanhSachKhachHang',
                                    sheetName: 'KhachHang',
                                    title: 'DANH SÁCH KHÁCH HÀNG',
                                    headers: ['Mã KH', 'Công ty', 'Người liên hệ', 'Điện thoại', 'Địa chỉ', 'Người tạo', 'Ngày tạo'],
                                    rows,
                                    colWidths: [12, 28, 22, 14, 36, 16, 12],
                                });
                            }}
                            style={{
                                ...BASE_BTN,
                                padding: isMobile ? '11px 16px' : '13px 18px',
                                background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                                color: '#fff',
                                fontSize: isMobile ? 13 : 14,
                                boxShadow: '0 14px 24px rgba(16,185,129,0.22)',
                            }}
                        >
                            <i className="ri-file-excel-2-line" style={{ marginRight: 6, fontSize: 16 }} />
                            Xuất Excel
                        </button>
                        {canEdit && (
                            <button
                                type="button" onClick={openForm}
                                onMouseEnter={() => setHoveredAddButton(true)}
                                onMouseLeave={() => setHoveredAddButton(false)}
                                style={{
                                    ...BASE_BTN,
                                    padding: isMobile ? '11px 16px' : '13px 18px',
                                    background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                                    color: '#fff',
                                    fontSize: isMobile ? 13 : 14,
                                    boxShadow: hoveredAddButton
                                        ? '0 18px 30px rgba(37,99,235,0.28)'
                                        : '0 14px 24px rgba(37,99,235,0.22)',
                                    transform: hoveredAddButton ? 'translateY(-2px)' : 'translateY(0)',
                                    filter: hoveredAddButton ? 'brightness(1.03)' : 'none',
                                }}
                            >
                                <i className="ri-add-line" style={{ marginRight: 6, fontSize: 16 }} />
                                Thêm Khách Hàng
                            </button>
                        )}
                        {!canEdit && (
                            <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>Chế độ chỉ xem</span>
                        )}
                    </div>
                </div>

                {/* ── Stats ── */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${statCols}, minmax(0, 1fr))`,
                    gap: isMobile ? 10 : 14,
                    marginBottom: isMobile ? 14 : 22,
                    opacity: pageLoaded ? 1 : 0,
                    transition: 'opacity 420ms ease 120ms'
                }}>
                    {[
                        { key: 'total', icon: 'ri-team-line', label: 'Tổng khách hàng', value: stats.total, desc: 'Danh mục khách hàng trong hệ thống.', bg: 'linear-gradient(135deg, #2563eb, #1d4ed8)', shadow: 'rgba(37,99,235,0.14)' },
                        { key: 'contact', icon: 'ri-customer-service-2-line', label: 'Có Người Liên Hệ', value: stats.withContact, desc: 'Đủ thông tin để chăm sóc và xử lý đơn.', bg: 'linear-gradient(135deg, #f59e0b, #d97706)', shadow: 'rgba(245,158,11,0.16)' },
                        { key: 'recent', icon: 'ri-time-line', label: 'Mới hiển thị', value: stats.recentlyAdded, desc: '5 bản ghi đầu tiên trong danh sách.', bg: 'linear-gradient(135deg, #10b981, #059669)', shadow: 'rgba(16,185,129,0.16)' }
                    ].map((item) => (
                        <div key={item.key} style={{
                            borderRadius: 22, padding: isMobile ? '14px' : 18,
                            background: '#fff',
                            boxShadow: '0 12px 24px rgba(15,23,42,0.08)',
                            border: '1px solid rgba(148,163,184,0.14)',
                            minHeight: isMobile ? 90 : 108,
                            opacity: pageLoaded ? 1 : 0,
                            transition: `opacity 420ms ease ${120 + (item.key === 'total' ? 0 : item.key === 'contact' ? 100 : 200)}ms`
                        }}>
                            <div style={{
                                width: isMobile ? 38 : 44, height: isMobile ? 38 : 44, borderRadius: 14,
                                background: item.bg, display: 'grid', placeItems: 'center',
                                marginBottom: isMobile ? 10 : 12, color: '#fff', fontSize: 18,
                                boxShadow: `0 12px 24px ${item.shadow}`
                            }}>
                                <i className={item.icon} />
                            </div>
                            <p style={{ margin: 0, color: '#64748b', fontSize: isMobile ? 11 : 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                {item.label}
                            </p>
                            <div style={{ margin: '8px 0 0', fontSize: isMobile ? 24 : 30, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em' }}>
                                {item.value}
                            </div>
                            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: isMobile ? 11 : 13, lineHeight: 1.5 }}>
                                {item.desc}
                            </p>
                        </div>
                    ))}
                </div>

                {/* ── Card ── */}
                <div style={{
                    background: 'rgba(255,255,255,0.92)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: isMobile ? 16 : 24,
                    border: '1px solid rgba(148,163,184,0.18)',
                    boxShadow: '0 16px 40px rgba(15,23,42,0.08)',
                    opacity: pageLoaded ? 1 : 0,
                    transform: pageLoaded ? 'translateY(0)' : 'translateY(18px)',
                    transition: 'opacity 460ms ease 180ms, transform 460ms ease 180ms',
                    overflow: 'hidden'
                }}>
                    {/* Card Header */}
                    <div style={{
                        padding: isMobile ? '14px' : '20px 20px 0',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                        gap: 12, flexWrap: 'wrap'
                    }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: isMobile ? 15 : 18, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
                                Danh sách khách hàng
                            </h3>
                            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: isMobile ? 11 : 13, lineHeight: 1.6 }}>
                                Giao diện rõ ràng, dễ quét thông tin và tối ưu cho thao tác quản trị hàng ngày.
                            </p>
                        </div>
                        {/* Search */}
                        <label style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 14px', borderRadius: 14,
                            border: '1px solid #cbd5e1', background: '#fff',
                            boxShadow: '0 8px 18px rgba(15,23,42,0.04)',
                            minWidth: 0, flex: isMobile ? '1 1 100%' : isTablet ? '1 1 260px' : '1 1 300px'
                        }}>
                            <i className="ri-search-line" style={{ color: '#64748b', fontSize: 16, flexShrink: 0 }} />
                            <input
                                type="text" value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Tìm mã, tên, SĐT..."
                                style={{ border: 'none', outline: 'none', width: '100%', fontSize: 13, background: 'transparent', color: '#0f172a' }}
                            />
                        </label>
                    </div>

                    {/* Table / List */}
                    <div style={{ padding: isMobile ? '0 0 12px' : '0 24px 24px' }}>
                        {loading ? (
                            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>Đang tải dữ liệu...</div>
                        ) : customers.length === 0 ? (
                            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>Chưa có khách hàng nào. Hãy thêm khách hàng đầu tiên.</div>
                        ) : filteredCustomers.length === 0 ? (
                            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>Không tìm thấy khách hàng phù hợp.</div>
                        ) : (
                            isMobile ? (
                                /* Mobile: card list */
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 12 }}>
                                    {filteredCustomers.map((item, index) => (
                                        <div
                                            key={item.id}
                                            style={{
                                                padding: '14px',
                                                borderRadius: 16,
                                                border: '1px solid #e2e8f0',
                                                background: hoveredRowId === item.id ? '#f8fbff' : '#fff',
                                                boxShadow: hoveredRowId === item.id ? '0 8px 20px rgba(15,23,42,0.06)' : '0 2px 8px rgba(15,23,42,0.03)',
                                                transition: 'background 180ms ease, box-shadow 180ms ease',
                                                opacity: pageLoaded ? 1 : 0,
                                                transition: `opacity 360ms ease ${120 + index * 70}ms, background 180ms ease, box-shadow 180ms ease`
                                            }}
                                            onMouseEnter={() => setHoveredRowId(item.id)}
                                            onMouseLeave={() => setHoveredRowId(null)}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                                <div style={{ minWidth: 0, flex: 1 }}>
                                                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 14, marginBottom: 4 }}>{item.company_name}</div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 6 }}>
                                                        {item.contact_person && (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569' }}>
                                                                <i className="ri-user-line" style={{ fontSize: 13, color: '#94a3b8' }} />
                                                                {item.contact_person}
                                                            </div>
                                                        )}
                                                        {item.phone && (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569' }}>
                                                                <i className="ri-phone-line" style={{ fontSize: 13, color: '#94a3b8' }} />
                                                                {item.phone}
                                                            </div>
                                                        )}
                                                        {item.address && (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569' }}>
                                                                <i className="ri-map-pin-line" style={{ fontSize: 13, color: '#94a3b8' }} />
                                                                <span style={{
                                                                    display: '-webkit-box',
                                                                    WebkitLineClamp: 2,
                                                                    WebkitBoxOrient: 'vertical',
                                                                    overflow: 'hidden'
                                                                }}>{item.address}</span>
                                                            </div>
                                                        )}
                                                        <div style={{ marginTop: 4 }}>
                                                            <span style={{
                                                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                                                padding: '3px 8px', borderRadius: 999,
                                                                background: '#e0f2fe', color: '#0369a1',
                                                                fontSize: 11, fontWeight: 800
                                                            }}>
                                                                {item.customer_code}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                    {canEdit && (
                                                        <button
                                                            onClick={() => handleDelete(item.id)}
                                                            style={{
                                                                width: 36, height: 36, flexShrink: 0,
                                                                borderWidth: '1px', borderStyle: 'solid', borderColor: '#fee2e2',
                                                                background: '#fff5f5', color: '#ef4444',
                                                                borderRadius: 10, cursor: 'pointer',
                                                                display: 'grid', placeItems: 'center',
                                                                fontSize: 15, boxShadow: '0 4px 10px rgba(239,68,68,0.06)'
                                                            }}
                                                        >
                                                            <i className="ri-delete-bin-line" />
                                                        </button>
                                                    )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                /* Desktop/Tablet: table */
                                <div style={{ overflowX: 'auto', paddingTop: 14, minWidth: 0 }}>
                                    <table style={{
                                        width: '100%', borderCollapse: 'separate', borderSpacing: 0,
                                        minWidth: isTablet ? 700 : 900
                                    }}>
                                        <thead>
                                            <tr>
                                                {['Mã KH', 'Tên công ty', 'Người liên hệ', 'SĐT', 'Địa chỉ', 'Hành động'].map((h) => (
                                                    <th key={h} style={{
                                                        textAlign: 'left', padding: '12px 16px',
                                                        fontSize: 12, textTransform: 'uppercase',
                                                        letterSpacing: '0.06em', color: '#64748b',
                                                        background: '#f8fafc',
                                                        borderBottom: '1px solid #e2e8f0',
                                                        whiteSpace: 'nowrap'
                                                    }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredCustomers.map((item, index) => {
                                                const isHovered = hoveredRowId === item.id;
                                                return (
                                                    <tr key={item.id}
                                                        onMouseEnter={() => setHoveredRowId(item.id)}
                                                        onMouseLeave={() => setHoveredRowId(null)}
                                                        style={{
                                                            background: isHovered ? '#f8fbff' : 'transparent',
                                                            boxShadow: isHovered ? '0 10px 24px rgba(15,23,42,0.06)' : 'none',
                                                            opacity: pageLoaded ? 1 : 0,
                                                            transition: `opacity 360ms ease ${120 + index * 70}ms, background 180ms ease, box-shadow 180ms ease`
                                                        }}
                                                    >
                                                        <td style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', verticalAlign: 'top' }}>
                                                            <span style={{
                                                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                                                padding: '5px 10px', borderRadius: 999,
                                                                background: '#e0f2fe', color: '#0369a1',
                                                                fontSize: 12, fontWeight: 800
                                                            }}>{item.customer_code}</span>
                                                        </td>
                                                        <td style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', verticalAlign: 'top', color: '#0f172a', fontWeight: 800 }}>{item.company_name}</td>
                                                        <td style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', verticalAlign: 'top', color: '#0f172a' }}>{item.contact_person || '—'}</td>
                                                        <td style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', verticalAlign: 'top', color: '#0f172a' }}>{item.phone || '—'}</td>
                                                        <td style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', verticalAlign: 'top', color: '#0f172a' }}>{item.address || '—'}</td>
                                                        <td style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', verticalAlign: 'top' }}>
                                                        {canEdit && (
                                                            <button
                                                                onClick={() => handleDelete(item.id)}
                                                                style={{
                                                                    width: 38, height: 38,
                                                                    borderWidth: '1px', borderStyle: 'solid', borderColor: '#fee2e2',
                                                                    background: '#fff5f5', color: '#ef4444',
                                                                    borderRadius: 12, cursor: 'pointer',
                                                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                                    fontSize: 16, boxShadow: '0 6px 14px rgba(239,68,68,0.06)'
                                                                }}
                                                            >
                                                                <i className="ri-delete-bin-line" />
                                                            </button>
                                                        )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>

            {renderFormModal()}
        </div>
    );
}
