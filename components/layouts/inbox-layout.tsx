"use client";

/**
 * Inbox Layout
 * Traditional email client with smart features
 * Gmail-style interface with folders and category tabs
 */

import { useState, useEffect } from "react";
import type { Email } from "@/lib/types/email";
import type { LayoutProps } from "@/lib/types/layout";
import { useTheme } from "@/lib/providers/theme-provider";
import { mockContextTags } from "@/lib/data/mock-context-tags";
import { useResponsive } from "@/lib/hooks/use-responsive";
import { useEmailData } from "@/lib/hooks/use-email-data";
import { useResponseSuggestion } from "@/lib/hooks/use-response-suggestion";
import { ResponseCache } from "@/lib/services/response/response-cache";
import { SuggestResponseButton } from "@/components/ui/suggest-response-button";
import { QuickReplyBar } from "@/components/ui/quick-reply-bar";
import { ResponseSuggestionPanel } from "@/components/ui/response-suggestion-panel";

type FolderType = "inbox" | "starred" | "sent" | "drafts" | "trash";

interface CategoryTab {
  id: string;
  label: string;
  color: string;
  tags: string[]; // Context tag IDs that belong to this category
}

export function InboxLayout({ emails, selected, onSelect }: LayoutProps & { emails: Email[] }) {
  console.log(emails);
  const { theme } = useTheme();
  const { breakpoint, isMobile } = useResponsive();
  const { enrichedEmails } = useEmailData();
  
  const [activeFolder, setActiveFolder] = useState<FolderType>("inbox");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [showNewTabPanel, setShowNewTabPanel] = useState(false);
  const [showResponsePanel, setShowResponsePanel] = useState(false);
  
  // Find enriched version of selected email
  const selectedEnrichedEmail = selectedEmail
    ? enrichedEmails.find((e) => parseInt(e.id.substring(e.id.length - 8), 36) % 10000 === selectedEmail.id)
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
  
  // Auto-generate quick replies for high-priority emails (only once per email)
  useEffect(() => {
    if (selectedEmail && selectedEmail.priority >= 80 && selectedEnrichedEmail) {
      // Use consistent cache key format
      const cacheKey = `quick_reply_${selectedEnrichedEmail.id}`;
      const cached = ResponseCache.get(cacheKey);
      
      console.log(`📧 Selected email ${selectedEmail.id} (priority: ${selectedEmail.priority})`);
      
      if (!cached) {
        console.log(`   🔄 No cache found, triggering generation...`);
        generateQuick();
      } else {
        console.log(`   ✅ Cache found, loading from cache`);
        // Trigger generateQuick to load from cache
        generateQuick();
      }
    }
  }, [selectedEmail?.id]);
  
  // New tab form state
  const [newTabName, setNewTabName] = useState("");
  const [newTabColor, setNewTabColor] = useState("#3b82f6");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Category tabs with "All" as default
  const [categoryTabs, setCategoryTabs] = useState<CategoryTab[]>([
    { id: "all", label: "All", color: "#64748b", tags: [] },
  ]);

  // Filter emails based on active tab
  let filteredEmails = emails;
  const currentTab = categoryTabs.find(tab => tab.id === activeTab);
  
  if (currentTab && currentTab.id !== "all" && currentTab.tags.length > 0) {
    // Show emails that have at least one tag matching the tab's selected tags
    filteredEmails = emails.filter(email => 
      email.tags.some(tag => currentTab.tags.includes(tag))
    );
  }
  
  // Sort emails by newest to oldest (for demo, using ID as proxy for timestamp)
  const sortedEmails = [...filteredEmails].sort((a, b) => b.id - a.id);
console.log(sortedEmails);
  // Folders configuration
  const folders = [
    { id: "inbox" as FolderType, label: "Inbox", icon: "📥", count: emails.length },
    { id: "starred" as FolderType, label: "Starred", icon: "⭐", count: 0 },
    { id: "sent" as FolderType, label: "Sent", icon: "📤", count: 0 },
    { id: "drafts" as FolderType, label: "Drafts", icon: "📝", count: 0 },
    { id: "trash" as FolderType, label: "Trash", icon: "🗑️", count: 0 },
  ];

  const handleCreateTab = () => {
    if (!newTabName.trim() || selectedTags.length === 0) return;
    
    const newTab: CategoryTab = {
      id: `tab-${Date.now()}`,
      label: newTabName.trim(),
      color: newTabColor,
      tags: selectedTags,
    };
    
    setCategoryTabs(prev => [...prev, newTab]);
    setActiveTab(newTab.id);
    
    // Reset form
    setShowNewTabPanel(false);
    setNewTabName("");
    setNewTabColor("#3b82f6");
    setSelectedTags([]);
  };
  
  const handleCancelTab = () => {
    setShowNewTabPanel(false);
    setNewTabName("");
    setNewTabColor("#3b82f6");
    setSelectedTags([]);
  };
  
  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    );
  };
  
  // Predefined color options
  const colorOptions = [
    "#3b82f6", // blue
    "#8b5cf6", // purple
    "#ec4899", // pink
    "#f59e0b", // amber
    "#10b981", // green
    "#06b6d4", // cyan
    "#f43f5e", // rose
    "#6366f1", // indigo
  ];

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        overflow: "hidden",
        gap: 12,
      }}
    >
      {/* Left Sidebar - Folders */}
      <div
        style={{
          width: isMobile ? 70 : 240,
          background: theme.bgCard,
          borderRadius: 14,
          padding: isMobile ? "12px 8px" : "16px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          border: `1px solid ${theme.borderMuted}`,
        }}
      >
        {/* Compose Button */}
        <button
          style={{
            width: "100%",
            padding: isMobile ? "10px 0" : "12px 16px",
            background: theme.accent,
            color: theme.textPrimary,
            border: "none",
            borderRadius: 10,
            fontSize: isMobile ? 11 : 13,
            fontWeight: 700,
            cursor: "pointer",
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "0.9";
            e.currentTarget.style.transform = "scale(0.98)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          {isMobile ? "✏️" : "✏️ Compose"}
        </button>

        {/* Folder List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {folders.map((folder) => {
            const isActive = activeFolder === folder.id;
            return (
              <button
                key={folder.id}
                onClick={() => setActiveFolder(folder.id)}
                style={{
                  width: "100%",
                  padding: isMobile ? "10px 8px" : "10px 12px",
                  background: isActive ? theme.accentDimBorder : "transparent",
                  border: `1px solid ${isActive ? theme.accentDimBorder : "transparent"}`,
                  borderRadius: 8,
                  fontSize: isMobile ? 10 : 13,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? theme.accentLight : theme.textMuted,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: isMobile ? "center" : "space-between",
                  gap: 8,
                  transition: "all 0.15s",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = theme.borderMuted;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: isMobile ? 14 : 16 }}>{folder.icon}</span>
                  {!isMobile && <span>{folder.label}</span>}
                </div>
                {!isMobile && folder.count > 0 && (
                  <span
                    style={{
                      background: isActive ? theme.accent : theme.borderMuted,
                      color: isActive ? theme.textPrimary : theme.textDim,
                      padding: "2px 8px",
                      borderRadius: 12,
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  >
                    {folder.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

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
            return (
              <div
                key={email.id}
                onClick={() => setSelectedEmail(isSelected ? null : email)}
                style={{
                  padding: "14px 16px",
                  borderBottom: `1px solid ${theme.borderMuted}`,
                  cursor: "pointer",
                  background: isSelected ? theme.accentDimBorder : email.read ? theme.bgCard : theme.bg,
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
                    e.currentTarget.style.background = email.read ? theme.bgCard : theme.bg;
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
                    <span
                      style={{
                        fontSize: 11,
                        color: theme.textDim,
                        flexShrink: 0,
                        marginLeft: 12,
                      }}
                    >
                      {email.time}
                    </span>
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
                    <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
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
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {["Reply", "Forward", "Archive", "Delete"].map((action) => (
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
                              e.currentTarget.style.borderColor = theme.accent;
                              e.currentTarget.style.color = theme.accentLight;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = theme.borderMuted;
                              e.currentTarget.style.color = theme.textMuted;
                            }}
                          >
                            {action}
                          </button>
                        ))}
                        
                        {/* AI Suggest Response Button (priority >= 80) */}
                        {email.priority >= 80 && selectedEnrichedEmail && (
                          <SuggestResponseButton
                            onClick={() => {
                              setShowResponsePanel(true);
                              if (!suggestion) {
                                generate();
                              }
                            }}
                            generating={generating}
                            priority={email.priority}
                          />
                        )}
                      </div>
                      
                      {/* AI Suggested Response (priority >= 80) */}
                      {email.priority >= 80 && !showResponsePanel && (
                        <QuickReplyBar
                          replies={quickReplies}
                          loading={generating}
                          onUseResponse={(text) => {
                            console.log('Using AI response:', text);
                            // TODO: Insert into compose field
                          }}
                          onWriteCustom={() => {
                            console.log('Write custom response');
                            // TODO: Open compose field
                          }}
                        />
                      )}
                      
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
        </div>
      </div>

      {/* Sliding Side Panel for New Tab Creation */}
      {showNewTabPanel && (
        <>
          {/* Backdrop */}
          <div
            onClick={handleCancelTab}
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
                onClick={handleCancelTab}
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
                  value={newTabName}
                  onChange={(e) => setNewTabName(e.target.value)}
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
                  {colorOptions.map((color) => {
                    const isSelected = newTabColor === color;
                    return (
                      <button
                        key={color}
                        onClick={() => setNewTabColor(color)}
                        style={{
                          width: "100%",
                          aspectRatio: "1",
                          background: color,
                          border: `3px solid ${isSelected ? theme.textPrimary : "transparent"}`,
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
                  Choose tags that represent the emails you want in this category. AI automatically tags emails based on their content.
                </p>

                {/* Tags grouped by category */}
                {["action", "priority", "topic", "project", "event", "person"].map((category) => {
                  const categoryTags = mockContextTags.filter(tag => tag.category === category);
                  if (categoryTags.length === 0) return null;
                  
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
                        {category}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 8,
                        }}
                      >
                        {categoryTags.map((tag) => {
                          const isSelected = selectedTags.includes(tag.id);
                          return (
                            <button
                              key={tag.id}
                              onClick={() => toggleTag(tag.id)}
                              style={{
                                padding: "6px 12px",
                                background: isSelected ? newTabColor : theme.bg,
                                border: `1px solid ${isSelected ? newTabColor : theme.borderMuted}`,
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: isSelected ? 600 : 500,
                                color: isSelected ? "#ffffff" : theme.textMuted,
                                cursor: "pointer",
                                transition: "all 0.15s",
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.borderColor = newTabColor;
                                  e.currentTarget.style.color = newTabColor;
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.borderColor = theme.borderMuted;
                                  e.currentTarget.style.color = theme.textMuted;
                                }
                              }}
                            >
                              {tag.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
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
                onClick={handleCancelTab}
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
                onClick={handleCreateTab}
                disabled={!newTabName.trim() || selectedTags.length === 0}
                style={{
                  flex: 1,
                  padding: "12px 20px",
                  background: newTabName.trim() && selectedTags.length > 0 ? newTabColor : theme.borderMuted,
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#ffffff",
                  cursor: newTabName.trim() && selectedTags.length > 0 ? "pointer" : "not-allowed",
                  transition: "all 0.15s",
                  opacity: newTabName.trim() && selectedTags.length > 0 ? 1 : 0.5,
                }}
                onMouseEnter={(e) => {
                  if (newTabName.trim() && selectedTags.length > 0) {
                    e.currentTarget.style.opacity = "0.9";
                  }
                }}
                onMouseLeave={(e) => {
                  if (newTabName.trim() && selectedTags.length > 0) {
                    e.currentTarget.style.opacity = "1";
                  }
                }}
              >
                Create Category
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
    </div>
  );
}
