/**
 * Responsive Style Utilities
 * Helper functions for creating responsive inline styles
 */

import type { Breakpoint } from "@/lib/hooks/use-responsive";

export function responsivePadding(breakpoint: Breakpoint): string {
  if (breakpoint === "mobile") return "12px";
  if (breakpoint === "tablet") return "16px";
  return "20px";
}

export function responsiveGap(breakpoint: Breakpoint): number {
  if (breakpoint === "mobile") return 8;
  if (breakpoint === "tablet") return 12;
  return 16;
}

export function responsiveFontSize(
  base: number,
  breakpoint: Breakpoint,
  scale: number = 0.85
): number {
  if (breakpoint === "mobile") return base * scale;
  if (breakpoint === "tablet") return base * 0.92;
  return base;
}

export function responsiveWidth(breakpoint: Breakpoint, desktop: number): number | string {
  if (breakpoint === "mobile") return "100%";
  if (breakpoint === "tablet") return Math.min(desktop, 280);
  return desktop;
}

export function hideOnMobile(breakpoint: Breakpoint): "none" | "flex" | "block" {
  return breakpoint === "mobile" ? "none" : "flex";
}

export function stackOnMobile(breakpoint: Breakpoint): "row" | "column" {
  return breakpoint === "mobile" ? "column" : "row";
}
