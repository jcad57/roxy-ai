"use client";

/**
 * OAuth Callback Handler
 * Handles redirect from Microsoft authentication
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // MSAL will automatically handle the redirect response
        // We just need to redirect back to the test page
        console.log("✅ Auth callback received, redirecting...");
        
        // Small delay to ensure MSAL processes the response
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        // Redirect to test page
        router.push("/outlook-test");
      } catch (err: any) {
        console.error("❌ Error handling auth callback:", err);
        setError(err.message || "Authentication failed");
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        fontFamily: "system-ui",
        background: "#f5f5f5",
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "40px",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          textAlign: "center",
          maxWidth: "500px",
        }}
      >
        {!error ? (
          <>
            <div
              style={{
                fontSize: "48px",
                marginBottom: "20px",
              }}
            >
              ⏳
            </div>
            <h1 style={{ margin: "0 0 10px 0", fontSize: "24px" }}>
              Processing Authentication...
            </h1>
            <p style={{ color: "#666", margin: 0 }}>
              Please wait while we complete your login.
            </p>
          </>
        ) : (
          <>
            <div
              style={{
                fontSize: "48px",
                marginBottom: "20px",
              }}
            >
              ❌
            </div>
            <h1 style={{ margin: "0 0 10px 0", fontSize: "24px", color: "#c00" }}>
              Authentication Failed
            </h1>
            <p style={{ color: "#666", margin: "0 0 20px 0" }}>
              {error}
            </p>
            <button
              onClick={() => router.push("/outlook-test")}
              style={{
                background: "#0078d4",
                color: "#fff",
                border: "none",
                padding: "10px 20px",
                fontSize: "14px",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Return to Test Page
            </button>
          </>
        )}
      </div>
    </div>
  );
}
