"use client";

/**
 * Reply Compose Box Component
 * Textarea and buttons for composing email replies
 */

import { useTheme } from "@/lib/providers/theme-provider";
import { usePriorityStore } from "@/lib/stores/priority-store";

interface ReplyComposeBoxProps {
  recipientName: string;
}

export function ReplyComposeBox({ recipientName }: ReplyComposeBoxProps) {
  const { theme } = useTheme();
  const {
    replyText,
    setReplyText,
    setShowReplyBox,
  } = usePriorityStore();

  return (
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
          ✉ REPLY TO {recipientName}
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
  );
}
