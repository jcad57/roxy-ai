/**
 * Raw Email Types
 * Represents email data as it comes from Outlook/Microsoft Graph API
 * No AI analysis included - this is pure email provider data
 */

export interface RawEmail {
  // Core email data from Outlook
  id: string; // Changed to string to match Outlook Graph API
  subject: string;
  bodyPreview: string; // First 255 chars of body
  from: {
    name: string;
    address: string;
  };
  receivedDateTime: string; // ISO 8601 format
  isRead: boolean;
  hasAttachments: boolean;
  importance: "low" | "normal" | "high"; // Outlook's importance flag
  
  // Optional Outlook fields
  conversationId?: string;
  categories?: string[]; // User-defined categories in Outlook
  flag?: {
    flagStatus: "notFlagged" | "complete" | "flagged";
  };
}

/**
 * AI Enrichment Data
 * Stored separately and joined with raw email data
 * This is what our AI analysis produces and stores
 */
export interface EmailAIEnrichment {
  emailId: string;
  
  // Core analysis
  aiPriority: number; // 0-100 AI-calculated priority
  priorityReason?: string;
  summary?: string;
  
  // Classification
  aiSentiment: "positive" | "negative" | "neutral";
  aiCluster: "operations" | "content" | "partnerships" | "analytics" | "finance" | "other";
  aiCategory: "urgent" | "work" | "automated" | "personal";
  
  // Extracted data
  actionItems?: Array<{
    task: string;
    deadline?: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  keyDates?: Array<{
    date: string;
    description: string;
    type: 'deadline' | 'meeting' | 'event' | 'reminder';
  }>;
  suggestedTags?: string[];
  
  // Metadata
  needsReply?: boolean;
  estimatedReadTime?: number;
  analyzedAt: string; // ISO timestamp
  analysisVersion: string; // e.g., "v2"
  model?: 'haiku' | 'sonnet';
}

/**
 * Enriched Email
 * Combination of raw email + AI enrichment for display
 */
export interface EnrichedEmail extends RawEmail {
  // AI enrichment (optional - may not be analyzed yet)
  enrichment?: EmailAIEnrichment;
}
