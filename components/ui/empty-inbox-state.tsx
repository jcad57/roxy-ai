/**
 * Empty Inbox State
 * Displayed when no emails are available
 */

'use client'

import { useTheme } from '@/lib/providers/theme-provider'
import { useEmailSync } from '@/lib/hooks/use-email-sync'

export function EmptyInboxState() {
  const { theme } = useTheme()
  const { sync, isSyncing } = useEmailSync()

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 60,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: `${theme.accent}10`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
        }}
      >
        <span style={{ fontSize: 40 }}>📭</span>
      </div>

      <h3
        style={{
          color: theme.textPrimary,
          fontSize: 20,
          fontWeight: 600,
          marginBottom: 12,
        }}
      >
        No Emails Yet
      </h3>

      <p
        style={{
          color: theme.textSecondary,
          fontSize: 16,
          marginBottom: 24,
          maxWidth: 400,
        }}
      >
        Your emails will appear here once they&apos;re fetched from Outlook.
        Try refreshing to sync your emails.
      </p>

      <button
        onClick={() => sync()}
        disabled={isSyncing}
        style={{
          background: theme.accent,
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '12px 24px',
          fontSize: 16,
          fontWeight: 500,
          cursor: isSyncing ? 'not-allowed' : 'pointer',
          opacity: isSyncing ? 0.6 : 1,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {isSyncing ? (
          <>
            <div
              style={{
                width: 16,
                height: 16,
                border: '2px solid #ffffff40',
                borderTop: '2px solid #ffffff',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
            Syncing...
          </>
        ) : (
          <>
            <span>🔄</span>
            Refresh Emails
          </>
        )}
      </button>

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
    </div>
  )
}
