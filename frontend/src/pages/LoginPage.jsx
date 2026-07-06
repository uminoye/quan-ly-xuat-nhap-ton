import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'remixicon/fonts/remixicon.css';
import api from '../services/api';

const demoAccounts = [
  { email: 'admin@congty.com', password: '123456', role: 'Admin',     accent: '#dbeafe', border: '#93c5fd', text: '#1d4ed8' },
  { email: 'sale@congty.com',  password: '123456', role: 'Sales',    accent: '#dcfce7', border: '#86efac', text: '#166534' },
  { email: 'kho@congty.com',   password: '123456', role: 'Kho',       accent: '#ede9fe', border: '#c4b5fd', text: '#6d28d9' },
  { email: 'logistics@congty.com', password: '123456', role: 'Logistics', accent: '#ffedd5', border: '#fdba74', text: '#9a3412' },
  { email: 'nhamay@congty.com',password: '123456', role: 'Nha may',  accent: '#fce7f3', border: '#f9a8d4', text: '#9d174d' },
];

const logoSrc = 'https://cdn.haitrieu.com/wp-content/uploads/2023/03/Logo-Truong-Cao-dang-nghe-Cong-nghiep-Cao-Dong-An.png';

export default function LoginPage() {
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [logoError, setLogoError]       = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('accessToken', res.data.accessToken);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi đăng nhập');
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        @media (max-width: 768px) {
          .login-root { flex-direction: column !important; }
          .login-left  { display: none !important; }
          .login-right { flex: 1 1 100% !important; padding: 24px 20px !important; }
          .login-form-wrap { max-width: 100% !important; }
        }
        @media (max-width: 480px) {
          .login-right { padding: 20px 16px !important; }
          .login-hero-title { font-size: 38px !important; }
        }
      `}</style>
    <div style={styles.root} className="login-root">
      {/* ── LEFT PANEL ── */}
      <aside style={styles.leftPanel} className="login-left">
        {/* Logo */}
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>
            {!logoError && logoSrc ? (
              <img src={logoSrc} alt="logo" style={styles.logoImg} onError={() => setLogoError(true)} />
            ) : (
              <span style={styles.logoFallback}>SS</span>
            )}
          </div>
          <div>
            <div style={styles.logoTitle}>Hệ Thống</div>
            <div style={styles.logoSub}>Quản lý xuất nhập tồn</div>
          </div>
        </div>

        {/* Hero text */}
        <div style={styles.hero}>
          <h1 style={styles.heroTitle} className="login-hero-title">
            Quản lý kho hàng<br />
            <span style={styles.heroAccent}>Xuất — Nhập — Tồn</span>
          </h1>
          <p style={styles.heroDesc}>
            Theo dõi xuất &mdash; nhập &mdash; tồn theo thời gian thực, phân quyền linh hoạt cho doanh nghiệp.
          </p>
        </div>

        {/* Stats */}
        <div style={styles.statsGrid}>
          {[
            { icon: 'ri-shield-check-line', val: '99.9%', lbl: 'Uptime' },
            { icon: 'ri-user-settings-line', val: '5 cap', lbl: 'Phan quyen' },
            { icon: 'ri-history-line',      val: 'Real-time', lbl: 'Cap nhat' },
          ].map(s => (
            <div key={s.val} style={styles.statCard}>
              <div style={styles.statIcon}><i className={s.icon} /></div>
              <div style={styles.statVal}>{s.val}</div>
              <div style={styles.statLbl}>{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* Testimonial */}
        <div style={styles.testimonial}>
          <div style={styles.testiAvatar}><i className="ri-user-smile-line" style={{ fontSize: 20 }} /></div>
          <div style={styles.testiBody}>
            <div style={styles.testiHeader}>
              <div>
                <div style={styles.testiName}>Nguyễn Văn An</div>
                <div style={styles.testiRole}>Admin · Ban Giám Đốc</div>
              </div>
              <div style={styles.testiStars}>
                {[...Array(5)].map((_, i) => <i key={i} className="ri-star-fill" />)}
              </div>
            </div>
            <div style={styles.testiQuote}>
              &ldquo;Hệ thống giúp chúng tôi kiểm soát kho hàng chính xác hơn 90%, tiết kiệm nhiều giờ làm việc.&rdquo;
            </div>
          </div>
        </div>

        {/* Decorative circles */}
        <div style={styles.deco1} />
        <div style={styles.deco2} />
      </aside>

      {/* ── RIGHT PANEL ── */}
      <main style={styles.rightPanel} className="login-right">
        <div style={styles.formWrap} className="login-form-wrap">

          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>Chào mừng trở lại!</h2>
            <p style={styles.formSub}>Đăng nhập để tiếp tục quản lý kho hàng</p>
          </div>

          <form onSubmit={handleLogin} style={styles.form}>
            {/* Email */}
            <div>
              <label style={styles.label}>Email</label>
              <div style={styles.inputWrap}>
                <i className="ri-mail-line" style={styles.inputIcon} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="email@company.vn"
                  required
                  style={styles.input}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={styles.label}>Mat khau</label>
              <div style={styles.inputWrap}>
                <i className="ri-lock-line" style={styles.inputIcon} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Nhap mat khau"
                  required
                  style={styles.input}
                />
                <button type="button" onClick={() => setShowPassword(p => !p)} style={styles.eyeBtn} aria-label="Toggle">
                  <i className={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} style={{ fontSize: 17 }} />
                </button>
              </div>
            </div>

            <button type="submit" style={styles.submitBtn}>
              Dang nhap
            </button>
          </form>

          <div style={styles.demoLabel}>Chon nhanh tai khoan demo</div>

          <div style={styles.demoList}>
            {demoAccounts.map(a => (
              <button key={a.email} type="button" onClick={() => { setEmail(a.email); setPassword(a.password); }} style={{ ...styles.demoBtn, background: a.accent, borderColor: a.border }}>
                <span style={{ color: a.text, fontWeight: 700 }}>{a.role}</span>
                <span style={styles.demoEmail}>{a.email}</span>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
    </>
  );
}

// ─── Responsive styles ───────────────────────────────────────────
const C = {
  blue:     '#2563eb',
  blueMid:  '#3b82f6',
  blueSoft: '#eff6ff',
  blueBorder: '#bfdbfe',
  white:    '#ffffff',
  bg:       '#f8fafc',
  text:     '#0f172a',
  muted:    '#94a3b8',
  border:   '#e2e8f0',
};

const styles = {
  root: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: 'Inter, system-ui, sans-serif',
  },

  // ── Left ──
  leftPanel: {
    position: 'relative',
    overflow: 'hidden',
    flex: '1 1 52%',
    background: `linear-gradient(155deg, #1e3a5f 0%, ${C.blue} 55%, #0ea5e9 100%)`,
    color: C.white,
    display: 'flex',
    flexDirection: 'column',
    padding: '36px 40px',
    gap: 0,
  },
  logoRow: {
    display: 'flex', alignItems: 'center', gap: 12,
  },
  logoIcon: {
    width: 44, height: 44, borderRadius: 12,
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.15)',
    display: 'grid', placeItems: 'center',
    overflow: 'hidden', flexShrink: 0,
  },
  logoImg:  { width: '100%', height: '100%', objectFit: 'contain', display: 'block' },
  logoFallback: {
    fontSize: 12, fontWeight: 800, letterSpacing: 1,
    color: '#93c5fd', display: 'grid', placeItems: 'center',
    width: '100%', height: '100%',
  },
  logoTitle: { fontSize: 17, fontWeight: 800, letterSpacing: 0.5 },
  logoSub:  { fontSize: 11, opacity: 0.65, marginTop: 2 },
  hero: { marginTop: 64, maxWidth: 480 },
  heroTitle: {
    margin: 0, fontSize: 52, lineHeight: 1.06, fontWeight: 800,
    color: C.white,
  },
  heroAccent: { display: 'block', color: '#93c5fd' },
  heroDesc: {
    margin: '16px 0 0', fontSize: 15, lineHeight: 1.65,
    color: 'rgba(255,255,255,0.72)',
  },
  statsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 14, marginTop: 40,
  },
  statCard: {
    background: 'rgba(255,255,255,0.09)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 16, padding: '16px 18px',
    backdropFilter: 'blur(10px)',
  },
  statIcon: {
    width: 30, height: 30, borderRadius: 8,
    background: 'rgba(96,165,250,0.2)',
    display: 'grid', placeItems: 'center',
    color: '#93c5fd', fontSize: 16, marginBottom: 12,
  },
  statVal: { fontSize: 22, fontWeight: 800 },
  statLbl: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 3 },
  testimonial: {
    marginTop: 'auto',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 18, padding: 18,
    display: 'flex', gap: 14, alignItems: 'flex-start',
    backdropFilter: 'blur(10px)',
  },
  testiAvatar: {
    width: 44, height: 44, borderRadius: '50%',
    background: 'rgba(96,165,250,0.2)',
    display: 'grid', placeItems: 'center',
    color: '#93c5fd', flexShrink: 0,
  },
  testiBody: { flex: 1 },
  testiHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  testiName: { fontWeight: 700, fontSize: 14 },
  testiRole: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  testiStars: { display: 'flex', gap: 2, color: '#fbbf24', fontSize: 13 },
  testiQuote: { marginTop: 10, fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.78)', fontStyle: 'italic' },

  // Decorative blobs
  deco1: {
    position: 'absolute', width: 320, height: 320,
    borderRadius: '50%', background: 'rgba(96,165,250,0.12)',
    top: -80, right: -80,
    filter: 'blur(40px)',
  },
  deco2: {
    position: 'absolute', width: 200, height: 200,
    borderRadius: '50%', background: 'rgba(14,165,233,0.12)',
    bottom: 60, right: 40,
    filter: 'blur(30px)',
  },

  // ── Right ──
  rightPanel: {
    flex: '1 1 48%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '32px 24px',
    background: C.bg,
    overflowY: 'auto',
  },
  formWrap: { width: '100%', maxWidth: 420 },
  formHeader: { marginBottom: 28 },
  formTitle: { margin: 0, fontSize: 28, fontWeight: 800, color: C.text },
  formSub: { margin: '7px 0 0', color: C.muted, fontSize: 14 },
  form: { display: 'flex', flexDirection: 'column', gap: 18 },
  label: { display: 'block', marginBottom: 7, fontSize: 14, fontWeight: 600, color: '#334155' },
  inputWrap: { position: 'relative' },
  inputIcon: {
    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
    color: C.muted, fontSize: 16, pointerEvents: 'none',
  },
  input: {
    width: '100%', height: 46, padding: '0 46px 0 40px',
    borderRadius: 10, border: `1.5px solid ${C.border}`,
    outline: 'none', background: C.white, color: C.text,
    fontSize: 14, boxSizing: 'border-box',
    transition: 'border-color 200ms',
  },
  eyeBtn: {
    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
    border: 'none', background: 'transparent', color: '#64748b',
    width: 32, height: 32, borderRadius: 8,
    display: 'grid', placeItems: 'center', cursor: 'pointer',
  },
  submitBtn: {
    height: 46, marginTop: 4, border: 'none', borderRadius: 10,
    background: `linear-gradient(90deg, ${C.blue} 0%, ${C.blueMid} 100%)`,
    color: C.white, fontWeight: 700, fontSize: 15,
    cursor: 'pointer', letterSpacing: 0.2,
    boxShadow: `0 8px 24px rgba(37,99,235,0.28)`,
    transition: 'transform 150ms, box-shadow 150ms',
  },
  demoLabel: {
    marginTop: 24, textAlign: 'center',
    color: C.muted, fontSize: 13,
  },
  demoList: {
    marginTop: 12, display: 'flex', flexDirection: 'column', gap: 9,
  },
  demoBtn: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    width: '100%', borderRadius: 12,
    border: '1px solid', padding: '11px 14px',
    fontSize: 13, cursor: 'pointer', textAlign: 'left',
  },
  demoEmail: { color: '#475569', fontWeight: 600, fontSize: 12 },
};
