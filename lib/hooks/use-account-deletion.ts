/**
 * Account Deletion Hook
 * Complete account and data deletion for testing/dev purposes
 */

import { useMutation } from '@tanstack/react-query'
import { useAuth } from '@/lib/providers/auth-provider'
import { useOutlookAuth } from '@/lib/providers/outlook-auth-provider'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function useAccountDeletion() {
  const { user, signOut: supabaseSignOut } = useAuth()
  const { logout: outlookLogout } = useOutlookAuth()
  const router = useRouter()

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error('No user logged in')
      }

      console.log('🗑️ Starting complete account deletion...')
      console.log(`👤 User ID: ${user.id}`)

      // Step 1: Delete email enrichments
      console.log('1️⃣ Deleting email enrichments...')
      const { error: enrichmentsError } = await (supabase
        .from('email_enrichments') as any)
        .delete()
        .eq('user_id', user.id)

      if (enrichmentsError) {
        console.warn('⚠️ Failed to delete enrichments:', enrichmentsError)
      } else {
        console.log('✅ Email enrichments deleted')
      }

      // Step 2: Delete email metadata
      console.log('2️⃣ Deleting email metadata...')
      const { error: metadataError } = await (supabase
        .from('email_metadata') as any)
        .delete()
        .eq('user_id', user.id)

      if (metadataError) {
        console.warn('⚠️ Failed to delete metadata:', metadataError)
      } else {
        console.log('✅ Email metadata deleted')
      }

      // Step 3: Delete Outlook connection
      console.log('3️⃣ Deleting Outlook connection...')
      const { error: connectionError } = await (supabase
        .from('outlook_connections') as any)
        .delete()
        .eq('user_id', user.id)

      if (connectionError) {
        console.warn('⚠️ Failed to delete connection:', connectionError)
      } else {
        console.log('✅ Outlook connection deleted')
      }

      // Step 4: Delete view preferences (if exists)
      console.log('4️⃣ Deleting view preferences...')
      const { error: prefsError } = await (supabase
        .from('view_preferences') as any)
        .delete()
        .eq('user_id', user.id)

      if (prefsError && prefsError.code !== 'PGRST116') { // Ignore "not found" error
        console.warn('⚠️ Failed to delete preferences:', prefsError)
      } else {
        console.log('✅ View preferences deleted')
      }

      // Step 5: Clear email body cache (in-memory)
      console.log('5️⃣ Clearing email body cache...')
      const { emailBodyCache } = await import('@/lib/services/email-body-cache')
      emailBodyCache.clear()
      console.log('✅ Email body cache cleared')

      // Step 7: Clear MSAL cache (Outlook tokens)
      console.log('7️⃣ Clearing MSAL cache...')
      try {
        await outlookLogout()
        
        // Clear all MSAL keys from localStorage
        const msalKeys = Object.keys(localStorage).filter(key => 
          key.includes('msal') || 
          key.includes('login.windows.net') ||
          key.includes('microsoft')
        )
        msalKeys.forEach(key => {
          localStorage.removeItem(key)
          console.log(`  Cleared: ${key}`)
        })
        
        console.log('✅ MSAL cache cleared')
      } catch (error) {
        console.warn('⚠️ Failed to clear MSAL cache:', error)
      }

      // Step 8: Clear IndexedDB
      console.log('6️⃣ Clearing IndexedDB...')
      try {
        const databases = await indexedDB.databases()
        for (const db of databases) {
          if (db.name) {
            indexedDB.deleteDatabase(db.name)
            console.log(`  Deleted database: ${db.name}`)
          }
        }
        console.log('✅ IndexedDB cleared')
      } catch (error) {
        console.warn('⚠️ Failed to clear IndexedDB:', error)
      }

      // Step 9: Clear localStorage (except theme preferences)
      console.log('7️⃣ Clearing localStorage...')
      try {
        const themeData = localStorage.getItem('roxy-theme')
        localStorage.clear()
        if (themeData) {
          localStorage.setItem('roxy-theme', themeData) // Restore theme
        }
        console.log('✅ localStorage cleared')
      } catch (error) {
        console.warn('⚠️ Failed to clear localStorage:', error)
      }

      // Step 10: Clear sessionStorage
      console.log('8️⃣ Clearing sessionStorage...')
      try {
        sessionStorage.clear()
        console.log('✅ sessionStorage cleared')
      } catch (error) {
        console.warn('⚠️ Failed to clear sessionStorage:', error)
      }

      // Step 11: Delete user account from Supabase Auth
      console.log('9️⃣ Deleting user account from Supabase Auth...')
      const { error: deleteUserError } = await supabase.rpc('delete_user')

      if (deleteUserError) {
        // If RPC doesn't exist, try auth admin API (will only work if you have service role key)
        console.warn('⚠️ delete_user RPC not found, account will need manual deletion')
        console.log('💡 User data cleared but account still exists in Supabase Auth')
        console.log('💡 Manually delete from Supabase Dashboard → Authentication → Users')
      } else {
        console.log('✅ User account deleted from Supabase Auth')
      }

      // Step 12: Sign out from Supabase
      console.log('🔟 Signing out from Supabase...')
      await supabaseSignOut()
      console.log('✅ Signed out successfully')

      console.log('')
      console.log('🎉 Account deletion complete!')
      console.log('📍 Routing to sign-in page...')

      return { success: true }
    },
    onSuccess: () => {
      // Clear any remaining React Query cache
      // queryClient.clear() - handled by logout

      // Wait a moment for state to settle, then redirect
      setTimeout(() => {
        router.push('/auth/sign-in')
        window.location.reload() // Force full page reload to clear everything
      }, 500)
    },
    onError: (error: Error) => {
      console.error('❌ Account deletion failed:', error.message)
    },
  })

  return {
    deleteAccount: deleteMutation.mutate,
    deleteAccountAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,
  }
}
