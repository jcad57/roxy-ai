/**
 * Quick Reply Bar
 * Single AI-suggested response with action buttons
 */

'use client';

import { useTheme } from '@/lib/providers/theme-provider';
import type { QuickReply } from '@/lib/types/response';

interface QuickReplyBarProps {
  replies: QuickReply[];
  onUseResponse: (text: string) => void;
  onWriteCustom: () => void;
  loading?: boolean;
}

export function QuickReplyBar({ 
  replies, 
  onUseResponse, 
  onWriteCustom, 
  loading = false 
}: QuickReplyBarProps) {
  const { theme } = useTheme();

  if (loading) {
    return (
      <div
        style={{
          position: 'relative',
          padding: '16px',
          background: theme.bgCard,
          borderRadius: 12,
          // marginTop: 16,
          overflow: 'hidden',
        }}
      >
        {/* Rotating rainbow border effect */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 12,
            padding: '2px',
            background: 'linear-gradient(90deg, #ef4444, #f59e0b, #eab308, #22c55e, #3b82f6, #a855f7, #ef4444)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s linear infinite',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            pointerEvents: 'none',
          }}
        />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div
            style={{
              fontSize: 10,
              color: theme.accentLight,
              textTransform: 'uppercase',
              letterSpacing: 1.2,
              fontWeight: 700,
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
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
            GENERATING AI RESPONSE...
          </div>
          
          {/* Placeholder text with shimmer effect */}
          <div
            style={{
              fontSize: 13,
              color: theme.textDim,
              lineHeight: 1.6,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                height: '18px',
                background: `linear-gradient(90deg, ${theme.borderMuted} 25%, ${theme.accentDim} 50%, ${theme.borderMuted} 75%)`,
                backgroundSize: '200% 100%',
                borderRadius: 4,
                marginBottom: 8,
                animation: 'shimmer 1.5s ease-in-out infinite',
              }}
            />
            <div
              style={{
                height: '18px',
                background: `linear-gradient(90deg, ${theme.borderMuted} 25%, ${theme.accentDim} 50%, ${theme.borderMuted} 75%)`,
                backgroundSize: '200% 100%',
                borderRadius: 4,
                marginBottom: 8,
                animation: 'shimmer 1.5s ease-in-out infinite',
                animationDelay: '0.1s',
              }}
            />
            <div
              style={{
                height: '18px',
                width: '80%',
                background: `linear-gradient(90deg, ${theme.borderMuted} 25%, ${theme.accentDim} 50%, ${theme.borderMuted} 75%)`,
                backgroundSize: '200% 100%',
                borderRadius: 4,
                animation: 'shimmer 1.5s ease-in-out infinite',
                animationDelay: '0.2s',
              }}
            />
          </div>

          {/* Disabled button placeholders to maintain layout */}
          <div style={{ display: 'flex', gap: 8 }}>
            <div
              style={{
                background: theme.borderMuted,
                borderRadius: 8,
                padding: '8px 14px',
                fontSize: 11,
                opacity: 0.5,
                height: '32px',
                width: '140px',
              }}
            />
            <div
              style={{
                background: theme.borderMuted,
                borderRadius: 8,
                padding: '8px 14px',
                fontSize: 11,
                opacity: 0.5,
                height: '32px',
                width: '170px',
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (replies.length === 0) return null;

  const reply = replies[0]; // Get the single suggested response

  return (
    <div
      style={{
        padding: '16px',
        background: theme.bgCard,
        border: `1px solid ${theme.borderMuted}`,
        borderRadius: 12,
        // marginTop: 16,
      }}
    >
      {/* Header */}
      <div
        style={{
          fontSize: 10,
          color: theme.accentLight,
          textTransform: 'uppercase',
          letterSpacing: 1.2,
          fontWeight: 700,
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span>{reply.icon}</span> AI SUGGESTED RESPONSE
      </div>

      {/* Response Text (plain text, no background) */}
      <div
        style={{
          fontSize: 13,
          color: theme.textPrimary,
          lineHeight: 1.6,
          marginBottom: 16,
        }}
      >
        {reply.text}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => onUseResponse(reply.text)}
          style={{
            background: theme.accentDimBorder,
            color: theme.accentLight,
            border: 'none',
            borderRadius: 8,
            padding: '8px 14px',
            fontSize: 11,
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = theme.accent;
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = theme.accentDimBorder;
            e.currentTarget.style.color = theme.accentLight;
          }}
        >
          Use AI Response
        </button>
        <button
          onClick={onWriteCustom}
          style={{
            background: 'transparent',
            color: theme.textMuted,
            border: `1px solid ${theme.borderMuted}`,
            borderRadius: 8,
            padding: '8px 14px',
            fontSize: 11,
            cursor: 'pointer',
            fontWeight: 500,
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = theme.accentDimBorder;
            e.currentTarget.style.color = theme.textPrimary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = theme.borderMuted;
            e.currentTarget.style.color = theme.textMuted;
          }}
        >
          Write Custom Response
        </button>
      </div>
    </div>
  );
}
