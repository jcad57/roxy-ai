/**
 * Suggest Response Button
 * Trigger AI response generation
 */

'use client';

import { useTheme } from '@/lib/providers/theme-provider';

interface SuggestResponseButtonProps {
  onClick: () => void;
  generating?: boolean;
  priority: number;
}

export function SuggestResponseButton({
  onClick,
  generating = false,
  priority,
}: SuggestResponseButtonProps) {
  const { theme } = useTheme();

  const shouldHighlight = priority >= 85;

  return (
    <button
      onClick={onClick}
      disabled={generating}
      style={{
        background: shouldHighlight ? theme.accentDim : theme.bg,
        border: `1px solid ${shouldHighlight ? theme.accent : theme.borderMuted}`,
        borderRadius: 8,
        padding: '10px 16px',
        fontSize: 13,
        color: shouldHighlight ? theme.accentLight : theme.textPrimary,
        cursor: generating ? 'not-allowed' : 'pointer',
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        transition: 'all 0.2s',
        opacity: generating ? 0.6 : 1,
      }}
      onMouseEnter={(e) => {
        if (!generating) {
          e.currentTarget.style.background = theme.accentDim;
          e.currentTarget.style.borderColor = theme.accent;
        }
      }}
      onMouseLeave={(e) => {
        if (!generating) {
          e.currentTarget.style.background = shouldHighlight ? theme.accentDim : theme.bg;
          e.currentTarget.style.borderColor = shouldHighlight ? theme.accent : theme.borderMuted;
        }
      }}
    >
      {generating ? (
        <>
          <div
            style={{
              width: 14,
              height: 14,
              border: `2px solid ${theme.accent}`,
              borderTop: '2px solid transparent',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <span>Generating...</span>
        </>
      ) : (
        <>
          <span>✨</span>
          <span>Suggest Response</span>
          {shouldHighlight && (
            <span
              style={{
                background: theme.accent,
                color: '#fff',
                fontSize: 9,
                padding: '2px 4px',
                borderRadius: 4,
                fontWeight: 600,
              }}
            >
              HIGH PRIORITY
            </span>
          )}
        </>
      )}
    </button>
  );
}
