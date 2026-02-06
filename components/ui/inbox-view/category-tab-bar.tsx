"use client";

/**
 * Category Tab Bar Component
 * Displays category tabs and "New Category" button
 */

import { useTheme } from "@/lib/providers/theme-provider";
import { useInboxStore } from "@/lib/stores/inbox-store";
import type { CategoryTab } from "@/lib/types/email";

interface CategoryTabBarProps {
  categoryTabs: CategoryTab[];
}

export function CategoryTabBar({ categoryTabs }: CategoryTabBarProps) {
  const { theme } = useTheme();
  const activeTab = useInboxStore((state) => state.activeTab);
  const setActiveTab = useInboxStore((state) => state.setActiveTab);
  const openNewCategoryPanel = useInboxStore(
    (state) => state.openNewCategoryPanel
  );

  return (
    <div
      style={{
        borderBottom: `1px solid ${theme.borderMuted}`,
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: 8,
        overflowX: "auto",
      }}
    >
      {categoryTabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const tabColor = tab.color || theme.accent;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "8px 16px",
              background: isActive ? `${tabColor}20` : "transparent",
              border: `1px solid ${isActive ? tabColor : theme.borderMuted}`,
              borderRadius: 8,
              fontSize: 12,
              fontWeight: isActive ? 600 : 500,
              color: isActive ? tabColor : theme.textMuted,
              cursor: "pointer",
              transition: "all 0.15s",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.borderColor = tabColor;
                e.currentTarget.style.color = tabColor;
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.borderColor = theme.borderMuted;
                e.currentTarget.style.color = theme.textMuted;
              }
            }}
          >
            {tab.id !== "all" && (
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: tabColor,
                }}
              />
            )}
            {tab.label}
          </button>
        );
      })}

      {/* Add New Tab Button */}
      <button
        onClick={openNewCategoryPanel}
        style={{
          padding: "8px 14px",
          background: "transparent",
          border: `2px dashed ${theme.borderMuted}`,
          borderRadius: 8,
          fontSize: 11,
          fontWeight: 600,
          color: theme.textDim,
          cursor: "pointer",
          transition: "all 0.15s",
          whiteSpace: "nowrap",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = theme.accentDimBorder;
          e.currentTarget.style.color = theme.accentLight;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = theme.borderMuted;
          e.currentTarget.style.color = theme.textDim;
        }}
      >
        + New Category
      </button>
    </div>
  );
}
