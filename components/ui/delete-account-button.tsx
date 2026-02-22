/**
 * Delete Account Button Component
 * Dev tool for complete account and data deletion (testing purposes)
 */

'use client'

import { useState } from 'react'
import { useTheme } from '@/lib/providers/theme-provider'
import { useAccountDeletion } from '@/lib/hooks/use-account-deletion'

export function DeleteAccountButton() {
  const { theme } = useTheme()
  const { deleteAccount, isDeleting } = useAccountDeletion()
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = () => {
    setShowConfirm(false)
    deleteAccount()
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={isDeleting}
        style={{
          background: 'transparent',
          border: `1px solid ${theme.error}`,
          borderRadius: 6,
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: isDeleting ? 'not-allowed' : 'pointer',
          color: theme.error,
          fontSize: 14,
          fontWeight: 500,
          opacity: isDeleting ? 0.6 : 1,
          transition: 'all 0.2s',
        }}
        title="Delete account and all data (testing tool)"
      >
        {/* Trash Icon */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>

        {isDeleting ? 'Deleting...' : 'Delete Account'}
      </button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}
          onClick={() => setShowConfirm(false)}
        >
          <div
            style={{
              background: theme.bgCard,
              borderRadius: 16,
              padding: 24,
              maxWidth: 450,
              border: `1px solid ${theme.borderMuted}`,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Warning Icon */}
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: theme.error + '20',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke={theme.error}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>

            <h3
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: theme.textPrimary,
                marginBottom: 8,
                textAlign: 'center',
              }}
            >
              Delete Account & All Data?
            </h3>

            <p
              style={{
                fontSize: 13,
                color: theme.textSecondary,
                lineHeight: 1.6,
                marginBottom: 20,
                textAlign: 'center',
              }}
            >
              This will permanently delete:
            </p>

            <ul
              style={{
                fontSize: 12,
                color: theme.textMuted,
                lineHeight: 1.8,
                marginBottom: 24,
                paddingLeft: 24,
              }}
            >
              <li>Your user account</li>
              <li>All email metadata (100+ emails)</li>
              <li>All AI enrichments</li>
              <li>Outlook connection</li>
              <li>MSAL cached tokens</li>
              <li>Local storage data</li>
              <li>Session data</li>
            </ul>

            <div
              style={{
                fontSize: 11,
                color: theme.warning,
                background: theme.warning + '10',
                padding: 12,
                borderRadius: 8,
                marginBottom: 20,
                border: `1px solid ${theme.warning}30`,
              }}
            >
              ⚠️ <strong>This action cannot be undone.</strong> You'll need to sign up again to use the app.
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  flex: 1,
                  background: theme.bg,
                  border: `1px solid ${theme.borderMuted}`,
                  borderRadius: 8,
                  padding: '10px 16px',
                  color: theme.textPrimary,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                style={{
                  flex: 1,
                  background: theme.error,
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 16px',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isDeleting ? 0.6 : 1,
                }}
              >
                {isDeleting ? 'Deleting...' : 'Delete Everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
