/**
 * Email Content Fetcher
 * Fetches full email content (body, attachments) from Microsoft Graph API on-demand
 */

export interface EmailContent {
  outlookMessageId: string
  subject: string
  from: {
    name: string
    address: string
  }
  to: Array<{
    name: string
    address: string
  }>
  cc?: Array<{
    name: string
    address: string
  }>
  receivedDateTime: string
  hasAttachments: boolean
  importance: string
  bodyPreview: string
  body: {
    contentType: 'text' | 'html'
    content: string
  }
  attachments?: Array<{
    id: string
    name: string
    contentType: string
    size: number
  }>
  conversationId: string
  internetMessageId: string
}

/**
 * Fetch full email content from Graph API
 */
export async function fetchEmailContent(
  messageId: string,
  accessToken: string
): Promise<EmailContent> {
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/messages/${messageId}?$select=id,subject,from,toRecipients,ccRecipients,receivedDateTime,hasAttachments,importance,bodyPreview,body,conversationId,internetMessageId`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  )

  if (!response.ok) {
    const error = await response.text()
    console.error('❌ Failed to fetch email content:', error)
    throw new Error(`Failed to fetch email content: ${response.status}`)
  }

  const data = await response.json()

  // Transform Graph API response to our format
  return {
    outlookMessageId: data.id,
    subject: data.subject || '(No Subject)',
    from: {
      name: data.from?.emailAddress?.name || 'Unknown',
      address: data.from?.emailAddress?.address || '',
    },
    to: (data.toRecipients || []).map((recipient: any) => ({
      name: recipient.emailAddress?.name || '',
      address: recipient.emailAddress?.address || '',
    })),
    cc: (data.ccRecipients || []).map((recipient: any) => ({
      name: recipient.emailAddress?.name || '',
      address: recipient.emailAddress?.address || '',
    })),
    receivedDateTime: data.receivedDateTime,
    hasAttachments: data.hasAttachments || false,
    importance: data.importance || 'normal',
    bodyPreview: data.bodyPreview || '',
    body: {
      contentType: data.body?.contentType === 'html' ? 'html' : 'text',
      content: data.body?.content || '',
    },
    conversationId: data.conversationId || '',
    internetMessageId: data.internetMessageId || '',
  }
}

/**
 * Fetch email attachments list
 */
export async function fetchEmailAttachments(
  messageId: string,
  accessToken: string
): Promise<any[]> {
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/messages/${messageId}/attachments?$select=id,name,contentType,size`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  )

  if (!response.ok) {
    console.error('❌ Failed to fetch attachments')
    return []
  }

  const data = await response.json()
  return data.value || []
}

/**
 * Fetch conversation thread (all messages in a conversation)
 */
export async function fetchConversationThread(
  conversationId: string,
  accessToken: string
): Promise<EmailContent[]> {
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/messages?$filter=conversationId eq '${conversationId}'&$orderby=receivedDateTime asc&$select=id,subject,from,toRecipients,receivedDateTime,hasAttachments,importance,bodyPreview,body,conversationId`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  )

  if (!response.ok) {
    console.error('❌ Failed to fetch conversation thread')
    return []
  }

  const data = await response.json()

  // Transform all messages in thread
  return (data.value || []).map((msg: any) => ({
    outlookMessageId: msg.id,
    subject: msg.subject || '(No Subject)',
    from: {
      name: msg.from?.emailAddress?.name || 'Unknown',
      address: msg.from?.emailAddress?.address || '',
    },
    to: (msg.toRecipients || []).map((recipient: any) => ({
      name: recipient.emailAddress?.name || '',
      address: recipient.emailAddress?.address || '',
    })),
    receivedDateTime: msg.receivedDateTime,
    hasAttachments: msg.hasAttachments || false,
    importance: msg.importance || 'normal',
    bodyPreview: msg.bodyPreview || '',
    body: {
      contentType: msg.body?.contentType === 'html' ? 'html' : 'text',
      content: msg.body?.content || '',
    },
    conversationId: msg.conversationId || '',
    internetMessageId: msg.internetMessageId || '',
  }))
}
