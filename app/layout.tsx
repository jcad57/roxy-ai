import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/lib/providers/theme-provider";
import { AuthProvider } from "@/lib/providers/auth-provider";
import { OutlookAuthProvider } from "@/lib/providers/outlook-auth-provider";
import { QueryProvider } from "@/lib/providers/query-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "RoxyAI - AI-Powered Email Client",
  description:
    "A beautiful, AI-powered email client that organizes your inbox with intelligent clustering, priority sorting, and multiple innovative views.",
  // manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RoxyAI",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        <QueryProvider>
          <AuthProvider>
            <OutlookAuthProvider>
              <ThemeProvider>{children}</ThemeProvider>
            </OutlookAuthProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
