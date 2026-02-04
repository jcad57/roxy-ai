/**
 * Email Data Hook
 * Manages emails using React Query + IndexedDB
 * Handles AI enrichment separately from raw email data
 */

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { RawEmail, EnrichedEmail, EmailAIEnrichment } from "@/lib/types/email-raw";
import { 
  initializeEmails,
  getEnrichedEmails,
  getEmailsNeedingAnalysis,
  saveEnrichment,
  clearAIEnrichments,
} from "@/lib/services/email-service";
import { mockOutlookEmails } from "@/lib/data/mock-outlook-emails";

// Removed - now using smart-analyze API endpoint

/**
 * Main hook to manage email data with AI enrichment
 */
export function useEmailData() {
  const queryClient = useQueryClient();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedCount, setAnalyzedCount] = useState(0);
  const [totalToAnalyze, setTotalToAnalyze] = useState(0);
  const [hasInitializedAnalysis, setHasInitializedAnalysis] = useState(false);

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

  // Derive raw emails from enriched for analysis
  const rawEmails = enrichedEmails.map(({ enrichment, ...raw }) => raw as RawEmail);

  // Mutation: Save AI enrichment to IndexedDB
  const enrichmentMutation = useMutation({
    mutationFn: async (enrichment: EmailAIEnrichment) => {
      await saveEnrichment(enrichment);
      return enrichment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrichedEmails"] });
    },
  });

  // Removed - now using batch smart analysis

  /**
   * Analyze all emails using smart two-pass approach
   */
  const analyzeAll = useCallback(async (): Promise<void> => {
    if (isAnalyzing) {
      console.log("⏭️  Analysis already in progress, skipping...");
      return;
    }

    const emailsToAnalyze = await getEmailsNeedingAnalysis();

    console.log(`📧 Email Analysis Check:`);
    console.log(`  Total emails: ${rawEmails.length}`);
    console.log(`  Need analysis: ${emailsToAnalyze.length}`);

    if (emailsToAnalyze.length === 0) {
      console.log("✅ All emails already analyzed");
      return;
    }

    setIsAnalyzing(true);
    setTotalToAnalyze(emailsToAnalyze.length);
    setAnalyzedCount(0);

    console.log(`🤖 Starting smart AI analysis of ${emailsToAnalyze.length} emails...`);

    try {
      // Use smart analysis endpoint (two-pass: quick + deep)
      const response = await fetch('/api/ai/smart-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: emailsToAnalyze }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Update progress
      setAnalyzedCount(data.processedCount);
      
      // Invalidate queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ["enrichedEmails"] });

      console.log(`✅ AI analysis complete! Cost: $${data.estimatedCost.toFixed(4)}`);
    } catch (error) {
      console.error("❌ AI analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, rawEmails.length, queryClient]);

  /**
   * Force re-analyze all emails (ignore cache)
   */
  const refresh = useCallback(async (): Promise<void> => {
    await clearAIEnrichments();
    setHasInitializedAnalysis(false);
    await analyzeAll();
  }, [analyzeAll]);

  /**
   * Auto-analyze when raw emails are loaded (only once)
   */
  useEffect(() => {
    if (rawEmails.length > 0 && !hasInitializedAnalysis && !isAnalyzing) {
      console.log("🤖 Triggering initial auto-analysis for", rawEmails.length, "emails");
      setHasInitializedAnalysis(true);
      analyzeAll();
    }
  }, [rawEmails.length]); // Only depend on rawEmails.length to prevent infinite loops

  const progress = totalToAnalyze > 0 ? Math.round((analyzedCount / totalToAnalyze) * 100) : 0;

  return {
    enrichedEmails,
    isLoading: isLoadingEmails,
    isAnalyzing,
    analyzedCount,
    totalToAnalyze,
    progress,
    analyzeAll,
    refresh,
  };
}
