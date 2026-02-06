/**
 * Microsoft Graph API Client
 * Handles API calls to Microsoft Graph
 */

import { Client } from "@microsoft/microsoft-graph-client";
import "isomorphic-fetch"; // Required for Graph client

/**
 * Create Graph Client with access token
 * @param accessToken - Access token from MSAL
 * @returns Authenticated Microsoft Graph client
 */
export function createGraphClient(accessToken: string): Client {
  console.log("🔧 Creating Graph client with token:", accessToken.substring(0, 20) + "...");
  
  return Client.init({
    authProvider: (done) => {
      // Provide the token with Bearer prefix
      done(null, accessToken);
    },
    defaultVersion: 'v1.0',
  });
}

/**
 * Get authenticated Graph client
 * Helper function that creates a client with the provided token
 */
export async function getGraphClient(
  getAccessToken: () => Promise<string | null>
): Promise<Client | null> {
  try {
    const token = await getAccessToken();
    
    if (!token) {
      console.error("❌ No access token available");
      return null;
    }

    return createGraphClient(token);
  } catch (err) {
    console.error("❌ Error creating Graph client:", err);
    return null;
  }
}
