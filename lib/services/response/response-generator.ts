/**
 * Response Generator Service
 * AI-powered email response generation
 */

import Anthropic from '@anthropic-ai/sdk';
import type { EnrichedEmail } from '@/lib/types/email-raw';
import type {
  ResponseSuggestion,
  ResponseContext,
  QuickReply,
  ResponseTone,
} from '@/lib/types/response';
import { generateTemplateResponse, generateQuickReplyTemplates } from './response-templates';

const HAIKU_MODEL = 'claude-3-haiku-20240307';
const SONNET_MODEL = 'claude-sonnet-4-5-20250929'; // Updated to active model (Feb 2026)

// Cost per 1M tokens (as of 2026)
const COSTS = {
  haiku: { input: 0.25, output: 1.25 },
  sonnet: { input: 3.00, output: 15.00 },
};

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

/**
 * Select appropriate model based on email priority
 */
function selectModel(priority: number): string {
  if (priority >= 95) {
    return SONNET_MODEL; // Best quality for critical
  }
  return HAIKU_MODEL; // Fast + cheap for standard
}

/**
 * Build prompt for response generation
 */
function buildResponsePrompt(
  email: EnrichedEmail,
  context: ResponseContext
): string {
  const tone = context.tone || 'professional';
  const length = context.length || 'standard';
  const style = context.style || 'thoughtful';
  const includeAction = context.includeAction !== false;

  const lengthGuide = {
    brief: '2-3 sentences',
    standard: '1 paragraph (4-6 sentences)',
    detailed: '2-3 paragraphs',
  };

  let prompt = `You are a professional email assistant. Generate a response to this email.

CONTEXT:
From: ${email.from.name} <${email.from.address}>
Subject: ${email.subject}
Received: ${email.receivedDateTime}
Priority: ${email.enrichment?.aiPriority || 50}/100
Category: ${email.enrichment?.aiCategory || 'work'}

EMAIL CONTENT:
${email.bodyPreview}

`;

  // Add thread history if available
  if (context.threadHistory) {
    prompt += `PREVIOUS EMAILS IN THREAD:
${context.threadHistory}

`;
  }

  prompt += `RESPONSE REQUIREMENTS:
- Tone: ${tone} (adjust language and formality accordingly)
- Length: ${length} (${lengthGuide[length]})
- Style: ${style}
- Include action items/next steps: ${includeAction}

`;

  // Add extracted context
  if (email.enrichment?.actionItems && email.enrichment.actionItems.length > 0) {
    prompt += `EXTRACTED ACTION ITEMS FROM EMAIL:
${email.enrichment.actionItems.map(a => `- ${a.task}${a.deadline ? ` (Due: ${a.deadline})` : ''}`).join('\n')}

`;
  }

  if (email.enrichment?.keyDates && email.enrichment.keyDates.length > 0) {
    prompt += `KEY DATES MENTIONED:
${email.enrichment.keyDates.map(d => `- ${d.description} on ${d.date}`).join('\n')}

`;
  }

  prompt += `Generate a response that:
1. Acknowledges the key points raised
2. Addresses all action items or questions
3. Provides clear next steps if applicable
4. Maintains appropriate ${tone} tone
5. Is ready to send with minimal edits
6. Does NOT include a signature (user will add their own)

OUTPUT FORMAT (JSON):
{
  "suggestedResponse": "<the email response body, no signature>",
  "reasoning": "<1-2 sentences explaining your approach>",
  "alternatives": [
    { "label": "<alternative scenario>", "response": "<alternative response>" }
  ],
  "confidence": <0-100, your confidence in this response>,
  "warnings": [<array of any concerns, e.g. "Multiple questions detected", "Sensitive topic">]
}

Return ONLY the JSON, no other text.`;

  return prompt;
}

/**
 * Generate full response for email
 */
export async function generateResponse(
  email: EnrichedEmail,
  context: ResponseContext = {}
): Promise<ResponseSuggestion> {
  try {
    const client = getClient();
    const priority = email.enrichment?.aiPriority || 50;
    const model = selectModel(priority);
    
    console.log(`🤖 Generating response for email ${email.id} (priority: ${priority}, model: ${model})`);
    
    const prompt = buildResponsePrompt(email, context);
    
    const response = await client.messages.create({
      model,
      max_tokens: 1500,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const parsed = JSON.parse(content.text);
      
      return {
        suggestedResponse: parsed.suggestedResponse || '',
        reasoning: parsed.reasoning || '',
        tone: context.tone || 'professional',
        alternatives: parsed.alternatives || [],
        confidence: parsed.confidence || 80,
        warnings: parsed.warnings || [],
      };
    }

    throw new Error('Unexpected response format');
  } catch (error) {
    console.error('Error generating response:', error);
    
    // Fallback to template
    return {
      suggestedResponse: generateTemplateResponse(email),
      reasoning: 'Generated from template (AI unavailable)',
      tone: context.tone || 'professional',
      alternatives: [],
      confidence: 50,
      warnings: ['AI generation failed, using template'],
    };
  }
}

/**
 * Generate single AI-suggested response (fast, cheap)
 */
export async function generateQuickReplies(
  email: EnrichedEmail
): Promise<QuickReply[]> {
  try {
    const client = getClient();
    
    const prompt = `Generate ONE professional email response for this email. Make it 2-3 sentences and ready to send.

From: ${email.from.name}
Subject: ${email.subject}
Preview: ${email.bodyPreview.substring(0, 200)}

Return JSON with a single suggested response:
{
  "text": "<professional 2-3 sentence response>",
  "icon": "✨"
}

Example:
{
  "text": "Thanks for bringing this to my attention. I'll review the details and get back to you by EOD with my decision.",
  "icon": "✨"
}

Return ONLY the JSON object.`;

    const response = await client.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 200,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const reply = JSON.parse(content.text);
      return [reply]; // Return as single-item array
    }

    throw new Error('Unexpected response format');
  } catch (error) {
    console.error('Error generating quick reply:', error);
    
    // Fallback to templates (return only first one)
    const templates = generateQuickReplyTemplates(email);
    return templates.slice(0, 1);
  }
}

/**
 * Regenerate response with different tone
 */
export async function regenerateWithTone(
  email: EnrichedEmail,
  previousResponse: string,
  newTone: ResponseTone
): Promise<ResponseSuggestion> {
  try {
    const client = getClient();
    
    const prompt = `Rewrite this email response with a different tone.

ORIGINAL RESPONSE:
${previousResponse}

NEW TONE: ${newTone}

Maintain the same content and key points, but adjust the language and formality to match the ${newTone} tone.

Return JSON:
{
  "suggestedResponse": "<rewritten response>",
  "reasoning": "<brief explanation of changes>"
}`;

    const response = await client.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 1000,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const parsed = JSON.parse(content.text);
      
      return {
        suggestedResponse: parsed.suggestedResponse,
        reasoning: parsed.reasoning,
        tone: newTone,
        alternatives: [],
        confidence: 85,
        warnings: [],
      };
    }

    throw new Error('Unexpected response format');
  } catch (error) {
    console.error('Error regenerating with tone:', error);
    throw error;
  }
}

/**
 * Estimate cost for generating response
 */
export function estimateResponseCost(priority: number): number {
  const model = selectModel(priority);
  const avgInputTokens = 800; // Estimated
  const avgOutputTokens = 500; // Estimated
  
  const cost = model === SONNET_MODEL
    ? (avgInputTokens * COSTS.sonnet.input + avgOutputTokens * COSTS.sonnet.output) / 1_000_000
    : (avgInputTokens * COSTS.haiku.input + avgOutputTokens * COSTS.haiku.output) / 1_000_000;
  
  return Math.round(cost * 10000) / 10000; // Round to 4 decimals
}
