"use client";

/**
 * Email List Item Component
 * Individual email item in the inbox list
 */

import { useTheme } from "@/lib/providers/theme-provider";
import { useInboxStore } from "@/lib/stores/inbox-store";
import { getPriorityColor } from "@/lib/utils/inbox-view-helpers";
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

  const isSelected = selectedEmail?.id === email.id;
  const priorityColor = getPriorityColor(email.priority);

  return (
    <div
      onClick={() => toggleEmailSelection(email)}
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
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                fontSize: 10,
                color: theme.textDim,
                flexShrink: 0,
                marginLeft: 8,
              }}
            >
              {email.time}
            </span>
            <p
              style={{
                backgroundColor: priorityColor,
                width: 6,
                height: 6,
                borderRadius: "50%",
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
