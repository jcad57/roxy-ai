"use client";

/**
 * Inbox Layout (Refactored with Zustand)
 * Traditional email client with smart features
 * Gmail-style interface with folders and category tabs
 *
 * State Management: Zustand (lib/stores/inbox-store.ts)
 * Components: Broken into smaller, reusable pieces in ui/inbox-view/
 */

import type { InboxLayoutProps } from "@/lib/types/email";
import { useEmailData } from "@/lib/hooks/use-email-data";
import { useResponseSuggestion } from "@/lib/hooks/use-response-suggestion";
import { useContextTags } from "@/lib/hooks/use-context-tags";
import { useInboxStore } from "@/lib/stores/inbox-store";
import { ResponseSuggestionPanel } from "@/components/ui/response-suggestion-panel";
import { EmailSkeleton } from "@/components/ui/email-skeleton";
import { getCategoryTabs } from "@/lib/utils/inbox-view-helpers";
import { useTheme } from "@/lib/providers/theme-provider";

// Sub-components
import InboxLayoutWrapper from "../ui/inbox-view/inbox-layout-wrapper";
import InboxLeftSidebar from "../ui/inbox-view/inbox-left-sidebar";
import { CategoryTabBar } from "../ui/inbox-view/category-tab-bar";
import { EmailListItem } from "../ui/inbox-view/email-list-item";
import { NewCategoryPanel } from "../ui/inbox-view/new-category-panel";
import { EmailThreadPanel } from "../ui/inbox-view/email-thread-panel";

export function InboxLayout({
  emails,
  selected,
  onSelect,
  isAnalyzing = false,
  unprocessedCount = 0,
}: InboxLayoutProps) {
  const { theme } = useTheme();
  const { enrichedEmails } = useEmailData();

  // === ZUSTAND STORE STATE ===
  const {
    activeFolder,
    activeTab,
    selectedEmail,
    showNewTabPanel,
    showResponsePanel,
    showEmailThreadPanel,
    setActiveFolder,
    setShowResponsePanel,
    switchToNewCategory,
  } = useInboxStore();

  // === CONTEXT TAGS & CUSTOM CATEGORIES ===
  const {
    tags: contextTags,
    groupedTags,
    categories: customCategories,
    createCategory,
    isCreatingCategory,
  } = useContextTags(emails);

  // === ENRICHED EMAIL LOOKUP ===
  const selectedEnrichedEmail = selectedEmail
    ? enrichedEmails.find(
        (e) =>
          parseInt(e.id.substring(e.id.length - 8), 36) % 10000 ===
          selectedEmail.id
      )
    : null;

  // === AI RESPONSE SUGGESTION ===
  const {
    suggestion,
    quickReplies,
    generating,
    generate,
    regenerate,
    generateQuick,
  } = useResponseSuggestion(selectedEnrichedEmail || ({} as any));

  // === CATEGORY TABS ===
  const categoryTabs = getCategoryTabs(customCategories);

  // === FILTER EMAILS BY ACTIVE TAB ===
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
          (tabTag: string) =>
            normalizedEmailTag === tabTag ||
            normalizedEmailTag === tabTag.toLowerCase()
        );
      })
    );
  }

  // === SORT EMAILS (NEWEST FIRST) ===
  const sortedEmails = [...filteredEmails].sort((a, b) => b.id - a.id);

  // === CREATE CATEGORY HANDLER ===
  const handleCreateCategory = async () => {
    const { newCategoryName, newCategoryColor, selectedTagIds } =
      useInboxStore.getState();

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

      // Switch to the new category and close panel
      switchToNewCategory(newCategory.id);

      console.log("✅ Created custom category:", newCategory);
    } catch (error) {
      console.error("❌ Failed to create category:", error);
      alert("Failed to create category. Please try again.");
    }
  };

  return (
    <InboxLayoutWrapper>
      {/* === LEFT SIDEBAR - FOLDERS === */}
      <InboxLeftSidebar
        emails={emails}
        activeFolder={activeFolder}
        setActiveFolder={setActiveFolder}
      />

      {/* === RIGHT SECTION - EMAILS & THREAD === */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Category Tabs - Spans full width */}
        <div
          style={{
            background: theme.bgCard,
            borderRadius: "14px 14px 0 0",
            border: `1px solid ${theme.borderMuted}`,
            borderBottom: "none",
          }}
        >
          <CategoryTabBar categoryTabs={categoryTabs} />
        </div>

        {/* Email List & Thread Panel Container */}
        <div
          style={{
            flex: 1,
            display: "flex",
            overflow: "hidden",
          }}
        >
          {/* Email List */}
          <div
            style={{
              flex: 1,
              background: theme.bgCard,
              border: `1px solid ${theme.borderMuted}`,
              borderRadius: showEmailThreadPanel
                ? "0 0 0 14px"
                : "0 0 14px 14px",
              borderTop: "none",
              borderRight: showEmailThreadPanel ? "none" : undefined,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "0",
              }}
            >
              {sortedEmails.map((email) => (
                <EmailListItem key={email.id} email={email} />
              ))}

              {/* Skeleton loaders for emails being analyzed */}
              {isAnalyzing && unprocessedCount > 0 && (
                <EmailSkeleton
                  count={Math.min(unprocessedCount, 3)}
                  variant="inbox"
                />
              )}
            </div>
          </div>

          {/* Email Thread Panel (Conditional) */}
          {showEmailThreadPanel && selectedEmail && (
            <EmailThreadPanel email={selectedEmail} />
          )}
        </div>
      </div>

      {/* === NEW CATEGORY PANEL (SLIDING) === */}
      {showNewTabPanel && (
        <NewCategoryPanel
          contextTags={contextTags}
          groupedTags={groupedTags}
          isCreatingCategory={isCreatingCategory}
          onCreateCategory={handleCreateCategory}
        />
      )}

      {/* === AI RESPONSE SUGGESTION PANEL === */}
      {showResponsePanel && selectedEnrichedEmail && (
        <ResponseSuggestionPanel
          suggestion={suggestion}
          generating={generating}
          onRegenerate={regenerate}
          onClose={() => setShowResponsePanel(false)}
        />
      )}
    </InboxLayoutWrapper>
  );
}
