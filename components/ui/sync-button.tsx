/**
 * Sync Button Component
 * Manual email refresh button for navbar
 */

'use client'

import { useEmailSync } from '@/lib/hooks/use-email-sync'
import { useTheme } from '@/lib/providers/theme-provider'

export function SyncButton() {
  const { theme } = useTheme()
  const { sync, isSyncing, syncError, lastSyncResult } = useEmailSync()

  const handleSync = () => {
    if (!isSyncing) {
      sync()
    }
  }

  return (
    <button
      onClick={handleSync}
      disabled={isSyncing}
      style={{
        background: isSyncing ? theme.bgCard : 'transparent',
        border: `1px solid ${theme.borderMuted}`,
        borderRadius: 6,
        padding: '6px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        cursor: isSyncing ? 'not-allowed' : 'pointer',
        color: theme.textPrimary,
        fontSize: 14,
        fontWeight: 500,
        opacity: isSyncing ? 0.6 : 1,
        transition: 'all 0.2s',
      }}
      title={isSyncing ? 'Syncing...' : 'Refresh emails'}
    >
      {/* Sync Icon */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          animation: isSyncing ? 'spin 1s linear infinite' : 'none',
        }}
      >
        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
      </svg>

      {isSyncing ? 'Syncing...' : 'Refresh'}

      {/* Success indicator */}
      {lastSyncResult && !isSyncing && lastSyncResult.newEmails > 0 && (
        <span
          style={{
            background: theme.success,
            color: '#fff',
            borderRadius: 10,
            padding: '2px 6px',
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          +{lastSyncResult.newEmails}
        </span>
      )}

      {/* Error indicator */}
      {syncError && !isSyncing && (
        <span
          style={{
            color: theme.error,
            fontSize: 12,
          }}
        >
          ⚠
        </span>
      )}

      <style jsx global>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </button>
  )
}
