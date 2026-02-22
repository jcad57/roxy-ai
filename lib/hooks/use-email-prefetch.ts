/**
 * Email Prefetch Hook
 * Background prefetching of email bodies for instant display
 */

import { useEffect, useRef, useState } from 'react'
import { useOutlookAuth } from '@/lib/providers/outlook-auth-provider'
import { prefetchEmailBodies } from './use-email-content'
import type { Email } from '@/lib/types/email'

export function useEmailPrefetch(emails: Email[], enabled: boolean = true) {
  const { getAccessToken } = useOutlookAuth()
  const [isPrefetching, setIsPrefetching] = useState(false)
  const [prefetchProgress, setPrefetchProgress] = useState({ completed: 0, total: 0 })
  const lastPrefetchRef = useRef<string>('')

  useEffect(() => {
    if (!enabled || emails.length === 0 || isPrefetching) {
      return
    }

    const prefetchEmails = async () => {
      // Get top 20 visible emails with outlook IDs
      const emailsToPrefetch = emails
        .slice(0, 20)
        .filter((e) => e.outlookMessageId)
        .map((e) => e.outlookMessageId!)

      if (emailsToPrefetch.length === 0) {
        console.log('ℹ️ No emails to prefetch (missing Outlook IDs)')
        return
      }

      // Create unique key for this prefetch batch
      const prefetchKey = emailsToPrefetch.slice(0, 5).join(',')
      
      // Skip if we already prefetched this batch
      if (lastPrefetchRef.current === prefetchKey) {
        console.log('ℹ️ Prefetch already completed for these emails')
        return
      }

      setIsPrefetching(true)
      lastPrefetchRef.current = prefetchKey

      try {
        const accessToken = await getAccessToken()
        if (!accessToken) {
          console.warn('⚠️ Cannot prefetch - no access token')
          return
        }

        console.log(`🚀 [Prefetch] Starting background fetch for ${emailsToPrefetch.length} emails...`)

        await prefetchEmailBodies(
          emailsToPrefetch,
          accessToken,
          (completed, total) => {
            setPrefetchProgress({ completed, total })
            
            if (completed % 5 === 0 || completed === total) {
              console.log(`   📥 Prefetched ${completed}/${total} emails`)
            }
          }
        )

        console.log(`✅ [Prefetch] Complete - emails will open instantly`)
      } catch (err: any) {
        console.error('❌ Prefetch error:', err.message)
      } finally {
        setIsPrefetching(false)
        setPrefetchProgress({ completed: 0, total: 0 })
      }
    }

    // Start prefetching after a short delay (let UI render first)
    const timeoutId = setTimeout(prefetchEmails, 1000)

    return () => clearTimeout(timeoutId)
  }, [emails, enabled, getAccessToken, isPrefetching])

  return {
    isPrefetching,
    prefetchProgress,
  }
}
