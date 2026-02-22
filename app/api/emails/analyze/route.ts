/**
 * Email Analysis API Route
 * Server-side endpoint for AI enrichment of email metadata
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { analyzeBatch } from '@/lib/services/ai/combined-email-analyzer'
import {
  getPendingEmailsForAnalysis,
  markEmailsAsProcessing,
} from '@/lib/services/outlook/metadata-storage'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 60 seconds for batch processing

/**
 * POST /api/emails/analyze
 * Analyze pending emails and store enrichments
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🤖 Email analysis API called')

    // Parse request body
    const body = await request.json().catch(() => ({}))
    const { batchSize = 50, specificEmailIds = null } = body

    // Create Supabase client with server-side auth
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('❌ Authentication failed:', authError)
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    console.log(`👤 Analyzing emails for user: ${user.id}`)

    // Get pending emails from metadata table
    let emailsToAnalyze: any[] = []

    if (specificEmailIds && Array.isArray(specificEmailIds)) {
      // Analyze specific emails
      const { data, error } = await (supabase
        .from('email_metadata') as any)
        .select('*')
        .eq('user_id', user.id)
        .in('outlook_message_id', specificEmailIds)
        .eq('ai_status', 'pending')

      if (error) {
        console.error('❌ Failed to get specific emails:', error)
        throw new Error('Failed to get emails for analysis')
      }

      emailsToAnalyze = data || []
    } else {
      // Get batch of pending emails
      const result = await getPendingEmailsForAnalysis(supabase, user.id, batchSize)
      if (!result.success) {
        throw new Error(result.error || 'Failed to get pending emails')
      }
      emailsToAnalyze = result.emails
    }

    if (emailsToAnalyze.length === 0) {
      console.log('✅ No pending emails to analyze')
      return NextResponse.json({
        success: true,
        analyzed: 0,
        message: 'No pending emails',
      })
    }

    console.log(`📧 Found ${emailsToAnalyze.length} emails to analyze`)

    // Mark emails as processing
    const outlookMessageIds = emailsToAnalyze.map((e) => e.outlook_message_id)
    await markEmailsAsProcessing(supabase, user.id, outlookMessageIds)

    // Run AI analysis in batches
    const analysisResults = await analyzeBatch(emailsToAnalyze, 10)

    // Separate successful vs failed
    const successful = analysisResults.filter((r) => r.success && r.enrichment)
    const failed = analysisResults.filter((r) => !r.success)

    console.log(`✅ Analysis complete: ${successful.length} success, ${failed.length} failed`)

    // Save successful enrichments to email_enrichments table
    if (successful.length > 0) {
      const enrichmentsToSave = successful.map((result) => ({
        user_id: user.id,
        email_id: result.outlookMessageId, // Keep for backward compatibility
        outlook_message_id: result.outlookMessageId,
        ai_priority: result.enrichment!.priority,
        priority_reason: result.enrichment!.priority_reason,
        summary: result.enrichment!.summary,
        ai_sentiment: result.enrichment!.sentiment,
        ai_category: result.enrichment!.category,
        ai_cluster: result.enrichment!.cluster,
        suggested_tags: result.enrichment!.tags,
        action_items: result.enrichment!.action_items,
        key_dates: result.enrichment!.key_dates,
        needs_reply: result.enrichment!.needs_reply,
        estimated_read_time: result.enrichment!.estimated_read_time,
        analyzed_at: new Date().toISOString(),
        analysis_version: '1.0',
        model: HAIKU_MODEL,
      }))

      const { error: enrichmentError } = await (supabase
        .from('email_enrichments') as any)
        .upsert(enrichmentsToSave, {
          onConflict: 'user_id,outlook_message_id',
        })

      if (enrichmentError) {
        console.error('❌ Failed to save enrichments:', enrichmentError)
        throw new Error('Failed to save enrichments')
      }

      console.log(`💾 Saved ${enrichmentsToSave.length} enrichments to Supabase`)

      // Update metadata status to 'enriched'
      const { error: statusError } = await (supabase
        .from('email_metadata') as any)
        .update({
          ai_status: 'enriched',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .in('outlook_message_id', successful.map((r) => r.outlookMessageId))

      if (statusError) {
        console.error('⚠️ Failed to update ai_status:', statusError)
      }
    }

    // Mark failed emails
    if (failed.length > 0) {
      console.warn(`⚠️ ${failed.length} emails failed analysis`)

      // Update failed emails (will retry based on retry_count)
      for (const failedResult of failed) {
        // First get current retry count
        const { data: currentData } = await (supabase
          .from('email_metadata') as any)
          .select('ai_retry_count')
          .eq('user_id', user.id)
          .eq('outlook_message_id', failedResult.outlookMessageId)
          .single()

        const newRetryCount = (currentData?.ai_retry_count || 0) + 1

        const { error } = await (supabase
          .from('email_metadata') as any)
          .update({
            ai_status: 'failed',
            ai_last_error: failedResult.error || 'Unknown error',
            ai_retry_count: newRetryCount,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
          .eq('outlook_message_id', failedResult.outlookMessageId)

        if (error) {
          console.error('⚠️ Failed to mark email as failed:', error)
        }
      }
    }

    return NextResponse.json({
      success: true,
      analyzed: successful.length,
      failed: failed.length,
      total: analysisResults.length,
    })
  } catch (error: any) {
    console.error('❌ Email analysis failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to analyze emails',
      },
      { status: 500 }
    )
  }
}

// Claude Haiku 4.5 - Latest fast model with near-frontier intelligence
const HAIKU_MODEL = 'claude-haiku-4-5-20251001'
