/**
 * Response Generation Types
 */

export type ResponseTone = 'professional' | 'casual' | 'friendly' | 'formal';
export type ResponseLength = 'brief' | 'standard' | 'detailed';
export type ResponseStyle = 'direct' | 'thoughtful' | 'diplomatic';

export interface ResponseContext {
  tone?: ResponseTone;
  length?: ResponseLength;
  style?: ResponseStyle;
  includeAction?: boolean;
  threadHistory?: string;
  isReply?: boolean;
}

export interface ResponseAlternative {
  label: string;
  response: string;
}

export interface ResponseSuggestion {
  suggestedResponse: string;
  reasoning: string;
  tone: ResponseTone;
  alternatives: ResponseAlternative[];
  confidence: number; // 0-100
  warnings: string[];
}

export interface QuickReply {
  text: string;
  icon: string;
}

export interface CachedResponse {
  response: ResponseSuggestion;
  context: ResponseContext;
  generatedAt: string;
}

export interface ResponseAnalyticsEntry {
  emailId: string;
  model: string;
  tokenCount: number;
  cost: number;
  timestamp: number;
}
