export const colors = {
  mossDark: '#94B16F',
  moss: '#B3D07E',
  mossSoft: '#BEDA9D',
  mossMist: '#E4F1D7',

  canvas: '#FFFEFA',
  canvasStrong: '#F8FAF3',
  surface: '#FFFFFF',
  panel: '#FAFCF5',
  elevated: '#F2F7EA',
  ink: '#17210F',
  muted: '#66705F',
  mutedSoft: '#9BA891',
  line: '#E7EEDC',
  accent: '#BEDA9D',
  accentStrong: '#94B16F',
  accentSoft: '#E4F1D7',
  success: '#5E9C5D',
  dangerSoft: '#FFE7E7',
  error: '#D95D5D',

  glass: 'rgba(255, 255, 255, 0.90)',
  glassStrong: 'rgba(255, 255, 255, 0.98)',
  glassSoft: 'rgba(253, 255, 248, 0.87)',
  glassLine: 'rgba(255, 255, 255, 0.95)',
  glassLineSoft: 'rgba(255, 255, 255, 0.80)',
  glassShadow: 'rgba(83, 107, 57, 0.14)',
  glassHighlight: 'rgba(255, 255, 255, 0.95)',
  glassSelected: '#5D7E3F',

  // legacy aliases for existing code
  primary: '#5D7E3F',
  shadow: '#536B39',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radii = {
  sm: 12,
  field: 18,
  button: 22,
  card: 28,
  largeCard: 34,
  pill: 999,
} as const;

export const typography = {
  displaySmall: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.7, color: colors.ink },
  headlineMedium: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.6, color: colors.ink },
  headlineSmall: { fontSize: 22, fontWeight: '800' as const, letterSpacing: -0.35, color: colors.ink },
  titleLarge: { fontSize: 18, fontWeight: '700' as const, letterSpacing: -0.2, color: colors.ink },
  titleMedium: { fontSize: 15, fontWeight: '700' as const, color: colors.ink },
  bodyLarge: { fontSize: 15, lineHeight: 22, color: colors.ink },
  bodyMedium: { fontSize: 13.5, lineHeight: 20, color: colors.muted },
  bodySmall: { fontSize: 11.5, lineHeight: 16, color: colors.mutedSoft },
};
