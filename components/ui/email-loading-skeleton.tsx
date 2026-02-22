/**
 * Email Loading Skeleton
 * Displays animated loading state while emails are being fetched
 */

'use client'

import { useTheme } from '@/lib/providers/theme-provider'

interface EmailLoadingSkeletonProps {
  count?: number
  fullPage?: boolean
}

export function EmailLoadingSkeleton({ count = 5, fullPage = false }: EmailLoadingSkeletonProps) {
  const { theme } = useTheme()

  if (fullPage) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: theme.bg,
          padding: 40,
        }}
      >
        <div
          style={{
            width: 60,
            height: 60,
            border: `4px solid ${theme.borderMuted}`,
            borderTop: `4px solid ${theme.accent}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: 24,
          }}
        />
        <h2
          style={{
            color: theme.textPrimary,
            fontSize: 24,
            fontWeight: 600,
            marginBottom: 12,
          }}
        >
          Loading your emails...
        </h2>
        <p
          style={{
            color: theme.textSecondary,
            fontSize: 16,
          }}
        >
          This may take a moment for the first sync
        </p>

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

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: 16,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            background: theme.bgCard,
            borderRadius: 12,
            padding: 16,
            border: `1px solid ${theme.borderMuted}`,
          }}
        >
          {/* Avatar + Header */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: `${theme.accent}20`,
                animation: 'pulse 2s ease-in-out infinite',
              }}
            />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  height: 12,
                  background: `${theme.accent}20`,
                  borderRadius: 6,
                  width: '40%',
                  marginBottom: 8,
                  animation: 'pulse 2s ease-in-out infinite',
                }}
              />
              <div
                style={{
                  height: 10,
                  background: `${theme.accent}20`,
                  borderRadius: 6,
                  width: '60%',
                  animation: 'pulse 2s ease-in-out infinite',
                  animationDelay: '0.2s',
                }}
              />
            </div>
          </div>

          {/* Content Lines */}
          <div
            style={{
              height: 8,
              background: `${theme.accent}20`,
              borderRadius: 6,
              width: '100%',
              marginBottom: 6,
              animation: 'pulse 2s ease-in-out infinite',
              animationDelay: '0.4s',
            }}
          />
          <div
            style={{
              height: 8,
              background: `${theme.accent}20`,
              borderRadius: 6,
              width: '80%',
              animation: 'pulse 2s ease-in-out infinite',
              animationDelay: '0.6s',
            }}
          />
        </div>
      ))}

      <style jsx global>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  )
}
