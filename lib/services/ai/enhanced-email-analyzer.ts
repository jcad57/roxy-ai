/**
 * Enhanced Email Analyzer Service
 * Production-ready AI analysis with tiered approach and batch processing
 */

import Anthropic from "@anthropic-ai/sdk";
import type { RawEmail } from "@/lib/types/email-raw";
import type {
  EmailAnalysis,
  QuickAnalysis,
  BatchAnalysisResponse,
  ActionItem,
  KeyDate,
} from "@/lib/types/ai-analysis";

// Claude Haiku 4.5 - Latest fast model with near-frontier intelligence
const HAIKU_MODEL = "claude-haiku-4-5-20251001";
// Claude Sonnet 4.6 - Best combination of speed and intelligence
const SONNET_MODEL = "claude-sonnet-4-6";

// Cost per 1M tokens (as of Feb 2026)
const COSTS = {
  haiku: { input: 1.0, output: 5.0 },  // Haiku 4.5 pricing
  sonnet: { input: 3.0, output: 15.0 }, // Sonnet 4.6 pricing
};

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === "your_api_key_here") {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

/**
 * Extract JSON from Claude's response
 * Handles markdown code blocks and extra text
 */
function extractJSON(text: string): any {
  // Remove markdown code blocks if present
  let cleaned = text.trim();

  // Remove ```json and ``` markers
  cleaned = cleaned.replace(/^```json?\s*/i, "");
  cleaned = cleaned.replace(/```\s*$/, "");

  // Try to find JSON object between curly braces
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  // If no match, try parsing the whole thing
  return JSON.parse(cleaned);
}

/**
 * Quick analysis using Haiku (fast, cheap)
 * Only analyzes subject, from, and preview
 */
export async function quickAnalyze(email: RawEmail): Promise<QuickAnalysis> {
  const client = getClient();

  const prompt = `Analyze this email and return ONLY valid JSON.

Email:
From: ${email.from.name}
Subject: ${email.subject}
Preview: ${email.bodyPreview.substring(0, 200)}

Priority scoring:
90-100: Urgent, same-day deadline or critical blocker
70-89: Important, needs action within 48 hours
40-69: Standard work, no immediate deadline
0-39: FYI, automated, no action needed

Categories: urgent, work, automated, personal

CRITICAL: Return ONLY the JSON object below with no additional text, explanations, or markdown formatting.

Example format:
{"priority": 75, "category": "work"}`;

  try {
    const response = await client.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 150,
      temperature: 0,
      messages: [
        { role: "user", content: prompt },
        { role: "assistant", content: "{" }, // Prefill to force JSON output
      ],
    });

    const content = response.content[0];
    if (content.type === "text") {
      // Prepend the opening brace we used in prefill
      const fullResponse = "{" + content.text;
      const result = extractJSON(fullResponse);
      return {
        priority: Math.min(Math.max(result.priority || 50, 0), 100),
        category: result.category || "work",
      };
    }
  } catch (error) {
    console.error("Quick analysis failed:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
  }

  return { priority: 50, category: "work" };
}

/**
 * Deep analysis using Sonnet (comprehensive, expensive)
 * Full analysis with all fields
 */
export async function deepAnalyze(email: RawEmail): Promise<EmailAnalysis> {
  const client = getClient();

  const prompt = `Analyze this email comprehensively and return ONLY valid JSON.

Email:
From: ${email.from.name} <${email.from.address}>
Subject: ${email.subject}
Received: ${email.receivedDateTime}
Body: ${email.bodyPreview.substring(0, 1000)}

Priority scoring:
90-100: Urgent, same-day deadline or critical blocker
70-89: Important, needs action within 48 hours
40-69: Standard work, no immediate deadline
0-39: FYI, automated, no action needed

CRITICAL: Return ONLY the JSON object below with no additional text, explanations, or markdown formatting.

Required JSON structure (all fields required):
{
  "priority": 75,
  "priorityReason": "brief explanation why",
  "summary": "2-3 sentence summary of email",
  "sentiment": "positive",
  "category": "work",
  "cluster": "operations",
  "actionItems": [{"task": "example task", "deadline": "2026-02-10", "priority": "high"}],
  "keyDates": [{"date": "2026-02-10", "description": "example date", "type": "deadline"}],
  "suggestedTags": ["tag1", "tag2"],
  "needsReply": true,
  "estimatedReadTime": 3
}

Valid values:
- sentiment: "positive", "neutral", or "negative"
- category: "urgent", "work", "automated", or "personal"
- cluster: "operations", "content", "partnerships", "analytics", "finance", or "other"
- actionItem priority: "high", "medium", or "low"
- keyDate type: "deadline", "meeting", "event", or "reminder"
- deadline format: "YYYY-MM-DD" or null
- needsReply: true or false (boolean)
- estimatedReadTime: number in minutes`;

  try {
    const response = await client.messages.create({
      model: SONNET_MODEL,
      max_tokens: 2000,
      temperature: 0,
      messages: [
        { role: "user", content: prompt },
        { role: "assistant", content: "{" }, // Prefill to force JSON output
      ],
    });

    const content = response.content[0];
    if (content.type === "text") {
      // Prepend the opening brace we used in prefill
      const fullResponse = "{" + content.text;
      // console.log("🤖 Raw AI response:", fullResponse.substring(0, 500) + "...");
      const analysis = extractJSON(fullResponse);

      return {
        ...analysis,
        analyzedAt: new Date().toISOString(),
        analysisVersion: "v2",
        model: "sonnet" as const,
      };
    }
  } catch (error) {
    console.error("Deep analysis failed:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
  }

  // Fallback
  return {
    priority: 50,
    priorityReason: "Default analysis",
    summary: email.bodyPreview.substring(0, 200),
    sentiment: "neutral",
    category: "work",
    cluster: "other",
    actionItems: [],
    keyDates: [],
    suggestedTags: [],
    needsReply: false,
    estimatedReadTime: 2,
    analyzedAt: new Date().toISOString(),
    analysisVersion: "v2",
    model: "sonnet",
  };
}

/**
 * Batch analyze multiple emails in one API call
 * More efficient than individual calls
 */
export async function batchQuickAnalyze(
  emails: RawEmail[],
  maxBatchSize: number = 10
): Promise<Array<{ emailId: string; analysis: QuickAnalysis }>> {
  const batches: RawEmail[][] = [];
  for (let i = 0; i < emails.length; i += maxBatchSize) {
    batches.push(emails.slice(i, i + maxBatchSize));
  }

  const results: Array<{ emailId: string; analysis: QuickAnalysis }> = [];

  for (const batch of batches) {
    const batchResults = await Promise.all(
      batch.map(async (email) => ({
        emailId: email.id,
        analysis: await quickAnalyze(email),
      }))
    );
    results.push(...batchResults);

    // Small delay between batches to avoid rate limits
    if (batches.indexOf(batch) < batches.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return results;
}

/**
 * Smart two-pass analysis
 * Pass 1: Quick analysis on ALL emails (Haiku)
 * Pass 2: Deep analysis only on high-priority emails (Sonnet)
 */
export async function smartAnalyze(
  emails: RawEmail[]
): Promise<Array<{ emailId: string; analysis: EmailAnalysis }>> {
  console.log(`🤖 Starting smart analysis for ${emails.length} emails...`);

  // Pass 1: Quick analysis on all emails
  console.log("  Pass 1: Quick analysis with Haiku...");
  const quickResults = await batchQuickAnalyze(emails, 10);

  // Identify high-priority emails (>= 70)
  const highPriorityIds = quickResults
    .filter((r) => r.analysis.priority >= 70)
    .map((r) => r.emailId);

  const highPriorityEmails = emails.filter((e) =>
    highPriorityIds.includes(e.id)
  );

  console.log(`  Found ${highPriorityEmails.length} high-priority emails`);
  console.log("  Pass 2: Deep analysis with Sonnet...");

  // Pass 2: Deep analysis on high-priority emails
  const deepResults = await Promise.all(
    highPriorityEmails.map(async (email) => ({
      emailId: email.id,
      analysis: await deepAnalyze(email),
    }))
  );

  // Merge results: use deep analysis for high-priority, enhance quick for others
  const finalResults = emails.map((email) => {
    const deepResult = deepResults.find((r) => r.emailId === email.id);
    if (deepResult) {
      return deepResult;
    }

    // For non-high-priority, create basic analysis from quick result
    const quickResult = quickResults.find((r) => r.emailId === email.id);
    if (!quickResult) {
      throw new Error(`No analysis found for email ${email.id}`);
    }

    return {
      emailId: email.id,
      analysis: {
        priority: quickResult.analysis.priority,
        priorityReason: "Quick analysis",
        summary: email.bodyPreview.substring(0, 150) + "...",
        sentiment: "neutral" as const,
        category: quickResult.analysis.category,
        cluster: "other" as const,
        actionItems: [],
        keyDates: [],
        suggestedTags: [],
        needsReply: false,
        estimatedReadTime: Math.ceil(email.bodyPreview.length / 200),
        analyzedAt: new Date().toISOString(),
        analysisVersion: "v2",
        model: "haiku" as const,
      },
    };
  });

  console.log("✅ Smart analysis complete");
  return finalResults;
}

/**
 * Estimate cost for analyzing N emails
 */
export function estimateCost(
  emailCount: number,
  averageBodyLength: number = 500
): {
  quick: number;
  deep: number;
  smart: number;
} {
  const tokensPerEmail = Math.ceil(averageBodyLength / 4); // Rough estimate: 4 chars = 1 token

  // Quick: All emails with Haiku
  const quickCost =
    (emailCount * tokensPerEmail * COSTS.haiku.input +
      emailCount * 100 * COSTS.haiku.output) /
    1_000_000;

  // Deep: All emails with Sonnet
  const deepCost =
    (emailCount * tokensPerEmail * COSTS.sonnet.input +
      emailCount * 2000 * COSTS.sonnet.output) /
    1_000_000;

  // Smart: All with Haiku, 30% with Sonnet (estimated)
  const highPriorityPercent = 0.3;
  const smartCost =
    (emailCount * tokensPerEmail * COSTS.haiku.input +
      emailCount * 100 * COSTS.haiku.output +
      (emailCount * highPriorityPercent * tokensPerEmail * COSTS.sonnet.input +
        emailCount * highPriorityPercent * 2000 * COSTS.sonnet.output)) /
    1_000_000;

  return {
    quick: Math.round(quickCost * 100) / 100,
    deep: Math.round(deepCost * 100) / 100,
    smart: Math.round(smartCost * 100) / 100,
  };
}

/**
 * Retry logic with exponential backoff
 */
export async function analyzeWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;

      const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
      console.log(`Retry attempt ${attempt + 1} after ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error("Max retries exceeded");
}
