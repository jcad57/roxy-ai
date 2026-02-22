/**
 * Email Verification Pending Page
 * Shows after sign-up, instructs user to check their email
 */

'use client';

import { useSearchParams } from 'next/navigation';
import { useTheme } from '@/lib/providers/theme-provider';
import { Suspense } from 'react';

function VerifyEmailContent() {
  const { theme } = useTheme();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || 'your email';

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
          width: '100%',
          maxWidth: 480,
          padding: 48,
          background: theme.bgCard,
          borderRadius: 16,
          border: `1px solid ${theme.borderMuted}`,
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
          textAlign: 'center',
        }}
      >
        {/* Email Icon */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: `${theme.accent}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.accent}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: theme.textPrimary,
            marginBottom: 12,
          }}
        >
          Check Your Email
        </h1>

        {/* Description */}
        <p
          style={{
            fontSize: 15,
            color: theme.textSecondary,
            lineHeight: 1.6,
            marginBottom: 24,
          }}
        >
          We've sent a confirmation link to
        </p>

        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: theme.accent,
            marginBottom: 32,
            padding: '12px 20px',
            background: `${theme.accent}10`,
            borderRadius: 8,
            border: `1px solid ${theme.accent}30`,
          }}
        >
          {email}
        </div>

        {/* Instructions */}
        <div
          style={{
            textAlign: 'left',
            fontSize: 14,
            color: theme.textMuted,
            lineHeight: 1.8,
            marginBottom: 32,
            padding: 20,
            background: theme.bg,
            borderRadius: 8,
          }}
        >
          <strong style={{ color: theme.textPrimary }}>Next steps:</strong>
          <ol style={{ margin: '12px 0 0 20px', padding: 0 }}>
            <li style={{ marginBottom: 8 }}>Open your email inbox</li>
            <li style={{ marginBottom: 8 }}>
              Click the confirmation link in the email from Roxy AI
            </li>
            <li style={{ marginBottom: 8 }}>
              You'll be redirected to connect your Outlook account
            </li>
          </ol>
        </div>

        {/* Help Text */}
        <p
          style={{
            fontSize: 12,
            color: theme.textMuted,
            lineHeight: 1.6,
          }}
        >
          Didn't receive the email? Check your spam folder or{' '}
          <a
            href="/auth/sign-in"
            style={{
              color: theme.accent,
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            try signing up again
          </a>
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
