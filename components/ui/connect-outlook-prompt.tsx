/**
 * Connect Outlook Prompt
 * Displayed in dashboard when user hasn't connected Outlook
 */

'use client'

import { useRouter } from 'next/navigation'
import { useTheme } from '@/lib/providers/theme-provider'

export function ConnectOutlookPrompt() {
  const { theme } = useTheme()
  const router = useRouter()

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.bg,
        padding: 20,
      }}
    >
      <div
        style={{
          maxWidth: 600,
          width: '100%',
          background: theme.bgCard,
          borderRadius: 16,
          padding: 48,
          textAlign: 'center',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 100,
            height: 100,
            background: `${theme.accent}10`,
            borderRadius: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 32px',
          }}
        >
          <span style={{ fontSize: 56 }}>📧</span>
        </div>

        {/* Heading */}
        <h1
          style={{
            color: theme.textPrimary,
            fontSize: 32,
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          Connect Your Email
        </h1>

        <p
          style={{
            color: theme.textSecondary,
            fontSize: 18,
            lineHeight: 1.6,
            marginBottom: 32,
          }}
        >
          To get started with RoxyAI, connect your Outlook account.
          <br />
          We&apos;ll help you organize and manage your emails with AI-powered tools.
        </p>

        {/* Features */}
        <div
          style={{
            background: theme.bg,
            borderRadius: 12,
            padding: 24,
            marginBottom: 32,
            textAlign: 'left',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 16,
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: 24, flexShrink: 0 }}>🤖</span>
            <div>
              <div
                style={{
                  color: theme.textPrimary,
                  fontWeight: 500,
                  marginBottom: 4,
                }}
              >
                AI-Powered Analysis
              </div>
              <div style={{ color: theme.textSecondary, fontSize: 14 }}>
                Automatically prioritize, categorize, and extract insights from your emails
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 16,
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: 24, flexShrink: 0 }}>📊</span>
            <div>
              <div
                style={{
                  color: theme.textPrimary,
                  fontWeight: 500,
                  marginBottom: 4,
                }}
              >
                Multiple Views
              </div>
              <div style={{ color: theme.textSecondary, fontSize: 14 }}>
                Switch between Inbox, Priority, Kanban, Calendar, and Spatial layouts
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 16,
            }}
          >
            <span style={{ fontSize: 24, flexShrink: 0 }}>🔒</span>
            <div>
              <div
                style={{
                  color: theme.textPrimary,
                  fontWeight: 500,
                  marginBottom: 4,
                }}
              >
                Secure & Private
              </div>
              <div style={{ color: theme.textSecondary, fontSize: 14 }}>
                Your data is encrypted and we never store your email content
              </div>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={() => router.push('/connect-outlook')}
          style={{
            width: '100%',
            background: theme.accent,
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '16px 24px',
            fontSize: 18,
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 24 }}>📧</span>
          Connect Outlook Account
        </button>

        {/* Help Text */}
        <p
          style={{
            color: theme.textSecondary,
            fontSize: 14,
            margin: 0,
          }}
        >
          Takes less than a minute to set up
        </p>
      </div>
    </div>
  )
}
