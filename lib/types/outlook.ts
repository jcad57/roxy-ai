/**
 * Outlook Integration Types
 * Types for Outlook connection and email metadata
 */

import { Database } from '../supabase/types'

// =====================================================
// DATABASE TABLE TYPES
// =====================================================

export type EmailMetadata = Database['public']['Tables']['email_metadata']['Row']
export type EmailMetadataInsert = Database['public']['Tables']['email_metadata']['Insert']
export type EmailMetadataUpdate = Database['public']['Tables']['email_metadata']['Update']

export type OutlookConnection = Database['public']['Tables']['outlook_connections']['Row']
export type OutlookConnectionInsert = Database['public']['Tables']['outlook_connections']['Insert']
export type OutlookConnectionUpdate = Database['public']['Tables']['outlook_connections']['Update']

// =====================================================
// AI STATUS TYPES
// =====================================================

export type AIStatus = 'pending' | 'processing' | 'enriched' | 'failed' | 'skipped'
export type SyncStatus = 'active' | 'disconnected' | 'error'
export type EmailImportance = 'low' | 'normal' | 'high'

// =====================================================
// OUTLOOK API RESPONSE TYPES (from Microsoft Graph)
// =====================================================

export interface OutlookEmailAddress {
  name: string
  address: string
}

export interface OutlookEmailRecipient {
  emailAddress: OutlookEmailAddress
}

export interface OutlookEmailBody {
  contentType: 'text' | 'html'
  content: string
}

export interface OutlookMessage {
  id: string
  subject: string
  from: OutlookEmailRecipient
  toRecipients: OutlookEmailRecipient[]
  ccRecipients?: OutlookEmailRecipient[]
  receivedDateTime: string
  sentDateTime: string
  bodyPreview: string
  body: OutlookEmailBody
  isRead: boolean
  hasAttachments: boolean
  importance: EmailImportance
  conversationId: string
  internetMessageId?: string
}

export interface OutlookMessagesResponse {
  '@odata.context': string
  '@odata.nextLink'?: string
  '@odata.deltaLink'?: string
  value: OutlookMessage[]
}

export interface OutlookDeltaResponse extends OutlookMessagesResponse {
  '@odata.deltaLink': string
}

export interface OutlookUserProfile {
  id: string
  userPrincipalName: string
  displayName: string
  mail: string
  businessPhones: string[]
  jobTitle: string | null
  mobilePhone: string | null
  officeLocation: string | null
}

// =====================================================
// ENRICHED EMAIL TYPE (combines metadata + enrichments)
// =====================================================

export interface EnrichedEmailWithMetadata extends EmailMetadata {
  ai_priority?: number | null
  priority_reason?: string | null
  summary?: string | null
  ai_sentiment?: 'positive' | 'negative' | 'neutral' | null
  ai_category?: 'urgent' | 'work' | 'automated' | 'personal' | null
  ai_cluster?: 'operations' | 'content' | 'partnerships' | 'analytics' | 'finance' | 'other' | null
  suggested_tags?: string[]
  action_items?: any
  key_dates?: any
  needs_reply?: boolean
  estimated_read_time?: number | null
  analyzed_at?: string
  analysis_version?: string
  model?: string
}

// =====================================================
// SYNC TYPES
// =====================================================

export interface SyncResult {
  success: boolean
  emailsFetched: number
  newEmails: number
  updatedEmails: number
  deltaLink?: string
  error?: string
}

export interface EmailSyncOptions {
  initialSync?: boolean
  maxEmails?: number
  folderIds?: string[]
}

// =====================================================
// EMAIL CONTENT CACHE (for on-demand fetching)
// =====================================================

export interface EmailContentCache {
  outlookMessageId: string
  htmlContent: string
  textContent: string
  fetchedAt: Date
}

// =====================================================
// HELPER TYPES
// =====================================================

export interface OutlookAuthTokens {
  accessToken: string
  refreshToken?: string
  expiresOn: number
}

export interface EmailBatchAnalysisRequest {
  emails: EmailMetadata[]
  userId: string
}

export interface EmailAnalysisResult {
  outlookMessageId: string
  success: boolean
  enrichment?: any
  error?: string
}
