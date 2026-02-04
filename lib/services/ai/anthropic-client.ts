/**
 * Anthropic API Client
 * Singleton client for interacting with Claude AI
 */

import Anthropic from "@anthropic-ai/sdk";

// Singleton instance
let anthropicClient: Anthropic | null = null;

/**
 * Get or create the Anthropic client instance
 * @returns Anthropic client instance
 * @throws Error if API key is not configured
 */
export function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey || apiKey === "your_api_key_here") {
      throw new Error(
        "ANTHROPIC_API_KEY is not configured. " +
        "Please set it in your .env.local file. " +
        "Get your API key from https://console.anthropic.com/"
      );
    }
    
    anthropicClient = new Anthropic({
      apiKey: apiKey,
    });
  }
  
  return anthropicClient;
}

/**
 * Reset the client instance (useful for testing)
 */
export function resetAnthropicClient(): void {
  anthropicClient = null;
}

/**
 * Check if the client is properly configured
 * @returns true if API key is set and valid format
 */
export function isAnthropicConfigured(): boolean {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  return !!(apiKey && apiKey !== "your_api_key_here" && apiKey.startsWith("sk-"));
}

/**
 * Available Claude models
 * Updated: February 2026 - Using current active models
 * Check: https://docs.anthropic.com/en/api/models-list
 */
export const CLAUDE_MODELS = {
  // Most capable model for complex tasks
  OPUS: "claude-opus-4-5-20251101",
  // Balanced performance and speed 
  SONNET: "claude-sonnet-4-5-20250929",
  // Fastest for simple tasks
  HAIKU: "claude-3-haiku-20240307",
} as const;

export type ClaudeModel = typeof CLAUDE_MODELS[keyof typeof CLAUDE_MODELS];
