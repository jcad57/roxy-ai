/**
 * Category Colors
 * Generates solid background colors for Kanban cards based on task categories
 * Colors are consistent and work well with both light and dark themes
 */

import type { ThemeName } from "@/lib/types/theme";

// Universal color palette that works well in both light and dark themes
// These are vibrant, saturated colors that maintain good contrast
const universalPalette = [
  "#3b82f6", // Blue
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#f97316", // Orange
  "#10b981", // Green
  "#06b6d4", // Cyan
  "#6366f1", // Indigo
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#14b8a6", // Teal
  "#a855f7", // Violet
  "#84cc16", // Lime
  "#0ea5e9", // Sky
  "#d946ef", // Fuchsia
  "#22c55e", // Emerald
  "#f43f5e", // Rose
  "#2563eb", // Blue (darker)
  "#7c3aed", // Purple (darker)
  "#db2777", // Pink (darker)
  "#ea580c", // Orange (darker)
];

// Cache for category-to-color mappings
const categoryColorCache = new Map<string, string>();

/**
 * Get a consistent color for a given category
 * Uses hashing to ensure the same category always gets the same color
 */
export function getCategoryColor(category: string, _themeName?: ThemeName): string {
  // Return cached color if available
  if (categoryColorCache.has(category)) {
    return categoryColorCache.get(category)!;
  }

  // Simple hash function to convert category string to number
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    const char = category.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Use absolute value and modulo to get palette index
  const index = Math.abs(hash) % universalPalette.length;
  const color = universalPalette[index];

  // Cache the result
  categoryColorCache.set(category, color);

  return color;
}

/**
 * Get contrasting text color (white or dark) based on background brightness
 */
export function getContrastTextColor(backgroundColor: string): string {
  // Convert hex to RGB
  const hex = backgroundColor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate relative luminance (WCAG formula)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return white for dark backgrounds, dark for light backgrounds
  return luminance > 0.5 ? "#1a1a1a" : "#ffffff";
}

/**
 * Get a lighter version of a color for hover states
 */
export function getLighterColor(color: string, amount: number = 0.15): string {
  const hex = color.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  const newR = Math.min(255, Math.floor(r + (255 - r) * amount));
  const newG = Math.min(255, Math.floor(g + (255 - g) * amount));
  const newB = Math.min(255, Math.floor(b + (255 - b) * amount));

  return `#${newR.toString(16).padStart(2, "0")}${newG.toString(16).padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`;
}
