"use client";

/**
 * Navigation Bar
 * Top app bar with branding, AI status, and settings
 */

import { useTheme } from "@/lib/providers/theme-provider";
import { useResponsive } from "@/lib/hooks/use-responsive";
import { responsivePadding } from "@/lib/utils/responsive-styles";
import { SyncButton } from "./sync-button";
import { AnalyzeButton } from "./analyze-button";
import { SyncStatusIndicator } from "./sync-status-indicator";
import { DeleteAccountButton } from "./delete-account-button";

interface NavBarProps {
  emailCount: number;
  onSettingsClick: () => void;
}

export function NavBar({ emailCount, onSettingsClick }: NavBarProps) {
  const { theme } = useTheme();
  const { breakpoint, isMobile } = useResponsive();
  
  return (
    <div
      style={{
        background: `linear-gradient(180deg, ${theme.bg} 0%, ${theme.bg} 100%)`,
        borderBottom: `1px solid ${theme.borderMuted}`,
        padding: responsivePadding(breakpoint),
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "flex-start" : "center",
          justifyContent: "space-between",
          gap: isMobile ? 10 : 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 10 }}>
          <div
            style={{
              width: isMobile ? 24 : 28,
              height: isMobile ? 24 : 28,
              borderRadius: isMobile ? 6 : 8,
              background: theme.gradLogo,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: isMobile ? 12 : 14,
            }}
          >
            ✉
          </div>
          <div>
            <span
              style={{
                fontSize: isMobile ? 14 : 15,
                fontWeight: 700,
                color: theme.textPrimary,
                letterSpacing: -0.5,
              }}
            >
              Roxy
            </span>
            <span style={{ fontSize: isMobile ? 14 : 15, color: theme.accent, fontWeight: 300 }}>AI</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 12 }}>
          <div
            style={{
              fontSize: isMobile ? 9 : 10,
              color: theme.textDim,
              background: theme.accentDimBorder,
              padding: isMobile ? "3px 8px" : "4px 10px",
              borderRadius: 20,
              border: `1px solid ${theme.accentDimBorder}`,
              whiteSpace: isMobile ? "nowrap" : "normal",
            }}
          >
            ◎ AI active · {emailCount} emails
          </div>
          <SyncStatusIndicator />
          <SyncButton />
          <AnalyzeButton />
          <DeleteAccountButton />
          <button
            onClick={onSettingsClick}
            style={{
              width: isMobile ? 28 : 32,
              height: isMobile ? 28 : 32,
              borderRadius: 8,
              background: theme.bgCard,
              border: `1px solid ${theme.borderMuted}`,
              color: theme.textMuted,
              fontSize: isMobile ? 14 : 16,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s",
            }}
            aria-label="Settings"
          >
            ⚙
          </button>
        </div>
      </div>
    </div>
  );
}
