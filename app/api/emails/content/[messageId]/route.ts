/**
 * Email Content API Route
 * Server-side endpoint for fetching full email content on-demand
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { fetchEmailContent, fetchEmailAttachments } from '@/lib/services/outlook/email-content-fetcher'

export const dynamic = 'force-dynamic'

/**
 * GET /api/emails/content/[messageId]
 * Fetch full email content including body
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ messageId: string }> }
) {
  try {
    const { messageId } = await context.params
    console.log(`📧 Fetching content for email: ${messageId}`)

    // Get access token from request headers (passed from client)
    const accessToken = request.headers.get('X-Outlook-Access-Token')

    if (!accessToken) {
      console.error('❌ No access token provided')
      return NextResponse.json(
        { success: false, error: 'Access token required' },
        { status: 401 }
      )
    }

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

    console.log(`👤 Fetching email for user: ${user.id}`)

    // Verify user has access to this email
    const { data: emailMetadata, error: metadataError } = await (supabase
      .from('email_metadata') as any)
      .select('outlook_message_id, conversation_id')
      .eq('user_id', user.id)
      .eq('outlook_message_id', messageId)
      .single()

    if (metadataError || !emailMetadata) {
      console.error('❌ Email not found or access denied:', metadataError)
      return NextResponse.json(
        { success: false, error: 'Email not found or access denied' },
        { status: 404 }
      )
    }

    // Fetch full email content from Graph API
    const emailContent = await fetchEmailContent(messageId, accessToken)

    // Fetch attachments if present
    let attachments: any[] = []
    if (emailContent.hasAttachments) {
      attachments = await fetchEmailAttachments(messageId, accessToken)
    }

    console.log(`✅ Email content fetched successfully`)

    return NextResponse.json({
      success: true,
      content: {
        ...emailContent,
        attachments,
      },
    })
  } catch (error: any) {
    console.error('❌ Failed to fetch email content:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch email content',
      },
      { status: 500 }
    )
  }
}
