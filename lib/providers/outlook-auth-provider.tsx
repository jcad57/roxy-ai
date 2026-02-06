"use client";

/**
 * Outlook Authentication Provider
 * Manages Microsoft authentication state and token acquisition
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  PublicClientApplication,
  AccountInfo,
  AuthenticationResult,
  InteractionRequiredAuthError,
} from "@azure/msal-browser";
import { msalConfig, loginRequest, graphScopes } from "@/lib/auth/msal-config";

interface OutlookAuthContextType {
  isAuthenticated: boolean;
  user: AccountInfo | null;
  loading: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  clearAuthState: () => Promise<void>;
}

const OutlookAuthContext = createContext<OutlookAuthContextType | undefined>(
  undefined
);

// Initialize MSAL instance
let msalInstance: PublicClientApplication | null = null;
let msalInitPromise: Promise<PublicClientApplication> | null = null;

const initializeMsal = async (): Promise<PublicClientApplication> => {
  // If already initialized, return it
  if (msalInstance) {
    return msalInstance;
  }
  
  // If initialization is in progress, wait for it
  if (msalInitPromise) {
    return msalInitPromise;
  }
  
  // Start new initialization
  msalInitPromise = (async () => {
    try {
      const instance = new PublicClientApplication(msalConfig);
      await instance.initialize();
      msalInstance = instance;
      console.log("✅ MSAL initialized successfully");
      return instance;
    } catch (err) {
      console.error("❌ MSAL initialization failed:", err);
      msalInitPromise = null; // Reset so we can retry
      throw err;
    }
  })();
  
  return msalInitPromise;
};

export function OutlookAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize MSAL and check for existing session
  useEffect(() => {
    let isMounted = true;
    
    const initAuth = async () => {
      try {
        console.log("🔧 Initializing MSAL...");
        const instance = await initializeMsal();
        
        if (!isMounted) return;
        
        // CRITICAL: Handle redirect response FIRST and ALWAYS
        // This must be called on every page load to handle OAuth redirects
        console.log("🔄 Handling redirect response...");
        
        try {
          const response = await instance.handleRedirectPromise();
          
          if (!isMounted) return;
          
          if (response !== null) {
            // We just came back from a redirect
            console.log("📥 Redirect response received:", response);
            
            if (response.account) {
              // Success! We have an account
              setUser(response.account);
              setIsAuthenticated(true);
              console.log("✅ Login successful via redirect:", response.account.username);
              console.log("🎟️  Access token acquired:", response.accessToken ? "Yes" : "No");
              console.log("📋 Granted scopes:", response.scopes);
              console.log("🔍 Looking for Mail.Read:", response.scopes?.includes("Mail.Read") ? "✅ Found" : "❌ NOT FOUND");
              setLoading(false);
              return; // Done!
            } else {
              console.warn("⚠️  Redirect completed but no account found");
            }
          } else {
            console.log("ℹ️  No redirect in progress (normal page load)");
          }
        } catch (redirectError: any) {
          console.error("❌ Error handling redirect:", redirectError);
          
          if (isMounted) {
            // Show specific error to user
            if (redirectError.errorCode === "no_token_request_cache_error") {
              setError("Session expired during login. Please try logging in again.");
            } else {
              setError(`Login failed: ${redirectError.message || redirectError.errorCode}`);
            }
          }
        }
        
        // Check for existing cached accounts (user was already logged in)
        const accounts = instance.getAllAccounts();

        if (!isMounted) return;

        if (accounts.length > 0) {
          setUser(accounts[0]);
          setIsAuthenticated(true);
          console.log("✅ Found existing Microsoft account:", accounts[0].username);
          console.log("📧 Email:", accounts[0].username);
        } else {
          console.log("ℹ️  No existing accounts found - user needs to login");
        }
      } catch (err: any) {
        console.error("❌ Fatal error initializing MSAL:", err);
        if (isMounted) {
          setError("Failed to initialize authentication. Please refresh the page.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();
    
    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Login with Microsoft
   * Uses redirect flow (more reliable than popup)
   */
  const login = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("🔑 Starting login process...");
      
      // Ensure MSAL is initialized
      const instance = await initializeMsal();
      
      // Check if there's already an interaction in progress
      const inProgressKey = 'msal.interaction.status';
      const inProgress = localStorage.getItem(inProgressKey);
      
      if (inProgress) {
        console.warn("⚠️  Clearing stale interaction state...");
        localStorage.removeItem(inProgressKey);
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      console.log("🔄 Redirecting to Microsoft login...");
      
      // Use redirect instead of popup - more reliable!
      await instance.loginRedirect(loginRequest);
      
      // Note: Code after loginRedirect won't execute as page will redirect
    } catch (err: any) {
      console.error("❌ Login error:", err);
      setLoading(false);
      
      // Handle specific error codes
      if (err.errorCode === "interaction_in_progress") {
        setError("Another login is already in progress. Please wait or click 'Clear State'.");
      } else if (err.errorCode === "user_cancelled") {
        setError("Login was cancelled. Please try again.");
      } else {
        setError(err.message || "Login failed. Please try again.");
      }
    }
  };

  /**
   * Logout
   * Clears tokens and account data
   */
  const logout = async () => {
    setLoading(true);
    setError(null);

    try {
      const instance = await initializeMsal();
      
      if (user) {
        // Use redirect for logout too
        await instance.logoutRedirect({
          account: user,
        });
      } else {
        // If no user, just clear local state
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Logout error:", err);
      setError(err.message || "Logout failed");
      setLoading(false);
    }
  };

  /**
   * Get Access Token for Graph API
   * Tries silent token acquisition first, falls back to interactive
   */
  const getAccessToken = async (): Promise<string | null> => {
    try {
      const instance = await initializeMsal();
      const accounts = instance.getAllAccounts();

      if (accounts.length === 0) {
        throw new Error("No accounts found. Please login first.");
      }

      const request = {
        ...graphScopes,
        account: accounts[0],
        forceRefresh: false, // Use cached token if available (set to true to force new token)
      };

      console.log("🎟️  Requesting token with scopes:", graphScopes.scopes);
      console.log("🔄 Force refresh:", request.forceRefresh);

      try {
        // Try to acquire token silently
        const response = await instance.acquireTokenSilent(request);
        console.log("✅ Access token acquired silently");
        console.log("📋 Token scopes:", response.scopes);
        return response.accessToken;
      } catch (err: any) {
        console.warn("⚠️  Silent token acquisition failed:", err.errorCode);
        
        // If silent acquisition fails, fall back to interactive (redirect)
        if (err instanceof InteractionRequiredAuthError) {
          console.log("🔄 Requesting consent via redirect...");
          // Use redirect for consistency
          await instance.acquireTokenRedirect(request);
          // Note: Code after this won't execute as page redirects
          return null;
        }
        throw err;
      }
    } catch (err: any) {
      console.error("❌ Error acquiring access token:", err);
      setError(err.message || "Failed to acquire access token");
      return null;
    }
  };

  /**
   * Clear stale authentication state
   * Use this if you get stuck in an interaction_in_progress error
   */
  const clearAuthState = async () => {
    console.log("🧹 Clearing authentication state...");
    
    try {
      // If MSAL is initialized, clear accounts properly
      if (msalInstance) {
        const accounts = msalInstance.getAllAccounts();
        for (const account of accounts) {
          try {
            await msalInstance.clearCache();
          } catch (e) {
            console.warn("Could not clear MSAL cache:", e);
          }
        }
      }
    } catch (err) {
      console.warn("Error during MSAL cleanup:", err);
    }
    
    // Clear MSAL-related items from localStorage
    const keysToRemove = [
      'msal.interaction.status',
      'msal.token.keys',
      'msal.account.keys'
    ];
    
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        // Ignore
      }
    });
    
    // Clear all keys that start with msal
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('msal.')) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn("Could not clear localStorage:", e);
    }
    
    // Reset MSAL instance to force re-initialization
    msalInstance = null;
    msalInitPromise = null;
    
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    
    console.log("✅ Authentication state cleared. You can try logging in again.");
  };

  const value: OutlookAuthContextType = {
    isAuthenticated,
    user,
    loading,
    error,
    login,
    logout,
    getAccessToken,
    clearAuthState,
  };

  return (
    <OutlookAuthContext.Provider value={value}>
      {children}
    </OutlookAuthContext.Provider>
  );
}

/**
 * Hook to use Outlook Authentication
 */
export function useOutlookAuth() {
  const context = useContext(OutlookAuthContext);
  if (context === undefined) {
    throw new Error("useOutlookAuth must be used within OutlookAuthProvider");
  }
  return context;
}
