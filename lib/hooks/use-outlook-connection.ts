/**
 * useOutlookConnection Hook
 * Manages Outlook connection state from Supabase + MSAL auth
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/providers/auth-provider'
import { useOutlookAuth } from '@/lib/providers/outlook-auth-provider'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'
import { OutlookConnection, OutlookUserProfile } from '@/lib/types/outlook'

export function useOutlookConnection() {
  const { user } = useAuth()
  const { isAuthenticated, getAccessToken, user: outlookUser } = useOutlookAuth()
  const queryClient = useQueryClient()

  // Check if user has Outlook connected in Supabase
  const {
    data: connection,
    isLoading: isLoadingConnection,
    error: connectionError,
  } = useQuery({
    queryKey: ['outlook-connection', user?.id],
    queryFn: async () => {
      if (!user?.id) return null

      console.log('🔍 Fetching Outlook connection from Supabase...')

      const { data, error } = await supabase
        .from('outlook_connections')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is fine
        console.error('Error fetching Outlook connection:', error)
        throw error
      }

      console.log(`✅ Connection check: ${data ? 'Connected' : 'Not connected'}`)

      return data as OutlookConnection | null
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes - prevent frequent refetches
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  // Save Outlook connection to Supabase
  const saveConnection = useMutation({
    mutationFn: async (profile: OutlookUserProfile) => {
      if (!user?.id) {
        throw new Error('User not authenticated with Supabase')
      }

      const connectionData = {
        user_id: user.id,
        outlook_email: profile.mail || profile.userPrincipalName,
        outlook_user_id: profile.id,
        outlook_display_name: profile.displayName,
        sync_status: 'active',
        connected_at: new Date().toISOString(),
      }

      const { data, error } = await (supabase
        .from('outlook_connections') as any)
        .upsert(connectionData, {
          onConflict: 'user_id',
        })
        .select()
        .single()

      if (error) {
        console.error('Error saving Outlook connection:', error)
        throw error
      }

      return data as OutlookConnection
    },
    onSuccess: (data) => {
      console.log('✅ Outlook connection saved to Supabase:', data)
      // Don't invalidate - let the caller handle UI updates to avoid cascading refetches
      // queryClient.invalidateQueries({ queryKey: ['outlook-connection', user?.id] })
    },
    onError: (error) => {
      console.error('❌ Failed to save Outlook connection:', error)
    },
  })

  // Disconnect Outlook
  const disconnectOutlook = useMutation({
    mutationFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      const { error } = await (supabase
        .from('outlook_connections') as any)
        .update({
          sync_status: 'disconnected',
          last_error: 'User disconnected',
        })
        .eq('user_id', user.id)

      if (error) {
        console.error('Error disconnecting Outlook:', error)
        throw error
      }
    },
    onSuccess: () => {
      console.log('✅ Outlook disconnected')
      queryClient.invalidateQueries({ queryKey: ['outlook-connection', user?.id] })
    },
  })

  // Update sync status (called after sync operations)
  const updateSyncStatus = useMutation({
    mutationFn: async (update: {
      lastSyncAt?: string
      deltaLink?: string
      totalEmailsSynced?: number
      lastSyncEmailCount?: number
      syncStatus?: 'active' | 'disconnected' | 'error'
      lastError?: string | null
    }) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      const updateData: any = {
        updated_at: new Date().toISOString(),
      }

      if (update.lastSyncAt) updateData.last_sync_at = update.lastSyncAt
      if (update.deltaLink !== undefined) updateData.delta_link = update.deltaLink
      if (update.totalEmailsSynced !== undefined)
        updateData.total_emails_synced = update.totalEmailsSynced
      if (update.lastSyncEmailCount !== undefined)
        updateData.last_sync_email_count = update.lastSyncEmailCount
      if (update.syncStatus) updateData.sync_status = update.syncStatus
      if (update.lastError !== undefined) updateData.last_error = update.lastError

      const { error } = await (supabase
        .from('outlook_connections') as any)
        .update(updateData)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error updating sync status:', error)
        throw error
      }
    },
    onSuccess: () => {
      // Invalidate on success to refresh connection state
      queryClient.invalidateQueries({ queryKey: ['outlook-connection', user?.id] })
    },
  })

  // Manual refresh for connection (used after saveConnection completes)
  const refreshConnection = () => {
    queryClient.invalidateQueries({ queryKey: ['outlook-connection', user?.id] })
  }

  return {
    // Connection state from Supabase
    connection,
    isConnected: !!connection && connection.sync_status === 'active',
    isLoadingConnection,
    connectionError,

    // MSAL authentication state
    outlookAuthenticated: isAuthenticated,
    outlookUser,
    getAccessToken,

    // Mutations
    saveConnection,
    disconnectOutlook,
    updateSyncStatus,
    refreshConnection,
  }
}
