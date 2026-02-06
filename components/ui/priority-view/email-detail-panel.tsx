"use client";

/**
 * Email Detail Panel Component
 * Displays full email details with AI features and reply functionality
 */

import { useTheme } from "@/lib/providers/theme-provider";
import { useResponsive } from "@/lib/hooks/use-responsive";
import { usePriorityStore } from "@/lib/stores/priority-store";
import { priorityColor } from "@/lib/utils/colors";
import { QuickReplyBar } from "@/components/ui/quick-reply-bar";
import { ResponseSuggestionPanel } from "@/components/ui/response-suggestion-panel";
import { ReplyComposeBox } from "./reply-compose-box";
import type { Email } from "@/lib/types/email";
import type { EnrichedEmail } from "@/lib/types/email-raw";
import type {
  QuickReply,
  ResponseContext,
  ResponseSuggestion,
} from "@/lib/types/response";

interface EmailDetailPanelProps {
  selectedEmail: Email;
  selectedEnrichedEmail: EnrichedEmail | null | undefined;
  quickReplies: QuickReply[];
  generating: boolean;
  suggestion: ResponseSuggestion | null;
  regenerate: (context: ResponseContext) => Promise<ResponseSuggestion | null>;
  onDeselect: () => void;
}

export function EmailDetailPanel({
  selectedEmail,
  selectedEnrichedEmail,
  quickReplies,
  generating,
  suggestion,
  regenerate,
  onDeselect,
}: EmailDetailPanelProps) {
  const { theme } = useTheme();
  const { isMobile } = useResponsive();

  const {
    showReplyBox,
    showAISuggestion,
    setReplyText,
    setShowReplyBox,
    setShowAISuggestion,
  } = usePriorityStore();

  return (
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
          onClick={onDeselect}
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

      {/* Email Header */}
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
          {selectedEmail.subject}
        </div>
        <div
          style={{
            fontSize: 11.5,
            color: theme.textDim,
            marginBottom: 10,
          }}
        >
          {selectedEmail.from} · {selectedEmail.time}
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
            {selectedEmail.cluster}
          </span>
          <span
            style={{
              fontSize: 10,
              background: priorityColor(selectedEmail.priority) + "20",
              color: priorityColor(selectedEmail.priority),
              padding: "4px 10px",
              borderRadius: 6,
              fontWeight: 600,
            }}
          >
            Priority {selectedEmail.priority}
          </span>
          {selectedEmail.thread > 1 && (
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
              {selectedEmail.thread} messages
            </span>
          )}
        </div>
      </div>

      {/* Email Body */}
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
        {selectedEmail.preview} Lorem ipsum dolor sit amet, consectetur
        adipiscing elit. This is the full email content that would be displayed
        here.
      </div>

      {/* AI Response System - Only show when reply box is hidden */}
      {!showReplyBox && (
        <>
          {/* AI Suggested Response (priority >= 70) */}
          {selectedEmail.priority >= 70 && !showAISuggestion && (
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

      {/* Reply Compose Box */}
      {showReplyBox && <ReplyComposeBox recipientName={selectedEmail.from} />}
    </div>
  );
}
