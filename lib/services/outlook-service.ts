/**
 * Outlook Service
 * Functions for interacting with Microsoft Graph API to fetch emails
 */

import { getGraphClient } from "./graph-client";

/**
 * Fetch emails from user's inbox
 * 
 * @param getAccessToken - Function to get access token from auth provider
 * @param count - Number of emails to fetch (default: 10)
 * @returns Raw Graph API response with email data
 */
export async function fetchInboxEmails(
  getAccessToken: () => Promise<string | null>,
  count: number = 10
): Promise<any> {
  try {
    console.log(`📧 Fetching ${count} emails from inbox...`);

    // Get fresh access token
    console.log("🎟️  Acquiring access token for email fetch...");
    const token = await getAccessToken();
    
    if (!token) {
      throw new Error("Failed to acquire access token. Please login first.");
    }
    
    console.log("✅ Token acquired, length:", token.length);
    console.log("🔍 Token preview:", token.substring(0, 50) + "...");

    // Build the query URL
    const selectFields = [
      "id",
      "subject",
      "from",
      "receivedDateTime",
      "isRead",
      "bodyPreview",
      "hasAttachments",
      "importance",
      "conversationId",
    ].join(",");
    
    const url = `https://graph.microsoft.com/v1.0/me/messages?$top=${count}&$select=${selectFields}&$orderby=receivedDateTime DESC`;
    
    console.log("📞 Calling Graph API with direct fetch...");
    console.log("🔗 URL:", url);
    
    // Make direct fetch call with explicit Authorization header
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("📡 Response status:", response.status, response.statusText);
    console.log("📡 Response headers:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Error response body:", errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.error("❌ Parsed error:", errorJson);
        throw new Error(`HTTP ${response.status}: ${errorJson.error?.message || response.statusText}`);
      } catch (parseError) {
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }
    }

    const data = await response.json();
    console.log(`✅ Successfully fetched ${data.value?.length || 0} emails`);
    return data;
  } catch (err: any) {
    console.error("❌ Error fetching emails:", err);
    
    // Provide helpful error messages
    if (err.statusCode === 401) {
      throw new Error("Authentication failed. Please login again.");
    } else if (err.statusCode === 403) {
      throw new Error("Permission denied. Please grant Mail.Read permission.");
    } else {
      throw new Error(err.message || "Failed to fetch emails");
    }
  }
}

/**
 * Fetch a single email by ID
 * 
 * @param getAccessToken - Function to get access token from auth provider
 * @param emailId - Email message ID
 * @returns Email message data
 */
export async function fetchEmailById(
  getAccessToken: () => Promise<string | null>,
  emailId: string
): Promise<any> {
  try {
    console.log(`📧 Fetching email ${emailId}...`);

    const client = await getGraphClient(getAccessToken);
    
    if (!client) {
      throw new Error("Failed to create Graph client. Please login first.");
    }

    const response = await client
      .api(`/me/messages/${emailId}`)
      .select([
        "id",
        "subject",
        "from",
        "toRecipients",
        "ccRecipients",
        "receivedDateTime",
        "isRead",
        "body",
        "bodyPreview",
        "hasAttachments",
        "importance",
        "conversationId",
      ])
      .get();

    console.log(`✅ Successfully fetched email: ${response.subject}`);
    return response;
  } catch (err: any) {
    console.error("❌ Error fetching email:", err);
    throw new Error(err.message || "Failed to fetch email");
  }
}

/**
 * Get user profile information
 * 
 * @param getAccessToken - Function to get access token from auth provider
 * @returns User profile data
 */
export async function getUserProfile(
  getAccessToken: () => Promise<string | null>
): Promise<any> {
  try {
    console.log("👤 Fetching user profile...");

    const client = await getGraphClient(getAccessToken);
    
    if (!client) {
      throw new Error("Failed to create Graph client. Please login first.");
    }

    const response = await client
      .api("/me")
      .select(["displayName", "mail", "userPrincipalName"])
      .get();

    console.log(`✅ Successfully fetched profile for: ${response.mail}`);
    return response;
  } catch (err: any) {
    console.error("❌ Error fetching user profile:", err);
    throw new Error(err.message || "Failed to fetch user profile");
  }
}
