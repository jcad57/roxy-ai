"use client";

/**
 * Email List Item Component
 * Individual email item in the inbox list
 */

import { useTheme } from "@/lib/providers/theme-provider";
import { useInboxStore } from "@/lib/stores/inbox-store";
import { getPriorityColor } from "@/lib/utils/inbox-view-helpers";
import { useEmailActions } from "@/lib/hooks/use-email-actions";
import type { Email } from "@/lib/types/email";

interface EmailListItemProps {
  email: Email;
}

export function EmailListItem({ email }: EmailListItemProps) {
  const { theme } = useTheme();
  const selectedEmail = useInboxStore((state) => state.selectedEmail);
  const toggleEmailSelection = useInboxStore(
    (state) => state.toggleEmailSelection
  );
  const { markAsRead } = useEmailActions();

  const isSelected = selectedEmail?.id === email.id;
  const priorityColor = getPriorityColor(email.priority);

  const handleEmailClick = () => {
    console.log(`📧 Email clicked:`, {
      subject: email.subject,
      from: email.from,
      isRead: email.read,
      outlookMessageId: email.outlookMessageId,
    });
    
    toggleEmailSelection(email);
    
    // Mark as read when opening (Outlook-style behavior)
    if (!email.read && email.outlookMessageId) {
      console.log(`📨 Marking email as read: ${email.outlookMessageId}`);
      markAsRead([email.outlookMessageId]);
    } else if (!email.read) {
      console.warn(`⚠️ Cannot mark as read - missing outlookMessageId`);
    } else {
      console.log(`ℹ️ Email already read, skipping mark-as-read`);
    }
  };

  return (
    <div
      onClick={handleEmailClick}
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
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 2,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  color: theme.textDim,
                  flexShrink: 0,
                  fontWeight: 600,
                }}
              >
                {email.date}
              </span>
              <span
                style={{
                  fontSize: 9,
                  color: theme.textDim,
                  flexShrink: 0,
                  opacity: 0.7,
                }}
              >
                {email.time}
              </span>
            </div>
            <p
              style={{
                backgroundColor: priorityColor,
                width: 6,
                height: 6,
                borderRadius: "50%",
                flexShrink: 0,
              }}
            ></p>
          </div>
        </div>

        <div
          style={{
            fontSize: 12,
            fontWeight: email.read ? 500 : 600,
            color: theme.textSecondary,
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
            fontSize: 11,
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
      </div>
    </div>
  );
}
