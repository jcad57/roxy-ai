/**
 * Outlook Test Layout
 * Wraps the test page with OutlookAuthProvider
 */

import { OutlookAuthProvider } from "@/lib/providers/outlook-auth-provider";

export default function OutlookTestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <OutlookAuthProvider>{children}</OutlookAuthProvider>;
}
