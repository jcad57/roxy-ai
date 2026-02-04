/**
 * Response Analytics Service
 * Track usage and costs
 */

import type { ResponseAnalyticsEntry } from "@/lib/types/response";

const ANALYTICS_KEY = "roxyai-response-analytics-v1";

export const ResponseAnalytics = {
  /**
   * Log a response generation
   */
  logGeneration(
    emailId: string,
    model: string,
    tokenCount: number,
    cost: number
  ): void {
    try {
      const log: ResponseAnalyticsEntry[] = JSON.parse(
        localStorage.getItem(ANALYTICS_KEY) || "[]"
      );

      log.push({
        emailId,
        model,
        tokenCount,
        cost,
        timestamp: Date.now(),
      });

      // Keep only last 100 entries
      if (log.length > 100) {
        log.splice(0, log.length - 100);
      }

      localStorage.setItem(ANALYTICS_KEY, JSON.stringify(log));
    } catch (error) {
      console.error("Error logging analytics:", error);
    }
  },

  /**
   * Get analytics statistics
   */
  getStats(): {
    totalGenerated: number;
    totalCost: number;
    avgCost: number;
    byModel: Record<string, number>;
    last7Days: ResponseAnalyticsEntry[];
  } {
    try {
      const log: ResponseAnalyticsEntry[] = JSON.parse(
        localStorage.getItem(ANALYTICS_KEY) || "[]"
      );

      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const last7Days = log.filter((entry) => entry.timestamp > sevenDaysAgo);

      const byModel: Record<string, number> = {};
      log.forEach((entry) => {
        byModel[entry.model] = (byModel[entry.model] || 0) + 1;
      });

      const totalCost = log.reduce((sum, entry) => sum + entry.cost, 0);

      return {
        totalGenerated: log.length,
        totalCost: Math.round(totalCost * 10000) / 10000,
        avgCost:
          log.length > 0
            ? Math.round((totalCost / log.length) * 10000) / 10000
            : 0,
        byModel,
        last7Days,
      };
    } catch (error) {
      console.error("Error getting analytics:", error);
      return {
        totalGenerated: 0,
        totalCost: 0,
        avgCost: 0,
        byModel: {},
        last7Days: [],
      };
    }
  },

  /**
   * Clear all analytics
   */
  clear(): void {
    localStorage.removeItem(ANALYTICS_KEY);
    console.log("🗑️  Cleared response analytics");
  },
};

// Add to dev helpers
if (typeof window !== "undefined") {
  (window as any).showResponseAnalytics = () => {
    const stats = ResponseAnalytics.getStats();
    console.log("📊 Response Generation Analytics:");
    console.log(`  Total generated: ${stats.totalGenerated}`);
    console.log(`  Total cost: $${stats.totalCost.toFixed(4)}`);
    console.log(`  Avg cost: $${stats.avgCost.toFixed(4)}`);
    console.log(`  By model:`, stats.byModel);
    console.log(`  Last 7 days: ${stats.last7Days.length} generations`);
    return stats;
  };

  console.log("💡 Response Analytics Helper:");
  console.log(
    "  - window.showResponseAnalytics() - Show response generation stats"
  );
}
