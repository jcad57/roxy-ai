/**
 * Email Analyzer Service
 * AI-powered email analysis functions using Claude
 */

import type { Email, AISuggestion, EmailCategory, EmailCluster, EmailSentiment } from "@/lib/types/email";
import { getAnthropicClient, CLAUDE_MODELS, type ClaudeModel } from "./anthropic-client";
import {
  SYSTEM_PROMPT,
  generatePriorityAnalysisPrompt,
  generateSentimentAnalysisPrompt,
  generateActionItemsPrompt,
  generateClusteringPrompt,
  generateCalendarExtractionPrompt,
  generateSummaryPrompt,
  generateReplyPrompt,
  generateCategorizationPrompt,
} from "./prompt-templates";

/**
 * Configuration for AI analysis
 */
const DEFAULT_CONFIG = {
  model: CLAUDE_MODELS.HAIKU, // Fast model for most tasks
  maxTokens: 1024,
  temperature: 0.7,
};

/**
 * Analyze email priority using AI
 * @param email Email to analyze
 * @returns Priority score (0-100)
 */
export async function analyzeEmailPriority(email: Email): Promise<number> {
  try {
    const client = getAnthropicClient();
    const prompt = generatePriorityAnalysisPrompt(email);

    const message = await client.messages.create({
      model: DEFAULT_CONFIG.model,
      max_tokens: 100,
      temperature: 0.3, // Lower temperature for consistent scoring
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type === "text") {
      const priority = parseInt(content.text.trim(), 10);
      return isNaN(priority) ? email.priority : Math.min(Math.max(priority, 0), 100);
    }

    return email.priority; // Fallback to existing priority
  } catch (error) {
    console.error("Error analyzing email priority:", error);
    return email.priority; // Fallback on error
  }
}

/**
 * Analyze email sentiment using AI
 * @param email Email to analyze
 * @returns Sentiment classification
 */
export async function analyzeEmailSentiment(email: Email): Promise<EmailSentiment> {
  try {
    const client = getAnthropicClient();
    const prompt = generateSentimentAnalysisPrompt(email);

    const message = await client.messages.create({
      model: DEFAULT_CONFIG.model,
      max_tokens: 50,
      temperature: 0.2,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type === "text") {
      const sentiment = content.text.trim().toLowerCase();
      if (sentiment === "positive" || sentiment === "negative" || sentiment === "neutral") {
        return sentiment;
      }
    }

    return email.sentiment; // Fallback to existing sentiment
  } catch (error) {
    console.error("Error analyzing email sentiment:", error);
    return email.sentiment;
  }
}

/**
 * Generate AI suggestions for action items
 * @param emails List of emails to analyze
 * @returns Array of AI suggestions
 */
export async function generateAISuggestions(emails: Email[]): Promise<AISuggestion[]> {
  try {
    const client = getAnthropicClient();
    const prompt = generateActionItemsPrompt(emails.slice(0, 10)); // Analyze top 10 emails

    const message = await client.messages.create({
      model: CLAUDE_MODELS.SONNET, // Use more capable model for complex analysis
      max_tokens: 500,
      temperature: 0.7,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type === "text") {
      try {
        const suggestions = JSON.parse(content.text);
        if (Array.isArray(suggestions)) {
          return suggestions.slice(0, 3); // Return top 3 suggestions
        }
      } catch (parseError) {
        console.error("Error parsing AI suggestions JSON:", parseError);
      }
    }

    return []; // Return empty array on error
  } catch (error) {
    console.error("Error generating AI suggestions:", error);
    return [];
  }
}

/**
 * Cluster/categorize an email using AI
 * @param email Email to cluster
 * @returns Cluster classification
 */
export async function clusterEmail(email: Email): Promise<EmailCluster> {
  try {
    const client = getAnthropicClient();
    const prompt = generateClusteringPrompt(email);

    const message = await client.messages.create({
      model: DEFAULT_CONFIG.model,
      max_tokens: 50,
      temperature: 0.2,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type === "text") {
      const cluster = content.text.trim().toLowerCase() as EmailCluster;
      const validClusters: EmailCluster[] = ["operations", "content", "partnerships", "analytics", "finance"];
      if (validClusters.includes(cluster)) {
        return cluster;
      }
    }

    return email.cluster; // Fallback to existing cluster
  } catch (error) {
    console.error("Error clustering email:", error);
    return email.cluster;
  }
}

/**
 * Categorize an email using AI
 * @param email Email to categorize
 * @returns Category classification
 */
export async function categorizeEmail(email: Email): Promise<EmailCategory> {
  try {
    const client = getAnthropicClient();
    const prompt = generateCategorizationPrompt(email);

    const message = await client.messages.create({
      model: DEFAULT_CONFIG.model,
      max_tokens: 50,
      temperature: 0.2,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type === "text") {
      const category = content.text.trim().toLowerCase() as EmailCategory;
      const validCategories: EmailCategory[] = ["urgent", "work", "automated"];
      if (validCategories.includes(category)) {
        return category;
      }
    }

    return email.category; // Fallback to existing category
  } catch (error) {
    console.error("Error categorizing email:", error);
    return email.category;
  }
}

/**
 * Generate a summary of multiple emails
 * @param emails Emails to summarize
 * @returns Summary text
 */
export async function generateEmailSummary(emails: Email[]): Promise<string> {
  try {
    const client = getAnthropicClient();
    const prompt = generateSummaryPrompt(emails);

    const message = await client.messages.create({
      model: DEFAULT_CONFIG.model,
      max_tokens: 200,
      temperature: 0.7,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type === "text") {
      return content.text.trim();
    }

    return `You have ${emails.length} emails requiring attention.`;
  } catch (error) {
    console.error("Error generating email summary:", error);
    return `You have ${emails.length} emails requiring attention.`;
  }
}

/**
 * Generate smart reply suggestions for an email
 * @param email Email to generate replies for
 * @returns Array of reply suggestions
 */
export async function generateReplySuggestions(email: Email): Promise<string[]> {
  try {
    const client = getAnthropicClient();
    const prompt = generateReplyPrompt(email);

    const message = await client.messages.create({
      model: CLAUDE_MODELS.SONNET,
      max_tokens: 500,
      temperature: 0.8,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type === "text") {
      try {
        const replies = JSON.parse(content.text);
        if (Array.isArray(replies)) {
          return replies.slice(0, 3);
        }
      } catch (parseError) {
        console.error("Error parsing reply suggestions JSON:", parseError);
      }
    }

    return [
      "Thank you for your email. I'll review this and get back to you shortly.",
      "Thanks for reaching out! I'll take a look at this.",
      "Received, thanks.",
    ];
  } catch (error) {
    console.error("Error generating reply suggestions:", error);
    return [
      "Thank you for your email. I'll review this and get back to you shortly.",
      "Thanks for reaching out! I'll take a look at this.",
      "Received, thanks.",
    ];
  }
}

/**
 * Batch analyze multiple emails
 * @param emails Emails to analyze
 * @param operations Which analyses to perform
 * @returns Updated emails with AI analysis
 */
export async function batchAnalyzeEmails(
  emails: Email[],
  operations: {
    priority?: boolean;
    sentiment?: boolean;
    cluster?: boolean;
    category?: boolean;
  } = { priority: true, sentiment: true, cluster: true, category: true }
): Promise<Email[]> {
  const results = await Promise.all(
    emails.map(async (email) => {
      const updates: Partial<Email> = {};

      if (operations.priority) {
        updates.priority = await analyzeEmailPriority(email);
      }
      if (operations.sentiment) {
        updates.sentiment = await analyzeEmailSentiment(email);
      }
      if (operations.cluster) {
        updates.cluster = await clusterEmail(email);
      }
      if (operations.category) {
        updates.category = await categorizeEmail(email);
      }

      return { ...email, ...updates };
    })
  );

  return results;
}
