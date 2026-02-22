/**
 * Email Confirmation Handler
 * Processes email verification token from confirmation link
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useTheme } from '@/lib/providers/theme-provider';
import { Suspense } from 'react';

function ConfirmContent() {
  const { theme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        console.log('🔐 Processing email confirmation...');
        
        // Get all URL parameters
        const allParams: { [key: string]: string } = {};
        searchParams.forEach((value, key) => {
          allParams[key] = value;
        });
        console.log('📋 URL Parameters:', allParams);

        // Supabase PKCE flow sends 'code' parameter in confirmation emails
        const code = searchParams.get('code');
        
        // Older flow might send token_hash and type
        const token_hash = searchParams.get('token_hash');
        const type = searchParams.get('type');

        // Method 1: PKCE flow (modern approach)
        if (code) {
          console.log('🔐 Using PKCE code exchange...');
          
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error('❌ Code exchange failed:', error);
            throw error;
          }

          if (data?.session?.user) {
            console.log('✅ Email verified successfully via code exchange!');
            console.log('User ID:', data.session.user.id);
            console.log('Email:', data.session.user.email);
            
            setStatus('success');

            // Wait 2 seconds to show success message, then redirect
            setTimeout(() => {
              router.push('/auth/verified');
            }, 2000);
            return;
          }
        }

        // Method 2: OTP verification (older flow)
        if (token_hash && type) {
          console.log('🔐 Using OTP verification...');
          
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as any,
          });

          if (error) {
            console.error('❌ OTP verification failed:', error);
            throw error;
          }

          if (data?.user) {
            console.log('✅ Email verified successfully via OTP!');
            console.log('User ID:', data.user.id);
            console.log('Email:', data.user.email);
            
            setStatus('success');

            setTimeout(() => {
              router.push('/auth/verified');
            }, 2000);
            return;
          }
        }

        // If we get here, no valid parameters were found
        throw new Error('Missing verification token. Please check the confirmation link or sign up again.');

      } catch (error: any) {
        console.error('❌ Email verification failed:', error);
        setStatus('error');
        setErrorMessage(error.message || 'Verification failed');
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  if (status === 'verifying') {
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
            textAlign: 'center',
            padding: 48,
            background: theme.bgCard,
            borderRadius: 16,
            border: `1px solid ${theme.borderMuted}`,
            maxWidth: 400,
          }}
        >
          {/* Spinner */}
          <div
            style={{
              width: 64,
              height: 64,
              margin: '0 auto 24px',
              border: `4px solid ${theme.borderMuted}`,
              borderTop: `4px solid ${theme.accent}`,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />

          <h2
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: theme.textPrimary,
              marginBottom: 12,
            }}
          >
            Verifying Your Email
          </h2>

          <p
            style={{
              fontSize: 14,
              color: theme.textMuted,
              lineHeight: 1.6,
            }}
          >
            Please wait while we confirm your email address...
          </p>

          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (status === 'success') {
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
            textAlign: 'center',
            padding: 48,
            background: theme.bgCard,
            borderRadius: 16,
            border: `1px solid ${theme.borderMuted}`,
            maxWidth: 400,
          }}
        >
          {/* Success Icon */}
          <div
            style={{
              width: 80,
              height: 80,
              margin: '0 auto 24px',
              borderRadius: '50%',
              background: `${theme.success}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke={theme.success}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h2
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: theme.success,
              marginBottom: 12,
            }}
          >
            Email Verified!
          </h2>

          <p
            style={{
              fontSize: 14,
              color: theme.textMuted,
              lineHeight: 1.6,
            }}
          >
            Redirecting you to set up your Outlook connection...
          </p>
        </div>
      </div>
    );
  }

  // Error state
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
          textAlign: 'center',
          padding: 48,
          background: theme.bgCard,
          borderRadius: 16,
          border: `1px solid ${theme.borderMuted}`,
          maxWidth: 400,
        }}
      >
        {/* Error Icon */}
        <div
          style={{
            width: 80,
            height: 80,
            margin: '0 auto 24px',
            borderRadius: '50%',
            background: `${theme.error}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.error}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h2
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: theme.error,
            marginBottom: 12,
          }}
        >
          Verification Failed
        </h2>

        <p
          style={{
            fontSize: 14,
            color: theme.textMuted,
            lineHeight: 1.6,
            marginBottom: 24,
          }}
        >
          {errorMessage || 'The verification link is invalid or has expired.'}
        </p>

        <a
          href="/auth/sign-in"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            background: theme.accent,
            color: '#fff',
            textDecoration: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Back to Sign In
        </a>
      </div>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ConfirmContent />
    </Suspense>
  );
}
