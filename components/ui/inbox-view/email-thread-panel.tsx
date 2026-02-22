"use client";

/**
 * Email Thread Panel Component
 * Displays email thread with full conversation history
 * Outlook-style detail view with real email content
 */

import { useTheme } from "@/lib/providers/theme-provider";
import { useInboxStore } from "@/lib/stores/inbox-store";
import { useEmailContent } from "@/lib/hooks/use-email-content";
import { useEmailActions } from "@/lib/hooks/use-email-actions";
import type { Email } from "@/lib/types/email";
import { EmailThreadMessage } from "./email-thread-message";
import { EmailThreadActions } from "./email-thread-actions";

interface EmailThreadPanelProps {
  email: Email;
}

export function EmailThreadPanel({ email }: EmailThreadPanelProps) {
  const { theme } = useTheme();
  const closeEmailThreadPanel = useInboxStore(
    (state) => state.closeEmailThreadPanel
  );
  const { markAsUnread } = useEmailActions();

  const handleMarkUnread = () => {
    console.log(`📧 Mark as Unread clicked in thread panel`);
    console.log(`   Email:`, { subject: email.subject, outlookMessageId: email.outlookMessageId });
    
    if (email.outlookMessageId) {
      console.log(`📨 Calling markAsUnread...`);
      markAsUnread([email.outlookMessageId]);
    } else {
      console.warn(`⚠️ Cannot mark as unread - missing outlookMessageId`);
    }
  };

  // Fetch real email content on-demand
  const { data: emailContent, isLoading, error } = useEmailContent(
    (email as any).outlookMessageId || null,
    true
  );

  // Prepare thread messages from real content
  const threadMessages = [];

  if (emailContent) {
    // Main email message with full body
    threadMessages.push({
      id: emailContent.outlookMessageId,
      from: emailContent.from.name || emailContent.from.address,
      to: emailContent.to.map(t => t.name || t.address).join(', ') || 'You',
      subject: emailContent.subject,
      time: new Date(emailContent.receivedDateTime).toLocaleString(),
      content: emailContent.body.contentType === 'html' 
        ? stripHtml(emailContent.body.content) 
        : emailContent.body.content,
      avatar: (emailContent.from.name || 'U')[0].toUpperCase(),
      isRead: true,
      hasAttachments: emailContent.hasAttachments,
      attachments: emailContent.attachments || [],
    });
  } else if (!isLoading && !error) {
    // Fallback to preview if content not yet loaded
    threadMessages.push({
      id: `${email.id}-1`,
      from: email.from,
      to: "You",
      subject: email.subject,
      time: email.time,
      content: email.preview || '(No preview available)',
      avatar: email.avatar,
      isRead: email.read,
    });
  }

  // Helper function to strip HTML tags for preview
  function stripHtml(html: string): string {
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
  }

  return (
    <div
      style={{
        width: "73%",
        background: theme.bgCard,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        animation: "slideInFromRight 0.2s ease",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: `1px solid ${theme.borderMuted}`,
          borderLeft: `1px solid ${theme.borderMuted}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: theme.bgCard,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: theme.textPrimary,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {email.subject}
          </div>
          {email.thread > 1 && (
            <div
              style={{
                fontSize: 10,
                color: theme.textMuted,
                marginTop: 2,
              }}
            >
              {email.thread} messages
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Mark as Unread Button */}
          {email.read && email.outlookMessageId && (
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

          {/* Close Button */}
          <button
            onClick={closeEmailThreadPanel}
            style={{
              background: "transparent",
              border: "none",
              color: theme.textMuted,
              cursor: "pointer",
              fontSize: 20,
              padding: "4px 8px",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = theme.textPrimary;
              e.currentTarget.style.background = theme.borderMuted;
              e.currentTarget.style.borderRadius = "6px";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = theme.textMuted;
              e.currentTarget.style.background = "transparent";
            }}
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Thread Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 20px",
          borderLeft: `1px solid ${theme.borderMuted}`,
        }}
      >
        {threadMessages.map((message, index) => (
          <EmailThreadMessage
            key={message.id}
            message={message}
            isFirst={index === 0}
            isLast={index === threadMessages.length - 1}
          />
        ))}
      </div>

      {/* Action Buttons */}
      <EmailThreadActions email={email} />

      {/* Inline CSS for animation */}
      <style jsx>{`
        @keyframes slideInFromRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
