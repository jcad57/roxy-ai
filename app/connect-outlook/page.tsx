/**
 * Connect Outlook Page
 * Allow users to connect their Outlook account via MSAL OAuth
 */

'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/providers/auth-provider'
import { useOutlookAuth } from '@/lib/providers/outlook-auth-provider'
import { useOutlookConnection } from '@/lib/hooks/use-outlook-connection'
import { useTheme } from '@/lib/providers/theme-provider'

export default function ConnectOutlookPage() {
  const { theme } = useTheme()
  const { user, loading: isLoadingAuth } = useAuth()
  const router = useRouter()

  const {
    isAuthenticated: isOutlookAuthenticated,
    login,
    logout,
    error: outlookAuthError,
    loading: isLoadingOutlook,
    user: outlookUser,
    getAccessToken,
  } = useOutlookAuth()

  const {
    connection,
    isConnected,
    saveConnection,
    isLoadingConnection,
    refreshConnection,
  } = useOutlookConnection()

  const [step, setStep] = useState<
    'connect' | 'saving' | 'fetching' | 'analyzing' | 'prefetching' | 'complete'
  >('connect')
  const [error, setError] = useState<string | null>(null)
  const [setupProgress, setSetupProgress] = useState({
    emailsFetched: 0,
    analyzed: 0,
    prefetched: 0,
  })
  const hasProcessedConnectionRef = useRef(false) // Prevent duplicate processing
  const isFirstTimeSetup = useRef(true) // Track if this is first-time setup vs reconnecting

  // Redirect to sign-in if not authenticated with Supabase
  useEffect(() => {
    if (!isLoadingAuth && !user) {
      router.push('/auth/sign-in')
    }
  }, [user, isLoadingAuth, router])

  // Handle post-Outlook authentication
  useEffect(() => {
    async function handleOutlookConnected() {
      // Guard against duplicate execution
      if (hasProcessedConnectionRef.current) {
        console.log('⚠️ Connection already processed, skipping...')
        return
      }

      if (!isOutlookAuthenticated || !outlookUser || !user) return
      
      // If already connected and NOT first-time setup, redirect immediately
      if (isConnected && !isFirstTimeSetup.current) {
        console.log('✅ Outlook already connected (reconnect), redirecting to dashboard')
        router.push('/')
        return
      }

      // Set guard before starting async work
      hasProcessedConnectionRef.current = true

      try {
        setStep('saving')
        setError(null)

        // Fetch Outlook profile to get email details
        const token = await getAccessToken()
        if (!token) {
          throw new Error('Failed to get access token')
        }

        const response = await fetch('https://graph.microsoft.com/v1.0/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch profile: ${response.status}`)
        }

        const profile = await response.json()
        console.log('📧 Outlook profile fetched:', profile)

        // Save connection to Supabase
        await saveConnection.mutateAsync(profile)
        
        // Manually refresh connection state after save
        refreshConnection()

        // ===== PHASE 1: FETCH EMAILS =====
        setStep('fetching')
        console.log('📬 [Phase 1/3] Starting initial email fetch...')
        
        const fetchResponse = await fetch('/api/emails/fetch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accessToken: token,
            initialSync: true,
          }),
        })

        if (!fetchResponse.ok) {
          throw new Error('Failed to fetch emails from Outlook')
        }

        const fetchData = await fetchResponse.json()
        console.log('✅ Initial email fetch completed:', fetchData)
        setSetupProgress(prev => ({ ...prev, emailsFetched: fetchData.emailsFetched || 0 }))

        // ===== PHASE 2: AI ENRICHMENT =====
        setStep('analyzing')
        console.log('🤖 [Phase 2/3] Starting AI enrichment...')
        
        const analyzeResponse = await fetch('/api/emails/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ batchSize: 100 }), // Analyze all fetched emails
        })

        if (!analyzeResponse.ok) {
          throw new Error('Failed to analyze emails with AI')
        }

        const analyzeData = await analyzeResponse.json()
        console.log('✅ AI enrichment completed:', analyzeData)
        setSetupProgress(prev => ({ ...prev, analyzed: analyzeData.analyzed || 0 }))

        // ===== PHASE 3: PREFETCH EMAIL BODIES =====
        setStep('prefetching')
        console.log('⚡ [Phase 3/3] Prefetching email bodies...')
        
        // Wait 2 seconds for metadata to be available in React Query cache
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Fetch email metadata to get message IDs
        const metadataResponse = await fetch('/api/emails/metadata', {
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        if (metadataResponse.ok) {
          const { emails } = await metadataResponse.json()
          const top20 = emails.slice(0, 20)
          
          console.log(`📥 Prefetching top ${top20.length} email bodies...`)
          
          let prefetched = 0
          const prefetchPromises = top20.map(async (email: any) => {
            if (!email.outlook_message_id) return
            
            try {
              const contentResponse = await fetch(
                `/api/emails/content/${email.outlook_message_id}`,
                {
                  headers: {
                    'X-Outlook-Access-Token': token,
                  },
                }
              )
              
              if (contentResponse.ok) {
                prefetched++
                setSetupProgress(prev => ({ ...prev, prefetched }))
                console.log(`  ✓ Prefetched ${prefetched}/${top20.length}`)
              }
            } catch (err) {
              console.warn(`⚠️ Failed to prefetch ${email.outlook_message_id}`)
            }
          })
          
          // Wait for all prefetch requests (5 concurrent max via API)
          await Promise.allSettled(prefetchPromises)
          console.log(`✅ Prefetch complete: ${prefetched}/${top20.length} emails cached`)
        }

        // ===== SETUP COMPLETE =====
        setStep('complete')
        console.log('🎉 Initial setup complete! Redirecting to dashboard...')
        
        // Mark as no longer first-time setup
        isFirstTimeSetup.current = false

        // Redirect to dashboard after brief success message
        setTimeout(() => {
          router.push('/')
        }, 2000)
      } catch (err: any) {
        console.error('❌ Error connecting Outlook:', err)
        setError(err.message || 'Failed to connect Outlook account')
        setStep('connect')
        hasProcessedConnectionRef.current = false // Reset guard on error
        
        // Logout from MSAL to allow retry
        await logout()
      }
    }

    handleOutlookConnected()
  }, [isOutlookAuthenticated, outlookUser, user, isConnected, router, getAccessToken, logout])

  // Handle errors from MSAL
  useEffect(() => {
    if (outlookAuthError) {
      setError(outlookAuthError)
      setStep('connect')
    }
  }, [outlookAuthError])

  const handleConnectClick = async () => {
    setError(null)
    try {
      await login()
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Failed to initiate login')
    }
  }

  // Loading state while checking Supabase auth
  if (isLoadingAuth || !user) {
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
        <div style={{ textAlign: 'center', color: theme.textSecondary }}>
          <div
            style={{
            width: 40,
            height: 40,
            border: `3px solid ${theme.borderMuted}`,
            borderTop: `3px solid ${theme.accent}`,
              borderRadius: '50%',
              margin: '0 auto 16px',
              animation: 'spin 1s linear infinite',
            }}
          />
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  // Already connected - show status and redirect (only if NOT during first-time setup)
  if (isConnected && connection && step === 'connect') {
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
          maxWidth: 500,
          width: '100%',
          background: theme.bgCard,
            borderRadius: 16,
            padding: 48,
            textAlign: 'center',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              background: `${theme.success}20`,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}
          >
            <span style={{ fontSize: 32 }}>✓</span>
          </div>

          <h1 style={{ color: theme.textPrimary, fontSize: 24, marginBottom: 12 }}>
            Already Connected
          </h1>
          <p style={{ color: theme.textSecondary, marginBottom: 24 }}>
            Your Outlook account is already connected:
            <br />
            <strong style={{ color: theme.textPrimary }}>{connection.outlook_email}</strong>
          </p>

          <button
            onClick={() => router.push('/')}
            style={{
              background: theme.accent,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '12px 24px',
              fontSize: 16,
              fontWeight: 500,
              cursor: 'pointer',
              width: '100%',
            }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
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
          maxWidth: 500,
          width: '100%',
          background: theme.bgCard,
          borderRadius: 16,
          padding: 48,
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 80,
              height: 80,
              background: `${theme.accent}10`,
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}
          >
            <span style={{ fontSize: 48 }}>📧</span>
          </div>

          <h1 style={{ color: theme.textPrimary, fontSize: 28, marginBottom: 12 }}>
            Connect Your Email
          </h1>
          <p style={{ color: theme.textSecondary, fontSize: 16, lineHeight: 1.5 }}>
            Connect your Outlook account to start managing your emails with AI-powered tools
          </p>
        </div>

        {/* Status/Error Messages */}
        {error && (
          <div
            style={{
              background: `${theme.error}10`,
              border: `1px solid ${theme.error}40`,
              borderRadius: 8,
              padding: 16,
              marginBottom: 24,
            }}
          >
            <div style={{ color: theme.error, fontSize: 14 }}>
              <strong>Error:</strong> {error}
            </div>
          </div>
        )}

        {/* Progress Steps */}
        {step !== 'connect' && (
          <div
            style={{
              background: `${theme.accent}10`,
              border: `1px solid ${theme.accent}40`,
              borderRadius: 12,
              padding: 24,
              marginBottom: 24,
            }}
          >
            {step === 'saving' && (
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    border: `3px solid ${theme.borderMuted}`,
                    borderTop: `3px solid ${theme.accent}`,
                    borderRadius: '50%',
                    margin: '0 auto 16px',
                    animation: 'spin 1s linear infinite',
                  }}
                />
                <p style={{ color: theme.textPrimary, fontWeight: 600, margin: '0 0 8px' }}>
                  Connecting Your Account
                </p>
                <p style={{ color: theme.textSecondary, fontSize: 14, margin: 0 }}>
                  Saving connection details...
                </p>
              </div>
            )}

            {step === 'fetching' && (
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    border: `3px solid ${theme.borderMuted}`,
                    borderTop: `3px solid ${theme.accent}`,
                    borderRadius: '50%',
                    margin: '0 auto 16px',
                    animation: 'spin 1s linear infinite',
                  }}
                />
                <p style={{ color: theme.textPrimary, fontWeight: 600, margin: '0 0 8px' }}>
                  Fetching Your Emails
                </p>
                <p style={{ color: theme.textSecondary, fontSize: 14, margin: 0 }}>
                  Loading your recent inbox messages...
                </p>
                {setupProgress.emailsFetched > 0 && (
                  <p style={{ color: theme.accent, fontSize: 14, margin: '8px 0 0', fontWeight: 500 }}>
                    {setupProgress.emailsFetched} emails loaded
                  </p>
                )}
              </div>
            )}

            {step === 'analyzing' && (
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    border: `3px solid ${theme.borderMuted}`,
                    borderTop: `3px solid ${theme.accent}`,
                    borderRadius: '50%',
                    margin: '0 auto 16px',
                    animation: 'spin 1s linear infinite',
                  }}
                />
                <p style={{ color: theme.textPrimary, fontWeight: 600, margin: '0 0 8px' }}>
                  AI Analysis in Progress
                </p>
                <p style={{ color: theme.textSecondary, fontSize: 14, margin: 0 }}>
                  Analyzing priorities, categories, and sentiment...
                </p>
                {setupProgress.analyzed > 0 && (
                  <p style={{ color: theme.accent, fontSize: 14, margin: '8px 0 0', fontWeight: 500 }}>
                    {setupProgress.analyzed} emails analyzed
                  </p>
                )}
              </div>
            )}

            {step === 'prefetching' && (
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    border: `3px solid ${theme.borderMuted}`,
                    borderTop: `3px solid ${theme.accent}`,
                    borderRadius: '50%',
                    margin: '0 auto 16px',
                    animation: 'spin 1s linear infinite',
                  }}
                />
                <p style={{ color: theme.textPrimary, fontWeight: 600, margin: '0 0 8px' }}>
                  Preparing Email Content
                </p>
                <p style={{ color: theme.textSecondary, fontSize: 14, margin: 0 }}>
                  Caching email bodies for instant access...
                </p>
                {setupProgress.prefetched > 0 && (
                  <p style={{ color: theme.accent, fontSize: 14, margin: '8px 0 0', fontWeight: 500 }}>
                    {setupProgress.prefetched}/20 emails cached
                  </p>
                )}
              </div>
            )}

            {step === 'complete' && (
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    background: theme.success,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <span style={{ color: '#fff', fontSize: 28 }}>✓</span>
                </div>
                <p style={{ color: theme.textPrimary, fontWeight: 600, fontSize: 18, margin: '0 0 8px' }}>
                  All Set!
                </p>
                <p style={{ color: theme.textSecondary, fontSize: 14, margin: '0 0 12px' }}>
                  Your inbox is ready with AI-powered insights
                </p>
                <div style={{ 
                  display: 'flex', 
                  gap: 16, 
                  justifyContent: 'center',
                  color: theme.textSecondary,
                  fontSize: 12,
                  marginTop: 16,
                }}>
                  <div>
                    <span style={{ color: theme.success, marginRight: 6 }}>✓</span>
                    {setupProgress.emailsFetched} emails
                  </div>
                  <div>
                    <span style={{ color: theme.success, marginRight: 6 }}>✓</span>
                    AI analyzed
                  </div>
                  <div>
                    <span style={{ color: theme.success, marginRight: 6 }}>✓</span>
                    Ready to open
                  </div>
                </div>
                <p style={{ color: theme.textSecondary, fontSize: 13, margin: '12px 0 0' }}>
                  Redirecting to dashboard...
                </p>
              </div>
            )}

            {/* Progress indicator bar */}
            {step !== 'complete' && (
              <div style={{ marginTop: 20 }}>
                <div
                  style={{
                    height: 4,
                    background: theme.borderMuted,
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      background: theme.accent,
                      width: step === 'saving' ? '25%' : step === 'fetching' ? '50%' : step === 'analyzing' ? '75%' : '90%',
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
                <p style={{ 
                  color: theme.textSecondary, 
                  fontSize: 12, 
                  textAlign: 'center',
                  margin: '8px 0 0',
                }}>
                  {step === 'saving' && 'Step 1 of 4'}
                  {step === 'fetching' && 'Step 2 of 4'}
                  {step === 'analyzing' && 'Step 3 of 4'}
                  {step === 'prefetching' && 'Step 4 of 4'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Connect Button */}
        {step === 'connect' && (
          <>
            <button
              onClick={handleConnectClick}
            disabled={isLoadingOutlook}
            style={{
              width: '100%',
              background: isLoadingOutlook ? theme.bgCard : theme.accent,
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '16px 24px',
                fontSize: 16,
                fontWeight: 600,
                cursor: isLoadingOutlook ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                marginBottom: 24,
                opacity: isLoadingOutlook ? 0.6 : 1,
              }}
            >
              {isLoadingOutlook ? (
                <>
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      border: '2px solid #ffffff40',
                      borderTop: '2px solid #ffffff',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                    }}
                  />
                  Connecting...
                </>
              ) : (
                <>
                  <span style={{ fontSize: 20 }}>📧</span>
                  Connect Outlook Account
                </>
              )}
            </button>

            {/* Security Features */}
            <div style={{ marginTop: 24 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 12,
                  color: theme.textSecondary,
                  fontSize: 14,
                }}
              >
                <span style={{ color: theme.success, fontSize: 18 }}>✓</span>
                <span>Secure OAuth 2.0 authentication</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 12,
                  color: theme.textSecondary,
                  fontSize: 14,
                }}
              >
                <span style={{ color: theme.success, fontSize: 18 }}>✓</span>
                <span>We never store your password</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  color: theme.textSecondary,
                  fontSize: 14,
                }}
              >
                <span style={{ color: theme.success, fontSize: 18 }}>✓</span>
                <span>Read-only access to emails</span>
              </div>
            </div>

            {/* Skip Link */}
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <button
                onClick={() => router.push('/')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: theme.textSecondary,
                  fontSize: 14,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Skip for now
              </button>
            </div>
          </>
        )}
      </div>

      {/* Spinner Animation */}
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
