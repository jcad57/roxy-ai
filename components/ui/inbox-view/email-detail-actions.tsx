"use client";

/**
 * Email Detail Actions Component
 * Action buttons for selected email (Reply, Forward, Archive, Delete)
 */

import { useTheme } from "@/lib/providers/theme-provider";

interface EmailDetailActionsProps {
  onReplyClick: () => void;
  onForwardClick: () => void;
  onArchiveClick: () => void;
  onDeleteClick: () => void;
  showResponsePanel: boolean;
  onResponsePanelToggle: (show: boolean) => void;
}

export function EmailDetailActions({
  onReplyClick,
  onForwardClick,
  onArchiveClick,
  onDeleteClick,
  showResponsePanel,
  onResponsePanelToggle,
}: EmailDetailActionsProps) {
  const { theme } = useTheme();

  const actions = [
    { label: "Reply", onClick: onReplyClick },
    { label: "Forward", onClick: onForwardClick },
    { label: "Archive", onClick: onArchiveClick },
    { label: "Delete", onClick: onDeleteClick },
  ];

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={action.onClick}
          style={{
            padding: "8px 14px",
            background: theme.bg,
            border: `1px solid ${theme.borderMuted}`,
            borderRadius: 7,
            fontSize: 11,
            fontWeight: 600,
            color: theme.textMuted,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = theme.accent;
            e.currentTarget.style.color = theme.accentLight;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = theme.borderMuted;
            e.currentTarget.style.color = theme.textMuted;
          }}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
