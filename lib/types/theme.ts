/**
 * Theme Types
 * Type definitions for the theme system
 */

export type ThemeName = "light" | "dark" | "red";

export interface ThemeConfig {
  theme: ThemeName;
}

export type FontSize = "small" | "medium" | "large";

export interface ColorPalette {
  // Primary accent colors
  accent: string;
  accentLight: string;
  accentDim: string;
  accentDimBorder: string;
  accentGlow: string;

  // Background colors
  bg: string;
  bgCard: string;
  bgCardHover: string;

  // Border colors
  borderMuted: string;

  // Text colors
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textDim: string;

  // Gradients
  gradBanner: string;
  gradLogo: string;

  // Semantic colors
  success: string;
  warning: string;
  error: string;
  info: string;
}
