"use client";

/**
 * Theme Provider
 * Manages theme state using React Query and Supabase for persistence
 */

import { createContext, useContext, ReactNode, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ThemeName, ColorPalette, FontSize } from "@/lib/types/theme";
import { getThemePalette, defaultTheme } from "@/lib/constants/theme-palettes";
import { useUserPreferences } from "@/lib/hooks/use-user-preferences";
import { useAuth } from "./auth-provider";

// Create Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity, // Theme doesn't go stale
      gcTime: Infinity, // Keep in cache forever
    },
  },
});

// Theme Context
interface ThemeContextValue {
  theme: ColorPalette;
  themeName: ThemeName;
  setTheme: (themeName: ThemeName) => Promise<void>;
  fontSize: FontSize;
  setFontSize: (fontSize: FontSize) => void;
  isLight: boolean;
  isDark: boolean;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// Local storage keys (fallback when not authenticated)
const THEME_STORAGE_KEY = "mailmind-theme";
const FONT_SIZE_STORAGE_KEY = "mailmind-font-size";

// Get theme from localStorage (fallback)
function getStoredTheme(): ThemeName {
  if (typeof window === "undefined") return defaultTheme;

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.mode) {
        return parsed.mode as ThemeName;
      }
      if (
        typeof parsed === "string" &&
        (parsed === "light" || parsed === "dark" || parsed === "red")
      ) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Error loading theme from storage:", error);
  }

  return defaultTheme;
}

// Get font size from localStorage (fallback)
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

// Save theme to localStorage (fallback)
function saveTheme(themeName: ThemeName): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(themeName));
  } catch (error) {
    console.error("Error saving theme to storage:", error);
  }
}

// Save font size to localStorage (fallback)
function saveFontSize(fontSize: FontSize): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(FONT_SIZE_STORAGE_KEY, JSON.stringify(fontSize));
  } catch (error) {
    console.error("Error saving font size to storage:", error);
  }
}

// Map Supabase theme_mode to app ThemeName (handle 'system' -> 'dark' and support 'red')
function mapSupabaseThemeToApp(
  supabaseTheme?: "light" | "dark" | "system"
): ThemeName {
  if (!supabaseTheme) return defaultTheme;
  if (supabaseTheme === "system") return "dark"; // Map system to dark for now
  // Supabase only supports light/dark, not red yet - that's stored in localStorage
  return supabaseTheme;
}

// Map app ThemeName to Supabase theme_mode ('red' -> 'dark' in Supabase, but keep in localStorage)
function mapAppThemeToSupabase(
  appTheme: ThemeName
): "light" | "dark" | "system" {
  if (appTheme === "red") return "dark"; // Store as dark in Supabase, localStorage has 'red'
  return appTheme;
}

// Theme Provider Component
function ThemeProviderInner({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const {
    preferences,
    updatePreferences,
    isLoading: isLoadingPrefs,
  } = useUserPreferences();

  // Get theme from Supabase or fallback to localStorage
  // For 'red' theme: localStorage has priority since Supabase doesn't support it yet
  const localTheme = getStoredTheme();
  const supabaseTheme = mapSupabaseThemeToApp(preferences?.theme_mode);
  const themeName: ThemeName =
    localTheme === "red" ? localTheme : supabaseTheme;
  const fontSize: FontSize = "medium"; // Will be expanded later when added to schema

  // Update theme (save to Supabase if authenticated, otherwise localStorage)
  const setTheme = async (newThemeName: ThemeName): Promise<void> => {
    // Always save to localStorage for immediate feedback and 'red' theme support
    saveTheme(newThemeName);

    if (user && updatePreferences) {
      try {
        const supabaseThemeValue = mapAppThemeToSupabase(newThemeName);
        await updatePreferences({ theme_mode: supabaseThemeValue });
        console.log("✅ Theme saved to Supabase:", newThemeName);
      } catch (error) {
        console.error("❌ Failed to save theme to Supabase:", error);
        // Already saved to localStorage, so UX is not affected
      }
    }
  };

  // Update font size (localStorage for now)
  const setFontSize = (newFontSize: FontSize): void => {
    saveFontSize(newFontSize);
    // Force re-render by invalidating queries
    queryClient.invalidateQueries({ queryKey: ["fontSize"] });
  };

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
    setTheme,
    fontSize,
    setFontSize,
    isLight: themeName === "light",
    isDark: themeName === "dark",
    isLoading: isLoadingPrefs,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
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
