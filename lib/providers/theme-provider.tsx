"use client";

/**
 * Theme Provider
 * Manages theme state using React Query and provides theme context
 */

import { createContext, useContext, ReactNode, useEffect } from "react";
import { QueryClient, QueryClientProvider, useQuery, useMutation } from "@tanstack/react-query";
import type { ThemeName, ColorPalette } from "@/lib/types/theme";
import { getThemePalette, defaultTheme } from "@/lib/constants/theme-palettes";

// Create Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity, // Theme doesn't go stale
      gcTime: Infinity, // Keep in cache forever
    },
  },
});

export type FontSize = "small" | "medium" | "large";

// Theme Context
interface ThemeContextValue {
  theme: ColorPalette;
  themeName: ThemeName;
  setTheme: (themeName: ThemeName) => void;
  fontSize: FontSize;
  setFontSize: (fontSize: FontSize) => void;
  isLight: boolean;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// Local storage keys
const THEME_STORAGE_KEY = "mailmind-theme";
const FONT_SIZE_STORAGE_KEY = "mailmind-font-size";

// Get theme from localStorage or default
function getStoredTheme(): ThemeName {
  if (typeof window === "undefined") return defaultTheme;
  
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Handle migration from old theme structure
      if (parsed.mode) {
        return parsed.mode as ThemeName;
      }
      if (typeof parsed === "string" && (parsed === "light" || parsed === "dark")) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Error loading theme from storage:", error);
  }
  
  return defaultTheme;
}

// Get font size from localStorage or default
function getStoredFontSize(): FontSize {
  if (typeof window === "undefined") return "medium";
  
  try {
    const stored = localStorage.getItem(FONT_SIZE_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed === "small" || parsed === "medium" || parsed === "large") {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Error loading font size from storage:", error);
  }
  
  return "medium";
}

// Save theme to localStorage
function saveTheme(themeName: ThemeName): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(themeName));
  } catch (error) {
    console.error("Error saving theme to storage:", error);
  }
}

// Save font size to localStorage
function saveFontSize(fontSize: FontSize): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(FONT_SIZE_STORAGE_KEY, JSON.stringify(fontSize));
  } catch (error) {
    console.error("Error saving font size to storage:", error);
  }
}

// Theme Provider Component
function ThemeProviderInner({ children }: { children: ReactNode }) {
  // Query for theme name
  const { data: themeName = defaultTheme } = useQuery({
    queryKey: ["theme"],
    queryFn: getStoredTheme,
    initialData: defaultTheme,
  });

  // Query for font size
  const { data: fontSize = "medium" } = useQuery({
    queryKey: ["fontSize"],
    queryFn: getStoredFontSize,
    initialData: "medium" as FontSize,
  });

  // Mutation to update theme
  const themeMutation = useMutation({
    mutationFn: async (newThemeName: ThemeName) => {
      saveTheme(newThemeName);
      return newThemeName;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["theme"], updated);
    },
  });

  // Mutation to update font size
  const fontSizeMutation = useMutation({
    mutationFn: async (newFontSize: FontSize) => {
      saveFontSize(newFontSize);
      return newFontSize;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["fontSize"], updated);
      // Force a refetch to ensure state updates
      queryClient.invalidateQueries({ queryKey: ["fontSize"] });
    },
  });

  // Apply theme and font size to document
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Set data attributes for CSS
    document.documentElement.setAttribute("data-theme", themeName);
    document.documentElement.setAttribute("data-font-size", fontSize);
    
    // Set meta theme-color
    const palette = getThemePalette(themeName);
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", palette.bg);
    }
  }, [themeName, fontSize]);

  const theme = getThemePalette(themeName);
  
  const value: ThemeContextValue = {
    theme,
    themeName,
    setTheme: (newThemeName) => themeMutation.mutate(newThemeName),
    fontSize,
    setFontSize: (newFontSize) => fontSizeMutation.mutate(newFontSize),
    isLight: themeName === "light",
    isDark: themeName === "dark",
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// Main Provider with Query Client
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProviderInner>{children}</ThemeProviderInner>
    </QueryClientProvider>
  );
}

// Hook to use theme
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
