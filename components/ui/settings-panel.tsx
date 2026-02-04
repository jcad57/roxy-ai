"use client";

/**
 * Settings Panel
 * Side panel for theme and app customization
 */

import type { ThemeName } from "@/lib/types/theme";
import type { FontSize } from "@/lib/providers/theme-provider";
import { useTheme } from "@/lib/providers/theme-provider";
import { useResponsive } from "@/lib/hooks/use-responsive";
import { responsivePadding } from "@/lib/utils/responsive-styles";

interface SettingsPanelProps {
  onClose: () => void;
}

const themes: Array<{
  id: ThemeName;
  label: string;
  description: string;
  icon: string;
  preview: { bg: string; accent: string };
}> = [
  {
    id: "light",
    label: "Light Theme",
    description: "Clean and modern with vibrant blue accents",
    icon: "☀️",
    preview: { bg: "#ffffff", accent: "#2563eb" },
  },
  {
    id: "dark",
    label: "Dark Theme",
    description: "Sophisticated purple-blue with rich depth",
    icon: "🌙",
    preview: { bg: "#0f0a1a", accent: "#8b5cf6" },
  },
  {
    id: "red",
    label: "Red Theme",
    description: "Bold and dramatic with deep crimson accents",
    icon: "🔥",
    preview: { bg: "#0a0000", accent: "#dc2626" },
  },
];

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { theme, themeName, setTheme, fontSize, setFontSize } = useTheme();
  const { breakpoint, isMobile, isTablet } = useResponsive();

  const handleThemeChange = (newTheme: ThemeName) => {
    setTheme(newTheme);
  };

  const handleFontSizeChange = (newSize: FontSize) => {
    setFontSize(newSize);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          zIndex: 50,
          animation: "fadeIn 0.2s ease both",
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: isMobile ? "100%" : isTablet ? 340 : 380,
          background: theme.bg,
          borderLeft: isMobile ? "none" : `1px solid ${theme.borderMuted}`,
          zIndex: 51,
          display: "flex",
          flexDirection: "column",
          animation: isMobile
            ? "fadeIn 0.2s ease both"
            : "pickerIn 0.28s cubic-bezier(0.22,1,0.36,1) both",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.4)",
        }}
      >
        {/* Panel Header */}
        <div
          style={{
            padding: responsivePadding(breakpoint),
            borderBottom: `1px solid ${theme.borderMuted}`,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: theme.accentDimBorder,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  color: theme.accentLight,
                }}
              >
                ⚙
              </div>
              <span style={{ fontSize: 16, fontWeight: 700, color: theme.textPrimary }}>
                Settings
              </span>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: theme.textDim,
                fontSize: 24,
                cursor: "pointer",
                lineHeight: 1,
                padding: "2px 6px",
              }}
            >
              ×
            </button>
          </div>
          <div style={{ fontSize: 12.5, color: theme.textMuted, lineHeight: 1.5 }}>
            Customize your workspace appearance and preferences
          </div>
        </div>

        {/* Settings Content */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: responsivePadding(breakpoint),
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          {/* Theme Selection */}
          <div>
            <div
              style={{
                fontSize: 11,
                color: theme.textMuted,
                textTransform: "uppercase",
                letterSpacing: 1.2,
                fontWeight: 700,
                marginBottom: 12,
              }}
            >
              🎨 Appearance
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {themes.map((themeOption) => {
                const isActive = themeName === themeOption.id;
                return (
                  <button
                    key={themeOption.id}
                    onClick={() => handleThemeChange(themeOption.id)}
                    style={{
                      flex: 1,
                      padding: "16px",
                      borderRadius: 12,
                      border: `2px solid ${isActive ? themeOption.preview.accent : theme.borderMuted}`,
                      background: isActive ? `${themeOption.preview.accent}10` : theme.bgCard,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 8,
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.borderColor = themeOption.preview.accent + "60";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.borderColor = theme.borderMuted;
                      }
                    }}
                  >
                    <div style={{ fontSize: 32 }}>{themeOption.icon}</div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: isActive ? 700 : 600,
                        color: isActive ? themeOption.preview.accent : theme.textPrimary,
                      }}
                    >
                      {themeOption.label.replace(" Theme", "")}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Font Size Selection */}
          <div>
            <div
              style={{
                fontSize: 11,
                color: theme.textMuted,
                textTransform: "uppercase",
                letterSpacing: 1.2,
                fontWeight: 700,
                marginBottom: 12,
              }}
            >
              🔤 Font Size
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { id: "small" as FontSize, label: "Small", preview: "Aa" },
                { id: "medium" as FontSize, label: "Medium", preview: "Aa" },
                { id: "large" as FontSize, label: "Large", preview: "Aa" },
              ].map((sizeOption) => {
                const isActive = fontSize === sizeOption.id;
                return (
                  <button
                    key={sizeOption.id}
                    onClick={() => handleFontSizeChange(sizeOption.id)}
                    style={{
                      flex: 1,
                      padding: "16px",
                      borderRadius: 12,
                      border: `2px solid ${isActive ? theme.accent : theme.borderMuted}`,
                      background: isActive ? theme.accentDim : theme.bgCard,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 8,
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.borderColor = theme.accentDimBorder;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.borderColor = theme.borderMuted;
                      }
                    }}
                  >
                    <div
                      style={{
                        fontSize: sizeOption.id === "small" ? 20 : sizeOption.id === "medium" ? 26 : 32,
                        fontWeight: 600,
                        color: isActive ? theme.accentLight : theme.textMuted,
                      }}
                    >
                      {sizeOption.preview}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: isActive ? 700 : 600,
                        color: isActive ? theme.accentLight : theme.textPrimary,
                      }}
                    >
                      {sizeOption.label}
                    </div>
                  </button>
                );
              })}
            </div>
            <div
              style={{
                fontSize: 11,
                color: theme.textDim,
                marginTop: 10,
                lineHeight: 1.5,
              }}
            >
              Adjust the font size across the entire application for better readability
            </div>
            
            {/* Live Preview */}
            <div
              style={{
                marginTop: 14,
                padding: "16px",
                background: theme.bgCard,
                border: `1px solid ${theme.borderMuted}`,
                borderRadius: 10,
              }}
            >
              <div style={{ fontSize: "0.7em", color: theme.textDim, marginBottom: 8, fontWeight: 600 }}>
                PREVIEW
              </div>
              <div style={{ fontSize: "1em", color: theme.textPrimary, lineHeight: 1.6 }}>
                The quick brown fox jumps over the lazy dog. This preview text will scale based on your selected font size.
              </div>
              <div style={{ fontSize: "0.75em", color: theme.textMuted, marginTop: 8 }}>
                Font size: {fontSize.charAt(0).toUpperCase() + fontSize.slice(1)}
              </div>
            </div>
          </div>

          {/* More Settings Placeholder */}
          <div>
            <div
              style={{
                fontSize: 11,
                color: theme.textDim,
                textTransform: "uppercase",
                letterSpacing: 1.2,
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              ⚡ More Settings Coming Soon
            </div>
            <div
              style={{
                padding: "20px",
                borderRadius: 12,
                background: theme.bgCard,
                border: `1px solid ${theme.borderMuted}`,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>🚀</div>
              <div style={{ fontSize: 12, color: theme.textMuted, lineHeight: 1.6 }}>
                Additional customization options will be available soon, including notification
                preferences, keyboard shortcuts, and more.
              </div>
            </div>
          </div>
        </div>

        {/* Panel Footer */}
        <div
          style={{
            padding: responsivePadding(breakpoint),
            borderTop: `1px solid ${theme.borderMuted}`,
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              width: "100%",
              background: theme.accent,
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "12px 20px",
              fontSize: 13,
              cursor: "pointer",
              fontWeight: 700,
              transition: "all 0.2s",
              boxShadow: `0 4px 16px ${theme.accent}40`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = `0 6px 20px ${theme.accent}50`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = `0 4px 16px ${theme.accent}40`;
            }}
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
}
