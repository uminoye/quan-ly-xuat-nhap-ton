import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import 'remixicon/fonts/remixicon.css';
import api from '../services/api';

const initialFormData = {
    customer_code: '',
    company_name: '',
    phone: '',
    address: '',
    contact_person: ''
};


const pageStyles = {
    page: {
        minHeight: '100vh',
        padding: '28px',
        background: 'radial-gradient(circle at top left, #eff6ff 0%, #f8fafc 38%, #f1f5f9 100%)',
        color: '#0f172a'
    },
    shell: {
        maxWidth: '1440px',
        margin: '0 auto'
    },
    hero: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        gap: '16px',
        marginBottom: '20px',
        flexWrap: 'wrap'
    },
    heroTitle: {
        margin: 0,
        fontSize: '30px',
        lineHeight: 1.15,
        letterSpacing: '-0.04em'
    },
    heroSubtitle: {
        margin: '8px 0 0',
        maxWidth: '780px',
        color: '#64748b',
        lineHeight: 1.7,
        fontSize: '14px'
    },
    statGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: '14px',
        marginBottom: '22px'
    },
    statCard: {
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '22px',
        padding: '18px',
        background: '#fff',
        boxShadow: '0 12px 24px rgba(15,23,42,0.08)',
        border: '1px solid rgba(148,163,184,0.14)',
        outline: 'none',
        minHeight: '108px',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: 'default'
    },
    statIcon: {
        width: '44px',
        height: '44px',
        borderRadius: '14px',
        display: 'grid',
        placeItems: 'center',
        marginBottom: '12px',
        fontSize: '18px',
        color: '#fff',
        boxShadow: '0 12px 24px rgba(37,99,235,0.14)'
    },
    statLabel: { margin: 0, color: '#64748b', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' },
    statBlue: { background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' },
    statAmber: { background: 'linear-gradient(135deg, #f59e0b, #d97706)' },
    statEmerald: { background: 'linear-gradient(135deg, #10b981, #059669)' },
    statValue: { margin: '10px 0 0', fontSize: '30px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em' },
    statDesc: { margin: '8px 0 0', color: '#64748b', fontSize: '13px', lineHeight: 1.5 },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr)',
        gap: '18px',
        alignItems: 'start'
    },
    card: {
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(10px)',
        borderRadius: '24px',
        border: '1px solid rgba(148,163,184,0.18)',
        boxShadow: '0 16px 40px rgba(15,23,42,0.08)',
        width: '100%'
    },
    cardHeader: {
        padding: '20px 20px 0'
    },
    cardBody: {
        padding: '20px'
    },
    cardTitle: {
        margin: 0,
        fontSize: '18px',
        fontWeight: 900,
        color: '#0f172a',
        letterSpacing: '-0.02em'
    },
    cardSubtitle: {
        margin: '8px 0 0',
        color: '#64748b',
        fontSize: '13px',
        lineHeight: 1.6
    },
    formGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: '14px'
    },
    field: { display: 'flex', flexDirection: 'column', gap: '8px' },
    label: {
        fontSize: '12px',
        fontWeight: 800,
        color: '#334155',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
    },
    input: {
        width: '100%',
        padding: '13px 14px',
        borderRadius: '14px',
        border: '1px solid #cbd5e1',
        background: '#fff',
        outline: 'none',
        fontSize: '14px',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease'
    },
    textareaLike: {
        gridColumn: '1 / -1'
    },
    actionsRow: {
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        alignItems: 'center',
        marginTop: '4px'
    },
    buttonPrimary: {
        padding: '13px 18px',
        borderRadius: '14px',
        border: 'none',
        background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
        color: '#fff',
        fontWeight: 800,
        cursor: 'pointer',
        boxShadow: '0 14px 24px rgba(37,99,235,0.22)'
    },
    buttonGhost: {
        padding: '13px 18px',
        borderRadius: '14px',
        border: '1px solid #cbd5e1',
        background: '#fff',
        color: '#0f172a',
        fontWeight: 800,
        cursor: 'pointer'
    },
    tableWrap: {
        overflowX: 'auto',
        width: '100%'
    },
    table: {
        width: '100%',
        borderCollapse: 'separate',
        borderSpacing: 0
    },
    th: {
        textAlign: 'left',
        padding: '14px 16px',
        fontSize: '12px',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: '#64748b',
        background: '#f8fafc',
        borderBottom: '1px solid #e2e8f0'
    },
    td: {
        padding: '16px',
        borderBottom: '1px solid #e2e8f0',
        verticalAlign: 'top',
        color: '#0f172a'
    },
    badge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 10px',
        borderRadius: '999px',
        background: '#e0f2fe',
        color: '#0369a1',
        fontSize: '12px',
        fontWeight: 800
    },
    empty: {
        padding: '40px 20px',
        textAlign: 'center',
        color: '#64748b'
    },
    deleteBtn: {
        width: '38px',
        height: '38px',
        border: '1px solid #fee2e2',
        background: '#fff5f5',
        color: '#ef4444',
        borderRadius: '12px',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
        boxShadow: '0 6px 14px rgba(239,68,68,0.06)'
    }
};

export default function CustomersPage() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [pageLoaded, setPageLoaded] = useState(false);
    const [visibleTick, setVisibleTick] = useState(0);
    const [hoveredStat, setHoveredStat] = useState(null);
    const [hoveredAddButton, setHoveredAddButton] = useState(false);
    const [hoveredRowId, setHoveredRowId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState(initialFormData);
    const [portalReady, setPortalReady] = useState(false);

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
            setVisibleTick((value) => value + 1);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => setPageLoaded(true));
            });
        };

        fetchCustomers();
        runEnterAnimation();
        setPortalReady(true);

        const handleVisible = () => {
            if (document.visibilityState === 'visible') {
                runEnterAnimation();
            }
        };

        window.addEventListener('pageshow', runEnterAnimation);
        document.addEventListener('visibilitychange', handleVisible);

        return () => {
            window.removeEventListener('pageshow', runEnterAnimation);
            document.removeEventListener('visibilitychange', handleVisible);
        };
    }, []);

    const stats = useMemo(() => ({
        total: customers.length,
        withContact: customers.filter((item) => item.contact_person).length,
        recentlyAdded: customers.slice(0, 5).length
    }), [customers]);

    const filteredCustomers = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();
        if (!keyword) return customers;

        return customers.filter((item) => {
            return [
                item.customer_code,
                item.company_name,
                item.contact_person,
                item.phone,
                item.address,
                item.creator_name
            ]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(keyword));
        });
    }, [customers, searchTerm]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSearchChange = (e) => setSearchTerm(e.target.value);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/customers', formData);
            alert('Thêm khách hàng thành công!');
            closeForm();
            fetchCustomers();
        } catch (error) {
            alert(error.response?.data?.message || 'Lỗi khi thêm khách hàng');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReset = () => setFormData(initialFormData);

    const openForm = () => {
        setIsFormOpen(true);
        requestAnimationFrame(() => setIsFormVisible(true));
    };
    const closeForm = () => {
        setIsFormVisible(false);
        window.setTimeout(() => {
            setIsFormOpen(false);
            handleReset();
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

    const renderFormModal = () => {
        if (!isFormOpen || !portalReady || typeof document === 'undefined') {
            return null;
        }

        return createPortal(
            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: isFormVisible ? 'rgba(15, 23, 42, 0.58)' : 'rgba(15, 23, 42, 0)',
                    zIndex: 2147483647,
                    transition: 'background 220ms ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}
                onClick={closeForm}
            >
                <div
                    style={{
                        width: 'min(760px, 100%)',
                        maxHeight: 'calc(100vh - 40px)',
                        overflowY: 'auto',
                        background: '#fff',
                        borderRadius: '24px',
                        boxShadow: '0 30px 80px rgba(15, 23, 42, 0.22)',
                        border: '1px solid rgba(148,163,184,0.16)',
                        transform: isFormVisible ? 'scale(1)' : 'scale(0.97)',
                        opacity: isFormVisible ? 1 : 0,
                        transition: 'transform 220ms ease, opacity 220ms ease'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div style={{ ...pageStyles.cardHeader, display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start', position: 'relative' }}>
                        <div>
                            <h3 style={pageStyles.cardTitle}>Thêm khách hàng mới</h3>
                            <p style={pageStyles.cardSubtitle}>Nhập đầy đủ thông tin để đội sales, kho và vận hành có thể phối hợp liền mạch.</p>
                        </div>
                        <button type="button" onClick={closeForm} style={{ ...pageStyles.buttonGhost, padding: '10px 14px' }}>
                            Đóng
                        </button>
                    </div>
                    <div style={pageStyles.cardBody}>
                        <form onSubmit={handleSubmit} style={pageStyles.formGrid}>
                            <div style={pageStyles.field}>
                                <label style={pageStyles.label}>Mã khách hàng</label>
                                <input required name="customer_code" value={formData.customer_code} onChange={handleInputChange} placeholder="VD: KH003" style={pageStyles.input} />
                            </div>
                            <div style={pageStyles.field}>
                                <label style={pageStyles.label}>Tên công ty</label>
                                <input required name="company_name" value={formData.company_name} onChange={handleInputChange} placeholder="Tên doanh nghiệp..." style={pageStyles.input} />
                            </div>
                            <div style={pageStyles.field}>
                                <label style={pageStyles.label}>Số điện thoại</label>
                                <input required name="phone" value={formData.phone} onChange={handleInputChange} placeholder="090..." style={pageStyles.input} />
                            </div>
                            <div style={pageStyles.field}>
                                <label style={pageStyles.label}>Người liên hệ</label>
                                <input required name="contact_person" value={formData.contact_person} onChange={handleInputChange} placeholder="Người phụ trách mua hàng..." style={pageStyles.input} />
                            </div>
                            <div style={{ ...pageStyles.field, ...pageStyles.textareaLike }}>
                                <label style={pageStyles.label}>Địa chỉ</label>
                                <input required name="address" value={formData.address} onChange={handleInputChange} placeholder="Địa chỉ trụ sở hoặc chi nhánh..." style={pageStyles.input} />
                            </div>
                            <div style={{ ...pageStyles.actionsRow, gridColumn: '1 / -1', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={closeForm} style={pageStyles.buttonGhost}>
                                    Hủy
                                </button>
                                <button type="submit" style={pageStyles.buttonPrimary} disabled={submitting}>
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

    return (
        <div
            style={{
                ...pageStyles.page,
                opacity: pageLoaded ? 1 : 0,
                transform: pageLoaded ? 'translateY(0)' : 'translateY(16px)',
                transition: 'opacity 320ms ease, transform 320ms ease'
            }}
        >
            <div style={pageStyles.shell}>
                <div
                    style={{
                        ...pageStyles.hero,
                        opacity: pageLoaded ? 1 : 0,
                        transform: pageLoaded ? 'translateY(0)' : 'translateY(14px)',
                        transition: 'opacity 420ms ease 80ms, transform 420ms ease 80ms'
                    }}
                >
                    <div>
                        <h2 style={pageStyles.heroTitle}>Quản lý khách hàng</h2>
                        <p style={pageStyles.heroSubtitle}>
                            Tập trung toàn bộ danh sách khách hàng trong một không gian làm việc trực quan, dễ theo dõi và sẵn sàng mở rộng cho quy trình vận hành doanh nghiệp.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={openForm}
                        onMouseEnter={() => setHoveredAddButton(true)}
                        onMouseLeave={() => setHoveredAddButton(false)}
                        style={{
                            ...pageStyles.buttonPrimary,
                            transform: hoveredAddButton ? 'translateY(-2px)' : 'translateY(0)',
                            boxShadow: hoveredAddButton ? '0 18px 30px rgba(37,99,235,0.28)' : '0 14px 24px rgba(37,99,235,0.22)',
                            filter: hoveredAddButton ? 'brightness(1.03)' : 'none',
                            transition: 'transform 180ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 180ms ease, filter 180ms ease'
                        }}
                    >
                        Thêm Khách Hàng
                    </button>
                </div>

                <div style={pageStyles.statGrid}>
                    {[
                        { key: 'total', icon: 'ri-team-line', label: 'Tổng khách hàng', value: stats.total, desc: 'Quản lý danh mục khách hàng đang có trong hệ thống.', delay: '120ms' },
                        { key: 'contact', icon: 'ri-customer-service-2-line', label: 'Có Người Liên Hệ', value: stats.withContact, desc: 'Dữ liệu đủ thông tin để chăm sóc và xử lý đơn hàng.', delay: '220ms' },
                        { key: 'recent', icon: 'ri-time-line', label: 'Mới hiển thị', value: stats.recentlyAdded, desc: '5 bản ghi đầu tiên trong danh sách hiện tại.', delay: '320ms' }
                    ].map((item) => {
                        const isHovered = hoveredStat === item.key;
                        const toneClass = item.key === 'total' ? 'statBlue' : item.key === 'contact' ? 'statAmber' : 'statEmerald';
                        return (
                            <div
                                key={item.key}
                                style={{
                                    ...pageStyles.statCard,
                                    opacity: pageLoaded ? 1 : 0,
                                    transform: isHovered ? 'translateY(-4px)' : pageLoaded ? 'translateY(0)' : 'translateY(18px)',
                                    boxShadow: isHovered
                                        ? item.key === 'total'
                                            ? '0 18px 34px rgba(37,99,235,0.14), 0 10px 24px rgba(37,99,235,0.10)'
                                            : item.key === 'contact'
                                                ? '0 18px 34px rgba(245,158,11,0.16), 0 10px 24px rgba(245,158,11,0.10)'
                                                : '0 18px 34px rgba(16,185,129,0.16), 0 10px 24px rgba(16,185,129,0.10)'
                                        : undefined,
                                    transition: `opacity 420ms ease ${item.delay}, transform 420ms ease ${item.delay}, box-shadow 220ms ease, border-color 220ms ease`
                                }}
                                onMouseEnter={() => setHoveredStat(item.key)}
                                onMouseLeave={() => setHoveredStat(null)}
                            >
                                <div style={{ ...pageStyles.statIcon, ...pageStyles[toneClass] }}>
                                    <i className={item.icon} />
                                </div>
                                <p style={pageStyles.statLabel}>{item.label}</p>
                                <div style={pageStyles.statValue}>{item.value}</div>
                                <p style={pageStyles.statDesc}>{item.desc}</p>
                            </div>
                        );
                    })}
                </div>

                {renderFormModal()}

                <div
                    key={visibleTick}
                    style={{
                        ...pageStyles.grid,
                        opacity: pageLoaded ? 1 : 0,
                        transform: pageLoaded ? 'translateY(0)' : 'translateY(18px)',
                        transition: 'opacity 460ms ease 180ms, transform 460ms ease 180ms'
                    }}
                >
                    <section style={pageStyles.card}>
                        <div style={pageStyles.cardHeader}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                <div>
                                    <h3 style={pageStyles.cardTitle}>Danh sách khách hàng</h3>
                                    <p style={pageStyles.cardSubtitle}>Giao diện bảng rõ ràng, dễ quét thông tin và tối ưu cho thao tác quản trị hàng ngày.</p>
                                </div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '280px', padding: '12px 14px', borderRadius: '14px', border: '1px solid #cbd5e1', background: '#fff', boxShadow: '0 8px 18px rgba(15,23,42,0.04)' }}>
                                    <i className="ri-search-line" style={{ color: '#64748b', fontSize: '18px' }} />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={handleSearchChange}
                                        placeholder="Tìm khách hàng theo mã, tên công ty, SĐT..."
                                        style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px', background: 'transparent', color: '#0f172a' }}
                                    />
                                </label>
                            </div>
                        </div>
                        <div style={{ ...pageStyles.cardBody, padding: '20px 24px 24px' }}>
                            {loading ? (
                                <div style={pageStyles.empty}>Đang tải dữ liệu...</div>
                            ) : customers.length === 0 ? (
                                <div style={pageStyles.empty}>Chưa có khách hàng nào. Hãy thêm khách hàng đầu tiên để bắt đầu.</div>
                            ) : filteredCustomers.length === 0 ? (
                                <div style={pageStyles.empty}>Không tìm thấy khách hàng phù hợp với từ khóa hiện tại.</div>
                            ) : (
                                <div style={pageStyles.tableWrap}>
                                    <table style={{ ...pageStyles.table, minWidth: '1200px' }}>
                                        <thead>
                                            <tr>
                                                <th style={{ ...pageStyles.th, minWidth: '120px' }}>Mã KH</th>
                                                <th style={{ ...pageStyles.th, minWidth: '220px' }}>Tên công ty</th>
                                                <th style={{ ...pageStyles.th, minWidth: '160px' }}>Người liên hệ</th>
                                                <th style={{ ...pageStyles.th, minWidth: '140px' }}>SĐT</th>
                                                <th style={{ ...pageStyles.th, minWidth: '260px' }}>Địa chỉ</th>
                                                <th style={{ ...pageStyles.th, minWidth: '160px' }}>Người phụ trách</th>
                                                <th style={{ ...pageStyles.th, minWidth: '110px' }}>Hành động</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredCustomers.map((item, index) => {
                                                const isHovered = hoveredRowId === item.id;

                                                return (
                                                    <tr
                                                        key={item.id}
                                                        onMouseEnter={() => setHoveredRowId(item.id)}
                                                        onMouseLeave={() => setHoveredRowId(null)}
                                                        style={{
                                                            opacity: pageLoaded ? 1 : 0,
                                                            transform: isHovered ? 'translateY(-2px)' : pageLoaded ? 'translateY(0)' : 'translateY(10px)',
                                                            background: isHovered ? '#f8fbff' : 'transparent',
                                                            boxShadow: isHovered ? '0 10px 24px rgba(15,23,42,0.06)' : 'none',
                                                            transition: `opacity 360ms ease ${120 + index * 70}ms, transform 180ms cubic-bezier(0.22, 1, 0.36, 1), background-color 180ms ease, box-shadow 180ms ease`
                                                        }}
                                                    >
                                                        <td style={pageStyles.td}><span style={pageStyles.badge}>{item.customer_code}</span></td>
                                                        <td style={pageStyles.td}><div style={{ fontWeight: 800 }}>{item.company_name}</div></td>
                                                        <td style={pageStyles.td}>{item.contact_person}</td>
                                                        <td style={pageStyles.td}>{item.phone}</td>
                                                        <td style={pageStyles.td}>{item.address}</td>
                                                        <td style={pageStyles.td}>{item.creator_name || 'Admin'}</td>
                                                        <td style={pageStyles.td}>
                                                            <button
                                                                onClick={() => handleDelete(item.id)}
                                                                style={{ ...pageStyles.deleteBtn, transform: isHovered ? 'translateY(-1px)' : 'translateY(0)', transition: 'transform 180ms ease, box-shadow 180ms ease' }}
                                                            >
                                                                <i className="ri-delete-bin-line" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
