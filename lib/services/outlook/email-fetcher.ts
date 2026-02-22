/**
 * Outlook Email Fetcher
 * Fetches emails from Microsoft Graph API and transforms to metadata format
 */

import type { OutlookMessage, OutlookMessagesResponse, OutlookDeltaResponse } from '@/lib/types/outlook'
import type { EmailMetadataInsert } from '@/lib/types/outlook'

const GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0'

/**
 * Fetch initial batch of emails (fast, returns immediately)
 * 
 * Returns the 100 most recent emails using regular /messages endpoint.
 * This is FAST (single request) and shows emails to user immediately.
 * 
 * Delta token establishment happens separately in background.
 */
export async function fetchInitialEmails(
  accessToken: string,
  maxEmails: number = 100
): Promise<{ emails: OutlookMessage[] }> {
  console.log(`📧 Fetching ${maxEmails} most recent emails...`)

  // Use regular messages endpoint - fast, supports ordering, single request
  const messagesUrl = `${GRAPH_API_BASE}/me/mailFolders/inbox/messages?$top=${maxEmails}&$orderby=receivedDateTime DESC&$select=id,subject,from,toRecipients,receivedDateTime,isRead,hasAttachments,importance,conversationId,bodyPreview`

  const messagesResponse = await fetch(messagesUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!messagesResponse.ok) {
    const errorText = await messagesResponse.text()
    console.error('❌ Failed to fetch messages:', messagesResponse.status, errorText)
    throw new Error(`Failed to fetch messages: ${messagesResponse.status} ${messagesResponse.statusText}`)
  }

  const messagesData: OutlookMessagesResponse = await messagesResponse.json()
  const emails = messagesData.value

  console.log(`✅ Fetched ${emails.length} recent emails (ready to display)`)

  return { emails }
}

/**
 * Establish delta token for future incremental syncs
 * 
 * BACKGROUND OPERATION: This drains the entire mailbox to get delta token.
 * Can take time for large mailboxes (1000+ emails = 20+ pages).
 * 
 * Should be called AFTER returning emails to user (fire-and-forget).
 * 
 * CRITICAL: Use FULL $select fields - the delta token "remembers" them
 * and will return these fields on all subsequent syncs.
 */
export async function establishDeltaToken(
  accessToken: string
): Promise<{ deltaLink: string | null; pagesDrained: number }> {
  console.log(`🔗 [Background] Establishing delta token...`)

  // Use full field selection - token will remember this for future syncs
  const selectFields = 'id,subject,from,toRecipients,receivedDateTime,isRead,hasAttachments,importance,conversationId,bodyPreview'
  const deltaUrl = `${GRAPH_API_BASE}/me/mailFolders/inbox/messages/delta?$select=${selectFields}&$top=50`
  
  let deltaLink: string | null = null
  let currentDeltaUrl: string | undefined = deltaUrl
  let pageCount = 0

  // No hard page limit - let it drain fully (with safety timeout)
  const startTime = Date.now()
  const timeoutMs = 60000 // 60 second timeout

  while (currentDeltaUrl) {
    // Safety timeout check
    if (Date.now() - startTime > timeoutMs) {
      console.error(`⏱️ Delta drain timeout after ${pageCount} pages (60s limit)`)
      break
    }

    pageCount++
    
    if (pageCount % 20 === 0) {
      console.log(`  🔗 [Background] Drained ${pageCount} pages...`)
    }

    try {
      const deltaResponse = await fetch(currentDeltaUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!deltaResponse.ok) {
        const errorText = await deltaResponse.text()
        console.error('❌ Delta drain failed:', deltaResponse.status, errorText)
        break
      }

      const deltaData: OutlookDeltaResponse = await deltaResponse.json()

      if (deltaData['@odata.deltaLink']) {
        deltaLink = deltaData['@odata.deltaLink']
        console.log(`✅ [Background] Delta token established! (${pageCount} pages drained)`)
        currentDeltaUrl = undefined
      } else if (deltaData['@odata.nextLink']) {
        currentDeltaUrl = deltaData['@odata.nextLink']
      } else {
        console.warn('⚠️ Delta drain ended without deltaLink')
        currentDeltaUrl = undefined
      }

      // Small delay every 20 pages to respect rate limits
      if (pageCount % 20 === 0 && currentDeltaUrl) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }

    } catch (err: any) {
      console.error('❌ Error during delta drain:', err.message)
      break
    }
  }

  const result = {
    deltaLink,
    pagesDrained: pageCount,
  }

  if (deltaLink) {
    console.log(`✅ [Background] Delta token ready: ${deltaLink.substring(0, 80)}...`)
  } else {
    console.warn(`⚠️ [Background] Delta token not established (drained ${pageCount} pages)`)
  }

  return result
}

/**
 * Fetch only new/changed emails using delta sync
 * 
 * CRITICAL: Delta sync also uses pagination - must drain all nextLink pages
 * until we get the final deltaLink for the next sync.
 * 
 * IMPORTANT: Delta links don't preserve $select - must append it manually
 */
export async function fetchDeltaEmails(
  accessToken: string,
  deltaLink: string
): Promise<{ emails: OutlookMessage[]; deltaLink: string }> {
  console.log('🔄 Fetching delta emails from Outlook (incremental sync)...')
  
  // CRITICAL: Append $select to delta link (not preserved by Microsoft)
  const selectFields = 'id,subject,from,toRecipients,receivedDateTime,isRead,hasAttachments,importance,conversationId,bodyPreview'
  const separator = deltaLink.includes('?') ? '&' : '?'
  const deltaUrlWithSelect = `${deltaLink}${separator}$select=${selectFields}`
  
  console.log(`🔗 Using saved delta link with field selection: ${deltaUrlWithSelect.substring(0, 100)}...`)

  let allNewEmails: OutlookMessage[] = []
  let currentUrl: string | undefined = deltaUrlWithSelect
  let newDeltaLink: string | undefined
  let pageCount = 0
  const maxPages = 50 // Delta syncs can have many pages if user was offline

  // Drain all delta pages until we get the new deltaLink
  while (currentUrl && pageCount < maxPages) {
    pageCount++

    const response = await fetch(currentUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Failed to fetch delta emails:', response.status, errorText)
      
      // Handle syncStateNotFound - delta token expired, need full re-sync
      if (errorText.includes('syncStateNotFound') || response.status === 410) {
        console.log('♻️ Delta token expired (syncStateNotFound)')
        console.log('   Falling back to full initial sync...')
        throw new Error('DELTA_EXPIRED') // Special error for caller to handle
      }
      
      throw new Error(`Failed to fetch delta emails: ${response.status} ${response.statusText}`)
    }

    const data: OutlookDeltaResponse = await response.json()
    
    if (pageCount === 1) {
      console.log(`  - Received ${data.value.length} new/changed emails`)
    } else {
      console.log(`  - Page ${pageCount}: ${data.value.length} emails`)
    }

    // Add emails from this page
    allNewEmails = allNewEmails.concat(data.value)

    // Check for new delta link (final page) or next link (more pages)
    if (data['@odata.deltaLink']) {
      newDeltaLink = data['@odata.deltaLink']
      console.log(`✅ New delta link received! (page ${pageCount})`)
      currentUrl = undefined // Stop pagination
    } else if (data['@odata.nextLink']) {
      console.log(`  - More delta pages available, following nextLink...`)
      currentUrl = data['@odata.nextLink']
    } else {
      console.warn('⚠️ No deltaLink or nextLink in delta response')
      currentUrl = undefined
    }
  }

  if (!newDeltaLink) {
    console.error('❌ Failed to get new delta link after draining delta pages')
    throw new Error('New delta link not available - delta sync failed')
  }

  console.log(`✅ Delta sync complete: ${allNewEmails.length} new/changed emails across ${pageCount} page(s)`)
  console.log(`🔗 New delta link secured for next sync`)

  return {
    emails: allNewEmails,
    deltaLink: newDeltaLink, // Return new delta link for next sync
  }
}

/**
 * Transform Outlook message to email metadata format
 */
export function transformToMetadata(
  outlookEmail: OutlookMessage,
  userId: string
): EmailMetadataInsert {
  // Handle missing fields with fallbacks (delta sync can have partial data)
  const fromEmail = outlookEmail.from?.emailAddress
  const fromName = fromEmail?.name || fromEmail?.address || 'Unknown Sender'
  const fromAddress = fromEmail?.address || 'unknown@unknown.com'
  
  // Use fallback timestamp if missing (current time)
  const receivedAt = outlookEmail.receivedDateTime || new Date().toISOString()

  return {
    user_id: userId,
    outlook_message_id: outlookEmail.id,
    subject: outlookEmail.subject || '(No Subject)',
    from_name: fromName,
    from_address: fromAddress,
    received_at: receivedAt,
    conversation_id: outlookEmail.conversationId || null,
    is_read: outlookEmail.isRead ?? false,
    has_attachments: outlookEmail.hasAttachments ?? false,
    importance: outlookEmail.importance || 'normal',
    ai_status: 'pending',
  }
}

/**
 * Transform multiple emails to metadata format
 * Uses fallbacks for missing fields instead of filtering out emails
 */
export function transformEmailsToMetadata(
  outlookEmails: OutlookMessage[],
  userId: string
): EmailMetadataInsert[] {
  console.log(`🔄 Transforming ${outlookEmails.length} emails from delta sync...`)
  
  // Filter out only truly invalid emails (no ID at all)
  const validEmails = outlookEmails.filter((email) => {
    if (!email.id) {
      console.warn('⚠️ Skipping email with no ID:', JSON.stringify(email).substring(0, 100))
      return false
    }
    return true
  })
  
  // Log warnings for missing fields but use fallbacks
  validEmails.forEach((email) => {
    if (!email.receivedDateTime) {
      console.warn(`⚠️ Email ${email.id} missing receivedDateTime - using fallback`)
    }
    if (!email.from) {
      console.warn(`⚠️ Email ${email.id} missing from field - using fallback`)
    }
  })
  
  console.log(`✅ Transforming ${validEmails.length} emails (${outlookEmails.length - validEmails.length} skipped)`)
  
  return validEmails.map((email) => transformToMetadata(email, userId))
}

/**
 * Transform delta email to partial update (only changed fields)
 * Used for delta sync when email already exists in DB
 */
export function transformToPartialUpdate(
  outlookEmail: OutlookMessage,
  userId: string
): Partial<EmailMetadataInsert> & { outlook_message_id: string; user_id: string } {
  // Always include ID and user_id for upsert matching
  const update: Partial<EmailMetadataInsert> & { outlook_message_id: string; user_id: string } = {
    outlook_message_id: outlookEmail.id,
    user_id: userId,
  }
  
  // Only include fields that are present in the delta response
  if (outlookEmail.subject !== undefined) {
    update.subject = outlookEmail.subject || '(No Subject)'
  }
  
  if (outlookEmail.from?.emailAddress) {
    const fromEmail = outlookEmail.from.emailAddress
    update.from_name = fromEmail.name || fromEmail.address || 'Unknown Sender'
    update.from_address = fromEmail.address || 'unknown@unknown.com'
  }
  
  if (outlookEmail.receivedDateTime !== undefined) {
    update.received_at = outlookEmail.receivedDateTime
  }
  
  if (outlookEmail.conversationId !== undefined) {
    update.conversation_id = outlookEmail.conversationId || null
  }
  
  if (outlookEmail.isRead !== undefined) {
    update.is_read = outlookEmail.isRead
  }
  
  if (outlookEmail.hasAttachments !== undefined) {
    update.has_attachments = outlookEmail.hasAttachments
  }
  
  if (outlookEmail.importance !== undefined) {
    update.importance = outlookEmail.importance || 'normal'
  }
  
  return update
}
