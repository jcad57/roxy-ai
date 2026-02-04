/**
 * Analyzing Indicator Component
 * Shows AI analysis progress in top-right corner
 */

'use client';

import { useTheme } from '@/lib/providers/theme-provider';

interface AnalyzingIndicatorProps {
  progress: {
    current: number;
    total: number;
    percentage: number;
  };
}

export function AnalyzingIndicator({ progress }: AnalyzingIndicatorProps) {
  const { theme } = useTheme();

  return (
    <div
      style={{
        position: 'fixed',
        top: 80,
        right: 20,
        background: theme.bgCard,
        border: `1px solid ${theme.accentDimBorder}`,
        borderRadius: 12,
        padding: '12px 16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 1000,
        minWidth: 240,
        animation: 'fadeSlideIn 0.3s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div
          style={{
            width: 16,
            height: 16,
            border: `2px solid ${theme.accent}`,
            borderTop: '2px solid transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <span style={{ fontSize: 13, fontWeight: 600, color: theme.textPrimary }}>
          Analyzing Emails
        </span>
      </div>

      <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 8 }}>
        {progress.current} of {progress.total} emails ({progress.percentage}%)
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: '100%',
          height: 4,
          background: theme.bg,
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            background: `linear-gradient(90deg, ${theme.accent}, ${theme.accentLight})`,
            width: `${progress.percentage}%`,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
}
