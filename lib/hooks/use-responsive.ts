"use client";

/**
 * Responsive Utilities Hook
 * Detects screen size and provides breakpoint utilities
 */

import { useState, useEffect } from "react";

export type Breakpoint = "mobile" | "tablet" | "desktop";

export interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  breakpoint: Breakpoint;
  width: number;
}

const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
} as const;

export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    breakpoint: "desktop",
    width: 1200,
  });

  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth;
      const isMobile = width < BREAKPOINTS.mobile;
      const isTablet = width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet;
      const isDesktop = width >= BREAKPOINTS.tablet;

      setState({
        isMobile,
        isTablet,
        isDesktop,
        breakpoint: isMobile ? "mobile" : isTablet ? "tablet" : "desktop",
        width,
      });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return state;
}

// Utility function for responsive values
export function responsive<T>(mobile: T, tablet: T, desktop: T, breakpoint: Breakpoint): T {
  if (breakpoint === "mobile") return mobile;
  if (breakpoint === "tablet") return tablet;
  return desktop;
}
