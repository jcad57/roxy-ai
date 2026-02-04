/**
 * AI Services
 * Central export for all AI-related services
 */

// Client
export {
  getAnthropicClient,
  resetAnthropicClient,
  isAnthropicConfigured,
  CLAUDE_MODELS,
  type ClaudeModel,
} from "./anthropic-client";

// Email Analysis
export {
  analyzeEmailPriority,
  analyzeEmailSentiment,
  generateAISuggestions,
  clusterEmail,
  categorizeEmail,
  generateEmailSummary,
  generateReplySuggestions,
  batchAnalyzeEmails,
} from "./email-analyzer";

// Prompt Templates (for advanced usage)
export * from "./prompt-templates";
