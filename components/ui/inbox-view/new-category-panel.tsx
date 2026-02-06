"use client";

/**
 * New Category Panel Component
 * Sliding side panel for creating new email categories
 */

import { useTheme } from "@/lib/providers/theme-provider";
import { useResponsive } from "@/lib/hooks/use-responsive";
import { useInboxStore } from "@/lib/stores/inbox-store";
import { emailCategoryColorPallets } from "@/lib/constants/menu-color-pallets";
import type { ContextTag } from "@/lib/services/storage/context-tags-service";

interface NewCategoryPanelProps {
  contextTags: ContextTag[];
  groupedTags: Record<string, ContextTag[]>;
  isCreatingCategory: boolean;
  onCreateCategory: () => Promise<void>;
}

export function NewCategoryPanel({
  contextTags,
  groupedTags,
  isCreatingCategory,
  onCreateCategory,
}: NewCategoryPanelProps) {
  const { theme } = useTheme();
  const { isMobile } = useResponsive();
  
  const {
    newCategoryName,
    newCategoryColor,
    selectedTagIds,
    setNewCategoryName,
    setNewCategoryColor,
    toggleTagSelection,
    handleCancelCategory,
  } = useInboxStore();

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleCancelCategory}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          zIndex: 999,
          animation: "fadeIn 0.2s ease",
        }}
      />

      {/* Side Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: isMobile ? "100%" : 450,
          background: theme.bgCard,
          borderLeft: `1px solid ${theme.borderMuted}`,
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          animation: "slideInRight 0.3s ease",
          boxShadow: "-4px 0 20px rgba(0, 0, 0, 0.2)",
        }}
      >
        {/* Panel Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: `1px solid ${theme.borderMuted}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: theme.textPrimary,
              margin: 0,
            }}
          >
            Create New Category
          </h2>
          <button
            onClick={handleCancelCategory}
            style={{
              background: "transparent",
              border: "none",
              fontSize: 24,
              color: theme.textMuted,
              cursor: "pointer",
              padding: 0,
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 6,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme.borderMuted;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            ×
          </button>
        </div>

        {/* Panel Content */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px",
          }}
        >
          {/* Category Name Input */}
          <div style={{ marginBottom: 28 }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: theme.textPrimary,
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Category Name
            </label>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g., Urgent Tasks, Marketing, etc."
              style={{
                width: "100%",
                padding: "12px 14px",
                background: theme.bg,
                border: `1px solid ${theme.borderMuted}`,
                borderRadius: 8,
                fontSize: 14,
                color: theme.textPrimary,
                outline: "none",
                transition: "all 0.15s",
                fontFamily: "inherit",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = theme.accent;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = theme.borderMuted;
              }}
              autoFocus
            />
          </div>

          {/* Color Picker */}
          <div style={{ marginBottom: 28 }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: theme.textPrimary,
                marginBottom: 12,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Category Color
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 12,
              }}
            >
              {emailCategoryColorPallets.map((color: string) => {
                const isSelected = newCategoryColor === color;
                return (
                  <button
                    key={color}
                    onClick={() => setNewCategoryColor(color)}
                    style={{
                      width: "100%",
                      aspectRatio: "1",
                      background: color,
                      border: `3px solid ${
                        isSelected ? theme.textPrimary : "transparent"
                      }`,
                      borderRadius: 10,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      position: "relative",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.transform = "scale(1.05)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    {isSelected && (
                      <span
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          fontSize: 20,
                          color: "#ffffff",
                        }}
                      >
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Context Tags Selection */}
          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: theme.textPrimary,
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Select Context Tags
            </label>
            <p
              style={{
                fontSize: 11,
                color: theme.textMuted,
                marginBottom: 16,
                lineHeight: 1.5,
              }}
            >
              Choose tags that represent the emails you want in this category.
              AI automatically tags emails based on their content.
            </p>

            {/* Display AI-generated tags grouped by category */}
            {contextTags.length === 0 ? (
              <div
                style={{
                  padding: 16,
                  background: theme.bgCard,
                  borderRadius: 8,
                  textAlign: "center",
                  color: theme.textMuted,
                  fontSize: 12,
                }}
              >
                No AI-generated tags available yet. Tags will appear after
                emails are analyzed.
              </div>
            ) : (
              Object.entries(groupedTags).map(([category, tags]) => {
                if (tags.length === 0) return null;

                return (
                  <div key={category} style={{ marginBottom: 20 }}>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: theme.textDim,
                        textTransform: "uppercase",
                        letterSpacing: 0.8,
                        marginBottom: 10,
                      }}
                    >
                      {category} ({tags.length})
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 8,
                      }}
                    >
                      {tags.map((tag: ContextTag) => {
                        const isSelected = selectedTagIds.includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            onClick={() => toggleTagSelection(tag.id)}
                            style={{
                              padding: "6px 12px",
                              background: isSelected
                                ? newCategoryColor
                                : theme.bg,
                              border: `1px solid ${
                                isSelected
                                  ? newCategoryColor
                                  : theme.borderMuted
                              }`,
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: isSelected ? 600 : 500,
                              color: isSelected ? "#ffffff" : theme.textMuted,
                              cursor: "pointer",
                              transition: "all 0.15s",
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.borderColor =
                                  newCategoryColor;
                                e.currentTarget.style.color = newCategoryColor;
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.borderColor =
                                  theme.borderMuted;
                                e.currentTarget.style.color = theme.textMuted;
                              }
                            }}
                          >
                            {tag.label} ({tag.count})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Panel Footer */}
        <div
          style={{
            padding: "20px 24px",
            borderTop: `1px solid ${theme.borderMuted}`,
            display: "flex",
            gap: 12,
          }}
        >
          <button
            onClick={handleCancelCategory}
            style={{
              flex: 1,
              padding: "12px 20px",
              background: theme.bg,
              border: `1px solid ${theme.borderMuted}`,
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              color: theme.textMuted,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = theme.accent;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = theme.borderMuted;
            }}
          >
            Cancel
          </button>
          <button
            onClick={onCreateCategory}
            disabled={
              isCreatingCategory ||
              !newCategoryName.trim() ||
              selectedTagIds.length === 0
            }
            style={{
              flex: 1,
              padding: "12px 20px",
              background:
                newCategoryName.trim() && selectedTagIds.length > 0
                  ? newCategoryColor
                  : theme.borderMuted,
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              color: "#ffffff",
              cursor:
                newCategoryName.trim() &&
                selectedTagIds.length > 0 &&
                !isCreatingCategory
                  ? "pointer"
                  : "not-allowed",
              transition: "all 0.15s",
              opacity:
                newCategoryName.trim() &&
                selectedTagIds.length > 0 &&
                !isCreatingCategory
                  ? 1
                  : 0.5,
            }}
            onMouseEnter={(e) => {
              if (
                newCategoryName.trim() &&
                selectedTagIds.length > 0 &&
                !isCreatingCategory
              ) {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = `0 4px 12px ${newCategoryColor}40`;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {isCreatingCategory ? "Creating..." : "Create Category"}
          </button>
        </div>
      </div>
    </>
  );
}
