"use client";

/**
 * Inbox Layout
 * Traditional email client with smart features
 * Gmail-style interface with folders and category tabs
 */

import { useState, useEffect } from "react";
import type {
  CategoryTab,
  Email,
  FolderType,
  InboxLayoutProps,
} from "@/lib/types/email";

import { useTheme } from "@/lib/providers/theme-provider";
import { useResponsive } from "@/lib/hooks/use-responsive";
import { useEmailData } from "@/lib/hooks/use-email-data";
import { useResponseSuggestion } from "@/lib/hooks/use-response-suggestion";
import { useContextTags } from "@/lib/hooks/use-context-tags";
import { ResponseSuggestionPanel } from "@/components/ui/response-suggestion-panel";
import { EmailSkeleton } from "@/components/ui/email-skeleton";
import { emailCategoryColorPallets } from "@/lib/constants/menu-color-pallets";
import { getPriorityColor } from "@/lib/utils/inbox-view-helpers";
import { ContextTag } from "@/lib/services/storage/context-tags-service";

import InboxLayoutWrapper from "../ui/inbox-view/inbox-layout-wrapper";
import InboxLeftSidebar from "../ui/inbox-view/inbox-left-sidebar";

export function InboxLayout({
  emails,
  selected,
  onSelect,
  isAnalyzing = false,
  unprocessedCount = 0,
}: InboxLayoutProps) {
  console.log(emails);
  const { theme } = useTheme();
  const { breakpoint, isMobile } = useResponsive();
  const { enrichedEmails } = useEmailData();

  // Context tags and custom categories (pass emails to extract tags)
  const {
    tags: contextTags,
    groupedTags,
    categories: customCategories,
    createCategory,
    isCreatingCategory,
  } = useContextTags(emails);

  const [activeFolder, setActiveFolder] = useState<FolderType>("inbox");
  const [activeTab, setActiveTab] = useState("all"); // Can be "all" or a custom category ID
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [showNewTabPanel, setShowNewTabPanel] = useState(false);
  const [showResponsePanel, setShowResponsePanel] = useState(false);

  // Find enriched version of selected email
  const selectedEnrichedEmail = selectedEmail
    ? enrichedEmails.find(
        (e) =>
          parseInt(e.id.substring(e.id.length - 8), 36) % 10000 ===
          selectedEmail.id
      )
    : null;

  // Response suggestion hook (only initialize if high priority)
  const {
    suggestion,
    quickReplies,
    generating,
    generate,
    regenerate,
    generateQuick,
  } = useResponseSuggestion(selectedEnrichedEmail || ({} as any));

  // New category form state
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#3b82f6");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  // Convert custom categories to CategoryTab format
  const categoryTabs: CategoryTab[] = [
    { id: "all", label: "All", color: "#64748b", tags: [] },
    ...customCategories.map((cat) => ({
      id: cat.id,
      label: cat.label,
      color: cat.color,
      tags: cat.tag_ids,
    })),
  ];

  // Filter emails based on active tab/category
  let filteredEmails = emails;
  const currentTab = categoryTabs.find((tab) => tab.id === activeTab);

  if (currentTab && currentTab.id !== "all" && currentTab.tags.length > 0) {
    // Filter emails that have any of the tab's tags
    filteredEmails = emails.filter((email) =>
      email.tags.some((emailTag) => {
        const normalizedEmailTag = emailTag
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-");
        return currentTab.tags.some(
          (tabTag) =>
            normalizedEmailTag === tabTag ||
            normalizedEmailTag === tabTag.toLowerCase()
        );
      })
    );
  }

  // Sort emails by newest to oldest
  const sortedEmails = [...filteredEmails].sort((a, b) => b.id - a.id);

  const toggleTagSelection = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      alert("Please enter a category name.");
      return;
    }

    if (selectedTagIds.length === 0) {
      alert("Please select at least one tag.");
      return;
    }

    try {
      const newCategory = await createCategory({
        label: newCategoryName.trim(),
        color: newCategoryColor,
        tagIds: selectedTagIds,
      });

      // Switch to the new category
      setActiveTab(newCategory.id);

      // Reset form
      setShowNewTabPanel(false);
      setNewCategoryName("");
      setNewCategoryColor("#3b82f6");
      setSelectedTagIds([]);

      console.log("✅ Created custom category:", newCategory);
    } catch (error) {
      console.error("❌ Failed to create category:", error);
      alert("Failed to create category. Please try again.");
    }
  };

  const handleCancelCategory = () => {
    setShowNewTabPanel(false);
    setNewCategoryName("");
    setNewCategoryColor("#3b82f6");
    setSelectedTagIds([]);
  };

  return (
    <InboxLayoutWrapper>
      {/* Left Sidebar - Folders */}
      <InboxLeftSidebar
        emails={emails}
        activeFolder={activeFolder}
        setActiveFolder={setActiveFolder}
      />

      {/* Right Section - Emails */}
      <div
        style={{
          flex: 1,
          background: theme.bgCard,
          borderRadius: 14,
          border: `1px solid ${theme.borderMuted}`,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Category Tabs */}
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
                  border: `1px solid ${
                    isActive ? tabColor : theme.borderMuted
                  }`,
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
            onClick={() => setShowNewTabPanel(true)}
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

        {/* Email List */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "0",
          }}
        >
          {sortedEmails.map((email, index) => {
            const isSelected = selectedEmail?.id === email.id;
            const priorityColor = getPriorityColor(email.priority);
            return (
              <div
                key={email.id}
                onClick={() => setSelectedEmail(isSelected ? null : email)}
                style={{
                  padding: "14px 16px",
                  borderBottom: `1px solid ${theme.borderMuted}`,
                  cursor: "pointer",
                  background: isSelected
                    ? theme.accentDimBorder
                    : email.read
                    ? theme.bgCard
                    : theme.bg,
                  transition: "all 0.15s",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = theme.borderMuted;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = email.read
                      ? theme.bgCard
                      : theme.bg;
                  }
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: theme.accent,
                    color: theme.textPrimary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {email.avatar}
                </div>

                {/* Email Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: email.read ? 500 : 700,
                        color: theme.textPrimary,
                      }}
                    >
                      {email.from}
                    </span>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <p
                        style={{
                          fontSize: 11,
                          color: theme.textDim,
                          flexShrink: 0,
                          marginLeft: 12,
                        }}
                      >
                        {email.time}
                      </p>
                      <p
                        style={{
                          backgroundColor: priorityColor,
                          borderRadius: "100px",
                          width: 8,
                          height: 8,
                        }}
                      ></p>
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: email.read ? 400 : 600,
                      color: theme.textPrimary,
                      marginBottom: 4,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {email.subject}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: theme.textMuted,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {email.preview}
                  </div>

                  {/* Tags */}
                  {email.tags && email.tags.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        marginTop: 6,
                        flexWrap: "wrap",
                      }}
                    >
                      {email.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          style={{
                            fontSize: 9,
                            background: theme.accentDimBorder,
                            color: theme.accentLight,
                            padding: "2px 6px",
                            borderRadius: 4,
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: 0.3,
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Expanded Email View */}
                  {isSelected && (
                    <div
                      style={{
                        marginTop: 16,
                        paddingTop: 16,
                        borderTop: `1px solid ${theme.borderMuted}`,
                        animation: "fadeIn 0.2s ease",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 13,
                          color: theme.textMuted,
                          lineHeight: 1.6,
                          marginBottom: 16,
                        }}
                      >
                        {email.preview}
                      </div>

                      {/* Action Buttons */}
                      <div
                        style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
                      >
                        {["Reply", "Forward", "Archive", "Delete"].map(
                          (action) => (
                            <button
                              key={action}
                              style={{
                                padding: "8px 14px",
                                background: theme.bg,
                                border: `1px solid ${theme.borderMuted}`,
                                borderRadius: 7,
                                fontSize: 11,
                                fontWeight: 600,
                                color: theme.textMuted,
                                cursor: "pointer",
                                transition: "all 0.15s",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor =
                                  theme.accent;
                                e.currentTarget.style.color = theme.accentLight;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor =
                                  theme.borderMuted;
                                e.currentTarget.style.color = theme.textMuted;
                              }}
                            >
                              {action}
                            </button>
                          )
                        )}
                      </div>

                      {/* AI Response Suggestion Panel */}
                      {showResponsePanel && selectedEnrichedEmail && (
                        <ResponseSuggestionPanel
                          suggestion={suggestion}
                          generating={generating}
                          onRegenerate={regenerate}
                          onClose={() => setShowResponsePanel(false)}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Skeleton loaders for emails being analyzed */}
          {isAnalyzing && unprocessedCount > 0 && (
            <EmailSkeleton
              count={Math.min(unprocessedCount, 3)}
              variant="inbox"
            />
          )}
        </div>
      </div>

      {/* Sliding Side Panel for New Tab Creation */}
      {showNewTabPanel && (
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
                  Choose tags that represent the emails you want in this
                  category. AI automatically tags emails based on their content.
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
                                  color: isSelected
                                    ? "#ffffff"
                                    : theme.textMuted,
                                  cursor: "pointer",
                                  transition: "all 0.15s",
                                }}
                                onMouseEnter={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.borderColor =
                                      newCategoryColor;
                                    e.currentTarget.style.color =
                                      newCategoryColor;
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.borderColor =
                                      theme.borderMuted;
                                    e.currentTarget.style.color =
                                      theme.textMuted;
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
                onClick={handleCreateCategory}
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
                    e.currentTarget.style.opacity = "0.9";
                  }
                }}
                onMouseLeave={(e) => {
                  if (
                    newCategoryName.trim() &&
                    selectedTagIds.length > 0 &&
                    !isCreatingCategory
                  ) {
                    e.currentTarget.style.opacity = "1";
                  }
                }}
              >
                {isCreatingCategory ? "Creating..." : "Create Category"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Add keyframe animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </InboxLayoutWrapper>
  );
}
