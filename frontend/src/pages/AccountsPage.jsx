import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';

const initialFormState = {
  email: '',
  password: '',
  fullName: '',
  roleId: '2'
};

const roleMeta = {
  1: { name: 'Ban Giám Đốc (Admin)', short: 'Admin', color: '#b42318', bg: '#fef3f2', border: '#fecdca', icon: 'ri-shield-star-line' },
  2: { name: 'Kinh Doanh (Sales)', short: 'Sales', color: '#175cd3', bg: '#eff8ff', border: '#b2ddff', icon: 'ri-briefcase-4-line' },
  3: { name: 'Giao Vận (Logistics)', short: 'Logistics', color: '#b54708', bg: '#fffaeb', border: '#fedf89', icon: 'ri-truck-line' },
  4: { name: 'Thủ Kho', short: 'Kho', color: '#067647', bg: '#ecfdf3', border: '#abefc6', icon: 'ri-store-2-line' },
  5: { name: 'Nhà Máy', short: 'Nhà máy', color: '#6941c6', bg: '#f4f3ff', border: '#d9d6fe', icon: 'ri-building-4-line' }
};

const styles = {
  page: {
    minHeight: '100vh',
    padding: '28px',
    background: 'radial-gradient(circle at top left, #eff6ff 0%, #f8fafc 38%, #f1f5f9 100%)',
    color: '#0f172a'
  },
  shell: { maxWidth: '1440px', margin: '0 auto' },
  hero: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: '16px',
    marginBottom: '20px',
    flexWrap: 'wrap'
  },
  heroTitle: { margin: 0, fontSize: '30px', lineHeight: 1.15, letterSpacing: '-0.04em' },
  heroSubtitle: { margin: '8px 0 0', maxWidth: '820px', color: '#64748b', lineHeight: 1.7, fontSize: '14px' },
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
  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '14px', marginBottom: '22px' },
  statCard: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: '22px',
    padding: '18px',
    background: '#fff',
    boxShadow: '0 12px 24px rgba(15,23,42,0.08)',
    border: '1px solid rgba(148,163,184,0.14)',
    minHeight: '108px',
    willChange: 'transform, box-shadow'
  },
  statIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '14px',
    display: 'grid',
    placeItems: 'center',
    marginBottom: '12px',
    fontSize: '18px',
    color: '#fff'
  },
  statBlue: { background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' },
  statAmber: { background: 'linear-gradient(135deg, #f59e0b, #d97706)' },
  statEmerald: { background: 'linear-gradient(135deg, #10b981, #059669)' },
  statLabel: { margin: 0, color: '#64748b', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' },
  statValue: { margin: '10px 0 0', fontSize: '30px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em' },
  statDesc: { margin: '8px 0 0', color: '#64748b', fontSize: '13px', lineHeight: 1.5 },
  card: {
    background: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(10px)',
    borderRadius: '24px',
    border: '1px solid rgba(148,163,184,0.18)',
    boxShadow: '0 16px 40px rgba(15,23,42,0.08)'
  },
  cardHeader: { padding: '20px 20px 0' },
  cardBody: { padding: '20px' },
  cardTitle: { margin: 0, fontSize: '18px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' },
  cardSubtitle: { margin: '8px 0 0', color: '#64748b', fontSize: '13px', lineHeight: 1.6 },
  tableWrap: { overflowX: 'auto', width: '100%' },
  table: { width: '100%', borderCollapse: 'separate', borderSpacing: 0 },
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
  td: { padding: '16px', borderBottom: '1px solid #e2e8f0', verticalAlign: 'top', color: '#0f172a' },
  roleBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 800,
    border: '1px solid transparent'
  },
  editBtn: {
    width: '38px',
    height: '38px',
    border: '1px solid #cbd5e1',
    background: '#fff',
    color: '#2563eb',
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    boxShadow: '0 6px 14px rgba(15,23,42,0.04)'
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
  },
  empty: { padding: '40px 20px', textAlign: 'center', color: '#64748b' },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.58)',
    zIndex: 2147483647,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  },
  modal: {
    width: 'min(760px, 100%)',
    maxHeight: 'calc(100vh - 40px)',
    overflowY: 'auto',
    background: '#fff',
    borderRadius: '24px',
    boxShadow: '0 30px 80px rgba(15, 23, 42, 0.22)',
    border: '1px solid rgba(148,163,184,0.16)'
  },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '12px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: {
    width: '100%',
    padding: '13px 14px',
    borderRadius: '14px',
    border: '1px solid #cbd5e1',
    background: '#fff',
    outline: 'none',
    fontSize: '14px'
  },
  select: {
    width: '100%',
    padding: '13px 14px',
    borderRadius: '14px',
    border: '1px solid #cbd5e1',
    background: '#fff',
    outline: 'none',
    fontSize: '14px',
    fontWeight: 700
  },
  hint: { color: '#94a3b8', fontSize: '12px', marginTop: '-2px' },
  modalActions: { display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'flex-end', gridColumn: '1 / -1', marginTop: '4px' }
};

export default function AccountsPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [hoveredStat, setHoveredStat] = useState(null);
  const [hoveredAddButton, setHoveredAddButton] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredRowId, setHoveredRowId] = useState(null);
  const [form, setForm] = useState(initialFormState);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data);
    } catch {
      alert('Lỗi tải danh sách tài khoản');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const enter = () => {
      setPageLoaded(false);
      requestAnimationFrame(() => requestAnimationFrame(() => setPageLoaded(true)));
    };

    fetchUsers();
    enter();
    setPortalReady(true);

    window.addEventListener('pageshow', enter);
    return () => window.removeEventListener('pageshow', enter);
  }, []);

  const filteredUsers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    const roleRank = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 };

    return users
      .filter((user) => {
        const matchesRole = roleFilter === 'all' || String(user.role_id) === roleFilter;
        const email = (user.email || '').toLowerCase();
        const fullName = (user.full_name || '').toLowerCase();
        const roleName = (roleMeta[user.role_id]?.name || '').toLowerCase();
        const matchesText = !keyword || email.includes(keyword) || fullName.includes(keyword) || roleName.includes(keyword);

        return matchesRole && matchesText;
      })
      .sort((a, b) => (roleRank[a.role_id] || 99) - (roleRank[b.role_id] || 99));
  }, [roleFilter, searchTerm, users]);

  const stats = useMemo(() => ({
    total: users.length,
    admins: users.filter((user) => String(user.role_id) === '1').length,
    activeRoles: new Set(users.map((user) => user.role_id)).size
  }), [users]);

  const openAddModal = () => {
    setEditingId(null);
    setForm(initialFormState);
    setIsModalOpen(true);
    requestAnimationFrame(() => setIsModalVisible(true));
  };

  const openEditModal = (user) => {
    setEditingId(user.id);
    setForm({
      email: user.email || '',
      password: '',
      fullName: user.full_name || '',
      roleId: String(user.role_id || '2')
    });
    setIsModalOpen(true);
    requestAnimationFrame(() => setIsModalVisible(true));
  };

  const closeModal = () => {
    setIsModalVisible(false);
    window.setTimeout(() => {
      setIsModalOpen(false);
      setEditingId(null);
      setForm(initialFormState);
    }, 220);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/auth/users/${editingId}`, {
          full_name: form.fullName,
          role_id: form.roleId,
          password: form.password || undefined
        });
        alert('Cập nhật tài khoản thành công!');
      } else {
        await api.post('/auth/users', {
          email: form.email,
          password: form.password,
          full_name: form.fullName,
          role_id: form.roleId
        });
        alert('Tạo tài khoản mới thành công!');
      }
      closeModal();
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi hệ thống!');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Bạn có chắc muốn xóa tài khoản của ${name} không?`)) {
      try {
        await api.delete(`/auth/users/${id}`);
        alert('Đã xóa thành công!');
        fetchUsers();
      } catch (error) {
        alert(error.response?.data?.message || 'Lỗi khi xóa!');
      }
    }
  };

  const renderModal = () => {
    if (!isModalOpen || !portalReady || typeof document === 'undefined') return null;

    return createPortal(
      <div style={{ ...styles.overlay, background: isModalVisible ? 'rgba(15, 23, 42, 0.58)' : 'rgba(15, 23, 42, 0)' }} onClick={closeModal}>
        <div
          style={{
            ...styles.modal,
            transform: isModalVisible ? 'scale(1)' : 'scale(0.97)',
            opacity: isModalVisible ? 1 : 0,
            transition: 'transform 220ms ease, opacity 220ms ease'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ ...styles.cardHeader, display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start' }}>
            <div>
              <h3 style={styles.cardTitle}>{editingId ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản mới'}</h3>
              <p style={styles.cardSubtitle}>
                {editingId ? 'Cập nhật thông tin và phân quyền cho tài khoản đang sử dụng.' : 'Tạo tài khoản mới với email đăng nhập, họ tên và quyền phù hợp.'}
              </p>
            </div>
            <button type="button" onClick={closeModal} style={{ ...styles.buttonGhost, padding: '10px 14px' }}>Đóng</button>
          </div>

          <div style={styles.cardBody}>
            <form onSubmit={handleSubmit} style={styles.formGrid}>
              <div style={styles.field}>
                <label style={styles.label}>Email đăng nhập</label>
                <input
                  required
                  disabled={!!editingId}
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="VD: nhanvien@congty.com"
                  style={{ ...styles.input, background: editingId ? '#f8fafc' : '#fff' }}
                />
                {editingId && <small style={styles.hint}>Không thể thay đổi email đăng nhập của tài khoản đã tạo.</small>}
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Họ và tên</label>
                <input required name="fullName" value={form.fullName} onChange={handleChange} placeholder="VD: Nguyễn Văn A" style={styles.input} />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Mật khẩu</label>
                <input
                  required={!editingId}
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder={editingId ? 'Bỏ trống nếu không đổi mật khẩu' : 'Nhập mật khẩu...'}
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Chức vụ / Phòng ban</label>
                <select name="roleId" value={form.roleId} onChange={handleChange} style={styles.select}>
                  <option value="1">Ban Giám Đốc (Toàn quyền)</option>
                  <option value="2">Kinh Doanh (Tạo đơn hàng)</option>
                  <option value="3">Giao Vận (Xem địa chỉ giao)</option>
                  <option value="4">Thủ Kho (Nhập/Xuất kho)</option>
                  <option value="5">Nhà Máy (Sản xuất & Giao hàng)</option>
                </select>
                <small style={{ ...styles.hint, color: roleMeta[form.roleId]?.color || '#94a3b8' }}>
                  {roleMeta[form.roleId]?.name}
                </small>
              </div>

              <div style={styles.modalActions}>
                <button type="button" onClick={closeModal} style={styles.buttonGhost}>Hủy bỏ</button>
                <button type="submit" style={styles.buttonPrimary} disabled={submitting}>
                  {submitting ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Tạo tài khoản'}
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
    <div style={{ ...styles.page, opacity: pageLoaded ? 1 : 0, transform: pageLoaded ? 'translateY(0)' : 'translateY(16px)', transition: 'opacity 320ms ease, transform 320ms ease' }}>
      <div style={styles.shell}>
        <div style={{ ...styles.hero, opacity: pageLoaded ? 1 : 0, transform: pageLoaded ? 'translateY(0)' : 'translateY(14px)', transition: 'opacity 420ms ease 80ms, transform 420ms ease 80ms' }}>
          <div>
            <h2 style={styles.heroTitle}>Quản lý tài khoản</h2>
            <p style={styles.heroSubtitle}>
              Giao diện quản trị hiện đại, rõ ràng và đồng bộ với phong cách dashboard hiện tại. Theo dõi tài khoản, vai trò và thao tác nhanh trong một màn hình duy nhất.
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={openAddModal}
              onMouseEnter={() => setHoveredAddButton(true)}
              onMouseLeave={() => setHoveredAddButton(false)}
              style={{
                ...styles.buttonPrimary,
                transform: hoveredAddButton ? 'translateY(-2px)' : 'translateY(0)',
                boxShadow: hoveredAddButton ? '0 18px 30px rgba(37,99,235,0.26)' : styles.buttonPrimary.boxShadow,
                transition: 'transform 180ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 180ms ease, filter 180ms ease',
                filter: hoveredAddButton ? 'brightness(1.02)' : 'none'
              }}
            >
              + Thêm tài khoản
            </button>
          </div>
        </div>

        <div style={styles.statGrid}>
          {[
            { key: 'total', label: 'Tổng tài khoản', value: stats.total, desc: 'Toàn bộ người dùng đang có trong hệ thống.', tone: 'statBlue', icon: 'ri-user-3-line' },
            { key: 'admins', label: 'Quản trị viên', value: stats.admins, desc: 'Các tài khoản có quyền cao nhất.', tone: 'statAmber', icon: 'ri-shield-star-line' },
            { key: 'roles', label: 'Nhóm quyền', value: stats.activeRoles, desc: 'Số loại vai trò đang được sử dụng.', tone: 'statEmerald', icon: 'ri-settings-3-line' }
          ].map((item, index) => (
            <div
              key={item.key}
              onMouseEnter={() => setHoveredStat(item.key)}
              onMouseLeave={() => setHoveredStat(null)}
              style={{
                ...styles.statCard,
                opacity: pageLoaded ? 1 : 0,
                transform: hoveredStat === item.key ? 'translateY(-5px) scale(1.01)' : pageLoaded ? 'translateY(0) scale(1)' : 'translateY(18px) scale(1)',
                boxShadow: hoveredStat === item.key
                  ? item.key === 'total'
                    ? '0 18px 36px rgba(37,99,235,0.14), 0 12px 24px rgba(37,99,235,0.10)'
                    : item.key === 'admins'
                      ? '0 18px 36px rgba(245,158,11,0.16), 0 12px 24px rgba(245,158,11,0.10)'
                      : '0 18px 36px rgba(16,185,129,0.16), 0 12px 24px rgba(16,185,129,0.10)'
                  : undefined,
                transition: `opacity 420ms ease ${120 + index * 100}ms, transform 460ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 460ms cubic-bezier(0.22, 1, 0.36, 1)`
              }}
            >
              <div style={{ ...styles.statIcon, ...styles[item.tone] }}><i className={item.icon} /></div>
              <p style={styles.statLabel}>{item.label}</p>
              <div style={styles.statValue}>{item.value}</div>
              <p style={styles.statDesc}>{item.desc}</p>
            </div>
          ))}
        </div>

        <section
          style={{
            ...styles.card,
            opacity: pageLoaded ? 1 : 0,
            transform: pageLoaded ? 'translateY(0)' : 'translateY(18px)',
            transition: 'opacity 460ms ease 180ms, transform 460ms ease 180ms'
          }}
        >
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>Danh sách tài khoản</h3>
            <p style={styles.cardSubtitle}>Bảng thông tin được thiết kế tối giản nhưng giàu độ tương phản để dễ đọc và thao tác quản trị nhanh.</p>
            <div style={{ marginTop: '14px', display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(240px, 0.7fr)', gap: '12px' }}>
              <div style={{ position: 'relative' }}>
                <i
                  className="ri-search-line"
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                    pointerEvents: 'none'
                  }}
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm theo email, họ tên hoặc quyền..."
                  style={{
                    width: '100%',
                    padding: '13px 14px 13px 42px',
                    borderRadius: '14px',
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                    outline: 'none',
                    fontSize: '14px',
                    boxShadow: '0 10px 20px rgba(15,23,42,0.04)',
                    transition: 'border-color 180ms ease, box-shadow 180ms ease'
                  }}
                />
              </div>
              <div style={{ position: 'relative' }}>
                <i
                  className="ri-filter-3-line"
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                    pointerEvents: 'none'
                  }}
                />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '13px 14px 13px 42px',
                    borderRadius: '14px',
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                    outline: 'none',
                    fontSize: '14px',
                    boxShadow: '0 10px 20px rgba(15,23,42,0.04)',
                    transition: 'border-color 180ms ease, box-shadow 180ms ease'
                  }}
                >
                  <option value="all">Tất cả vai trò</option>
                  <option value="1">Ban Giám Đốc (Admin)</option>
                  <option value="2">Kinh Doanh (Sales)</option>
                  <option value="3">Giao Vận (Logistics)</option>
                  <option value="4">Thủ Kho</option>
                  <option value="5">Nhà Máy</option>
                </select>
              </div>
            </div>
          </div>
          <div style={{ ...styles.cardBody, padding: '20px 24px 24px' }}>
            {loading ? (
              <div style={styles.empty}>Đang tải dữ liệu...</div>
            ) : users.length === 0 ? (
              <div style={styles.empty}>Chưa có tài khoản nào. Hãy tạo tài khoản đầu tiên để bắt đầu.</div>
            ) : filteredUsers.length === 0 ? (
              <div style={styles.empty}>Không có tài khoản nào phù hợp với từ khóa hoặc bộ lọc hiện tại.</div>
            ) : (
              <div style={styles.tableWrap}>
                <table style={{ ...styles.table, minWidth: '1100px' }}>
                  <thead>
                    <tr>
                      <th style={{ ...styles.th, minWidth: '260px' }}>Email đăng nhập</th>
                      <th style={{ ...styles.th, minWidth: '220px' }}>Họ và tên</th>
                      <th style={{ ...styles.th, minWidth: '240px' }}>Chức vụ / Quyền</th>
                      <th style={{ ...styles.th, minWidth: '140px', textAlign: 'center' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user, index) => {
                      const role = roleMeta[user.role_id] || { name: 'Chưa rõ', color: '#475467', bg: '#f2f4f7', border: '#d0d5dd', icon: '•' };
                      return (
                        <tr
                          key={user.id}
                          onMouseEnter={() => setHoveredRowId(user.id)}
                          onMouseLeave={() => setHoveredRowId(null)}
                          style={{
                            opacity: pageLoaded ? 1 : 0,
                            transform: hoveredRowId === user.id ? 'translateY(-2px)' : pageLoaded ? 'translateY(0)' : 'translateY(10px)',
                            background: hoveredRowId === user.id ? '#f8fbff' : 'transparent',
                            boxShadow: hoveredRowId === user.id ? '0 10px 24px rgba(15,23,42,0.06)' : 'none',
                            transition: `opacity 360ms ease ${120 + index * 70}ms, transform 180ms cubic-bezier(0.22, 1, 0.36, 1), background-color 180ms ease, box-shadow 180ms ease`
                          }}
                        >
                          <td style={styles.td}>
                            <div style={{ fontWeight: 800 }}>{user.email}</div>
                            <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px' }}>Tài khoản đăng nhập hệ thống</div>
                          </td>
                          <td style={styles.td}>{user.full_name}</td>
                          <td style={styles.td}>
                            <span style={{ ...styles.roleBadge, color: role.color, background: role.bg, borderColor: role.border }}>
                              <i className={role.icon} />
                              <span>{role.name}</span>
                            </span>
                          </td>
                          <td style={{ ...styles.td, textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                              <button type="button" title="Sửa tài khoản" aria-label="Sửa tài khoản" onClick={() => openEditModal(user)} style={{ ...styles.editBtn, transform: hoveredRowId === user.id ? 'translateY(-1px)' : 'translateY(0)', transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease', boxShadow: hoveredRowId === user.id ? '0 10px 18px rgba(37,99,235,0.10)' : '0 6px 14px rgba(15,23,42,0.04)' }}>
                                <i className="ri-edit-2-line" />
                              </button>
                              {String(user.role_id) !== '1' && (
                                <button type="button" title="Xóa tài khoản" aria-label="Xóa tài khoản" onClick={() => handleDelete(user.id, user.full_name)} style={{ ...styles.deleteBtn, transform: hoveredRowId === user.id ? 'translateY(-1px)' : 'translateY(0)', transition: 'transform 180ms ease, box-shadow 180ms ease', boxShadow: hoveredRowId === user.id ? '0 10px 18px rgba(239,68,68,0.12)' : '0 6px 14px rgba(239,68,68,0.06)' }}>
                                <i className="ri-delete-bin-line" />
                              </button>
                              )}
                            </div>
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

      {renderModal()}
    </div>
  );
}
