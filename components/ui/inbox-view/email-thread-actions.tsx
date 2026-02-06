"use client";

/**
 * Email Thread Actions Component
 * Action buttons for replying, forwarding, archiving, etc.
 */

import { useState } from "react";
import { useTheme } from "@/lib/providers/theme-provider";
import type { Email } from "@/lib/types/email";

interface EmailThreadActionsProps {
  email: Email;
}

export function EmailThreadActions({ email }: EmailThreadActionsProps) {
  const { theme } = useTheme();
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState("");

  const handleReply = () => {
    setShowReplyBox(!showReplyBox);
  };

  const handleSend = () => {
    console.log("Sending reply:", replyText);
    // In real app, this would send the email
    setReplyText("");
    setShowReplyBox(false);
  };

  return (
    <div
      style={{
        borderTop: `1px solid ${theme.borderMuted}`,
        borderLeft: `1px solid ${theme.borderMuted}`,
        borderBottom: `1px solid ${theme.borderMuted}`,
        borderRadius: "0 0 14px 0",
        padding: "16px 20px",
        background: theme.bgCard,
      }}
    >
      {/* Action Buttons */}
      {!showReplyBox && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={handleReply}
            style={{
              flex: 1,
              minWidth: "170px",
              padding: "10px 16px",
              background: theme.accent,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = `0 4px 12px ${theme.accent}40`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            ↩ Reply
          </button>

          <button
            onClick={() => console.log("Reply All")}
            style={{
              flex: 1,
              minWidth: "170px",
              padding: "10px 16px",
              background: theme.bgCardHover,
              color: theme.textPrimary,
              border: `1px solid ${theme.borderMuted}`,
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme.borderMuted;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = theme.bgCardHover;
            }}
          >
            ↩↩ Reply All
          </button>

          <button
            onClick={() => console.log("Forward")}
            style={{
              padding: "10px 16px",
              background: theme.bgCardHover,
              color: theme.textPrimary,
              border: `1px solid ${theme.borderMuted}`,
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme.borderMuted;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = theme.bgCardHover;
            }}
          >
            ↗ Forward
          </button>
        </div>
      )}

      {/* Reply Compose Box */}
      {showReplyBox && (
        <div
          style={{
            animation: "fadeIn 0.2s ease",
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: theme.textMuted,
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              fontWeight: 600,
            }}
          >
            Reply to {email.from}
          </div>

          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type your reply..."
            autoFocus
            style={{
              width: "100%",
              minHeight: 120,
              background: theme.bg,
              border: `1px solid ${theme.borderMuted}`,
              borderRadius: 8,
              padding: "12px",
              fontSize: 12,
              color: theme.textPrimary,
              lineHeight: 1.5,
              resize: "vertical",
              fontFamily: "inherit",
              outline: "none",
              marginBottom: 10,
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
              onClick={handleSend}
              disabled={!replyText.trim()}
              style={{
                flex: 1,
                padding: "10px 16px",
                background: replyText.trim() ? theme.accent : theme.borderMuted,
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: replyText.trim() ? "pointer" : "not-allowed",
                opacity: replyText.trim() ? 1 : 0.5,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                if (replyText.trim()) {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = `0 4px 12px ${theme.accent}40`;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Send
            </button>

            <button
              onClick={() => setShowReplyBox(false)}
              style={{
                padding: "10px 16px",
                background: theme.bgCardHover,
                color: theme.textMuted,
                border: `1px solid ${theme.borderMuted}`,
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.borderMuted;
                e.currentTarget.style.color = theme.textPrimary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = theme.bgCardHover;
                e.currentTarget.style.color = theme.textMuted;
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
