/**
 * Email Verified Success Page
 * Shows after successful email verification, prompts to connect Outlook
 */

'use client';

import { useTheme } from '@/lib/providers/theme-provider';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/providers/auth-provider';
import { useEffect, useState } from 'react';

function VerifiedContent() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait for auth to load
    if (!loading) {
      if (!user) {
        // Not authenticated - redirect to sign in
        router.push('/auth/sign-in');
      } else {
        setIsReady(true);
      }
    }
  }, [user, loading, router]);

  const handleConnectOutlook = () => {
    router.push('/connect-outlook');
  };

  if (loading || !isReady) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: theme.bg,
        }}
      >
        <div style={{ color: theme.textMuted }}>Loading...</div>
      </div>
    );
  }

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
          maxWidth: 520,
          padding: 48,
          background: theme.bgCard,
          borderRadius: 16,
          border: `1px solid ${theme.borderMuted}`,
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
          textAlign: 'center',
        }}
      >
        {/* Success Checkmark */}
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: '50%',
            background: `${theme.success}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 32px',
          }}
        >
          <svg
            width="56"
            height="56"
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.success}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: 32,
            fontWeight: 800,
            color: theme.textPrimary,
            marginBottom: 16,
          }}
        >
          Email Verified!
        </h1>

        {/* Description */}
        <p
          style={{
            fontSize: 15,
            color: theme.textSecondary,
            lineHeight: 1.6,
            marginBottom: 32,
          }}
        >
          Your account has been successfully verified. Now let's connect your Outlook account to start managing your emails with AI-powered insights.
        </p>

        {/* Connect Outlook Button */}
        <button
          onClick={handleConnectOutlook}
          style={{
            width: '100%',
            padding: '16px 24px',
            fontSize: 16,
            fontWeight: 600,
            color: '#ffffff',
            background: theme.accent,
            border: 'none',
            borderRadius: 12,
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = `0 8px 24px ${theme.accent}40`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {/* Microsoft Icon */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 23 23"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M0 0h11v11H0z" fill="#f25022" />
            <path d="M12 0h11v11H12z" fill="#7fba00" />
            <path d="M0 12h11v11H0z" fill="#00a4ef" />
            <path d="M12 12h11v11H12z" fill="#ffb900" />
          </svg>
          Connect Outlook Account
        </button>

        {/* Info Box */}
        <div
          style={{
            marginTop: 32,
            padding: 20,
            background: `${theme.accent}10`,
            border: `1px solid ${theme.accent}30`,
            borderRadius: 12,
            textAlign: 'left',
            fontSize: 13,
            color: theme.textMuted,
            lineHeight: 1.7,
          }}
        >
          <strong style={{ color: theme.textPrimary, display: 'block', marginBottom: 8 }}>
            What happens next:
          </strong>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li style={{ marginBottom: 6 }}>
              You'll be prompted to sign in with Microsoft
            </li>
            <li style={{ marginBottom: 6 }}>
              Grant permission for Roxy AI to read your emails
            </li>
            <li style={{ marginBottom: 6 }}>
              We'll fetch your latest 100 emails
            </li>
            <li>
              AI will analyze and categorize them automatically
            </li>
          </ul>
        </div>

        {/* Skip Link (for testing) */}
        <div style={{ marginTop: 24 }}>
          <a
            href="/"
            style={{
              fontSize: 12,
              color: theme.textMuted,
              textDecoration: 'none',
            }}
          >
            Skip for now
          </a>
        </div>
      </div>
    </div>
  );
}

export default function VerifiedPage() {
  return (
    <VerifiedContent />
  );
}
