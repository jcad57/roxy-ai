/**
 * Email Metadata Hook
 * Manages email metadata from Supabase (no IndexedDB, no mock data)
 * 
 * Flow:
 * 1. Fetch email metadata from Supabase (email_metadata table)
 * 2. Fetch AI enrichments from Supabase (email_enrichments table)
 * 3. Combine metadata + enrichments for display
 * 4. Only show emails if user has Outlook connected
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/providers/auth-provider'
import { useOutlookConnection } from './use-outlook-connection'
import { supabase } from '@/lib/supabase/client'
import { EmailMetadata, EnrichedEmailWithMetadata } from '@/lib/types/outlook'
import type { Email } from '@/lib/types/email'

/**
 * Fetch email metadata from Supabase
 */
async function fetchEmailMetadata(userId: string): Promise<EmailMetadata[]> {
  const { data, error } = await (supabase
    .from('email_metadata') as any)
    .select('*')
    .eq('user_id', userId)
    .order('received_at', { ascending: false })

  if (error) {
    console.error('Error fetching email metadata:', error)
    throw error
  }

  return data || []
}

/**
 * Fetch AI enrichments from Supabase
 */
async function fetchEnrichments(userId: string) {
  const { data, error } = await (supabase
    .from('email_enrichments') as any)
    .select('*')
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching enrichments:', error)
    throw error
  }

  return data || []
}

/**
 * Combine metadata with enrichments
 */
function combineMetadataAndEnrichments(
  metadata: EmailMetadata[],
  enrichments: any[]
): EnrichedEmailWithMetadata[] {
  const enrichmentMap = new Map(
    enrichments.map((e) => [e.outlook_message_id || e.email_id, e])
  )

  return metadata.map((email) => {
    const enrichment = enrichmentMap.get(email.outlook_message_id)
    return {
      ...email,
      ...enrichment,
    }
  })
}

/**
 * Transform enriched metadata to legacy Email format for views
 */
export function enrichedMetadataToLegacy(
  enrichedMetadata: EnrichedEmailWithMetadata[]
): Email[] {
  return enrichedMetadata.map((email, index) => {
    // Generate a numeric ID from the outlook_message_id hash
    const numericId = Math.abs(
      email.outlook_message_id.split('').reduce((acc, char) => {
        return acc + char.charCodeAt(0)
      }, 0)
    ) % 1000000

    const receivedDate = new Date(email.received_at)
    
    return {
      id: numericId,
      from: email.from_name,
      avatar: email.from_address.charAt(0).toUpperCase(),
      subject: email.subject,
      preview: '', // Not stored in metadata (fetched on-demand)
      time: receivedDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
      date: receivedDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: receivedDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
      }),
      receivedAt: email.received_at, // Store full timestamp for sorting
      priority: email.ai_priority || 50,
      category: (email.ai_category || 'personal') as 'urgent' | 'work' | 'automated' | 'personal',
      tags: email.suggested_tags || [],
      cluster: (email.ai_cluster || 'other') as 'operations' | 'content' | 'partnerships' | 'analytics' | 'finance' | 'other',
      read: email.is_read,
      sentiment: (email.ai_sentiment || 'neutral') as 'positive' | 'negative' | 'neutral',
      thread: 1, // Default thread count
      outlookMessageId: email.outlook_message_id, // For on-demand content fetching
    }
  })
}

/**
 * Main hook to manage email metadata from Supabase
 */
export function useEmailMetadata() {
  const { user } = useAuth()
  const { isConnected } = useOutlookConnection()
  const queryClient = useQueryClient()

  // Fetch email metadata
  const {
    data: emailMetadata = [],
    isLoading: isLoadingMetadata,
    error: metadataError,
  } = useQuery({
    queryKey: ['email-metadata', user?.id],
    queryFn: () => fetchEmailMetadata(user!.id),
    enabled: !!user?.id && isConnected,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  })

  // Fetch enrichments
  const {
    data: enrichments = [],
    isLoading: isLoadingEnrichments,
    error: enrichmentsError,
  } = useQuery({
    queryKey: ['email-enrichments', user?.id],
    queryFn: () => fetchEnrichments(user!.id),
    enabled: !!user?.id && isConnected,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  })

  // Combine metadata with enrichments
  const enrichedEmails = combineMetadataAndEnrichments(emailMetadata, enrichments)

  // Separate processed vs unprocessed emails
  const processedEmails = enrichedEmails.filter((email) => email.ai_status === 'enriched')
  const unprocessedEmails = enrichedEmails.filter(
    (email) => email.ai_status === 'pending' || email.ai_status === 'processing'
  )

  // Convert ALL emails to legacy format for views (both processed and unprocessed)
  // This ensures emails display immediately, even without AI enrichments
  const emails = enrichedMetadataToLegacy(enrichedEmails)

  // Refresh data
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['email-metadata', user?.id] })
    queryClient.invalidateQueries({ queryKey: ['email-enrichments', user?.id] })
  }

  return {
    // Enriched emails (metadata + AI data)
    enrichedEmails,
    processedEmails,
    unprocessedEmails,

    // Legacy format for views
    emails,

    // Loading states
    isLoading: isLoadingMetadata || isLoadingEnrichments,
    isLoadingMetadata,
    isLoadingEnrichments,

    // Errors
    error: metadataError || enrichmentsError,
    metadataError,
    enrichmentsError,

    // Actions
    refresh,
  }
}
