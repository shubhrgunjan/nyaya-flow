export interface ColorPalette {
  background: string;
  surface: string;
  surfaceHighlight: string;
  surfaceElevated: string;
  border: string;
  borderSubtle: string;

  accent: string;
  accentMuted: string;
  accentPrimary: string;
  accentPrimaryHover: string;
  accentPrimaryMuted: string;
  accentPrimaryBorder: string;

  accentSecondary: string;
  accentSuccess: string;
  accentWarning: string;
  accentError: string;

  brandPrimary: string;
  brandPrimaryMuted: string;
  brandPrimaryBorder: string;

  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  // Legal Specific Tokens
  watermarkText: string;
  stampBorder: string;
  stampFill: string;
  pathLineActive: string;
  pathLineInactive: string;

  overlay: string;
  transparent: string;
}

export const lightColors: ColorPalette = {
  background: '#FBFBFA',
  surface: '#FFFFFF',
  surfaceHighlight: '#F3F4F6',
  surfaceElevated: '#FFFFFF',
  border: '#E2E8F0',
  borderSubtle: '#F1F5F9',

  // Primary Interaction Color: Purple
  accent: '#7C3AED',
  accentMuted: 'rgba(124, 58, 237, 0.08)',
  accentPrimary: '#7C3AED',
  accentPrimaryHover: '#6D28D9',
  accentPrimaryMuted: 'rgba(124, 58, 237, 0.08)',
  accentPrimaryBorder: 'rgba(124, 58, 237, 0.2)',

  // Backward compatibility
  brandPrimary: '#7C3AED',
  brandPrimaryMuted: 'rgba(124, 58, 237, 0.08)',
  brandPrimaryBorder: 'rgba(124, 58, 237, 0.2)',

  // State Colors (Used ONLY when communicating actual state)
  accentSecondary: '#2563EB',
  accentSuccess: '#10B981',
  accentWarning: '#F59E0B',
  accentError: '#EF4444',

  // Text Hierarchy
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',

  // Legal Tokens
  watermarkText: 'rgba(15, 23, 42, 0.02)',
  stampBorder: 'rgba(124, 58, 237, 0.25)',
  stampFill: 'rgba(124, 58, 237, 0.04)',
  pathLineActive: '#7C3AED',
  pathLineInactive: '#CBD5E1',

  // System
  overlay: 'rgba(15, 23, 42, 0.6)',
  transparent: 'transparent',
};

export const darkColors: ColorPalette = {
  background: '#0F172A',
  surface: '#1E293B',
  surfaceHighlight: '#334155',
  surfaceElevated: '#1E293B',
  border: '#334155',
  borderSubtle: '#1E293B',

  // Primary Interaction Color: Purple
  accent: '#8B5CF6',
  accentMuted: 'rgba(139, 92, 246, 0.12)',
  accentPrimary: '#8B5CF6',
  accentPrimaryHover: '#7C3AED',
  accentPrimaryMuted: 'rgba(139, 92, 246, 0.12)',
  accentPrimaryBorder: 'rgba(139, 92, 246, 0.25)',

  // Backward compatibility
  brandPrimary: '#8B5CF6',
  brandPrimaryMuted: 'rgba(139, 92, 246, 0.12)',
  brandPrimaryBorder: 'rgba(139, 92, 246, 0.25)',

  // State Colors
  accentSecondary: '#3B82F6',
  accentSuccess: '#10B981',
  accentWarning: '#F59E0B',
  accentError: '#EF4444',

  // Text Hierarchy
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverse: '#0F172A',

  // Legal Tokens
  watermarkText: 'rgba(248, 250, 252, 0.02)',
  stampBorder: 'rgba(139, 92, 246, 0.3)',
  stampFill: 'rgba(139, 92, 246, 0.08)',
  pathLineActive: '#8B5CF6',
  pathLineInactive: '#334155',

  // System
  overlay: 'rgba(15, 23, 42, 0.85)',
  transparent: 'transparent',
};


