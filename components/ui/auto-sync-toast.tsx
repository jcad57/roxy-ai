/**
 * Auto-Sync Toast Component
 * Shows a brief notification when background sync completes with new emails
 */

'use client'

import { useEffect, useState } from 'react'
import { useTheme } from '@/lib/providers/theme-provider'
import { useEmailSync } from '@/lib/hooks/use-email-sync'

export function AutoSyncToast() {
  const { theme } = useTheme()
  const { lastSyncResult, isSyncingBackground } = useEmailSync()
  const [show, setShow] = useState(false)
  const [newEmailCount, setNewEmailCount] = useState(0)

  useEffect(() => {
    // Show toast when sync completes with new emails
    if (lastSyncResult && !isSyncingBackground && lastSyncResult.newEmails > 0) {
      setNewEmailCount(lastSyncResult.newEmails)
      setShow(true)

      // Auto-hide after 4 seconds
      const timeout = setTimeout(() => {
        setShow(false)
      }, 4000)

      return () => clearTimeout(timeout)
    }
  }, [lastSyncResult, isSyncingBackground])

  if (!show) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        background: theme.bgCard,
        border: `1px solid ${theme.success}`,
        borderRadius: 12,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 9999,
        animation: 'slideInUp 0.3s ease',
      }}
    >
      {/* Success Icon */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: theme.success + '20',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke={theme.success}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>

      {/* Message */}
      <div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: theme.textPrimary,
            marginBottom: 2,
          }}
        >
          New emails synced
        </div>
        <div
          style={{
            fontSize: 11,
            color: theme.textMuted,
          }}
        >
          {newEmailCount} new {newEmailCount === 1 ? 'email' : 'emails'} received
        </div>
      </div>

      {/* Close Button */}
      <button
        onClick={() => setShow(false)}
        style={{
          background: 'transparent',
          border: 'none',
          color: theme.textMuted,
          cursor: 'pointer',
          padding: 4,
          marginLeft: 8,
        }}
        title="Dismiss"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <style jsx global>{`
        @keyframes slideInUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
