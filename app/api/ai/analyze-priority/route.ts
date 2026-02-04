/**
 * AI Priority Analysis API Route
 * Analyzes email priority using Claude AI
 */

import { NextResponse } from "next/server";
import { analyzeEmailPriority } from "@/lib/services/ai";
import { isAnthropicConfigured } from "@/lib/services/ai";
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
    const email: Email = await request.json();

    // Validate email data
    if (!email || !email.subject || !email.preview) {
      return NextResponse.json(
        { error: "Invalid email data. Required fields: subject, preview" },
        { status: 400 }
      );
    }

    // Analyze priority using AI
    const priority = await analyzeEmailPriority(email);

    // Return result
    return NextResponse.json({
      priority,
      originalPriority: email.priority,
      changed: priority !== email.priority,
    });
  } catch (error) {
    console.error("Error in priority analysis API:", error);
    return NextResponse.json(
      { error: "Failed to analyze email priority" },
      { status: 500 }
    );
  }
}
