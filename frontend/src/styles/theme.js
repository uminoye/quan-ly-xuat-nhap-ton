// ============================================================
//  DESIGN SYSTEM — XUÂT NHẬP TỒN
//  Tông màu xanh dương sang, responsive laptop + điện thoại
// ============================================================

// --- MÀU CHÍNH ---
export const colors = {
  // Primary
  primary:        '#2563eb',   // xanh dương đậm — nút chính, link
  primaryLight:   '#3b82f6',   // hover state
  primaryDark:    '#1d4ed8',   // active state
  primarySoft:    '#eff6ff',   // nền nhẹ primary
  primaryBorder:  '#bfdbfe',   // viền nhẹ

  // Accent / Success
  success:        '#10b981',   // xanh lá — thành công, nhập kho
  successLight:   '#059669',
  successSoft:    '#ecfdf3',
  successBorder:  '#a7f3d0',

  // Warning / Hoàn
  warning:        '#f59e0b',   // vàng cam — cảnh báo, chờ xử lý
  warningLight:   '#d97706',
  warningSoft:    '#fffbeb',
  warningBorder:  '#fde68a',

  // Danger / Lỗi
  danger:         '#ef4444',   // đỏ — lỗi, xóa, hủy
  dangerLight:    '#dc2626',
  dangerSoft:     '#fef2f2',
  dangerBorder:   '#fecaca',

  // Purple / Xuất kho
  purple:         '#7c3aed',
  purpleLight:    '#6d28d9',
  purpleSoft:     '#f5f3ff',
  purpleBorder:   '#ddd6fe',

  // Neutral (nền, chữ)
  white:          '#ffffff',
  background:     '#f8fafc',
  backgroundAlt:  '#f1f5f9',
  surface:        '#ffffff',   // card, modal
  border:         '#e2e8f0',
  borderLight:    '#f1f5f9',

  // Text
  text:           '#0f172a',   // đen đậm
  textSecondary:  '#475569',   // xám
  textMuted:      '#94a3b8',   // xám nhạt
  textInverse:    '#ffffff',

  // Trạng thái đơn hàng
  statusPending:        '#f59e0b',
  statusProcessing:     '#3b82f6',
  statusWarehouse:     '#7c3aed',
  statusShipping:      '#0ea5e9',
  statusCompleted:     '#10b981',
  statusCanceled:      '#64748b',
  statusReturned:      '#f59e0b',
};

// --- SPACING & BORDER RADIUS ---
export const spacing = {
  xs:  '4px',
  sm:  '8px',
  md:  '16px',
  lg:  '24px',
  xl:  '32px',
  xxl: '48px',
};

export const radius = {
  sm:  '8px',
  md:  '12px',
  lg:  '16px',
  xl:  '20px',
  full: '9999px',
};

// --- SHADOW ---
export const shadows = {
  sm:  '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)',
  md:  '0 4px 12px rgba(15,23,42,0.08), 0 2px 4px rgba(15,23,42,0.04)',
  lg:  '0 10px 28px rgba(15,23,42,0.10), 0 4px 8px rgba(15,23,42,0.06)',
  xl:  '0 20px 48px rgba(15,23,42,0.14), 0 8px 16px rgba(15,23,42,0.08)',
};

// --- TYPOGRAPHY ---
export const fonts = {
  mono: "'JetBrains Mono', 'Fira Code', monospace",
};

// --- BUTTON BASE STYLE ---
export const btn = (variant = 'primary', size = 'md') => {
  const sizes = {
    sm: { padding: '6px 14px', fontSize: '13px', height: '32px' },
    md: { padding: '10px 20px', fontSize: '14px', height: '40px' },
    lg: { padding: '12px 24px', fontSize: '16px', height: '48px' },
  };
  const variants = {
    primary: {
      background: colors.primary,
      color: colors.white,
      border: 'none',
      hoverBg: colors.primaryDark,
      boxShadow: `0 4px 12px ${colors.primary}33`,
    },
    secondary: {
      background: colors.white,
      color: colors.primary,
      border: `1.5px solid ${colors.border}`,
      hoverBg: colors.primarySoft,
      boxShadow: 'none',
    },
    danger: {
      background: colors.danger,
      color: colors.white,
      border: 'none',
      hoverBg: colors.dangerLight,
      boxShadow: `0 4px 12px ${colors.danger}33`,
    },
    ghost: {
      background: 'transparent',
      color: colors.textSecondary,
      border: 'none',
      hoverBg: colors.backgroundAlt,
      boxShadow: 'none',
    },
    success: {
      background: colors.success,
      color: colors.white,
      border: 'none',
      hoverBg: colors.successLight,
      boxShadow: `0 4px 12px ${colors.success}33`,
    },
  };
  const v = variants[variant] || variants.primary;
  const s = sizes[size] || sizes.md;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    borderRadius: radius.md,
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 200ms ease',
    outline: 'none',
    whiteSpace: 'nowrap',
    textDecoration: 'none',
    ...s,
    background: v.background,
    color: v.color,
    border: v.border,
    boxShadow: v.boxShadow,
  };
};

// --- CARD BASE ---
export const card = (extra = {}) => ({
  background: colors.surface,
  borderRadius: radius.xl,
  border: `1px solid ${colors.border}`,
  boxShadow: shadows.md,
  padding: spacing.lg,
  ...extra,
});

// --- INPUT BASE ---
export const input = () => ({
  width: '100%',
  padding: '10px 14px',
  borderRadius: radius.md,
  border: `1.5px solid ${colors.border}`,
  background: colors.white,
  color: colors.text,
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 200ms ease, box-shadow 200ms ease',
  boxSizing: 'border-box',
});

// --- BADGE BASE ---
export const badge = (variant = 'default') => {
  const map = {
    default:   { bg: colors.backgroundAlt, color: colors.textSecondary, border: colors.border },
    primary:   { bg: colors.primarySoft, color: colors.primary, border: colors.primaryBorder },
    success:   { bg: colors.successSoft, color: colors.successLight, border: colors.successBorder },
    warning:   { bg: colors.warningSoft, color: colors.warningLight, border: colors.warningBorder },
    danger:    { bg: colors.dangerSoft, color: colors.danger, border: colors.dangerBorder },
    purple:    { bg: colors.purpleSoft, color: colors.purple, border: colors.purpleBorder },
  };
  const b = map[variant] || map.default;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    borderRadius: radius.full,
    fontSize: '12px',
    fontWeight: '600',
    border: `1px solid ${b.border}`,
    background: b.bg,
    color: b.color,
    gap: '4px',
  };
};

// --- PAGE WRAPPER ---
export const pageWrap = {
  minHeight: '100vh',
  padding: spacing.lg,
  background: `linear-gradient(160deg, #eff6ff 0%, ${colors.background} 40%, #f8fafc 100%)`,
  color: colors.text,
};

// ============================================================
//  COMPONENT FACTORIES — dùng nhanh trong JSX
// ============================================================

export const StatCard = ({ icon, value, label, sub, accent = colors.primary, delay = 0 }) => ({
  type: 'div',
  style: {
    ...card(),
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
    animation: `fadeUp 500ms ease ${delay}ms both`,
  },
  children: [
    {
      type: 'div',
      style: {
        width: 44,
        height: 44,
        borderRadius: radius.lg,
        background: accent + '18',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: accent,
        fontSize: 20,
      },
      children: icon,
    },
    {
      type: 'div',
      children: [
        { type: 'div', style: { fontSize: 12, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }, children: label },
        { type: 'div', style: { fontSize: 28, fontWeight: 800, color: colors.text, marginTop: 4, lineHeight: 1.1 }, children: value },
        sub ? { type: 'div', style: { fontSize: 12, color: colors.textMuted, marginTop: 6 }, children: sub } : null,
      ].filter(Boolean),
    },
  ].filter(Boolean),
});

export default {
  colors,
  spacing,
  radius,
  shadows,
  fonts,
  btn,
  card,
  input,
  badge,
  pageWrap,
  StatCard,
};
