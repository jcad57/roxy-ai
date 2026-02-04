/**
 * Smart AI Analysis API Route
 * Two-pass analysis: quick for all, deep for high-priority
 */

import { NextResponse } from 'next/server';
import { smartAnalyze, estimateCost } from '@/lib/services/ai/enhanced-email-analyzer';
import { EnrichmentDB } from '@/lib/services/storage/indexeddb';
import type { RawEmail, EmailAIEnrichment } from '@/lib/types/email-raw';

export const maxDuration = 300; // 5 minutes for batch processing

export async function POST(request: Request) {
  try {
    const { emails }: { emails: RawEmail[] } = await request.json();

    if (!Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request. Provide emails array' },
        { status: 400 }
      );
    }

    console.log(`📧 Smart analyzing ${emails.length} emails...`);

    // Perform smart analysis
    const results = await smartAnalyze(emails);

    // Save enrichments to IndexedDB
    const enrichments: EmailAIEnrichment[] = results.map(r => ({
      emailId: r.emailId,
      aiPriority: r.analysis.priority,
      priorityReason: r.analysis.priorityReason,
      summary: r.analysis.summary,
      aiSentiment: r.analysis.sentiment,
      aiCluster: r.analysis.cluster,
      aiCategory: r.analysis.category,
      actionItems: r.analysis.actionItems,
      keyDates: r.analysis.keyDates,
      suggestedTags: r.analysis.suggestedTags,
      needsReply: r.analysis.needsReply,
      estimatedReadTime: r.analysis.estimatedReadTime,
      analyzedAt: r.analysis.analyzedAt,
      analysisVersion: r.analysis.analysisVersion,
      model: r.analysis.model,
    }));

    await EnrichmentDB.saveMany(enrichments);

    // Calculate cost estimate
    const cost = estimateCost(emails.length);

    return NextResponse.json({
      success: true,
      results,
      processedCount: results.length,
      estimatedCost: cost.smart,
    });
  } catch (error) {
    console.error('Smart analysis error:', error);
    return NextResponse.json(
      { 
        error: 'Analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
