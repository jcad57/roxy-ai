/**
 * Email Data Hook
 * Manages emails using React Query + IndexedDB + Supabase
 * Handles AI enrichment separately from raw email data
 *
 * Flow:
 * 1. Load emails from IndexedDB
 * 2. Separate processed (has enrichment) vs unprocessed (needs analysis)
 * 3. Show processed emails immediately
 * 4. Show skeletons for unprocessed emails
 * 5. Trigger AI analysis for unprocessed emails
 * 6. Save enrichments to IndexedDB (fast local cache)
 * 7. Save enrichments to Supabase (persistent cloud storage)
 * 8. Update UI with analyzed emails
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  RawEmail,
  EnrichedEmail,
  EmailAIEnrichment,
} from "@/lib/types/email-raw";
import {
  initializeEmails,
  getEnrichedEmails,
  getEmailsNeedingAnalysis,
  clearAIEnrichments,
} from "@/lib/services/email-service";
import { EnrichmentDB } from "@/lib/services/storage/indexeddb";
import { mockOutlookEmails } from "@/lib/data/mock-outlook-emails";
import { useEmailEnrichments } from "./use-email-enrichments";

/**
 * Main hook to manage email data with AI enrichment
 */
export function useEmailData() {
  const queryClient = useQueryClient();
  const { saveEnrichments } = useEmailEnrichments();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedCount, setAnalyzedCount] = useState(0);
  const [totalToAnalyze, setTotalToAnalyze] = useState(0);
  const [hasInitializedAnalysis, setHasInitializedAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [emailsBeingAnalyzed, setEmailsBeingAnalyzed] = useState<Set<string>>(
    new Set()
  );

  // Initialize email database on mount
  useEffect(() => {
    const init = async () => {
      await initializeEmails(mockOutlookEmails);
      queryClient.invalidateQueries({ queryKey: ["enrichedEmails"] });
    };
    init();
  }, [queryClient]);

  // Query: Get enriched emails (raw + AI data from IndexedDB)
  const { data: enrichedEmails = [], isLoading: isLoadingEmails } = useQuery({
    queryKey: ["enrichedEmails"],
    queryFn: async () => {
      console.log("🔍 Loading emails from IndexedDB...");
      const enriched = await getEnrichedEmails();
      console.log("✅ Loaded", enriched.length, "emails");
      return enriched;
    },
    initialData: [],
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Separate processed vs unprocessed emails
  const { processedEmails, unprocessedEmails } = useMemo(() => {
    const processed: EnrichedEmail[] = [];
    const unprocessed: EnrichedEmail[] = [];

    enrichedEmails.forEach((email) => {
      if (email.enrichment) {
        processed.push(email);
      } else {
        unprocessed.push(email);
      }
    });

    return { processedEmails: processed, unprocessedEmails: unprocessed };
  }, [enrichedEmails]);

  /**
   * Analyze unprocessed emails using smart two-pass approach
   */
  const analyzeAll = useCallback(async (): Promise<void> => {
    if (isAnalyzing) {
      console.log("⏭️  Analysis already in progress, skipping...");
      return;
    }

    const emailsToAnalyze = await getEmailsNeedingAnalysis();

    console.log(`📧 Email Analysis Check:`);
    console.log(`  Total emails: ${enrichedEmails.length}`);
    console.log(`  Processed: ${processedEmails.length}`);
    console.log(`  Need analysis: ${emailsToAnalyze.length}`);

    if (emailsToAnalyze.length === 0) {
      console.log("✅ All emails already analyzed");
      return;
    }

    setIsAnalyzing(true);
    setTotalToAnalyze(emailsToAnalyze.length);
    setAnalyzedCount(0);
    setAnalysisError(null);

    // Mark emails as being analyzed
    setEmailsBeingAnalyzed(new Set(emailsToAnalyze.map((e) => e.id)));

    console.log(
      `🤖 Starting smart AI analysis of ${emailsToAnalyze.length} emails...`
    );

    try {
      // Use smart analysis endpoint (two-pass: quick + deep)
      const response = await fetch("/api/ai/smart-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: emailsToAnalyze }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Analysis failed: ${response.statusText}`
        );
      }

      const data = await response.json();

      // CRITICAL: Save enrichments to both IndexedDB and Supabase
      if (data.enrichments && Array.isArray(data.enrichments)) {
        console.log(`💾 Saving ${data.enrichments.length} enrichments...`);

        // Save to IndexedDB first (fast local cache)
        await EnrichmentDB.saveMany(data.enrichments);
        console.log(`✅ Enrichments saved to IndexedDB`);

        // Save to Supabase (cloud persistence)
        try {
          await saveEnrichments(data.enrichments);
          console.log(`✅ Enrichments synced to Supabase`);
        } catch (error) {
          console.error("⚠️  Failed to sync enrichments to Supabase:", error);
          // Don't fail the whole operation if Supabase fails
          // IndexedDB has the data for now
        }
      } else {
        console.warn("⚠️  No enrichments returned from API");
      }

      // Update progress
      setAnalyzedCount(data.processedCount);

      // Invalidate queries to refresh UI with new enrichments
      await queryClient.invalidateQueries({ queryKey: ["enrichedEmails"] });

      console.log(
        `✅ AI analysis complete! Cost: $${
          data.estimatedCost?.toFixed(4) || "N/A"
        }`
      );
      setEmailsBeingAnalyzed(new Set());
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error("❌ AI analysis failed:", errorMessage);
      setAnalysisError(errorMessage);
      setEmailsBeingAnalyzed(new Set());
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, enrichedEmails.length, processedEmails.length, queryClient]);

  /**
   * Force re-analyze all emails (ignore cache)
   */
  const refresh = useCallback(async (): Promise<void> => {
    await clearAIEnrichments();
    setHasInitializedAnalysis(false);
    await analyzeAll();
  }, [analyzeAll]);

  /**
   * Auto-analyze when emails are loaded (only once)
   */
  useEffect(() => {
    if (enrichedEmails.length > 0 && !hasInitializedAnalysis && !isAnalyzing) {
      console.log("🤖 Triggering initial auto-analysis...");
      console.log(`  Total emails: ${enrichedEmails.length}`);
      console.log(`  Already processed: ${processedEmails.length}`);
      console.log(`  Need processing: ${unprocessedEmails.length}`);

      setHasInitializedAnalysis(true);

      // Only analyze if there are unprocessed emails
      if (unprocessedEmails.length > 0) {
        analyzeAll();
      }
    }
  }, [enrichedEmails.length, hasInitializedAnalysis, isAnalyzing]); // Only trigger when emails load

  const progress =
    totalToAnalyze > 0 ? Math.round((analyzedCount / totalToAnalyze) * 100) : 0;

  return {
    // All emails (mixed processed and unprocessed)
    enrichedEmails,

    // Separated by processing state
    processedEmails,
    unprocessedEmails,

    // Loading states
    isLoading: isLoadingEmails,
    isAnalyzing,
    emailsBeingAnalyzed,

    // Progress tracking
    analyzedCount,
    totalToAnalyze,
    progress,

    // Error handling
    analysisError,
    clearError: () => setAnalysisError(null),

    // Actions
    analyzeAll,
    refresh,
  };
}
