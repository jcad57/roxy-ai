/**
 * AI Analysis Types
 * Comprehensive types for email AI enrichment
 */

export interface ActionItem {
  task: string;
  deadline?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface KeyDate {
  date: string;
  description: string;
  type: 'deadline' | 'meeting' | 'event' | 'reminder';
}

export interface EmailAnalysis {
  // Core fields
  priority: number; // 0-100
  priorityReason: string;
  summary: string;
  
  // Classification
  sentiment: 'positive' | 'neutral' | 'negative';
  category: 'urgent' | 'work' | 'automated' | 'personal';
  cluster: 'operations' | 'content' | 'partnerships' | 'analytics' | 'finance' | 'other';
  
  // Extracted data
  actionItems: ActionItem[];
  keyDates: KeyDate[];
  suggestedTags: string[];
  
  // Metadata
  needsReply: boolean;
  estimatedReadTime: number; // minutes
  
  // Processing info
  analyzedAt: string;
  analysisVersion: string;
  model: 'haiku' | 'sonnet';
}

export interface QuickAnalysis {
  priority: number;
  category: 'urgent' | 'work' | 'automated' | 'personal';
}

export interface BatchAnalysisRequest {
  emails: Array<{
    id: string;
    from: string;
    subject: string;
    bodyPreview: string;
    receivedDateTime: string;
  }>;
  maxBatchSize?: number;
}

export interface BatchAnalysisResponse {
  results: Array<{
    emailId: string;
    analysis: EmailAnalysis;
    error?: string;
  }>;
  processedCount: number;
  failedCount: number;
  cost: {
    inputTokens: number;
    outputTokens: number;
    estimatedCostUSD: number;
  };
}
