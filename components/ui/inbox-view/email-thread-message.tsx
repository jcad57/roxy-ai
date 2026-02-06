"use client";

/**
 * Email Thread Message Component
 * Individual message within an email thread
 */

import { useTheme } from "@/lib/providers/theme-provider";

interface ThreadMessage {
  id: string;
  from: string;
  to: string;
  subject: string;
  time: string;
  content: string;
  avatar: string;
  isRead: boolean;
}

interface EmailThreadMessageProps {
  message: ThreadMessage;
  isFirst: boolean;
  isLast: boolean;
}

export function EmailThreadMessage({
  message,
  isFirst,
  isLast,
}: EmailThreadMessageProps) {
  const { theme } = useTheme();

  return (
    <div
      style={{
        marginBottom: isLast ? 0 : 24,
        paddingBottom: isLast ? 0 : 24,
        borderBottom: isLast ? "none" : `1px solid ${theme.borderMuted}`,
      }}
    >
      {/* Message Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          marginBottom: 12,
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: theme.accent,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {message.avatar}
        </div>

        {/* From/To Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 2,
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: theme.textPrimary,
              }}
            >
              {message.from}
            </span>
            <span
              style={{
                fontSize: 10,
                color: theme.textDim,
                flexShrink: 0,
                marginLeft: 8,
              }}
            >
              {message.time}
            </span>
          </div>
          <div
            style={{
              fontSize: 11,
              color: theme.textMuted,
            }}
          >
            To: {message.to}
          </div>
        </div>
      </div>

      {/* Message Content */}
      <div
        style={{
          fontSize: 12,
          color: theme.textSecondary,
          lineHeight: 1.6,
          whiteSpace: "pre-wrap",
          paddingLeft: 48, // Align with avatar
        }}
      >
        {message.content}
      </div>
    </div>
  );
}
