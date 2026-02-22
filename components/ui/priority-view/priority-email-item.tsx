"use client";

/**
 * Priority Email Item Component
 * Individual email item in priority list
 */

import { useTheme } from "@/lib/providers/theme-provider";
import { priorityColor } from "@/lib/utils/colors";
import { useEmailActions } from "@/lib/hooks/use-email-actions";
import type { Email } from "@/lib/types/email";

interface PriorityEmailItemProps {
  email: Email;
  isSelected: boolean;
  index: number;
  onSelect: (email: Email) => void;
}

export function PriorityEmailItem({
  email,
  isSelected,
  index,
  onSelect,
}: PriorityEmailItemProps) {
  const { theme } = useTheme();
  const { markAsRead } = useEmailActions();

  const handleEmailClick = () => {
    console.log(`📧 Priority email clicked:`, {
      subject: email.subject,
      from: email.from,
      isRead: email.read,
      outlookMessageId: email.outlookMessageId,
    });
    
    onSelect(email);
    
    // Mark as read when opening (Outlook-style behavior)
    if (!email.read && email.outlookMessageId) {
      console.log(`📨 Marking priority email as read: ${email.outlookMessageId}`);
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
        padding: "10px 12px",
        borderRadius: 10,
        cursor: "pointer",
        transition: "all 0.15s",
        background: isSelected ? theme.accentGlow : theme.bgCard,
        border: isSelected
          ? `1px solid ${theme.accentDimBorder}`
          : `1px solid ${theme.borderMuted}`,
        animation: `fadeSlideIn 0.3s ease ${index * 30}ms both`,
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
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
        }}
      >
        {email.subject}
      </div>
    </div>
  );
}
