/**
 * Microsoft Authentication Library (MSAL) Configuration
 * Handles OAuth 2.0 authentication with Microsoft/Azure AD
 */

import { Configuration, LogLevel, CacheOptions } from "@azure/msal-browser";

/**
 * MSAL Configuration
 *
 * Required Environment Variables:
 * - NEXT_PUBLIC_AZURE_CLIENT_ID: Application (client) ID from Azure Portal
 * - NEXT_PUBLIC_AZURE_TENANT_ID: Directory (tenant) ID from Azure Portal
 * - NEXT_PUBLIC_REDIRECT_URI: Redirect URI configured in Azure Portal
 */
export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID || "",
    // Use 'consumers' for personal Microsoft accounts (hotmail, outlook.com, live.com)
    // Use 'common' for both personal and work accounts
    // Use tenant ID for work/school accounts only
    authority: `https://login.microsoftonline.com/consumers`,
    redirectUri:
      process.env.NEXT_PUBLIC_REDIRECT_URI ||
      "http://localhost:3000/outlook-test",
  },
  cache: {
    cacheLocation: "localStorage", // Store tokens in localStorage for persistence
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
          case LogLevel.Info:
            console.info(message);
            return;
          case LogLevel.Verbose:
            console.debug(message);
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
        }
      },
    },
  },
};

/**
 * Scopes for Microsoft Graph API
 *
 * - User.Read: Read user profile
 * - Mail.Read: Read user's mail
 * - Mail.ReadWrite: Read and write user's mail (for future send/delete features)
 */
export const loginRequest = {
  scopes: ["User.Read", "Mail.Read"],
};

/**
 * Scopes for token acquisition
 * Used when acquiring access tokens for Graph API calls
 */
export const graphScopes = {
  scopes: ["User.Read", "Mail.Read"],
};
