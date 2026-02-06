"use client";

/**
 * Outlook Test Page
 * Simple test page to verify Microsoft Outlook integration
 */

import { useEffect, useState } from "react";
import { useOutlookAuth } from "@/lib/providers/outlook-auth-provider";
import {
  fetchInboxEmails,
  getUserProfile,
} from "@/lib/services/outlook-service";

export default function OutlookTestPage() {
  const {
    isAuthenticated,
    user,
    loading,
    error,
    login,
    logout,
    getAccessToken,
    clearAuthState,
  } = useOutlookAuth();

  const [emails, setEmails] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [fetchingEmails, setFetchingEmails] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      await login();
    } catch (err: any) {
      console.error("Login failed:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setEmails(null);
      setProfile(null);
      setApiError(null);
    } catch (err: any) {
      console.error("Logout failed:", err);
    }
  };

  const handleFetchEmails = async () => {
    setFetchingEmails(true);
    setApiError(null);

    try {
      const response = await fetchInboxEmails(getAccessToken, 10);
      setEmails(response);
      console.log("Emails fetched:", response);
    } catch (err: any) {
      console.error("Failed to fetch emails:", err);
      setApiError(err.message || "Failed to fetch emails");
    } finally {
      setFetchingEmails(false);
    }
  };

  const handleFetchProfile = async () => {
    setFetchingProfile(true);
    setApiError(null);

    try {
      const response = await getUserProfile(getAccessToken);
      setProfile(response);
      console.log("Profile fetched:", response);
    } catch (err: any) {
      console.error("Failed to fetch profile:", err);
      setApiError(err.message || "Failed to fetch profile");
    } finally {
      setFetchingProfile(false);
    }
  };

  const handleCheckToken = async () => {
    setApiError(null);
    try {
      const token = await getAccessToken();
      if (!token) {
        setApiError("Failed to get access token");
        return;
      }

      // Decode JWT token to see scopes
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        setTokenInfo({
          scopes: payload.scp || payload.roles || "No scopes found",
          appId: payload.appid || payload.azp,
          audience: payload.aud,
          issuer: payload.iss,
          expiresAt: new Date(payload.exp * 1000).toLocaleString(),
        });
        console.log("🎟️  Full token payload:", payload);
      }
    } catch (err: any) {
      console.error("Failed to decode token:", err);
      setApiError(err.message || "Failed to check token");
    }
  };

  // Loading state
  if (loading) {
    return (
      <div style={{ padding: "40px", fontFamily: "system-ui" }}>
        <h1>Outlook Integration Test</h1>
        <p>Loading authentication...</p>
      </div>
    );
  }

  return (
    <div
      style={{ padding: "40px", fontFamily: "system-ui", maxWidth: "1200px" }}
    >
      <h1>🔗 Outlook Integration Test</h1>
      <p style={{ color: "#666", marginBottom: "30px" }}>
        Test Microsoft Graph API connection and email retrieval
      </p>

      {/* Authentication Error */}
      {error && (
        <div
          style={{
            background: "#fee",
            border: "1px solid #fcc",
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "20px",
            color: "#c00",
          }}
        >
          <strong>Authentication Error:</strong> {error}
          {error.includes("interaction") && (
            <div style={{ marginTop: "10px" }}>
              <button
                onClick={async () => {
                  await clearAuthState();
                  setApiError(null);
                }}
                style={{
                  background: "#fff",
                  color: "#c00",
                  border: "1px solid #c00",
                  padding: "6px 12px",
                  fontSize: "12px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                🧹 Clear Auth State & Try Again
              </button>
            </div>
          )}
        </div>
      )}

      {/* API Error */}
      {apiError && (
        <div
          style={{
            background: "#fee",
            border: "1px solid #fcc",
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "20px",
            color: "#c00",
          }}
        >
          <strong>API Error:</strong> {apiError}
        </div>
      )}

      {/* Not Authenticated State */}
      {!isAuthenticated && (
        <div
          style={{
            background: "#f5f5f5",
            border: "1px solid #ddd",
            padding: "30px",
            borderRadius: "12px",
            textAlign: "center",
          }}
        >
          <h2>🔐 Not Authenticated</h2>
          <p style={{ color: "#666", marginBottom: "20px" }}>
            Login with your Microsoft account to test email fetching
          </p>
          <div
            style={{ display: "flex", gap: "12px", justifyContent: "center" }}
          >
            <button
              onClick={handleLogin}
              style={{
                background: "#0078d4",
                color: "#fff",
                border: "none",
                padding: "12px 24px",
                fontSize: "16px",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 600,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#005a9e";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#0078d4";
              }}
            >
              🔑 Login with Microsoft
            </button>

            <button
              onClick={async () => {
                await clearAuthState();
              }}
              title="Clear any stuck authentication state"
              style={{
                background: "#fff",
                color: "#666",
                border: "1px solid #ddd",
                padding: "12px 16px",
                fontSize: "14px",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 600,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f5f5f5";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#fff";
              }}
            >
              🧹 Clear State
            </button>
          </div>
        </div>
      )}

      {/* Authenticated State */}
      {isAuthenticated && user && (
        <>
          {/* User Info */}
          <div
            style={{
              background: "#e8f5e9",
              border: "1px solid #c8e6c9",
              padding: "20px",
              borderRadius: "12px",
              marginBottom: "20px",
            }}
          >
            <h2 style={{ margin: "0 0 10px 0", color: "#2e7d32" }}>
              ✅ Authenticated
            </h2>
            <p style={{ margin: "0", fontSize: "14px", color: "#1b5e20" }}>
              <strong>Logged in as:</strong> {user.username || user.name}
            </p>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginBottom: "30px",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={handleFetchProfile}
              disabled={fetchingProfile}
              style={{
                background: "#0078d4",
                color: "#fff",
                border: "none",
                padding: "10px 20px",
                fontSize: "14px",
                borderRadius: "6px",
                cursor: fetchingProfile ? "not-allowed" : "pointer",
                fontWeight: 600,
                opacity: fetchingProfile ? 0.6 : 1,
              }}
            >
              {fetchingProfile ? "⏳ Loading..." : "👤 Fetch Profile"}
            </button>

            <button
              onClick={handleFetchEmails}
              disabled={fetchingEmails}
              style={{
                background: "#0078d4",
                color: "#fff",
                border: "none",
                padding: "10px 20px",
                fontSize: "14px",
                borderRadius: "6px",
                cursor: fetchingEmails ? "not-allowed" : "pointer",
                fontWeight: 600,
                opacity: fetchingEmails ? 0.6 : 1,
              }}
            >
              {fetchingEmails ? "⏳ Loading..." : "📧 Fetch Emails"}
            </button>

            <button
              onClick={handleCheckToken}
              style={{
                background: "#f59e0b",
                color: "#fff",
                border: "none",
                padding: "10px 20px",
                fontSize: "14px",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 600,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#d97706";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#f59e0b";
              }}
            >
              🔍 Check Token Scopes
            </button>

            <button
              onClick={handleLogout}
              style={{
                background: "#666",
                color: "#fff",
                border: "none",
                padding: "10px 20px",
                fontSize: "14px",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 600,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#444";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#666";
              }}
            >
              🚪 Logout
            </button>
          </div>

          {/* Token Info */}
          {tokenInfo && (
            <div style={{ marginBottom: "30px" }}>
              <h2>🎟️ Access Token Info</h2>
              <div
                style={{
                  background: tokenInfo.scopes?.includes("Mail.Read")
                    ? "#e8f5e9"
                    : "#fee",
                  border: `1px solid ${tokenInfo.scopes?.includes("Mail.Read") ? "#c8e6c9" : "#fcc"}`,
                  padding: "16px",
                  borderRadius: "8px",
                  fontSize: "13px",
                }}
              >
                <div style={{ marginBottom: "8px" }}>
                  <strong>Scopes:</strong> {tokenInfo.scopes}
                </div>
                <div
                  style={{
                    marginBottom: "8px",
                    color: tokenInfo.scopes?.includes("Mail.Read")
                      ? "#2e7d32"
                      : "#c00",
                    fontWeight: "bold",
                  }}
                >
                  {tokenInfo.scopes?.includes("Mail.Read")
                    ? "✅ Mail.Read permission is granted!"
                    : "❌ Mail.Read permission is MISSING!"}
                </div>
                <div
                  style={{ fontSize: "11px", color: "#666", marginTop: "8px" }}
                >
                  <div>Expires: {tokenInfo.expiresAt}</div>
                  <div>App ID: {tokenInfo.appId}</div>
                </div>

                {!tokenInfo.scopes?.includes("Mail.Read") && (
                  <div
                    style={{
                      marginTop: "12px",
                      padding: "10px",
                      background: "#fff",
                      borderRadius: "4px",
                      fontSize: "12px",
                    }}
                  >
                    <strong>⚠️ To fix:</strong>
                    <ol style={{ margin: "8px 0 0 0", paddingLeft: "20px" }}>
                      <li>Go to Azure Portal → Your App → API Permissions</li>
                      <li>Add "Mail.Read" permission</li>
                      <li>Grant admin consent</li>
                      <li>Logout and login again</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Profile Data */}
          {profile && (
            <div style={{ marginBottom: "30px" }}>
              <h2>👤 User Profile</h2>
              <div
                style={{
                  background: "#f5f5f5",
                  border: "1px solid #ddd",
                  padding: "16px",
                  borderRadius: "8px",
                  fontFamily: "monospace",
                  fontSize: "13px",
                  overflow: "auto",
                }}
              >
                <div>
                  <strong>Name:</strong> {profile.displayName}
                </div>
                <div>
                  <strong>Email:</strong>{" "}
                  {profile.mail || profile.userPrincipalName}
                </div>
              </div>
            </div>
          )}

          {/* Email Data */}
          {emails && (
            <div>
              <h2>📧 Emails (Raw JSON Response)</h2>
              <div
                style={{
                  background: "#f5f5f5",
                  border: "1px solid #ddd",
                  padding: "16px",
                  borderRadius: "8px",
                  overflow: "auto",
                  maxHeight: "600px",
                }}
              >
                <pre
                  style={{
                    margin: 0,
                    fontFamily: "monospace",
                    fontSize: "12px",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                  }}
                >
                  {JSON.stringify(emails, null, 2)}
                </pre>
              </div>

              {/* Email Count Summary */}
              {emails.value && (
                <div
                  style={{
                    marginTop: "16px",
                    padding: "12px",
                    background: "#e3f2fd",
                    border: "1px solid #90caf9",
                    borderRadius: "6px",
                  }}
                >
                  <strong>
                    ✅ Successfully fetched {emails.value.length} emails
                  </strong>
                  <div style={{ marginTop: "8px", fontSize: "14px" }}>
                    {emails.value
                      .slice(0, 3)
                      .map((email: any, index: number) => (
                        <div key={index} style={{ marginTop: "4px" }}>
                          • {email.subject || "(No subject)"} - from{" "}
                          {email.from?.emailAddress?.name ||
                            email.from?.emailAddress?.address}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Instructions */}
      <div
        style={{
          marginTop: "40px",
          padding: "20px",
          background: "#fff3cd",
          border: "1px solid #ffc107",
          borderRadius: "8px",
        }}
      >
        <h3 style={{ margin: "0 0 10px 0" }}>📋 Testing Instructions</h3>
        <ol style={{ margin: "0", paddingLeft: "20px", fontSize: "14px" }}>
          <li>Click "Login with Microsoft" to authenticate</li>
          <li>Grant permissions when prompted (User.Read, Mail.Read)</li>
          <li>
            After login, click "Fetch Profile" to test user data retrieval
          </li>
          <li>Click "Fetch Emails" to retrieve your inbox messages</li>
          <li>Check the raw JSON response below</li>
          <li>Check browser console for detailed logs</li>
        </ol>

        <div
          style={{
            marginTop: "12px",
            padding: "10px",
            background: "#fff",
            borderRadius: "4px",
            fontSize: "13px",
          }}
        >
          <strong>💡 Troubleshooting:</strong> If you see
          "interaction_in_progress" error:
          <ul style={{ margin: "4px 0 0 0", paddingLeft: "20px" }}>
            <li>Close any open Microsoft login popups</li>
            <li>Click "Clear Auth State" button</li>
            <li>Wait 2-3 seconds, then try logging in again</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
