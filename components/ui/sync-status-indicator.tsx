/**
 * Sync Status Indicator Component
 * Shows last sync time and background sync status
 */

'use client'

import { useTheme } from '@/lib/providers/theme-provider'
import { useEmailSync } from '@/lib/hooks/use-email-sync'
import { useResponsive } from '@/lib/hooks/use-responsive'

export function SyncStatusIndicator() {
  const { theme } = useTheme()
  const { isMobile } = useResponsive()
  const { lastSyncTime, isSyncingBackground, isAutoSyncEnabled } = useEmailSync()

  // Format last sync time
  const formatSyncTime = (date: Date | null): string => {
    if (!date) return 'Never'

    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)

    if (seconds < 10) return 'Just now'
    if (seconds < 60) return `${seconds}s ago`
    if (minutes < 60) return `${minutes}m ago`
    
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  if (!isAutoSyncEnabled) {
    return null // Don't show if auto-sync is disabled
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: isMobile ? 10 : 11,
        color: theme.textMuted,
        padding: isMobile ? '4px 8px' : '4px 10px',
        background: isSyncingBackground ? theme.accentDimBorder : theme.bg,
        borderRadius: 6,
        border: `1px solid ${isSyncingBackground ? theme.accent : theme.borderMuted}`,
        transition: 'all 0.3s ease',
      }}
      title={lastSyncTime ? `Last synced: ${lastSyncTime.toLocaleString()}` : 'Auto-sync enabled'}
    >
      {/* Sync Indicator Dot */}
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: isSyncingBackground ? theme.accent : theme.success,
          animation: isSyncingBackground ? 'pulse 1.5s ease-in-out infinite' : 'none',
        }}
      />

      {/* Status Text */}
      {!isMobile && (
        <span style={{ fontWeight: 500 }}>
          {isSyncingBackground ? 'Syncing...' : `Last sync: ${formatSyncTime(lastSyncTime)}`}
        </span>
      )}

      {/* Pulse animation */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  )
}
