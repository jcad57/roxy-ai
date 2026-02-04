/**
 * Email AI Hook
 * Manages AI analysis state and processing
 */

import { useState, useEffect, useCallback } from 'react';
import type { RawEmail } from '@/lib/types/email-raw';
import { EnrichmentDB } from '../services/storage/indexeddb';

export interface UseEmailAIResult {
  analyzing: boolean;
  progress: {
    current: number;
    total: number;
    percentage: number;
  };
  error: string | null;
  reanalyze: () => Promise<void>;
}

export function useEmailAI(emails: RawEmail[]): UseEmailAIResult {
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, percentage: 0 });
  const [error, setError] = useState<string | null>(null);

  const analyzeEmails = useCallback(async (emailsToAnalyze: RawEmail[]) => {
    if (emailsToAnalyze.length === 0) return;

    setAnalyzing(true);
    setProgress({ current: 0, total: emailsToAnalyze.length, percentage: 0 });
    setError(null);

    try {
      // Use smart analysis API
      const response = await fetch('/api/ai/smart-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: emailsToAnalyze }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Save enrichments to IndexedDB (client-side only)
      if (data.enrichments && Array.isArray(data.enrichments)) {
        await EnrichmentDB.saveMany(data.enrichments);
        console.log(`✅ Saved ${data.enrichments.length} AI enrichments to IndexedDB`);
      }
      
      // Update progress as results come in
      for (let i = 0; i < data.results.length; i++) {
        setProgress({
          current: i + 1,
          total: emailsToAnalyze.length,
          percentage: Math.round(((i + 1) / emailsToAnalyze.length) * 100),
        });
        
        // Small delay for UI feedback
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } catch (err) {
      console.error('Email AI analysis error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const checkAndAnalyze = useCallback(async () => {
    if (emails.length === 0) return;

    // Check which emails need analysis
    const needsAnalysis: RawEmail[] = [];
    
    for (const email of emails) {
      const needsAnalyze = await EnrichmentDB.needsAnalysis(email.id);
      if (needsAnalyze) {
        needsAnalysis.push(email);
      }
    }

    if (needsAnalysis.length > 0) {
      console.log(`🤖 ${needsAnalysis.length} emails need AI analysis`);
      await analyzeEmails(needsAnalysis);
    }
  }, [emails, analyzeEmails]);

  const reanalyze = useCallback(async () => {
    await EnrichmentDB.clear();
    await checkAndAnalyze();
  }, [checkAndAnalyze]);

  // Auto-analyze on mount
  useEffect(() => {
    checkAndAnalyze();
  }, []);

  return {
    analyzing,
    progress,
    error,
    reanalyze,
  };
}
