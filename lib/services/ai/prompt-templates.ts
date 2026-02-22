/**
 * AI Prompt Templates
 * Reusable prompts for various email analysis tasks
 */

import type { Email } from "@/lib/types/email";

/**
 * System prompt for email analysis
 */
export const SYSTEM_PROMPT = `You are an AI assistant specialized in analyzing and organizing emails for busy professionals. Your role is to:

1. Analyze email content for priority, urgency, and sentiment
2. Extract actionable items and deadlines
3. Categorize and cluster related emails
4. Suggest intelligent responses and actions
5. Identify calendar events and meetings

Provide concise, actionable insights that help users manage their inbox efficiently.`;

/**
 * Generate a prompt for analyzing email priority
 */
export function generatePriorityAnalysisPrompt(email: Email): string {
  return `Analyze this email and determine its priority level (0-100):

FROM: ${email.from}
SUBJECT: ${email.subject}
PREVIEW: ${email.preview}
CURRENT PRIORITY: ${email.priority}

Consider:
- Urgency indicators (deadlines, time-sensitive language, punctuation, etc.)
- Sender importance
- Action requirements
- Business impact

Respond with ONLY a number between 0-100.`;
}

/**
 * Generate a prompt for sentiment analysis
 */
export function generateSentimentAnalysisPrompt(email: Email): string {
  return `Analyze the sentiment of this email:

FROM: ${email.from}
SUBJECT: ${email.subject}
CONTENT: ${email.preview}

Respond with ONLY one word: positive, negative, or neutral`;
}

/**
 * Generate a prompt for extracting action items
 */
export function generateActionItemsPrompt(emails: Email[]): string {
  const emailList = emails
    .map(
      (e, i) =>
        `${i + 1}. FROM: ${e.from}\n   SUBJECT: ${e.subject}\n   PREVIEW: ${e.preview}`,
    )
    .join("\n\n");

  return `Analyze these emails and extract the top 3 most important action items:

${emailList}

For each action item, provide:
1. A concise description (max 100 characters)
2. The type: "reply", "calendar", or "action"

Format your response as a JSON array:
[
  {"text": "Action description", "type": "reply"},
  {"text": "Action description", "type": "calendar"},
  {"text": "Action description", "type": "action"}
]`;
}

/**
 * Generate a prompt for email clustering
 */
export function generateClusteringPrompt(email: Email): string {
  return `Categorize this email into ONE of these clusters:

FROM: ${email.from}
SUBJECT: ${email.subject}
PREVIEW: ${email.preview}

Available clusters:
- operations: Operational issues, logistics, event management
- content: Marketing, social media, creative content
- partnerships: Business partnerships, sponsorships, collaborations
- analytics: Data, reports, metrics, performance
- finance: Budget, payments, financial matters

Respond with ONLY the cluster name (lowercase).`;
}

/**
 * Generate a prompt for extracting calendar events
 */
export function generateCalendarExtractionPrompt(email: Email): string {
  return `Extract any calendar events, meetings, or deadlines from this email:

FROM: ${email.from}
SUBJECT: ${email.subject}
CONTENT: ${email.preview}

If there are any time-sensitive events or deadlines, respond with a JSON array:
[
  {
    "title": "Event title",
    "date": "YYYY-MM-DD",
    "time": "HH:MM AM/PM",
    "type": "deadline" | "meeting" | "review"
  }
]

If there are no calendar events, respond with an empty array: []`;
}

/**
 * Generate a prompt for email summary
 */
export function generateSummaryPrompt(emails: Email[]): string {
  const emailList = emails.map((e) => `• ${e.from}: ${e.subject}`).join("\n");

  return `Provide a brief summary of these ${emails.length} emails in 2-3 sentences:

${emailList}

Focus on the main themes and most critical items.`;
}

/**
 * Generate a prompt for smart reply suggestions
 */
export function generateReplyPrompt(email: Email): string {
  return `Suggest 3 brief, professional reply options for this email:

FROM: ${email.from}
SUBJECT: ${email.subject}
CONTENT: ${email.preview}

Provide 3 different tones:
1. Formal/professional
2. Friendly/casual
3. Brief/direct

Format as a JSON array of strings (max 150 characters each):
["Reply option 1", "Reply option 2", "Reply option 3"]`;
}

/**
 * Generate a prompt for email thread grouping
 */
export function generateThreadGroupingPrompt(emails: Email[]): string {
  const emailList = emails
    .map((e, i) => `${i + 1}. FROM: ${e.from} | SUBJECT: ${e.subject}`)
    .join("\n");

  return `Group these emails into conversation threads based on subject similarity and context:

${emailList}

Respond with a JSON object mapping email IDs to thread IDs:
{
  "1": 1,
  "2": 1,
  "3": 2,
  ...
}

Emails in the same thread should have the same thread ID.`;
}

/**
 * Generate a prompt for categorizing emails
 */
export function generateCategorizationPrompt(email: Email): string {
  return `Categorize this email into ONE category:

FROM: ${email.from}
SUBJECT: ${email.subject}
PREVIEW: ${email.preview}

Categories:
- urgent: Requires immediate attention or has a deadline
- work: Regular work communication
- automated: Automated notifications, receipts, newsletters

Respond with ONLY the category name (lowercase).`;
}
