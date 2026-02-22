/**
 * Combined Email Analyzer
 * Single API call to extract all email enrichments (cost-optimized)
 */

import Anthropic from '@anthropic-ai/sdk'
import type { EmailMetadata } from '@/lib/types/outlook'

// Claude Haiku 4.5 - Latest fast model with near-frontier intelligence
const HAIKU_MODEL = 'claude-haiku-4-5-20251001'

let client: Anthropic | null = null

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey || apiKey === 'your_api_key_here') {
      throw new Error('ANTHROPIC_API_KEY not configured')
    }
    client = new Anthropic({ apiKey })
  }
  return client
}

/**
 * Extract JSON from Claude's response
 */
function extractJSON(text: string): any {
  let cleaned = text.trim()

  // Remove markdown code blocks
  cleaned = cleaned.replace(/^```json?\s*/i, '')
  cleaned = cleaned.replace(/```\s*$/, '')

  // Find JSON object
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    cleaned = jsonMatch[0]
  }

  try {
    return JSON.parse(cleaned)
  } catch (error) {
    console.error('Failed to parse JSON:', cleaned)
    throw new Error('Invalid JSON response from AI')
  }
}

/**
 * Combined AI enrichment result
 */
export interface CombinedEnrichment {
  priority: number
  priority_reason: string
  sentiment: 'positive' | 'negative' | 'neutral'
  category: 'urgent' | 'work' | 'automated' | 'personal'
  cluster: 'operations' | 'content' | 'partnerships' | 'analytics' | 'finance' | 'other'
  tags: string[]
  action_items: Array<{
    task: string
    due_date: string | null
    priority: 'high' | 'medium' | 'low'
  }>
  key_dates: Array<{
    date: string
    description: string
    type: 'deadline' | 'meeting' | 'reminder' | 'event'
  }>
  needs_reply: boolean
  estimated_read_time: number
  summary: string
}

/**
 * Analyze email and extract all enrichments in ONE API call
 */
export async function analyzeCombined(
  email: EmailMetadata
): Promise<CombinedEnrichment> {
  const client = getClient()

  const systemPrompt = `You are an email analysis assistant. Analyze emails and return structured JSON with enrichment data.

Return ONLY valid JSON with these exact fields:
{
  "priority": 1-100 (100 = most urgent),
  "priority_reason": "Brief one-sentence explanation",
  "sentiment": "positive" | "negative" | "neutral",
  "category": "urgent" | "work" | "automated" | "personal",
  "cluster": "operations" | "content" | "partnerships" | "analytics" | "finance" | "other",
  "tags": ["tag1", "tag2"] (2-5 relevant tags from common business categories),
  "action_items": [{"task": "...", "due_date": "YYYY-MM-DD or null", "priority": "high|medium|low"}],
  "key_dates": [{"date": "YYYY-MM-DD", "description": "...", "type": "deadline|meeting|reminder|event"}],
  "needs_reply": true|false,
  "estimated_read_time": 1-10 (minutes),
  "summary": "Brief 1-2 sentence summary"
}

Return ONLY the JSON object. No markdown, no explanations.`

  const userPrompt = `Analyze this email:

From: ${email.from_name} <${email.from_address}>
Subject: ${email.subject}
Date: ${email.received_at}
Importance: ${email.importance}

Provide complete analysis in JSON format.`

  try {
    const response = await client.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 1024,
      temperature: 0,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt },
        { role: 'assistant', content: '{' }, // Prefill for JSON
      ],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    // Add opening brace back (was prefilled)
    const fullJson = '{' + content.text
    const parsed = extractJSON(fullJson)

    // Validate required fields
    if (
      typeof parsed.priority !== 'number' ||
      !parsed.sentiment ||
      !parsed.category ||
      !Array.isArray(parsed.tags)
    ) {
      throw new Error('Invalid enrichment structure')
    }

    return parsed as CombinedEnrichment
  } catch (error: any) {
    console.error('❌ AI analysis failed:', error.message)
    throw error
  }
}

/**
 * Analyze multiple emails in parallel (with concurrency limit)
 */
export async function analyzeBatch(
  emails: EmailMetadata[],
  concurrency: number = 10
): Promise<Array<{ outlookMessageId: string; success: boolean; enrichment?: CombinedEnrichment; error?: string }>> {
  console.log(`🤖 Analyzing ${emails.length} emails in batches of ${concurrency}...`)

  const results: Array<{
    outlookMessageId: string
    success: boolean
    enrichment?: CombinedEnrichment
    error?: string
  }> = []

  // Process in batches to avoid overwhelming the API
  for (let i = 0; i < emails.length; i += concurrency) {
    const batch = emails.slice(i, i + concurrency)
    console.log(`  Processing batch ${Math.floor(i / concurrency) + 1}/${Math.ceil(emails.length / concurrency)}`)

    const batchPromises = batch.map(async (email) => {
      try {
        const enrichment = await analyzeCombined(email)
        return {
          outlookMessageId: email.outlook_message_id,
          success: true,
          enrichment,
        }
      } catch (error: any) {
        return {
          outlookMessageId: email.outlook_message_id,
          success: false,
          error: error.message,
        }
      }
    })

    const batchResults = await Promise.allSettled(batchPromises)

    batchResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        results.push(result.value)
      } else {
        results.push({
          outlookMessageId: 'unknown',
          success: false,
          error: result.reason?.message || 'Unknown error',
        })
      }
    })
  }

  const successCount = results.filter((r) => r.success).length
  const failCount = results.filter((r) => !r.success).length

  console.log(`✅ Batch analysis complete: ${successCount} success, ${failCount} failed`)

  return results
}
