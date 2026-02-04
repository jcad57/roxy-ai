/**
 * AI Insight Badge Component
 * Shows AI-extracted insights on emails
 */

'use client';

import { useTheme } from '@/lib/providers/theme-provider';

interface AIInsightBadgeProps {
  priority: number;
  actionItemsCount?: number;
  keyDatesCount?: number;
  needsReply?: boolean;
  compact?: boolean;
}

export function AIInsightBadge({
  priority,
  actionItemsCount = 0,
  keyDatesCount = 0,
  needsReply = false,
  compact = false,
}: AIInsightBadgeProps) {
  const { theme } = useTheme();

  const getPriorityColor = (p: number) => {
    if (p >= 90) return '#f43f5e'; // red
    if (p >= 70) return '#f59e0b'; // orange
    if (p >= 40) return '#3b82f6'; // blue
    return '#64748b'; // gray
  };

  const priorityColor = getPriorityColor(priority);

  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: priorityColor,
          }}
        />
        <span style={{ fontSize: 10, color: theme.textDim }}>{priority}</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      {/* Priority */}
      <div
        style={{
          background: `${priorityColor}15`,
          border: `1px solid ${priorityColor}40`,
          borderRadius: 6,
          padding: '2px 6px',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <div style={{ width: 4, height: 4, borderRadius: '50%', background: priorityColor }} />
        <span style={{ fontSize: 10, fontWeight: 600, color: priorityColor }}>{priority}</span>
      </div>

      {/* Action items */}
      {actionItemsCount > 0 && (
        <div
          style={{
            background: theme.accentDim,
            borderRadius: 6,
            padding: '2px 6px',
            fontSize: 10,
            color: theme.accentLight,
          }}
        >
          ✓ {actionItemsCount}
        </div>
      )}

      {/* Key dates */}
      {keyDatesCount > 0 && (
        <div
          style={{
            background: theme.accentDim,
            borderRadius: 6,
            padding: '2px 6px',
            fontSize: 10,
            color: theme.accentLight,
          }}
        >
          📅 {keyDatesCount}
        </div>
      )}

      {/* Needs reply */}
      {needsReply && (
        <div
          style={{
            background: `${priorityColor}15`,
            borderRadius: 6,
            padding: '2px 6px',
            fontSize: 10,
            color: priorityColor,
          }}
        >
          ↩
        </div>
      )}
    </div>
  );
}
