"use client";

/**
 * Conversation Layout
 * AI-grouped email threads with conversation summaries
 */

import { useState, useMemo } from "react";
import type { Email } from "@/lib/types/email";
import type { LayoutProps } from "@/lib/types/layout";
import { useTheme } from "@/lib/providers/theme-provider";
import { priorityColor } from "@/lib/utils/colors";
import { useResponsive } from "@/lib/hooks/use-responsive";
import { responsivePadding } from "@/lib/utils/responsive-styles";

interface Thread {
  id: string;
  title: string;
  emails: Email[];
  lastTime: string;
  unread: number;
  aiSummary: string;
}

export function ConversationLayout({ emails, selected, onSelect }: LayoutProps & { emails: Email[] }) {
  const { theme } = useTheme();
  const { breakpoint, isMobile } = useResponsive();

  // Group emails by thread dynamically
  const threads: Thread[] = useMemo(() => {
    const threadMap = new Map<number, Email[]>();
    
    emails.forEach(email => {
      if (!threadMap.has(email.thread)) {
        threadMap.set(email.thread, []);
      }
      threadMap.get(email.thread)!.push(email);
    });

    return Array.from(threadMap.entries()).map(([threadId, threadEmails]) => {
      const sortedEmails = threadEmails.sort((a, b) => {
        // Sort by ID (assuming higher ID = more recent)
        return b.id - a.id;
      });
      const latestEmail = sortedEmails[0];
      
      return {
        id: `t${threadId}`,
        title: latestEmail.subject.split('—')[0].trim(),
        emails: sortedEmails,
        lastTime: latestEmail.time,
        unread: sortedEmails.filter(e => !e.read).length,
        aiSummary: `${sortedEmails.length} message${sortedEmails.length > 1 ? 's' : ''} in this conversation. ${latestEmail.preview.substring(0, 120)}...`,
      };
    }).sort((a, b) => {
      // Sort threads by most recent email
      return b.emails[0].id - a.emails[0].id;
    });
  }, [emails]);

  const [activeThread, setActiveThread] = useState<Thread | null>(threads.length > 0 ? threads[0] : null);

  return (
    <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", height: "100%", gap: 0 }}>
      {/* Thread List */}
      <div
        style={{
          width: isMobile ? "100%" : breakpoint === "tablet" ? 260 : 300,
          maxHeight: isMobile && selected ? "35vh" : isMobile ? "40vh" : "none",
          overflowY: "auto",
          borderRight: isMobile ? "none" : `1px solid ${theme.borderMuted}`,
          borderBottom: isMobile ? `1px solid ${theme.borderMuted}` : "none",
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        <div
          style={{
            padding: "12px 14px 8px",
            fontSize: 9.5,
            color: theme.textDim,
            textTransform: "uppercase",
            letterSpacing: 1.5,
            fontWeight: 600,
          }}
        >
          AI-Grouped Conversations
        </div>
        {threads.map((thread, i) => (
          <div
            key={thread.id}
            onClick={() => setActiveThread(thread)}
            style={{
              padding: "12px 14px",
              cursor: "pointer",
              transition: "all 0.15s",
              background: activeThread?.id === thread.id ? theme.accentGlow : "transparent",
              borderRight: activeThread?.id === thread.id ? `2px solid ${theme.accent}` : "2px solid transparent",
              animation: `fadeSlideIn 0.3s ease ${i * 40}ms both`,
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
                  fontSize: 13,
                  fontWeight: 600,
                  color: activeThread?.id === thread.id ? theme.accentLight : theme.textPrimary,
                }}
              >
                {thread.title}
              </span>
              {thread.unread > 0 && (
                <span
                  style={{
                    fontSize: 9,
                    background: theme.accent,
                    color: "#fff",
                    padding: "1px 6px",
                    borderRadius: 10,
                    fontWeight: 700,
                  }}
                >
                  {thread.unread}
                </span>
              )}
            </div>
            <div
              style={{
                fontSize: 11,
                color: theme.textDim,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {thread.aiSummary.slice(0, 60)}...
            </div>
            <div style={{ fontSize: 10, color: theme.textMuted, marginTop: 3 }}>
              {thread.emails.length} email{thread.emails.length > 1 ? "s" : ""} · {thread.lastTime}
            </div>
          </div>
        ))}
      </div>

      {/* Thread Detail */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* AI Summary Banner */}
        <div
          style={{
            background: theme.gradBanner,
            padding: responsivePadding(breakpoint),
            borderBottom: `1px solid ${theme.accentDimBorder}`,
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span
              style={{
                fontSize: 9.5,
                color: theme.accentLight,
                textTransform: "uppercase",
                letterSpacing: 1.5,
                fontWeight: 600,
              }}
            >
              ◎ AI Summary
            </span>
            <span
              style={{
                fontSize: 9,
                background: theme.accentDimBorder,
                color: theme.accentLight,
                padding: "2px 7px",
                borderRadius: 10,
              }}
            >
              {activeThread?.emails.length} emails
            </span>
          </div>
          <div style={{ fontSize: isMobile ? 12 : 13.5, color: theme.textSecondary, lineHeight: 1.5 }}>{activeThread?.aiSummary}</div>
        </div>

        {/* Emails in Thread */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: responsivePadding(breakpoint),
            display: "flex",
            flexDirection: "column",
            gap: isMobile ? 10 : 12,
          }}
        >
          {activeThread?.emails.map((email, i) => (
            <div
              key={email.id}
              onClick={() => onSelect(email)}
              style={{
                background: theme.bgCard,
                borderRadius: 12,
                overflow: "hidden",
                cursor: "pointer",
                transition: "border 0.2s",
                border: selected?.id === email.id ? `1px solid ${theme.accentDimBorder}` : `1px solid ${theme.borderMuted}`,
                animation: `fadeSlideIn 0.35s ease ${i * 80}ms both`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 16px",
                  borderBottom: `1px solid ${theme.borderMuted}`,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: theme.accentDimBorder,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    color: theme.accentLight,
                    fontWeight: 700,
                  }}
                >
                  {email.avatar}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: theme.textPrimary }}>{email.from}</div>
                  <div style={{ fontSize: 10.5, color: theme.textDim }}>{email.subject}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: priorityColor(email.priority),
                    }}
                  />
                  <span style={{ fontSize: 10, color: theme.textDim }}>{email.time}</span>
                </div>
              </div>
              <div style={{ padding: "12px 16px", fontSize: 13, color: theme.textMuted, lineHeight: 1.7 }}>
                {email.preview}
              </div>
            </div>
          ))}
        </div>

        {/* Reply Input */}
        <div
          style={{
            padding: isMobile ? 12 : 16,
            borderTop: `1px solid ${theme.borderMuted}`,
            background: theme.bg,
          }}
        >
          <div
            style={{
              background: theme.bgCard,
              borderRadius: 10,
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              border: `1px solid ${theme.borderMuted}`,
            }}
          >
            <span style={{ fontSize: 12.5, color: theme.textDim }}>Reply to thread...</span>
            <button
              style={{
                background: theme.accentDimBorder,
                color: theme.accentLight,
                border: "none",
                borderRadius: 6,
                padding: "5px 12px",
                fontSize: 11.5,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
