/**
 * AI Status Check API Route
 * Checks if Anthropic AI is properly configured
 */

import { NextResponse } from "next/server";
import { isAnthropicConfigured } from "@/lib/services/ai";

export async function GET() {
  const isConfigured = isAnthropicConfigured();
  
  return NextResponse.json({
    configured: isConfigured,
    status: isConfigured ? "ready" : "not_configured",
    message: isConfigured
      ? "Anthropic AI is properly configured"
      : "ANTHROPIC_API_KEY is missing or invalid in .env.local",
  });
}
