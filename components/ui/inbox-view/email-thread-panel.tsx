"use client";

/**
 * Email Thread Panel Component
 * Displays email thread with full conversation history
 * Outlook-style detail view
 */

import { useTheme } from "@/lib/providers/theme-provider";
import { useInboxStore } from "@/lib/stores/inbox-store";
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

  // Mock thread data - in real app, this would come from API/database
  const threadMessages = [
    {
      id: `${email.id}-1`,
      from: email.from,
      to: "You",
      subject: email.subject,
      time: email.time,
      content: `${email.preview}\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.\n\nBest regards,\n${email.from}`,
      avatar: email.avatar,
      isRead: email.read,
    },
  ];

  // If email has thread count > 1, add more messages
  if (email.thread > 1) {
    for (let i = 2; i <= Math.min(email.thread, 5); i++) {
      threadMessages.push({
        id: `${email.id}-${i}`,
        from: i % 2 === 0 ? "You" : email.from,
        to: i % 2 === 0 ? email.from : "You",
        subject: `Re: ${email.subject}`,
        time: `${i}h ago`,
        content: `This is message ${i} in the thread.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit.`,
        avatar: i % 2 === 0 ? "Y" : email.avatar,
        isRead: true,
      });
    }
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
            marginLeft: 12,
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
