/**
 * Connect Outlook Layout
 * Wraps the connect-outlook page with OutlookAuthProvider
 */

import { OutlookAuthProvider } from '@/lib/providers/outlook-auth-provider'

export default function ConnectOutlookLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <OutlookAuthProvider>{children}</OutlookAuthProvider>
}
