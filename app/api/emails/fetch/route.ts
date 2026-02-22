/**
 * Email Fetch API Route
 * Server-side endpoint to fetch emails from Outlook and store in Supabase
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import {
  fetchInitialEmails,
  fetchDeltaEmails,
  establishDeltaToken,
  transformEmailsToMetadata,
  transformToPartialUpdate,
} from '@/lib/services/outlook/email-fetcher'
import {
  upsertEmailMetadata,
  updateSyncStatus,
} from '@/lib/services/outlook/metadata-storage'

export const dynamic = 'force-dynamic'

/**
 * POST /api/emails/fetch
 * Fetch emails from Outlook and store metadata in Supabase
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Email fetch API called')

    // Parse request body
    const body = await request.json()
    const { accessToken, initialSync = false } = body

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Access token is required' },
        { status: 400 }
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

    console.log(`👤 Fetching emails for user: ${user.id}`)

    // Get Outlook connection details
    const { data: connection, error: connectionError } = await (supabase
      .from('outlook_connections') as any)
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (connectionError || !connection) {
      console.error('❌ Outlook connection not found:', connectionError)
      return NextResponse.json(
        { success: false, error: 'Outlook not connected' },
        { status: 400 }
      )
    }

    // Determine if this is initial fetch or delta sync
    const hasDeltaToken = connection.delta_link && connection.sync_status === 'active'
    const isInitialFetch = initialSync || !connection.last_sync_at || !hasDeltaToken

    console.log(`📊 Fetch type: ${isInitialFetch ? 'Initial' : 'Delta'}`)
    
    let emails: any[] = []
    let newDeltaLink: string | null = null
    let actualNewEmailCount = 0 // Track truly NEW emails (for AI analysis)

    if (isInitialFetch) {
      // ===== INITIAL FETCH: Fast return, delta token in background =====
      console.log(`📧 Initial fetch: Getting ${100} most recent emails...`)
      
      // Fetch emails (FAST - single request)
      const result = await fetchInitialEmails(accessToken, 100)
      emails = result.emails
      console.log(`✅ Fetched ${emails.length} emails (ready to display)`)

      // Transform and store emails immediately
      const metadata = transformEmailsToMetadata(emails, user.id)
      console.log(`💾 Storing ${metadata.length} emails...`)
      
      const upsertResult = await upsertEmailMetadata(supabase, metadata)
      if (!upsertResult.success) {
        throw new Error(upsertResult.error || 'Failed to store emails')
      }
      console.log(`✅ Emails stored successfully`)
      
      // All emails are new on initial fetch
      actualNewEmailCount = metadata.length

      // Update sync status (mark as pending delta token establishment)
      await updateSyncStatus(supabase, user.id, {
        lastSyncAt: new Date().toISOString(),
        deltaLink: null, // Not ready yet
        totalEmailsSynced: emails.length,
        lastSyncEmailCount: emails.length,
        syncStatus: 'delta_pending', // Flag: delta token being established
        lastError: null,
      })

      console.log(`✅ Sync status updated (delta_pending)`)

      // BACKGROUND: Establish delta token (fire-and-forget, don't await)
      console.log(`🔗 [Background] Starting delta token establishment...`)
      establishDeltaToken(accessToken)
        .then(async (result) => {
          if (result.deltaLink) {
            // Success - save delta token
            console.log(`✅ [Background] Delta token established after ${result.pagesDrained} pages`)
            await updateSyncStatus(supabase, user.id, {
              lastSyncAt: new Date().toISOString(),
              deltaLink: result.deltaLink,
              totalEmailsSynced: (connection.total_emails_synced || 0) + emails.length,
              lastSyncEmailCount: emails.length,
              syncStatus: 'active', // Ready for delta sync
              lastError: null,
            })
            console.log(`✅ [Background] Delta token saved, incremental sync now available`)
          } else {
            // Failed - will use fallback /messages on next sync
            console.warn(`⚠️ [Background] Delta token not established (${result.pagesDrained} pages drained)`)
            console.warn(`   Future syncs will use /messages fallback`)
            await updateSyncStatus(supabase, user.id, {
              lastSyncAt: new Date().toISOString(),
              deltaLink: null,
              totalEmailsSynced: (connection.total_emails_synced || 0) + emails.length,
              lastSyncEmailCount: emails.length,
              syncStatus: 'delta_unavailable', // Flag: use fallback
              lastError: 'Delta token establishment failed',
            })
          }
        })
        .catch((err) => {
          console.error(`❌ [Background] Delta token establishment error:`, err.message)
        })

      // Return immediately - don't wait for delta token
      console.log(`✅ Initial fetch complete (delta token establishing in background)`)

    } else if (hasDeltaToken) {
      // ===== DELTA SYNC: Incremental fetch using saved delta token =====
      console.log(`🔗 Using saved delta token: ${connection.delta_link.substring(0, 80)}...`)
      
      try {
        const result = await fetchDeltaEmails(accessToken, connection.delta_link)
        emails = result.emails
        newDeltaLink = result.deltaLink
        console.log(`✅ Delta sync: ${emails.length} new/changed emails`)
        console.log(`✅ New delta token acquired`)

        // SMART DELTA UPDATES: Differentiate NEW vs UPDATED emails
        if (emails.length > 0) {
          // Check which emails already exist in DB
          const { data: existingEmails } = await (supabase
            .from('email_metadata') as any)
            .select('outlook_message_id')
            .eq('user_id', user.id)
            .in('outlook_message_id', emails.map(e => e.id))
          
          const existingIds = new Set(existingEmails?.map((e: any) => e.outlook_message_id) || [])
          
          // Split into new vs updated
          const newEmails = emails.filter(e => !existingIds.has(e.id))
          const updatedEmails = emails.filter(e => existingIds.has(e.id))
          
          actualNewEmailCount = newEmails.length
          console.log(`📊 Delta sync breakdown: ${newEmails.length} new, ${updatedEmails.length} updated`)
          
          // Handle NEW emails: Use full transform (with fallbacks)
          if (newEmails.length > 0) {
            const newMetadata = transformEmailsToMetadata(newEmails, user.id)
            const upsertResult = await upsertEmailMetadata(supabase, newMetadata)
            if (!upsertResult.success) {
              throw new Error(upsertResult.error || 'Failed to store new emails')
            }
            console.log(`✅ Stored ${newEmails.length} NEW emails`)
          }
          
          // Handle UPDATED emails: Use partial updates (only changed fields)
          if (updatedEmails.length > 0) {
            console.log(`🔄 Processing ${updatedEmails.length} email updates (partial data)...`)
            
            for (const email of updatedEmails) {
              const partialUpdate = transformToPartialUpdate(email, user.id)
              
              // Log what fields are being updated
              const changedFields = Object.keys(partialUpdate).filter(k => k !== 'outlook_message_id' && k !== 'user_id')
              console.log(`  - Updating ${email.id.substring(0, 20)}... fields: [${changedFields.join(', ')}]`)
              
              const { error: updateError } = await (supabase
                .from('email_metadata') as any)
                .update(partialUpdate)
                .eq('outlook_message_id', email.id)
                .eq('user_id', user.id)
              
              if (updateError) {
                console.warn(`⚠️ Failed to update ${email.id}:`, updateError)
              }
            }
            
            console.log(`✅ Updated ${updatedEmails.length} existing emails (preserved unchanged fields)`)
          }
        } else {
          console.log(`ℹ️ No changes since last sync`)
        }

        // Persist new delta token
        await updateSyncStatus(supabase, user.id, {
          lastSyncAt: new Date().toISOString(),
          deltaLink: newDeltaLink,
          totalEmailsSynced: (connection.total_emails_synced || 0) + emails.length,
          lastSyncEmailCount: emails.length,
          syncStatus: 'active',
          lastError: null,
        })
        console.log(`✅ Delta token updated`)

      } catch (error: any) {
        // Handle delta token expiry
        if (error.message === 'DELTA_EXPIRED') {
          console.log(`♻️ Delta token expired, falling back to /messages...`)
          
          // Fetch recent 25 emails as fallback
          const result = await fetchInitialEmails(accessToken, 25)
          emails = result.emails
          
          // Store fallback emails
          if (emails.length > 0) {
            const metadata = transformEmailsToMetadata(emails, user.id)
            
            // Check for new emails
            const { data: existingEmails } = await (supabase
              .from('email_metadata') as any)
              .select('outlook_message_id')
              .eq('user_id', user.id)
              .in('outlook_message_id', metadata.map(e => e.outlook_message_id))
            
            const existingIds = new Set(existingEmails?.map((e: any) => e.outlook_message_id) || [])
            actualNewEmailCount = metadata.filter(e => !existingIds.has(e.outlook_message_id)).length
            
            await upsertEmailMetadata(supabase, metadata)
            console.log(`✅ Fallback: ${metadata.length} emails (${actualNewEmailCount} new)`)
          }
          
          // Mark delta as pending re-establishment
          await updateSyncStatus(supabase, user.id, {
            lastSyncAt: new Date().toISOString(),
            deltaLink: null,
            totalEmailsSynced: (connection.total_emails_synced || 0) + emails.length,
            lastSyncEmailCount: emails.length,
            syncStatus: 'delta_pending',
            lastError: 'Delta expired, re-establishing',
          })

          // Re-establish delta token in background
          establishDeltaToken(accessToken)
            .then(async (result) => {
              if (result.deltaLink) {
                // Get current connection to preserve email counts
                const { data: currentConn } = await (supabase
                  .from('outlook_connections') as any)
                  .select('total_emails_synced, last_sync_email_count')
                  .eq('user_id', user.id)
                  .single()

                await updateSyncStatus(supabase, user.id, {
                  lastSyncAt: new Date().toISOString(),
                  deltaLink: result.deltaLink,
                  totalEmailsSynced: currentConn?.total_emails_synced || 0,
                  lastSyncEmailCount: currentConn?.last_sync_email_count || 0,
                  syncStatus: 'active',
                  lastError: null,
                })
                console.log(`✅ [Background] Delta token re-established`)
              }
            })
            .catch(console.error)
        } else {
          throw error
        }
      }

    } else {
      // ===== FALLBACK: Delta pending, use /messages endpoint =====
      console.log(`📧 Delta token pending, using /messages fallback...`)
      
      const result = await fetchInitialEmails(accessToken, 25)
      emails = result.emails
      
      if (emails.length > 0) {
        const metadata = transformEmailsToMetadata(emails, user.id)
        
        // Check for truly new emails
        const { data: existingEmails } = await (supabase
          .from('email_metadata') as any)
          .select('outlook_message_id')
          .eq('user_id', user.id)
          .in('outlook_message_id', metadata.map(e => e.outlook_message_id))
        
        const existingIds = new Set(existingEmails?.map((e: any) => e.outlook_message_id) || [])
        actualNewEmailCount = metadata.filter(e => !existingIds.has(e.outlook_message_id)).length
        
        await upsertEmailMetadata(supabase, metadata)
        console.log(`✅ Fallback: ${metadata.length} emails (${actualNewEmailCount} new)`)
      }
      
      await updateSyncStatus(supabase, user.id, {
        lastSyncAt: new Date().toISOString(),
        deltaLink: null,
        totalEmailsSynced: (connection.total_emails_synced || 0) + emails.length,
        lastSyncEmailCount: emails.length,
        syncStatus: 'delta_pending',
        lastError: null,
      })
    }

    console.log('✅ Email fetch completed successfully')

    return NextResponse.json({
      success: true,
      emailsFetched: emails.length,
      newEmails: actualNewEmailCount, // Only truly NEW emails (for AI analysis)
      isInitialSync: isInitialFetch,
      deltaLink: newDeltaLink,
    })
  } catch (error: any) {
    console.error('❌ Email fetch failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch emails',
      },
      { status: 500 }
    )
  }
}
