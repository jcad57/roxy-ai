/**
 * Email Mark Read/Unread API Route
 * Server-side endpoint for updating email read status in Outlook
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

const GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0'

/**
 * Helper to chunk array into batches
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

/**
 * POST /api/emails/mark-read
 * Mark single or multiple emails as read/unread
 * 
 * Body:
 * - messageIds: string[] - Outlook message IDs
 * - isRead: boolean - Target read status
 * - accessToken: string - Outlook access token
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📧 Mark read/unread API called')

    // Parse request body
    const body = await request.json()
    const { messageIds, isRead, accessToken } = body

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'messageIds array required' },
        { status: 400 }
      )
    }

    if (typeof isRead !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'isRead boolean required' },
        { status: 400 }
      )
    }

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'accessToken required' },
        { status: 400 }
      )
    }

    // Create Supabase client
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
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    console.log(`👤 Marking ${messageIds.length} emails as ${isRead ? 'read' : 'unread'} for user: ${user.id}`)

    // SINGLE EMAIL: Direct PATCH
    if (messageIds.length === 1) {
      const messageId = messageIds[0]
      console.log(`📨 Single email: ${messageId}`)

      const response = await fetch(`${GRAPH_API_BASE}/me/messages/${messageId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isRead }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        console.error('❌ Failed to mark email in Outlook:', error)
        return NextResponse.json(
          { success: false, error: error.error?.message || 'Failed to update Outlook' },
          { status: response.status }
        )
      }

      console.log(`✅ Email marked as ${isRead ? 'read' : 'unread'} in Outlook`)

      return NextResponse.json({
        success: true,
        updated: 1,
      })
    }

    // MULTIPLE EMAILS: Use batch endpoint (max 20 per batch)
    console.log(`📨 Batch update: ${messageIds.length} emails`)

    const chunks = chunkArray(messageIds, 20)
    let totalSuccess = 0
    let totalFailed = 0

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex]
      console.log(`  Processing batch ${chunkIndex + 1}/${chunks.length} (${chunk.length} emails)`)

      // Build batch request
      const batchRequests = chunk.map((id, index) => ({
        id: String(index + 1),
        method: 'PATCH',
        url: `/me/messages/${id}`,
        headers: { 'Content-Type': 'application/json' },
        body: { isRead },
      }))

      const response = await fetch(`${GRAPH_API_BASE}/$batch`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests: batchRequests }),
      })

      if (!response.ok) {
        console.error(`❌ Batch ${chunkIndex + 1} failed:`, response.status)
        totalFailed += chunk.length
        continue
      }

      const batchResult = await response.json()

      // Check individual responses
      for (const itemResponse of batchResult.responses) {
        if (itemResponse.status === 200 || itemResponse.status === 204) {
          totalSuccess++
        } else {
          totalFailed++
          console.warn(`  ⚠️ Failed to update message ${itemResponse.id}:`, itemResponse.body)
        }
      }
    }

    console.log(`✅ Batch complete: ${totalSuccess} success, ${totalFailed} failed`)

    return NextResponse.json({
      success: true,
      updated: totalSuccess,
      failed: totalFailed,
    })
  } catch (error: any) {
    console.error('❌ Mark read/unread error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
