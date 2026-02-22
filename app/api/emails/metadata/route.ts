/**
 * Email Metadata API Route
 * Returns email metadata for the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/emails/metadata
 * Fetch email metadata for current user
 */
export async function GET(req: NextRequest) {
  try {
    // Create Supabase client
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookies) => {
            cookies.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('📊 Fetching metadata for user:', user.id)

    // Fetch email metadata
    const { data: emails, error: fetchError } = await (supabase
      .from('email_metadata') as any)
      .select('*')
      .eq('user_id', user.id)
      .order('received_at', { ascending: false })

    if (fetchError) {
      console.error('Error fetching email metadata:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch email metadata' },
        { status: 500 }
      )
    }

    console.log(`✅ Retrieved ${emails?.length || 0} emails`)

    return NextResponse.json({
      success: true,
      emails: emails || [],
      count: emails?.length || 0,
    })
  } catch (error: any) {
    console.error('Error in metadata route:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
