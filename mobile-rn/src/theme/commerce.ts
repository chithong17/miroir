import { spacing } from './tokens';

export const commerceLayout = {
  pageMax: 1200,
  formMax: 680,
  tablet: 600,
  desktop: 960,
  gutter: spacing.lg,
  gap: spacing.lg,
  target: 48,
} as const;

export function productColumns(width: number) {
  return width >= commerceLayout.desktop ? 4 : width >= commerceLayout.tablet ? 3 : 2;
}
