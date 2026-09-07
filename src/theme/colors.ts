export const colors = {
  // Base dark charcoal surfaces
  background: '#0D0F12',
  surface: '#151820',
  surfaceHighlight: '#1E222D',
  surfaceElevated: '#262B39',
  border: '#2D3344',
  borderSubtle: '#222736',

  // Brand Warm Amber Accent (Subtle, calm, trustworthy - NOT overwhelming)
  brandPrimary: '#E07A5F',
  brandPrimaryHover: '#F4A261',
  brandPrimaryMuted: 'rgba(224, 122, 95, 0.15)',
  brandPrimaryBorder: 'rgba(224, 122, 95, 0.3)',

  // Secondary & Accents
  accentTeal: '#2A9D8F',
  accentTealMuted: 'rgba(42, 157, 143, 0.15)',
  accentAmber: '#E76F51',
  accentAmberMuted: 'rgba(231, 111, 81, 0.15)',

  // Text Hierarchy
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverse: '#0D0F12',

  // Status & Priority
  statusPending: '#F59E0B',
  statusInProgress: '#3B82F6',
  statusCompleted: '#10B981',
  statusUrgent: '#EF4444',

  // System
  overlay: 'rgba(13, 15, 18, 0.85)',
  transparent: 'transparent',
} as const;

export type ColorToken = keyof typeof colors;
