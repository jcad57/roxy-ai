/**
 * AI Suggestions API Route
 * Generates action items from emails using Claude AI
 */

import { NextResponse } from "next/server";
import { generateAISuggestions, isAnthropicConfigured } from "@/lib/services/ai";
import type { Email } from "@/lib/types/email";

export async function POST(request: Request) {
  try {
    // Check if AI is configured
    if (!isAnthropicConfigured()) {
      return NextResponse.json(
        { error: "AI service is not configured. Please add ANTHROPIC_API_KEY to .env.local" },
        { status: 503 }
      );
    }

    // Parse request body
    const { emails }: { emails: Email[] } = await request.json();

    // Validate emails data
    if (!Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: "Invalid request. Please provide an array of emails" },
        { status: 400 }
      );
    }

    // Generate AI suggestions
    const suggestions = await generateAISuggestions(emails);

    // Return results
    return NextResponse.json({
      suggestions,
      count: suggestions.length,
      analyzedEmails: emails.length,
    });
  } catch (error) {
    console.error("Error in suggestions API:", error);
    return NextResponse.json(
      { error: "Failed to generate AI suggestions" },
      { status: 500 }
    );
  }
}
