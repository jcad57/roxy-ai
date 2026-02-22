/**
 * Email Content Hook
 * On-demand fetching with in-memory session cache (Gmail/Outlook-style)
 */

import { useQuery } from '@tanstack/react-query'
import { useOutlookAuth } from '@/lib/providers/outlook-auth-provider'
import { emailBodyCache } from '@/lib/services/email-body-cache'
import type { EmailContent } from '@/lib/services/outlook/email-content-fetcher'

interface EmailContentResponse {
  success: boolean
  content?: EmailContent
  error?: string
}

/**
 * Fetch full email content from API (with in-memory cache check)
 */
async function fetchEmailContentFromAPI(
  messageId: string,
  accessToken: string
): Promise<EmailContent> {
  console.log(`📧 Fetching email content: ${messageId}`)
  
  // STEP 1: Check in-memory cache (instant, no API call)
  const cached = emailBodyCache.get(messageId)
  if (cached) {
    console.log(`⚡ INSTANT: Returning cached content (no API call)`)
    
    // Return in EmailContent format (body is stored, other fields from metadata)
    return {
      outlookMessageId: messageId,
      subject: '',
      from: { name: '', address: '' },
      to: [],
      receivedDateTime: '',
      hasAttachments: cached.attachments.length > 0,
      importance: 'normal',
      bodyPreview: '',
      body: {
        content: cached.htmlBody, // Use HTML version if available
        contentType: 'html',
      },
      attachments: cached.attachments,
      conversationId: '',
      internetMessageId: '',
    } as EmailContent
  }
  
  // STEP 2: Cache miss - fetch from API
  console.log(`📡 Cache MISS: Fetching from Outlook API...`)
  const response = await fetch(`/api/emails/content/${messageId}`, {
    headers: {
      'X-Outlook-Access-Token': accessToken,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to fetch email content')
  }

  const data: EmailContentResponse = await response.json()

  if (!data.success || !data.content) {
    throw new Error(data.error || 'Invalid response')
  }

  // STEP 3: Store in cache for next time
  const content = data.content
  emailBodyCache.set(
    messageId,
    content.body.content,
    content.body.contentType === 'html' ? content.body.content : '',
    content.attachments || []
  )
  
  console.log(`✅ Email content fetched and cached`)

  return content
}

/**
 * Hook to fetch and cache email content on-demand
 */
export function useEmailContent(messageId: string | null, enabled: boolean = true) {
  const { getAccessToken } = useOutlookAuth()

  return useQuery({
    queryKey: ['email-content', messageId],
    queryFn: async () => {
      if (!messageId) {
        throw new Error('No message ID provided')
      }

      const accessToken = await getAccessToken()
      if (!accessToken) {
        throw new Error('Not authenticated with Outlook')
      }

      return fetchEmailContentFromAPI(messageId, accessToken)
    },
    enabled: enabled && !!messageId,
    staleTime: 15 * 60 * 1000, // Match cache TTL (15 min)
    gcTime: 15 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
  })
}

/**
 * Prefetch multiple emails in background (for inbox/priority views)
 */
export async function prefetchEmailBodies(
  messageIds: string[],
  accessToken: string,
  onProgress?: (completed: number, total: number) => void
): Promise<void> {
  if (!accessToken || messageIds.length === 0) return

  console.log(`🔄 Starting background prefetch for ${messageIds.length} emails...`)

  await emailBodyCache.prefetch(
    messageIds,
    async (messageId) => {
      const response = await fetch(`/api/emails/content/${messageId}`, {
        headers: {
          'X-Outlook-Access-Token': accessToken,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch ${messageId}`)
      }

      const data: EmailContentResponse = await response.json()
      
      if (!data.success || !data.content) {
        throw new Error('Invalid response')
      }

      return {
        body: data.content.body.content,
        htmlBody: data.content.body.contentType === 'html' ? data.content.body.content : '',
        attachments: data.content.attachments || [],
      }
    },
    {
      maxConcurrent: 5,
      onProgress,
    }
  )
}

