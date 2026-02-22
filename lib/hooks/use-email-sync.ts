/**
 * Email Sync Hook
 * Handles manual email refresh, auto-sync, and provides sync status
 * Does NOT trigger AI analysis - that's handled separately to avoid loops
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/providers/auth-provider'
import { useOutlookConnection } from './use-outlook-connection'
import { useEffect, useRef, useState, useCallback } from 'react'

interface SyncResult {
  success: boolean
  emailsFetched: number
  newEmails: number
  isInitialSync: boolean
  timestamp: string // Unique identifier to prevent duplicate analysis triggers
  error?: string
}

export function useEmailSync(options?: {
  autoSync?: boolean
  autoSyncInterval?: number // milliseconds
}) {
  const { user } = useAuth()
  const { getAccessToken, isConnected } = useOutlookConnection()
  const queryClient = useQueryClient()

  // Options with defaults
  const autoSync = options?.autoSync ?? false
  const autoSyncInterval = options?.autoSyncInterval ?? 3 * 60 * 1000 // 3 minutes

  // Track last sync time and prevent concurrent syncs
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [isSyncingBackground, setIsSyncingBackground] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isSyncingRef = useRef(false) // Guard against concurrent syncs

  // Manual sync mutation
  const syncMutation = useMutation({
    mutationFn: async (): Promise<SyncResult> => {
      console.log('🔄 Sync mutation triggered')
      
      // Guard against concurrent syncs
      if (isSyncingRef.current) {
        console.log('⚠️ Sync already in progress, skipping...')
        throw new Error('Sync already in progress')
      }

      if (!user || !isConnected) {
        console.log('⚠️ Cannot sync: user or connection missing')
        throw new Error('User not authenticated or Outlook not connected')
      }

      console.log('🔒 Acquiring sync lock...')
      isSyncingRef.current = true

      // Get access token from MSAL
      const token = await getAccessToken()
      if (!token) {
        console.error('❌ Failed to get access token')
        isSyncingRef.current = false
        throw new Error('Failed to get Outlook access token')
      }

      console.log('🔄 Starting email sync (delta mode)...')

      // Call fetch API
      const response = await fetch('/api/emails/fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken: token,
          initialSync: false, // Delta sync for manual refresh
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        isSyncingRef.current = false
        throw new Error(errorData.error || 'Failed to sync emails')
      }

      const data = await response.json()
      console.log('✅ Email sync completed:', data)

      // Add unique timestamp to prevent duplicate analysis triggers
      return {
        ...data,
        timestamp: new Date().toISOString(),
      }
    },
    onSuccess: (data) => {
      console.log(`✅ Sync complete: ${data.emailsFetched} emails (${data.newEmails} new)`)
      console.log('🔓 Releasing sync lock')

      // Update last sync time
      setLastSyncTime(new Date())

      // Only invalidate metadata query (enrichments will be handled by AI analysis)
      queryClient.invalidateQueries({ queryKey: ['email-metadata', user?.id] })

      // Reset guards
      isSyncingRef.current = false
      setIsSyncingBackground(false)
    },
    onError: (error: Error) => {
      console.error('❌ Email sync failed:', error.message)
      isSyncingRef.current = false
      setIsSyncingBackground(false)
    },
  })

  // Background sync function (memoized to prevent recreating)
  const backgroundSync = useCallback(async () => {
    // Skip if already syncing or not connected
    if (!isConnected || syncMutation.isPending || isSyncingRef.current) {
      console.log('⏭️ Skipping background sync (already syncing or not connected)')
      return
    }

    console.log('⏰ Auto-sync triggered by interval')
    setIsSyncingBackground(true)

    try {
      await syncMutation.mutateAsync()
    } catch (error) {
      // Error already logged in onError
      if (error instanceof Error && error.message !== 'Sync already in progress') {
        console.error('❌ Background sync failed:', error)
      }
      setIsSyncingBackground(false)
    }
  }, [isConnected, syncMutation, isSyncingRef])

  // Auto-sync effect
  useEffect(() => {
    if (!autoSync || !isConnected) {
      // Clear interval if auto-sync disabled or not connected
      if (intervalRef.current) {
        console.log('🛑 Auto-sync disabled or not connected, clearing interval')
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    console.log(`⏰ Auto-sync enabled: every ${autoSyncInterval / 1000}s`)
    console.log(`⏱️ First auto-sync will run in 30 seconds (letting initial connection settle)`)

    // Run initial background sync after 30 seconds (let initial connection complete first)
    const initialTimeout = setTimeout(() => {
      console.log('⏰ Running first auto-sync after initial delay')
      backgroundSync()
    }, 30000) // 30 seconds instead of 5

    // Set up recurring sync
    intervalRef.current = setInterval(() => {
      console.log('⏰ Recurring auto-sync interval triggered')
      backgroundSync()
    }, autoSyncInterval)

    // Cleanup
    return () => {
      clearTimeout(initialTimeout)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [autoSync, autoSyncInterval, isConnected, backgroundSync])

  // Visibility change handler (pause sync when tab hidden)
  useEffect(() => {
    if (!autoSync) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Pause sync when tab is hidden
        if (intervalRef.current) {
          console.log('⏸️ Pausing auto-sync (tab hidden)')
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      } else {
        // Resume sync when tab becomes visible
        if (autoSync && isConnected && !intervalRef.current) {
          console.log('▶️ Resuming auto-sync (tab visible)')
          backgroundSync() // Immediate sync on resume
          intervalRef.current = setInterval(backgroundSync, autoSyncInterval)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [autoSync, autoSyncInterval, isConnected, backgroundSync])

  return {
    // Manual sync
    sync: syncMutation.mutate,
    syncAsync: syncMutation.mutateAsync,
    isSyncing: syncMutation.isPending,
    syncError: syncMutation.error,
    lastSyncResult: syncMutation.data,

    // Auto-sync status
    lastSyncTime,
    isSyncingBackground,
    isAutoSyncEnabled: autoSync && isConnected,
  }
}
