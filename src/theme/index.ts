import { colors } from './colors';
import { typography } from './typography';
import { spacing, radius, shadow, animations } from './spacing';

export const theme = {
  colors,
  typography,
  spacing,
  radius,
  shadow,
  animations,
} as const;

export type Theme = typeof theme;
export { colors, typography, spacing, radius, shadow, animations };
