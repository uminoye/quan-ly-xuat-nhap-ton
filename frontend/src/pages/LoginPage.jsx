import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'remixicon/fonts/remixicon.css';
import api from '../services/api';

const demoAccounts = [
  { email: 'admin@congty.com',     password: '123456', role: 'Admin',     accent: '#dbeafe', border: '#93c5fd', text: '#1d4ed8', icon: 'ri-shield-user-line'  },
  { email: 'sale@congty.com',      password: '123456', role: 'Sales',     accent: '#fee2e2', border: '#fca5a5', text: '#b91c1c', icon: 'ri-shopping-cart-line' },
  { email: 'kho@congty.com',       password: '123456', role: 'Kho',       accent: '#fef3c7', border: '#fcd34d', text: '#b45309', icon: 'ri-archive-line'       },
  { email: 'logistics@congty.com', password: '123456', role: 'Logistics', accent: '#dcfce7', border: '#86efac', text: '#15803d', icon: 'ri-truck-line'         },
  { email: 'nhamay@congty.com',    password: '123456', role: 'Nhà máy',   accent: '#ede9fe', border: '#c4b5fd', text: '#6d28d9', icon: 'ri-building-line'      },
];

const logoSrc = 'https://cdn.haitrieu.com/wp-content/uploads/2023/03/Logo-Truong-Cao-dang-nghe-Cong-nghe-cao-Dong-An.png';

export default function LoginPage() {
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPass] = useState(false);
  const [logoError, setLogoError]   = useState(false);
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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        .login-root { font-family: 'Inter', system-ui, sans-serif; }

        .login-input:focus { border-color: #1e40af !important; box-shadow: 0 0 0 4px rgba(30,64,175,0.12); }
        .login-submit:hover { transform: translateY(-1px); box-shadow: 0 14px 32px rgba(30,64,175,0.45) !important; }
        .login-demo:hover { transform: translateY(-2px); box-shadow: 0 6px 14px rgba(15,23,42,0.08); }
        .login-eye:hover { color: #1e40af; background: #eff6ff; }
        .login-left-deco { position: absolute; border-radius: 50%; pointer-events: none; }

        @media (max-width: 1280px) {
          .login-left  { padding: 32px 36px !important; }
          .login-right { padding: 32px 28px !important; }
          .login-hero-title { font-size: 42px !important; }
          .login-hero { margin-top: 56px !important; }
          .login-stats-grid { margin-top: 32px !important; }
        }
        @media (max-width: 1100px) {
          .login-hero-title { font-size: 38px !important; }
          .login-stat-val   { font-size: 20px !important; }
          .login-stat-card  { padding: 14px 14px !important; }
        }
        @media (max-width: 980px) {
          .login-left  { padding: 28px 28px !important; }
          .login-hero  { display: none !important; }
          .login-testimonial { display: none !important; }
          .login-stats-grid { margin-top: auto !important; }
        }
        @media (max-width: 768px) {
          .login-left  { display: none !important; }
          .login-right { flex: 1 1 100% !important; padding: 28px 22px !important; }
        }
        @media (max-width: 480px) {
          .login-right        { padding: 22px 18px !important; }
          .login-form-wrap    { max-width: 100% !important; }
          .login-form-title   { font-size: 26px !important; }
          .login-form-sub     { font-size: 14px !important; }
          .login-input        { height: 46px !important; font-size: 13.5px !important; }
          .login-submit       { height: 48px !important; font-size: 14.5px !important; }
          .login-demo-email   { font-size: 11px !important; }
        }
        @media (max-width: 360px) {
          .login-right        { padding: 18px 14px !important; }
          .login-form-title   { font-size: 23px !important; }
        }
        @media (max-height: 500px) and (orientation: landscape) {
          .login-left-deco:nth-of-type(1),
          .login-left-deco:nth-of-type(3) { display: none !important; }
        }
      `}</style>

      <div className="login-root" style={S.root}>
        {/* ───────── LEFT PANEL ───────── */}
        <aside className="login-left" style={S.left}>
          <div className="login-left-deco" style={S.deco1} />
          <div className="login-left-deco" style={S.deco2} />
          <div className="login-left-deco" style={S.deco3} />

          {/* Logo */}
          <div style={S.logoRow}>
            <div style={S.logoBox}>
              {!logoError && logoSrc ? (
                <img src={logoSrc} alt="logo" style={S.logoImg} onError={() => setLogoError(true)} />
              ) : (
                <span style={S.logoFallback}>CĐ</span>
              )}
            </div>
            <div>
              <div style={S.logoTitle}>Đồ Án Tốt Nghiệp</div>
              <div style={S.logoSub}>Trường Cao đẳng Công nghiệp Cao Đồng An</div>
            </div>
          </div>

          {/* Hero */}
          <div className="login-hero" style={S.hero}>
            <h1 className="login-hero-title" style={S.heroTitle}>
              Quản Lý<br />
              <span style={S.heroAccent}>Xuất — Nhập — Tồn</span>
            </h1>
            <p style={S.heroDesc}>
              Hệ thống quản lý kho hàng thông minh, theo dõi xuất nhập tồn theo
              thời gian thực với phân quyền linh hoạt cho doanh nghiệp.
            </p>
          </div>

          {/* Stats */}
          <div className="login-stats-grid" style={S.statsGrid}>
            {[
              { icon: 'ri-shield-check-line',  val: '99.9%',   lbl: 'Độ ổn định' },
              { icon: 'ri-user-settings-line', val: '5 cấp',   lbl: 'Phân quyền' },
              { icon: 'ri-database-2-line',    val: 'Realtime', lbl: 'Cập nhật'  },
            ].map(s => (
              <div key={s.val} className="login-stat-card" style={S.statCard}>
                <div style={S.statIcon}><i className={s.icon} /></div>
                <div className="login-stat-val" style={S.statVal}>{s.val}</div>
                <div style={S.statLbl}>{s.lbl}</div>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="login-testimonial" style={S.testi}>
            <div style={S.testiAvatar}><i className="ri-user-smile-line" style={{ fontSize: 22 }} /></div>
            <div style={S.testiBody}>
              <div style={S.testiHead}>
                <div>
                  <div style={S.testiName}>Nguyễn Văn An</div>
                  <div style={S.testiRole}>Admin · Ban Giám Đốc</div>
                </div>
                <div style={S.testiStars}>
                  {[...Array(5)].map((_, i) => <i key={i} className="ri-star-fill" />)}
                </div>
              </div>
              <div style={S.testiQuote}>
                "Hệ thống giúp chúng tôi kiểm soát kho hàng chính xác hơn 90%, tiết kiệm nhiều giờ làm việc mỗi ngày."
              </div>
            </div>
          </div>
        </aside>

        {/* ───────── RIGHT PANEL ───────── */}
        <main className="login-right" style={S.right}>
          <div className="login-form-wrap" style={S.formWrap}>

            <div style={S.formHead}>
              <h2 className="login-form-title" style={S.formTitle}>Chào mừng trở lại! 👋</h2>
              <p className="login-form-sub" style={S.formSub}>Đăng nhập để tiếp tục quản lý kho hàng</p>
            </div>

            <form onSubmit={handleLogin} style={S.form}>
              {/* Email */}
              <div>
                <label style={S.label}>Email</label>
                <div style={S.inputWrap}>
                  <i className="ri-mail-line" style={S.inputIcon} />
                  <input
                    className="login-input login-input"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="email@company.vn"
                    required
                    style={S.input}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={S.label}>Mật khẩu</label>
                <div style={S.inputWrap}>
                  <i className="ri-lock-line" style={S.inputIcon} />
                  <input
                    className="login-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    required
                    style={S.input}
                  />
                  <button
                    type="button"
                    className="login-eye"
                    onClick={() => setShowPass(p => !p)}
                    style={S.eyeBtn}
                    aria-label="Hiện/ẩn mật khẩu"
                  >
                    <i className={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} style={{ fontSize: 18 }} />
                  </button>
                </div>
              </div>

              {/* Forgot */}
              <div style={S.forgotRow}>
                <label style={S.checkbox}>
                  <input type="checkbox" /> <span>Ghi nhớ</span>
                </label>
                <a href="#" style={S.forgot}>Quên mật khẩu?</a>
              </div>

              <button type="submit" className="login-submit" style={S.submit}>
                Đăng nhập
                <i className="ri-arrow-right-line" style={{ marginLeft: 8, fontSize: 18 }} />
              </button>
            </form>

            <div style={S.divider}>
              <span style={S.dividerText}>Hoặc chọn nhanh tài khoản demo</span>
            </div>

            <div style={S.demoList}>
              {demoAccounts.map(a => (
                <button
                  key={a.email}
                  type="button"
                  className="login-demo"
                  onClick={() => { setEmail(a.email); setPassword(a.password); }}
                  style={{ ...S.demoBtn, background: a.accent, borderColor: a.border }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <i className={a.icon} style={{ color: a.text, fontSize: 16 }} />
                    <span style={{ color: a.text, fontWeight: 700, fontSize: 14 }}>{a.role}</span>
                  </span>
                  <span className="login-demo-email" style={S.demoEmail}>{a.email}</span>
                </button>
              ))}
            </div>

            <div style={S.footer}>
              © 2026 Đồ Án Tốt Nghiệp — Khoa CNTT
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

// ─── Styles ────────────────────────────────────────────────────────
const S = {
  root: {
    display: 'flex',
    minHeight: '100vh',
    background: '#f1f5f9',
  },

  // ── LEFT ──
  left: {
    position: 'relative',
    overflow: 'hidden',
    flex: '1 1 50%',
    background: 'linear-gradient(160deg, #0c1e3e 0%, #1e3a8a 45%, #1e40af 80%, #0ea5e9 100%)',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    padding: '40px 48px',
  },

  // Decorative circles
  deco1: {
    width: 420, height: 420,
    top: -140, right: -120,
    background: 'radial-gradient(circle, rgba(59,130,246,0.35) 0%, transparent 70%)',
  },
  deco2: {
    width: 280, height: 280,
    bottom: -80, left: -60,
    background: 'radial-gradient(circle, rgba(14,165,233,0.30) 0%, transparent 70%)',
  },
  deco3: {
    width: 200, height: 200,
    top: '40%', right: '15%',
    background: 'radial-gradient(circle, rgba(96,165,250,0.20) 0%, transparent 70%)',
  },

  // Logo
  logoRow: {
    display: 'flex', alignItems: 'center', gap: 14,
    position: 'relative', zIndex: 2,
  },
  logoBox: {
    width: 56, height: 56, borderRadius: 14,
    background: '#fff',
    boxShadow: '0 10px 28px rgba(0,0,0,0.25)',
    display: 'grid', placeItems: 'center',
    overflow: 'hidden', flexShrink: 0,
    border: '2px solid rgba(255,255,255,0.4)',
  },
  logoImg: { width: '88%', height: '88%', objectFit: 'contain', display: 'block' },
  logoFallback: {
    fontSize: 16, fontWeight: 900, color: '#1e3a8a',
    letterSpacing: 0.5,
  },
  logoTitle: { fontSize: 18, fontWeight: 800, letterSpacing: 0.3, color: '#fff' },
  logoSub:   { fontSize: 13, opacity: 0.75, marginTop: 3, color: '#dbeafe' },

  // Hero
  hero: { marginTop: 72, maxWidth: 520, position: 'relative', zIndex: 2 },
  heroTitle: {
    margin: 0, fontSize: 48, lineHeight: 1.1, fontWeight: 900,
    color: '#fff', letterSpacing: -0.5,
  },
  heroAccent: {
    color: '#7dd3fc',
    textShadow: '0 0 32px rgba(125,211,252,0.4)',
  },
  heroDesc: {
    margin: '20px 0 0', fontSize: 16, lineHeight: 1.65,
    color: 'rgba(219,234,254,0.85)', maxWidth: 460,
  },

  // Stats
  statsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 14, marginTop: 40, position: 'relative', zIndex: 2,
  },
  statCard: {
    background: 'rgba(255,255,255,0.10)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 16, padding: '16px 18px',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
  },
  statIcon: {
    width: 32, height: 32, borderRadius: 9,
    background: 'rgba(125,211,252,0.25)',
    display: 'grid', placeItems: 'center',
    color: '#7dd3fc', fontSize: 17, marginBottom: 12,
  },
  statVal: { fontSize: 22, fontWeight: 800, color: '#fff' },
  statLbl: { fontSize: 12, color: 'rgba(219,234,254,0.7)', marginTop: 3 },

  // Testimonial
  testi: {
    marginTop: 'auto', position: 'relative', zIndex: 2,
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 18, padding: 18,
    display: 'flex', gap: 14, alignItems: 'flex-start',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
  },
  testiAvatar: {
    width: 46, height: 46, borderRadius: '50%',
    background: 'rgba(125,211,252,0.30)',
    display: 'grid', placeItems: 'center',
    color: '#7dd3fc', flexShrink: 0,
  },
  testiBody: { flex: 1 },
  testiHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  testiName: { fontWeight: 700, fontSize: 14, color: '#fff' },
  testiRole: { fontSize: 12, color: 'rgba(219,234,254,0.7)', marginTop: 2 },
  testiStars: { display: 'flex', gap: 2, color: '#fbbf24', fontSize: 13 },
  testiQuote: { marginTop: 10, fontSize: 13, lineHeight: 1.65, color: 'rgba(219,234,254,0.85)', fontStyle: 'italic' },

  // ── RIGHT ──
  right: {
    flex: '1 1 50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '40px 32px',
    background: '#f8fafc',
    overflowY: 'auto',
  },
  formWrap: { width: '100%', maxWidth: 440 },

  formHead: { marginBottom: 32 },
  formTitle: { margin: 0, fontSize: 30, fontWeight: 800, color: '#0f172a', letterSpacing: -0.4 },
  formSub:   { margin: '8px 0 0', color: '#64748b', fontSize: 15 },

  form: { display: 'flex', flexDirection: 'column', gap: 18 },
  label: { display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#334155' },

  inputWrap: { position: 'relative' },
  inputIcon: {
    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
    color: '#94a3b8', fontSize: 17, pointerEvents: 'none',
  },
  input: {
    width: '100%', height: 48, padding: '0 46px 0 42px',
    borderRadius: 11, border: '1.5px solid #e2e8f0',
    outline: 'none', background: '#fff', color: '#0f172a',
    fontSize: 14, boxSizing: 'border-box',
    transition: 'border-color 200ms, box-shadow 200ms',
  },
  eyeBtn: {
    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
    border: 'none', background: 'transparent', color: '#64748b',
    width: 34, height: 34, borderRadius: 8,
    display: 'grid', placeItems: 'center', cursor: 'pointer',
    transition: 'background 150ms, color 150ms',
  },

  forgotRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: -4 },
  checkbox: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569', cursor: 'pointer' },
  forgot: { fontSize: 13, color: '#1e40af', textDecoration: 'none', fontWeight: 600 },

  submit: {
    height: 50, marginTop: 6, border: 'none', borderRadius: 12,
    background: 'linear-gradient(90deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%)',
    color: '#fff', fontWeight: 700, fontSize: 15,
    cursor: 'pointer', letterSpacing: 0.3,
    boxShadow: '0 10px 28px rgba(30,58,138,0.35)',
    transition: 'transform 150ms, box-shadow 150ms',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  },

  divider: {
    display: 'flex', alignItems: 'center', margin: '28px 0 14px', gap: 12,
  },
  dividerText: {
    fontSize: 12, color: '#94a3b8', fontWeight: 500,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },

  demoList: { display: 'flex', flexDirection: 'column', gap: 9 },
  demoBtn: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    width: '100%', borderRadius: 12,
    border: '1px solid', padding: '12px 14px',
    fontSize: 13, cursor: 'pointer', textAlign: 'left',
    transition: 'transform 150ms, box-shadow 150ms',
  },
  demoEmail: { color: '#475569', fontWeight: 600, fontSize: 12 },

  footer: { marginTop: 24, textAlign: 'center', color: '#94a3b8', fontSize: 12 },
};
