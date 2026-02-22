/**
 * Email Metadata Storage
 * Handles storing and updating email metadata in Supabase
 * Note: These functions require an authenticated Supabase client to be passed in
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { EmailMetadataInsert, EmailMetadataUpdate } from '@/lib/types/outlook'

/**
 * Upsert email metadata to Supabase (insert or update if exists)
 * @param supabase - Authenticated Supabase client (server-side)
 * @param metadata - Array of email metadata to upsert
 */
export async function upsertEmailMetadata(
  supabase: SupabaseClient,
  metadata: EmailMetadataInsert[]
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    console.log(`💾 Upserting ${metadata.length} email metadata records...`)

    const { data, error } = await (supabase
      .from('email_metadata') as any)
      .upsert(metadata, {
        onConflict: 'user_id,outlook_message_id',
        ignoreDuplicates: false, // Update existing records
      })

    if (error) {
      console.error('❌ Failed to upsert email metadata:', error)
      return { success: false, count: 0, error: error.message }
    }

    console.log(`✅ Successfully upserted ${metadata.length} email metadata records`)
    return { success: true, count: metadata.length }
  } catch (error: any) {
    console.error('❌ Error upserting email metadata:', error)
    return { success: false, count: 0, error: error.message }
  }
}

/**
 * Update sync status in outlook_connections table
 * @param supabase - Authenticated Supabase client (server-side)
 */
export async function updateSyncStatus(
  supabase: SupabaseClient,
  userId: string,
  updates: {
    lastSyncAt: string
    deltaLink?: string | null
    totalEmailsSynced: number
    lastSyncEmailCount: number
    syncStatus?: 'active' | 'disconnected' | 'error' | 'delta_pending' | 'delta_unavailable'
    lastError?: string | null
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`📊 Updating sync status for user ${userId}...`)

    const updateData: any = {
      last_sync_at: updates.lastSyncAt,
      last_sync_email_count: updates.lastSyncEmailCount,
      updated_at: new Date().toISOString(),
    }

    if (updates.deltaLink !== undefined) updateData.delta_link = updates.deltaLink
    if (updates.totalEmailsSynced !== undefined)
      updateData.total_emails_synced = updates.totalEmailsSynced
    if (updates.syncStatus) updateData.sync_status = updates.syncStatus
    if (updates.lastError !== undefined) updateData.last_error = updates.lastError

    const { error } = await (supabase
      .from('outlook_connections') as any)
      .update(updateData)
      .eq('user_id', userId)

    if (error) {
      console.error('❌ Failed to update sync status:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Sync status updated successfully')
    return { success: true }
  } catch (error: any) {
    console.error('❌ Error updating sync status:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get emails that need AI analysis
 * @param supabase - Authenticated Supabase client (server-side)
 */
export async function getPendingEmailsForAnalysis(
  supabase: SupabaseClient,
  userId: string,
  limit: number = 50
): Promise<{ success: boolean; emails: any[]; error?: string }> {
  try {
    const { data, error } = await (supabase
      .from('email_metadata') as any)
      .select('*')
      .eq('user_id', userId)
      .eq('ai_status', 'pending')
      .order('received_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('❌ Failed to get pending emails:', error)
      return { success: false, emails: [], error: error.message }
    }

    return { success: true, emails: data || [] }
  } catch (error: any) {
    console.error('❌ Error getting pending emails:', error)
    return { success: false, emails: [], error: error.message }
  }
}

/**
 * Mark emails as processing
 * @param supabase - Authenticated Supabase client (server-side)
 */
export async function markEmailsAsProcessing(
  supabase: SupabaseClient,
  userId: string,
  outlookMessageIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await (supabase
      .from('email_metadata') as any)
      .update({ ai_status: 'processing', updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .in('outlook_message_id', outlookMessageIds)

    if (error) {
      console.error('❌ Failed to mark emails as processing:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('❌ Error marking emails as processing:', error)
    return { success: false, error: error.message }
  }
}
