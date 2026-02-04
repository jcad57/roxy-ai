/**
 * Generate Response API Route
 * Server-side response generation
 */

import { NextResponse } from 'next/server';
import { generateResponse } from '@/lib/services/response/response-generator';
import type { EnrichedEmail } from '@/lib/types/email-raw';
import type { ResponseContext } from '@/lib/types/response';

export const maxDuration = 60; // 1 minute timeout

export async function POST(request: Request) {
  try {
    const { email, context }: { email: EnrichedEmail; context?: ResponseContext } = 
      await request.json();

    if (!email || !email.id) {
      return NextResponse.json(
        { error: 'Invalid email data' },
        { status: 400 }
      );
    }

    console.log(`📧 Generating response for email: ${email.id}`);

    const suggestion = await generateResponse(email, context || {});

    return NextResponse.json({
      success: true,
      suggestion,
    });
  } catch (error) {
    console.error('Response generation error:', error);
    return NextResponse.json(
      {
        error: 'Response generation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
