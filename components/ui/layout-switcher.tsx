"use client";

/**
 * Layout Switcher
 * Tab bar for switching between different view modes
 */

import type { Layout, LayoutId } from "@/lib/types/layout";
import { useTheme } from "@/lib/providers/theme-provider";
import { useResponsive } from "@/lib/hooks/use-responsive";

interface LayoutSwitcherProps {
  layouts: Layout[];
  activeLayout: LayoutId;
  onLayoutChange: (id: LayoutId) => void;
  onCustomizeClick: () => void;
  showCustomize: boolean;
  currentLayoutDesc: string;
}

export function LayoutSwitcher({
  layouts,
  activeLayout,
  onLayoutChange,
  onCustomizeClick,
  showCustomize,
  currentLayoutDesc,
}: LayoutSwitcherProps) {
  const { theme } = useTheme();
  const { breakpoint, isMobile } = useResponsive();

  return (
    <div
      style={{
        padding: "14px 24px",
        flexShrink: 0,
      }}
    >
      {/* Layout Switcher Row */}
      <div
        style={{
          display: "flex",
          gap: isMobile ? 3 : 5,
          alignItems: "center",
          overflowX: isMobile ? "auto" : "visible",
          WebkitOverflowScrolling: "touch",
          paddingBottom: isMobile ? 2 : 0,
          width: "100%",
        }}
      >
        {layouts.map((layout) => (
          <button
            key={layout.id}
            onClick={() => onLayoutChange(layout.id)}
            style={{
              flex: isMobile ? "0 0 auto" : "1 1 0",
              minWidth: isMobile ? 65 : 80,
              maxWidth: isMobile ? "none" : "25%",
              background:
                activeLayout === layout.id
                  ? theme.accentDimBorder
                  : theme.bgCard,
              border:
                activeLayout === layout.id
                  ? `1px solid ${theme.accentDimBorder}`
                  : `1px solid ${theme.borderMuted}`,
              borderRadius: isMobile ? 8 : 10,
              padding: isMobile ? "6px 4px" : "8px 4px",
              cursor: "pointer",
              transition: "all 0.2s",
              textAlign: "center",
              color: "inherit",
            }}
          >
            <div
              style={{
                fontSize: isMobile ? 12 : 14,
                marginBottom: 2,
                color:
                  activeLayout === layout.id
                    ? theme.accentLight
                    : theme.textDim,
              }}
            >
              {layout.icon}
            </div>
            <div
              style={{
                fontSize: isMobile ? 8 : 9,
                color:
                  activeLayout === layout.id
                    ? theme.accentLight
                    : theme.textDim,
                fontWeight: activeLayout === layout.id ? 600 : 400,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                padding: "0 2px",
              }}
            >
              {layout.label}
            </div>
          </button>
        ))}

        {/* Customize Trigger */}
        <button
          onClick={onCustomizeClick}
          style={{
            width: isMobile ? 34 : 38,
            height: isMobile ? 34 : 38,
            borderRadius: isMobile ? 8 : 10,
            flexShrink: 0,
            background: showCustomize
              ? theme.accentDimBorder
              : "rgba(15,23,42,0.45)",
            border: `1px solid ${
              showCustomize ? theme.accentDimBorder : theme.borderMuted
            }`,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
            color: showCustomize ? theme.accentLight : theme.textDim,
            fontSize: isMobile ? 14 : 16,
          }}
        >
          ⊕
        </button>
      </div>

      {/* Description */}
      {!isMobile && (
        <div
          style={{
            marginTop: 10,
            fontSize: 11.5,
            color: theme.textDim,
            lineHeight: 1.5,
            maxWidth: 700,
          }}
        >
          {currentLayoutDesc}
        </div>
      )}
    </div>
  );
}
