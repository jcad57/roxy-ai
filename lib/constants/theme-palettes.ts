/**
 * Theme Palettes
 * Beautiful, independent Light and Dark theme palettes
 */

import type { ColorPalette, ThemeName } from "@/lib/types/theme";

// ─── DARK THEME ──────────────────────────────────────────────────────────────
// A sophisticated dark theme with purple-blue accents and rich depth

const darkTheme: ColorPalette = {
  // Primary accent: Deep purple-blue with electric highlights
  accent: "#8b5cf6",
  accentLight: "#a78bfa",
  accentDim: "rgba(139,92,246,0.15)",
  accentDimBorder: "rgba(139,92,246,0.3)",
  accentGlow: "rgba(139,92,246,0.12)",
  
  // Backgrounds: Deep navy-purple with subtle warmth
  bg: "#0f0a1a",
  bgCard: "rgba(25,20,40,0.85)",      // Lighter and more opaque for better contrast
  bgCardHover: "rgba(35,28,55,0.95)", // Lighter for better text contrast
  
  // Borders: Subtle with purple tint
  borderMuted: "rgba(139,92,246,0.2)",
  
  // Text: Enhanced contrast for better readability
  textPrimary: "#ffffff",             // Pure white for maximum contrast
  textSecondary: "#e2e8f0",           // Very light gray (same)
  textMuted: "#cbd5e1",               // Lighter gray for better contrast (was #94a3b8)
  textDim: "#94a3b8",                 // Lighter than before (was #64748b)
  
  // Gradients: Rich depth with purple-blue flow
  gradBanner: "linear-gradient(135deg, #0f0a1a 0%, #1a0f2e 50%, #0f1629 100%)",
  gradLogo: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #3b82f6 100%)",
  
  // Semantic colors: Vibrant and clear
  success: "#22c55e",                 // Brighter green for better visibility
  warning: "#fbbf24",                 // Brighter yellow for better visibility
  error: "#f87171",                   // Brighter red for better visibility
  info: "#22d3ee",                    // Brighter cyan for better visibility
};

// ─── LIGHT THEME ─────────────────────────────────────────────────────────────
// A clean, modern light theme with blue accents and crisp readability

const lightTheme: ColorPalette = {
  // Primary accent: Vibrant blue with professional appeal
  accent: "#2563eb",
  accentLight: "#3b82f6",
  accentDim: "rgba(37,99,235,0.1)",
  accentDimBorder: "rgba(37,99,235,0.2)",
  accentGlow: "rgba(37,99,235,0.08)",
  
  // Backgrounds: Clean white with subtle gray overlays
  bg: "#ffffff",
  bgCard: "rgba(248,250,252,0.9)",    // More opaque for clearer distinction
  bgCardHover: "rgba(241,245,249,1)",  // Fully opaque for better contrast
  
  // Borders: Increased contrast for better visibility
  borderMuted: "rgba(203,213,225,1)",  // Darker borders for better contrast
  
  // Text: Enhanced contrast for excellent readability
  textPrimary: "#0f172a",              // Very dark navy (same)
  textSecondary: "#1e293b",            // Darker for better contrast (was #334155)
  textMuted: "#475569",                // Much darker for better contrast (was #64748b)
  textDim: "#64748b",                  // Darker than before (was #94a3b8)
  
  // Gradients: Subtle blue-to-purple flow
  gradBanner: "linear-gradient(135deg, #f8fafc 0%, #eff6ff 50%, #f5f3ff 100%)",
  gradLogo: "linear-gradient(135deg, #2563eb 0%, #3b82f6 50%, #6366f1 100%)",
  
  // Semantic colors: Clear and professional with good contrast
  success: "#15803d",                  // Darker green for better contrast
  warning: "#c2410c",                  // Darker orange for better contrast
  error: "#b91c1c",                    // Darker red for better contrast
  info: "#0369a1",                     // Darker blue for better contrast
};

// ─── RED THEME ───────────────────────────────────────────────────────────────
// A bold, dramatic red/black theme with deep crimson accents and rich depth

const redTheme: ColorPalette = {
  // Primary accent: Deep crimson-red with fiery highlights
  accent: "#dc2626",
  accentLight: "#ef4444",
  accentDim: "rgba(220,38,38,0.15)",
  accentDimBorder: "rgba(220,38,38,0.3)",
  accentGlow: "rgba(220,38,38,0.12)",
  
  // Backgrounds: Deep black with subtle red warmth
  bg: "#0a0000",
  bgCard: "rgba(20,5,5,0.85)",        // Dark red-black with opacity
  bgCardHover: "rgba(30,8,8,0.95)",   // Lighter on hover for contrast
  
  // Borders: Subtle with red tint
  borderMuted: "rgba(220,38,38,0.2)",
  
  // Text: Enhanced contrast for better readability
  textPrimary: "#ffffff",             // Pure white for maximum contrast
  textSecondary: "#fef2f2",           // Very light red tint
  textMuted: "#fecaca",               // Light red-gray for better contrast
  textDim: "#fca5a5",                 // Softer red-gray
  
  // Gradients: Rich depth with red-to-black flow
  gradBanner: "linear-gradient(135deg, #0a0000 0%, #1a0505 50%, #0f0000 100%)",
  gradLogo: "linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%)",
  
  // Semantic colors: Vibrant and clear
  success: "#22c55e",                 // Bright green for contrast
  warning: "#fbbf24",                 // Bright yellow for contrast
  error: "#fca5a5",                   // Lighter red to differentiate from accent
  info: "#22d3ee",                    // Bright cyan for contrast
};

// ─── THEME REGISTRY ──────────────────────────────────────────────────────────

const themes: Record<ThemeName, ColorPalette> = {
  dark: darkTheme,
  light: lightTheme,
  red: redTheme,
};

export function getThemePalette(themeName: ThemeName): ColorPalette {
  return themes[themeName];
}

export const defaultTheme: ThemeName = "dark";
