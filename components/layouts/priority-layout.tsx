"use client";

/**
 * Priority Layout (Refactored with Zustand)
 * AI-prioritized email list for efficient inbox processing
 *
 * State Management: Zustand (lib/stores/priority-store.ts)
 * Components: Broken into smaller, reusable pieces in ui/priority-view/
 */

import { useEffect } from "react";
import type { Email, EmailCluster } from "@/lib/types/email";
import type { LayoutProps } from "@/lib/types/layout";
import { useTheme } from "@/lib/providers/theme-provider";
import { useResponsive } from "@/lib/hooks/use-responsive";
import { useEmailPrefetch } from "@/lib/hooks/use-email-prefetch";
import { responsiveGap } from "@/lib/utils/responsive-styles";
import { useResponseSuggestion } from "@/lib/hooks/use-response-suggestion";
import { ResponseCache } from "@/lib/services/response/response-cache";
import {
  usePriorityStore,
  type PriorityFilter,
} from "@/lib/stores/priority-store";

// Sub-components
import { KPICards } from "../ui/priority-view/kpi-cards";
import { ClustersSidebar } from "../ui/priority-view/clusters-sidebar";
import { PriorityEmailItem } from "../ui/priority-view/priority-email-item";
import { EmailDetailPanel } from "../ui/priority-view/email-detail-panel";
import { EmptySelectionState } from "../ui/priority-view/empty-selection-state";
import { EmptyInboxState } from "../ui/empty-inbox-state";

interface PriorityLayoutProps extends LayoutProps {
  emails: Email[];
}

export function PriorityLayout({
  emails,
  selected,
  onSelect,
}: PriorityLayoutProps) {
  // Prefetch email bodies in background
  const { isPrefetching } = useEmailPrefetch(emails, true);
  const { theme } = useTheme();
  const { breakpoint, isMobile, isTablet } = useResponsive();

  // === ZUSTAND STORE STATE ===
  const { activeCluster, activePriority } = usePriorityStore();

  // === AI RESPONSE SUGGESTION ===
  const {
    suggestion,
    quickReplies,
    generating,
    generate,
    regenerate,
    generateQuick,
  } = useResponseSuggestion(selected || ({} as any));

  // === AUTO-GENERATE FOR HIGH-PRIORITY EMAILS ===
  useEffect(() => {
    if (selected && selected.priority >= 70) {
      const cacheKey = `quick_reply_${selected.id}`;
      const cached = ResponseCache.get(cacheKey);

      console.log(
        `📧 Selected email ${selected.id} (priority: ${selected.priority})`,
      );

      if (!cached) {
        console.log(`   🔄 No cache found, triggering generation...`);
        generateQuick();
      } else {
        console.log(`   ✅ Cache found, loading from cache`);
        generateQuick();
      }
    }
  }, [selected?.id, generateQuick]);

  // === CLUSTERS ===
  const clusters: EmailCluster[] = [
    "operations",
    "content",
    "partnerships",
    "analytics",
    "finance",
    "other",
  ];

  // === FILTER EMAILS ===
  let filtered = activeCluster
    ? emails.filter((e) => e.cluster === activeCluster)
    : emails;

  // Filter by priority
  if (activePriority === "high") {
    filtered = filtered.filter((e) => e.priority >= 80);
  } else if (activePriority === "medium") {
    filtered = filtered.filter((e) => e.priority >= 50 && e.priority < 80);
  } else if (activePriority === "low") {
    filtered = filtered.filter((e) => e.priority < 50);
  }

  const sorted = [...filtered].sort((a, b) => b.priority - a.priority);

  return (
    <div
      style={{
        display: isMobile ? "flex" : "grid",
        flexDirection: isMobile ? "column" : undefined,
        gridTemplateColumns: isMobile
          ? "1fr"
          : isTablet
            ? "180px 1fr"
            : "200px 1fr 1fr",
        gridTemplateRows: isMobile ? "auto" : "auto 1fr",
        gap: responsiveGap(breakpoint),
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* === KPI CARDS === */}
      <KPICards emails={emails} />

      {/* === CLUSTERS SIDEBAR === */}
      <div
        style={{
          overflowY: "auto",
          display: isMobile && selected ? "none" : "flex",
          flexDirection: "column",
          gap: 3,
          maxHeight: isMobile ? "30vh" : "none",
        }}
      >
        <ClustersSidebar emails={emails} clusters={clusters} />
      </div>

      {/* === EMAIL LIST === */}
      <div
        style={{
          overflowY: "auto",
          display: isMobile && selected ? "none" : "flex",
          flexDirection: "column",
          gap: 4,
          maxHeight: isMobile ? "40vh" : "none",
        }}
      >
        <div
          style={{
            fontSize: 9.5,
            color: theme.textDim,
            textTransform: "uppercase",
            letterSpacing: 1.5,
            fontWeight: 600,
            padding: "0 2px",
            marginBottom: 4,
          }}
        >
          {activeCluster
            ? `${activeCluster} — ${sorted.length}`
            : activePriority !== "all"
              ? `${activePriority} priority — ${sorted.length}`
              : `All emails — ${sorted.length}`}
        </div>

        {sorted.length === 0 ? (
          <div style={{ padding: 20 }}>
            <EmptyInboxState />
          </div>
        ) : (
          sorted.map((email, i) => (
            <PriorityEmailItem
              key={email.id}
              email={email}
              isSelected={selected?.id === email.id}
              index={i}
              onSelect={onSelect}
            />
          ))
        )}
      </div>

      {/* === EMAIL DETAIL === */}
      <div style={{ overflowY: "auto", position: "relative" }}>
        {selected ? (
          <EmailDetailPanel
            selectedEmail={selected}
            quickReplies={quickReplies}
            generating={generating}
            suggestion={suggestion}
            regenerate={regenerate}
            onDeselect={() => onSelect(null)}
          />
        ) : (
          <EmptySelectionState />
        )}
      </div>
    </div>
  );
}
