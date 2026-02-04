/**
 * Theme Constants
 * Centralized color palette and theme tokens
 */

export const theme = {
  accent: "#ec4899",          // pink-500
  accentLight: "#f472b6",     // pink-400
  accentDim: "rgba(236,72,153,0.15)",
  accentDimBorder: "rgba(236,72,153,0.3)",
  accentGlow: "rgba(236,72,153,0.12)",
  bg: "#0f172a",
  bgCard: "rgba(15,23,42,0.6)",
  bgCardHover: "rgba(30,20,40,0.7)",
  borderMuted: "rgba(51,65,85,0.3)",
  textPrimary: "#f1f5f9",
  textSecondary: "#cbd5e1",
  textMuted: "#94a3b8",
  textDim: "#64748b",
  gradBanner: "linear-gradient(135deg, #1f1025 0%, #2d1a3a 100%)",
  gradLogo: "linear-gradient(135deg, #ec4899, #db2777)",
} as const;

export const colorPalette: string[] = [
  "#ec4899",
  "#f43f5e",
  "#f59e0b",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#14b8a6",
  "#64748b",
  "#db2777",
  "#a78bfa",
  "#fb923c",
  "#06b6d4",
];
