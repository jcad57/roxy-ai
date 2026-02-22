"use client";

/**
 * Email Detail Panel Component
 * Displays full email details with AI features and reply functionality
 * Now with real on-demand content fetching
 */

import { useTheme } from "@/lib/providers/theme-provider";
import { useResponsive } from "@/lib/hooks/use-responsive";
import { usePriorityStore } from "@/lib/stores/priority-store";
import { useEmailContent } from "@/lib/hooks/use-email-content";
import { useEmailActions } from "@/lib/hooks/use-email-actions";
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
  quickReplies: QuickReply[];
  generating: boolean;
  suggestion: ResponseSuggestion | null;
  regenerate: (context: ResponseContext) => Promise<ResponseSuggestion | null>;
  onDeselect: () => void;
}

export function EmailDetailPanel({
  selectedEmail,
  quickReplies,
  generating,
  suggestion,
  regenerate,
  onDeselect,
}: EmailDetailPanelProps) {
  const { theme } = useTheme();
  const { isMobile } = useResponsive();
  const { markAsUnread } = useEmailActions();

  const handleMarkUnread = () => {
    console.log(`📧 Mark as Unread clicked in priority detail panel`);
    console.log(`   Email:`, { subject: selectedEmail.subject, outlookMessageId: selectedEmail.outlookMessageId });
    
    if (selectedEmail.outlookMessageId) {
      console.log(`📨 Calling markAsUnread...`);
      markAsUnread([selectedEmail.outlookMessageId]);
    } else {
      console.warn(`⚠️ Cannot mark as unread - missing outlookMessageId`);
    }
  };

  const {
    showReplyBox,
    showAISuggestion,
    setReplyText,
    setShowReplyBox,
    setShowAISuggestion,
  } = usePriorityStore();

  // Fetch real email content on-demand
  const { data: emailContent, isLoading: isLoadingContent, error: contentError } = useEmailContent(
    (selectedEmail as any).outlookMessageId || null,
    true
  );

  // Helper to strip HTML
  const stripHtml = (html: string): string => {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  };

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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: theme.textPrimary,
              flex: 1,
            }}
          >
            {selectedEmail.subject}
          </div>
          
          {/* Mark as Unread Button */}
          {selectedEmail.read && selectedEmail.outlookMessageId && (
            <button
              onClick={handleMarkUnread}
              style={{
                background: "transparent",
                border: `1px solid ${theme.borderMuted}`,
                color: theme.textMuted,
                cursor: "pointer",
                fontSize: 11,
                padding: "6px 12px",
                borderRadius: 6,
                transition: "all 0.15s",
                fontWeight: 500,
                marginLeft: 12,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = theme.textPrimary;
                e.currentTarget.style.background = theme.borderMuted;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = theme.textMuted;
                e.currentTarget.style.background = "transparent";
              }}
              title="Mark as unread"
            >
              Mark as Unread
            </button>
          )}
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
          minHeight: 100,
        }}
      >
        {isLoadingContent && (
          <div style={{ textAlign: 'center', padding: 20, color: theme.textMuted }}>
            Loading email content...
          </div>
        )}
        
        {contentError && (
          <div style={{ color: theme.error }}>
            Failed to load email content. Showing preview only:<br /><br />
            {selectedEmail.preview}
          </div>
        )}

        {emailContent && !isLoadingContent && !contentError && (
          <div style={{ whiteSpace: 'pre-wrap' }}>
            {emailContent.body.contentType === 'html' 
              ? stripHtml(emailContent.body.content)
              : emailContent.body.content}
          </div>
        )}

        {!emailContent && !isLoadingContent && !contentError && (
          <div>{selectedEmail.preview}</div>
        )}

        {emailContent?.hasAttachments && emailContent.attachments && emailContent.attachments.length > 0 && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${theme.borderMuted}` }}>
            <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 8, fontWeight: 600 }}>
              📎 Attachments ({emailContent.attachments.length})
            </div>
            {emailContent.attachments.map((attachment: any) => (
              <div 
                key={attachment.id}
                style={{
                  fontSize: 11,
                  color: theme.textSecondary,
                  padding: '6px 10px',
                  background: theme.bg,
                  borderRadius: 6,
                  marginBottom: 4,
                }}
              >
                {attachment.name} ({Math.round(attachment.size / 1024)}KB)
              </div>
            ))}
          </div>
        )}
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
          {showAISuggestion && selectedEmail && (
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
