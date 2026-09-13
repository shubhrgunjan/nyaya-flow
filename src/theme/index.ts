import { lightColors, darkColors, ColorPalette } from './colors';
import { typography } from './typography';
import { spacing, radius, shadow, animations } from './spacing';

export const theme = {
  colors: lightColors,
  lightColors,
  darkColors,
  typography,
  spacing,
  radius,
  shadow,
  animations,
} as const;

export { lightColors, darkColors, typography, spacing, radius, shadow, animations };
export type { ColorPalette };
