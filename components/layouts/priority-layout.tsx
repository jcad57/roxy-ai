"use client";

/**
 * Priority Layout
 * AI-prioritized email list for efficient inbox processing
 */

import { useState, useEffect } from "react";
import type { Email, EmailCluster } from "@/lib/types/email";
import type { LayoutProps } from "@/lib/types/layout";
import { useTheme } from "@/lib/providers/theme-provider";
import { priorityColor } from "@/lib/utils/colors";
import { useResponsive } from "@/lib/hooks/use-responsive";
import {
  responsivePadding,
  responsiveGap,
} from "@/lib/utils/responsive-styles";
import { useEmailData } from "@/lib/hooks/use-email-data";
import { useResponseSuggestion } from "@/lib/hooks/use-response-suggestion";
import { ResponseCache } from "@/lib/services/response/response-cache";
import { ResponseSuggestionPanel } from "@/components/ui/response-suggestion-panel";
import { QuickReplyBar } from "@/components/ui/quick-reply-bar";
import { EmailSkeleton } from "@/components/ui/email-skeleton";

type PriorityFilter = "all" | "high" | "medium" | "low";

interface PriorityLayoutProps extends LayoutProps {
  emails: Email[];
  isAnalyzing?: boolean;
  unprocessedCount?: number;
}

export function PriorityLayout({
  emails,
  selected,
  onSelect,
  isAnalyzing = false,
  unprocessedCount = 0,
}: PriorityLayoutProps) {
  const urgent = emails.filter((e) => e.priority >= 70);
  const clusters: EmailCluster[] = [
    "operations",
    "content",
    "partnerships",
    "analytics",
    "finance",
    "other",
  ];
  const [activeCluster, setActiveCluster] = useState<EmailCluster | null>(null);
  const [activePriority, setActivePriority] = useState<PriorityFilter>("all");
  const [replyText, setReplyText] = useState("");
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [showAISuggestion, setShowAISuggestion] = useState(false);
  const { theme } = useTheme();
  const { breakpoint, isMobile, isTablet } = useResponsive();
  const { enrichedEmails } = useEmailData();

  // Find enriched version of selected email
  const selectedEnrichedEmail = selected
    ? enrichedEmails.find(
        (e) =>
          parseInt(e.id.substring(e.id.length - 8), 36) % 10000 === selected.id
      )
    : null;

  // Response suggestion hook
  const {
    suggestion,
    quickReplies,
    generating,
    generate,
    regenerate,
    generateQuick,
  } = useResponseSuggestion(selectedEnrichedEmail || ({} as any));

  // Auto-generate for high-priority emails (only once per email)
  useEffect(() => {
    if (selected && selected.priority >= 80 && selectedEnrichedEmail) {
      // Use consistent cache key format
      const cacheKey = `quick_reply_${selectedEnrichedEmail.id}`;
      const cached = ResponseCache.get(cacheKey);

      console.log(
        `📧 Selected email ${selected.id} (priority: ${selected.priority})`
      );

      if (!cached) {
        console.log(`   🔄 No cache found, triggering generation...`);
        generateQuick();
      } else {
        console.log(`   ✅ Cache found, loading from cache`);
        // Trigger generateQuick to load from cache
        generateQuick();
      }
    }
  }, [selected?.id]);

  // Filter by cluster
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
      {/* KPI Cards */}
      <div
        style={{
          gridColumn: "1 / -1",
          display: "grid",
          gridTemplateColumns: isMobile
            ? "1fr 1fr"
            : isTablet
            ? "repeat(2, 1fr)"
            : "repeat(4, 1fr)",
          gap: isMobile ? 8 : 10,
        }}
      >
        {[
          {
            label: "High Priority",
            val: urgent.length,
            color: "#f43f5e",
            bg: "rgba(244,63,94,0.1)",
          },
          {
            label: "Unread",
            val: emails.filter((e) => !e.read).length,
            color: theme.accentLight,
            bg: theme.accentDimBorder,
          },
          {
            label: "Total Emails",
            val: emails.length,
            color: "#22c55e",
            bg: "rgba(34,197,94,0.1)",
          },
          {
            label: "Read",
            val: emails.filter((e) => e.read).length,
            color: "#3b82f6",
            bg: "rgba(59,130,246,0.1)",
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            style={{
              background: kpi.bg,
              borderRadius: isMobile ? 10 : 12,
              padding: isMobile ? "8px 10px" : "10px 14px",
              border: `1px solid ${kpi.color}20`,
            }}
          >
            <div
              style={{
                fontSize: isMobile ? 18 : 22,
                fontWeight: 800,
                color: kpi.color,
              }}
            >
              {kpi.val}
            </div>
            <div
              style={{
                fontSize: isMobile ? 9 : 10.5,
                color: theme.textDim,
                textTransform: "uppercase",
                letterSpacing: 1,
                marginTop: 2,
              }}
            >
              {kpi.label}
            </div>
          </div>
        ))}
      </div>

      {/* Clusters Sidebar */}
      <div
        style={{
          overflowY: "auto",
          display: isMobile && selected ? "none" : "flex",
          flexDirection: "column",
          gap: 3,
          maxHeight: isMobile ? "30vh" : "none",
        }}
      >
        <div
          style={{
            fontSize: 9.5,
            color: theme.textDim,
            textTransform: "uppercase",
            letterSpacing: 1.5,
            fontWeight: 600,
            padding: "0 10px",
            marginBottom: 4,
          }}
        >
          Clusters
        </div>
        {clusters.map((c) => {
          const count = emails.filter((e) => e.cluster === c).length;
          const active = activeCluster === c;
          return (
            <div
              key={c}
              onClick={() => setActiveCluster(active ? null : c)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 10px",
                borderRadius: 8,
                cursor: "pointer",
                transition: "all 0.15s",
                background: active ? theme.accentDimBorder : "transparent",
                border: active
                  ? `1px solid ${theme.accentDimBorder}`
                  : "1px solid transparent",
              }}
            >
              <span
                style={{
                  fontSize: 12.5,
                  color: active ? theme.accentLight : theme.textMuted,
                  fontWeight: active ? 600 : 400,
                  textTransform: "capitalize",
                }}
              >
                {c}
              </span>
              <span
                style={{
                  fontSize: 10,
                  background: theme.accentDimBorder,
                  color: theme.accentLight,
                  padding: "1px 7px",
                  borderRadius: 10,
                }}
              >
                {count}
              </span>
            </div>
          );
        })}

        {/* Priority Filter */}
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              fontSize: 9.5,
              color: theme.textDim,
              textTransform: "uppercase",
              letterSpacing: 1.5,
              fontWeight: 600,
              padding: "0 10px",
              marginBottom: 6,
            }}
          >
            Priority Level
          </div>
          {[
            {
              id: "all",
              label: "All",
              color: theme.textMuted,
              count: emails.length,
            },
            {
              id: "high",
              label: "High",
              color: "#f43f5e",
              count: emails.filter((e) => e.priority >= 80).length,
            },
            {
              id: "medium",
              label: "Medium",
              color: "#f59e0b",
              count: emails.filter((e) => e.priority >= 50 && e.priority < 80)
                .length,
            },
            {
              id: "low",
              label: "Low",
              color: "#22c55e",
              count: emails.filter((e) => e.priority < 50).length,
            },
          ].map((priority) => {
            const active = activePriority === priority.id;
            return (
              <div
                key={priority.id}
                onClick={() => setActivePriority(priority.id as PriorityFilter)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 10px",
                  borderRadius: 8,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  background: active ? `${priority.color}15` : "transparent",
                  border: active
                    ? `1px solid ${priority.color}40`
                    : "1px solid transparent",
                  marginBottom: 3,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: priority.color,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 12.5,
                      color: active ? priority.color : theme.textMuted,
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    {priority.label}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    background: `${priority.color}20`,
                    color: priority.color,
                    padding: "1px 7px",
                    borderRadius: 10,
                    fontWeight: 600,
                  }}
                >
                  {priority.count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Email List */}
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
        {sorted.map((email, i) => (
          <div
            key={email.id}
            onClick={() => onSelect(email)}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              cursor: "pointer",
              transition: "all 0.15s",
              background:
                selected?.id === email.id ? theme.accentGlow : theme.bgCard,
              border:
                selected?.id === email.id
                  ? `1px solid ${theme.accentDimBorder}`
                  : `1px solid ${theme.borderMuted}`,
              animation: `fadeSlideIn 0.3s ease ${i * 30}ms both`,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: theme.textPrimary,
                }}
              >
                {email.from}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: priorityColor(email.priority),
                  }}
                />
                <span style={{ fontSize: 9.5, color: theme.textDim }}>
                  {email.priority}
                </span>
              </div>
            </div>
            <div
              style={{
                fontSize: 11.5,
                color: theme.textMuted,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {email.subject}
            </div>
          </div>
        ))}

        {/* Skeleton loaders for emails being analyzed */}
        {isAnalyzing && unprocessedCount > 0 && (
          <EmailSkeleton
            count={Math.min(unprocessedCount, 3)}
            variant="priority"
          />
        )}
      </div>

      {/* Email Detail */}
      <div style={{ overflowY: "auto", position: "relative" }}>
        {selected ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: isMobile ? 10 : 12,
            }}
          >
            {/* Back Button on Mobile */}
            {isMobile && (
              <button
                onClick={() => onSelect(null)}
                style={{
                  position: "sticky",
                  top: 0,
                  zIndex: 10,
                  background: theme.accentDimBorder,
                  color: theme.accentLight,
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 12,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                ← Back
              </button>
            )}
            <div
              style={{
                background: theme.bgCard,
                borderRadius: 14,
                padding: 18,
                border: `1px solid ${theme.borderMuted}`,
              }}
            >
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: theme.textPrimary,
                  marginBottom: 4,
                }}
              >
                {selected.subject}
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: theme.textDim,
                  marginBottom: 10,
                }}
              >
                {selected.from} · {selected.time}
              </div>
              {/* Context Pills */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span
                  style={{
                    fontSize: 10,
                    background: theme.accentDimBorder,
                    color: theme.accentLight,
                    padding: "4px 10px",
                    borderRadius: 6,
                    fontWeight: 600,
                  }}
                >
                  {selected.cluster}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    background: priorityColor(selected.priority) + "20",
                    color: priorityColor(selected.priority),
                    padding: "4px 10px",
                    borderRadius: 6,
                    fontWeight: 600,
                  }}
                >
                  Priority {selected.priority}
                </span>
                {selected.thread > 1 && (
                  <span
                    style={{
                      fontSize: 10,
                      background: "rgba(34,197,94,0.15)",
                      color: "#22c55e",
                      padding: "4px 10px",
                      borderRadius: 6,
                      fontWeight: 600,
                    }}
                  >
                    {selected.thread} messages
                  </span>
                )}
              </div>
            </div>
            <div
              style={{
                fontSize: 13,
                color: theme.textSecondary,
                lineHeight: 1.7,
                background: theme.bgCard,
                borderRadius: 12,
                padding: 16,
                border: `1px solid ${theme.borderMuted}`,
              }}
            >
              {selected.preview} Lorem ipsum dolor sit amet, consectetur
              adipiscing elit. This is the full email content that would be
              displayed here.
            </div>

            {/* AI Response System - Only show when reply box is hidden */}
            {!showReplyBox && (
              <>
                {/* AI Suggested Response (priority >= 80) */}
                {selected.priority >= 80 && !showAISuggestion && (
                  <QuickReplyBar
                    replies={quickReplies}
                    loading={generating}
                    onUseResponse={(text) => {
                      setReplyText(text);
                      setShowReplyBox(true);
                    }}
                    onWriteCustom={() => {
                      setReplyText("");
                      setShowReplyBox(true);
                    }}
                  />
                )}

                {/* AI Response Suggestion Panel */}
                {showAISuggestion && selectedEnrichedEmail && (
                  <ResponseSuggestionPanel
                    suggestion={suggestion}
                    generating={generating}
                    onRegenerate={regenerate}
                    onClose={() => setShowAISuggestion(false)}
                  />
                )}
              </>
            )}

            {/* Reply Compose Box - Only show when AI suggestion is hidden */}
            {showReplyBox && (
              <div
                style={{
                  background: theme.bgCard,
                  borderRadius: 12,
                  padding: 16,
                  border: `2px solid ${theme.accentDimBorder}`,
                  animation: "fadeSlideIn 0.2s ease both",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: theme.accentLight,
                      textTransform: "uppercase",
                      letterSpacing: 1.2,
                      fontWeight: 700,
                    }}
                  >
                    ✉ REPLY TO {selected.from}
                  </div>
                  <button
                    onClick={() => setShowReplyBox(false)}
                    style={{
                      background: "none",
                      border: "none",
                      color: theme.textDim,
                      fontSize: 16,
                      cursor: "pointer",
                      padding: "2px 6px",
                    }}
                  >
                    ×
                  </button>
                </div>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  style={{
                    width: "100%",
                    minHeight: 120,
                    background: theme.bg,
                    border: `1px solid ${theme.borderMuted}`,
                    borderRadius: 8,
                    padding: "12px 14px",
                    fontSize: 13,
                    color: theme.textPrimary,
                    lineHeight: 1.6,
                    resize: "vertical",
                    fontFamily: "inherit",
                    outline: "none",
                    marginBottom: 12,
                    transition: "all 0.15s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = theme.accentLight;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = theme.borderMuted;
                  }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    style={{
                      flex: 1,
                      background: theme.accent,
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      padding: "10px 16px",
                      fontSize: 12,
                      cursor: "pointer",
                      fontWeight: 700,
                      transition: "all 0.2s",
                      boxShadow: `0 4px 12px ${theme.accent}40`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = `0 6px 16px ${theme.accent}50`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = `0 4px 12px ${theme.accent}40`;
                    }}
                  >
                    Send Reply
                  </button>
                  <button
                    style={{
                      background: theme.bgCardHover,
                      color: theme.textMuted,
                      border: `1px solid ${theme.borderMuted}`,
                      borderRadius: 8,
                      padding: "10px 16px",
                      fontSize: 12,
                      cursor: "pointer",
                      fontWeight: 600,
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = theme.textPrimary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = theme.textMuted;
                    }}
                  >
                    Save Draft
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: theme.textMuted,
              fontSize: 14,
            }}
          >
            Select an email to read and respond
          </div>
        )}
      </div>
    </div>
  );
}
