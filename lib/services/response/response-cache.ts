/**
 * Response Cache Service
 * Caches generated responses to avoid re-generation
 */

import type {
  ResponseSuggestion,
  ResponseContext,
  CachedResponse,
} from "@/lib/types/response";

const RESPONSE_CACHE_KEY = "roxyai-response-cache-v1";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CacheStore {
  [emailId: string]: CachedResponse;
}

export const ResponseCache = {
  /**
   * Get cached response for email
   */
  get(emailId: string): ResponseSuggestion | null {
    try {
      const cache: CacheStore = JSON.parse(
        localStorage.getItem(RESPONSE_CACHE_KEY) || "{}"
      );

      const cached = cache[emailId];

      if (!cached) return null;

      // Check if cache is still valid (< 24 hours)
      const age = Date.now() - new Date(cached.generatedAt).getTime();
      if (age < CACHE_DURATION) {
        console.log(`📦 Cache HIT for email ${emailId}`);
        return cached.response;
      }

      console.log(`⏰ Cache EXPIRED for email ${emailId}`);
      return null;
    } catch (error) {
      console.error("Error reading response cache:", error);
      return null;
    }
  },

  /**
   * Cache a response
   */
  set(
    emailId: string,
    response: ResponseSuggestion,
    context: ResponseContext
  ): void {
    try {
      const cache: CacheStore = JSON.parse(
        localStorage.getItem(RESPONSE_CACHE_KEY) || "{}"
      );

      cache[emailId] = {
        response,
        context,
        generatedAt: new Date().toISOString(),
      };

      localStorage.setItem(RESPONSE_CACHE_KEY, JSON.stringify(cache));
      console.log(`💾 Cached response for email ${emailId}`);
    } catch (error) {
      console.error("Error caching response:", error);
    }
  },

  /**
   * Invalidate cache for specific email
   */
  invalidate(emailId: string): void {
    try {
      const cache: CacheStore = JSON.parse(
        localStorage.getItem(RESPONSE_CACHE_KEY) || "{}"
      );

      delete cache[emailId];
      localStorage.setItem(RESPONSE_CACHE_KEY, JSON.stringify(cache));
      console.log(`🗑️  Invalidated cache for email ${emailId}`);
    } catch (error) {
      console.error("Error invalidating cache:", error);
    }
  },

  /**
   * Clear old cache entries (> 7 days)
   */
  clearOld(): void {
    try {
      const cache: CacheStore = JSON.parse(
        localStorage.getItem(RESPONSE_CACHE_KEY) || "{}"
      );

      const now = Date.now();
      let removedCount = 0;

      Object.keys(cache).forEach((emailId) => {
        const age = now - new Date(cache[emailId].generatedAt).getTime();
        if (age > MAX_CACHE_AGE) {
          delete cache[emailId];
          removedCount++;
        }
      });

      localStorage.setItem(RESPONSE_CACHE_KEY, JSON.stringify(cache));

      if (removedCount > 0) {
        console.log(`🧹 Cleaned up ${removedCount} old cached responses`);
      }
    } catch (error) {
      console.error("Error cleaning cache:", error);
    }
  },

  /**
   * Clear all cached responses
   */
  clear(): void {
    localStorage.removeItem(RESPONSE_CACHE_KEY);
    console.log("🗑️  Cleared all response cache");
  },

  /**
   * Get cache statistics
   */
  getStats(): {
    totalCached: number;
    oldestEntry: string | null;
    newestEntry: string | null;
  } {
    try {
      const cache: CacheStore = JSON.parse(
        localStorage.getItem(RESPONSE_CACHE_KEY) || "{}"
      );

      const entries = Object.values(cache);

      if (entries.length === 0) {
        return { totalCached: 0, oldestEntry: null, newestEntry: null };
      }

      const dates = entries.map((e) => new Date(e.generatedAt).getTime());

      return {
        totalCached: entries.length,
        oldestEntry: new Date(Math.min(...dates)).toISOString(),
        newestEntry: new Date(Math.max(...dates)).toISOString(),
      };
    } catch (error) {
      console.error("Error getting cache stats:", error);
      return { totalCached: 0, oldestEntry: null, newestEntry: null };
    }
  },
};

// Auto-cleanup on load
if (typeof window !== "undefined") {
  ResponseCache.clearOld();
}
