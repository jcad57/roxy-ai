/**
 * Email Actions Hook
 * Handle email operations: mark read/unread, delete, archive, etc.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/providers/auth-provider'
import { useOutlookConnection } from './use-outlook-connection'
import { supabase } from '@/lib/supabase/client'

interface MarkReadOptions {
  messageIds: string[]
  isRead: boolean
}

export function useEmailActions() {
  const { user } = useAuth()
  const { getAccessToken } = useOutlookConnection()
  const queryClient = useQueryClient()

  // Mark emails as read/unread with optimistic updates
  const markReadMutation = useMutation({
    // STEP 1: Optimistically update cache before API call (instant UI)
    onMutate: async ({ messageIds, isRead }: MarkReadOptions) => {
      if (!user?.id) {
        console.error('❌ Cannot mark as read/unread - no user ID');
        return;
      }

      console.log(`⚡ OPTIMISTIC UPDATE: Marking ${messageIds.length} email(s) as ${isRead ? 'READ' : 'UNREAD'}...`);
      console.log(`   Message IDs:`, messageIds);

      // Cancel outgoing refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['email-metadata', user.id] });
      console.log(`   ✅ Cancelled pending queries`);

      // Snapshot previous value for rollback
      const previousMetadata = queryClient.getQueryData(['email-metadata', user.id]);

      // Optimistically update cache
      queryClient.setQueryData(['email-metadata', user.id], (old: any) => {
        if (!Array.isArray(old)) {
          console.warn('   ⚠️ Email metadata cache is not an array');
          return old;
        }

        const updated = old.map((email: any) => 
          messageIds.includes(email.outlook_message_id)
            ? { ...email, is_read: isRead, updated_at: new Date().toISOString() }
            : email
        );
        
        console.log(`   ✅ Cache updated - ${messageIds.length} email(s) marked as ${isRead ? 'READ' : 'UNREAD'}`);
        return updated;
      });

      console.log(`✅ UI UPDATED INSTANTLY (optimistic)`);

      // Return context for rollback
      return { previousMetadata };
    },

    // STEP 2: Sync to database and Outlook
    mutationFn: async ({ messageIds, isRead }: MarkReadOptions) => {
      console.log(`🔄 BACKGROUND SYNC: Starting database + Outlook sync...`);
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Update Supabase
      console.log(`   💾 Updating Supabase...`);
      const { error: localUpdateError } = await (supabase
        .from('email_metadata') as any)
        .update({ 
          is_read: isRead,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .in('outlook_message_id', messageIds)

      if (localUpdateError) {
        console.error('   ❌ Failed to update Supabase:', localUpdateError)
        throw new Error('Failed to update database')
      }

      console.log(`   ✅ Supabase updated`)

      // Get access token for Outlook
      console.log(`   🔑 Getting Outlook access token...`);
      const accessToken = await getAccessToken()
      if (!accessToken) {
        console.error('   ❌ Failed to get access token');
        throw new Error('Failed to get Outlook access token')
      }
      console.log(`   ✅ Access token acquired`);

      // Sync to Outlook
      console.log(`   📤 Syncing to Outlook (${messageIds.length} email(s))...`);
      const response = await fetch('/api/emails/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageIds,
          isRead,
          accessToken,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('   ❌ Outlook sync failed:', errorData);
        throw new Error(errorData.error || 'Failed to sync with Outlook')
      }

      const data = await response.json()
      console.log(`   ✅ Outlook synced: ${data.updated} email(s) updated`)
      console.log(`✅ BACKGROUND SYNC COMPLETE`);

      return data
    },

    // STEP 3: Rollback on error
    onError: (error: Error, variables, context: any) => {
      console.error('❌ Mark read/unread failed:', error.message)
      
      // Restore previous cache state
      if (context?.previousMetadata && user?.id) {
        queryClient.setQueryData(['email-metadata', user.id], context.previousMetadata)
        console.log('♻️ Rolled back UI to previous state')
      }
    },

    // STEP 4: Refetch to confirm on success
    onSettled: () => {
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ['email-metadata', user.id] })
      }
    },
  })

  return {
    markAsRead: (messageIds: string[]) => {
      console.log(`🔵 markAsRead called with ${messageIds.length} message ID(s):`, messageIds);
      markReadMutation.mutate({ messageIds, isRead: true });
    },
    markAsUnread: (messageIds: string[]) => {
      console.log(`🔵 markAsUnread called with ${messageIds.length} message ID(s):`, messageIds);
      markReadMutation.mutate({ messageIds, isRead: false });
    },
    isUpdating: markReadMutation.isPending,
    error: markReadMutation.error,
  }
}
