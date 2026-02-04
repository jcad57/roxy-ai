/**
 * Quick Replies API Route
 * Fast one-liner response generation
 */

import { NextResponse } from 'next/server';
import { generateQuickReplies } from '@/lib/services/response/response-generator';
import type { EnrichedEmail } from '@/lib/types/email-raw';

export const maxDuration = 30; // 30 seconds timeout

export async function POST(request: Request) {
  try {
    const { email }: { email: EnrichedEmail } = await request.json();

    if (!email || !email.id) {
      return NextResponse.json(
        { error: 'Invalid email data' },
        { status: 400 }
      );
    }

    console.log(`⚡ Generating quick replies for email: ${email.id}`);

    const replies = await generateQuickReplies(email);

    return NextResponse.json({
      success: true,
      replies,
    });
  } catch (error) {
    console.error('Quick reply generation error:', error);
    return NextResponse.json(
      {
        error: 'Quick reply generation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
