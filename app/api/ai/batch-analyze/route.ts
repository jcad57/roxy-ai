/**
 * AI Batch Analysis API Route
 * Analyzes multiple emails in one request using Claude AI
 */

import { NextResponse } from "next/server";
import { batchAnalyzeEmails, isAnthropicConfigured } from "@/lib/services/ai";
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
    const {
      emails,
      operations = { priority: true, sentiment: true, cluster: true, category: true },
    }: {
      emails: Email[];
      operations?: {
        priority?: boolean;
        sentiment?: boolean;
        cluster?: boolean;
        category?: boolean;
      };
    } = await request.json();

    // Validate emails data
    if (!Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: "Invalid request. Please provide an array of emails" },
        { status: 400 }
      );
    }

    // Limit batch size to prevent timeout
    if (emails.length > 50) {
      return NextResponse.json(
        { error: "Batch size too large. Maximum 50 emails per request" },
        { status: 400 }
      );
    }

    // Perform batch analysis
    const analyzedEmails = await batchAnalyzeEmails(emails, operations);

    // Return results
    return NextResponse.json({
      emails: analyzedEmails,
      count: analyzedEmails.length,
      operations: operations,
    });
  } catch (error) {
    console.error("Error in batch analysis API:", error);
    return NextResponse.json(
      { error: "Failed to analyze emails" },
      { status: 500 }
    );
  }
}
