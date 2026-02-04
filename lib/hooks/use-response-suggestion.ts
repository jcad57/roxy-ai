/**
 * Response Suggestion Hook
 * Manages AI response generation state
 */

import { useState, useCallback, useEffect } from 'react';
import type { EnrichedEmail } from '@/lib/types/email-raw';
import type { ResponseSuggestion, ResponseContext, QuickReply } from '@/lib/types/response';
import { ResponseCache } from '@/lib/services/response/response-cache';

export function useResponseSuggestion(email: EnrichedEmail) {
  const [suggestion, setSuggestion] = useState<ResponseSuggestion | null>(null);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentEmailId, setCurrentEmailId] = useState<string | null>(null);

  // Reset state when email changes
  useEffect(() => {
    if (email && email.id && email.id !== currentEmailId) {
      console.log(`🔄 Email changed from ${currentEmailId} to ${email.id}, resetting state`);
      setCurrentEmailId(email.id);
      setSuggestion(null);
      setQuickReplies([]);
      setError(null);
    }
  }, [email?.id]);

  /**
   * Generate response (checks cache first)
   */
  const generate = useCallback(
    async (context: ResponseContext = {}): Promise<ResponseSuggestion | null> => {
      // Check cache first
      const cached = ResponseCache.get(email.id);
      if (cached) {
        console.log('Using cached response');
        setSuggestion(cached);
        return cached;
      }

      setGenerating(true);
      setError(null);

      try {
        const response = await fetch('/api/ai/generate-response', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, context }),
        });

        if (!response.ok) {
          throw new Error(`Generation failed: ${response.statusText}`);
        }

        const data = await response.json();
        const responseSuggestion: ResponseSuggestion = data.suggestion;

        // Cache the response
        ResponseCache.set(email.id, responseSuggestion, context);
        setSuggestion(responseSuggestion);
        
        return responseSuggestion;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Generation failed';
        setError(errorMsg);
        console.error('Error generating response:', err);
        return null;
      } finally {
        setGenerating(false);
      }
    },
    [email]
  );

  /**
   * Force regenerate with new context
   */
  const regenerate = useCallback(
    async (newContext: ResponseContext): Promise<ResponseSuggestion | null> => {
      ResponseCache.invalidate(email.id);
      return generate(newContext);
    },
    [email, generate]
  );

  /**
   * Generate quick replies
   */
  const generateQuick = useCallback(async (): Promise<QuickReply[]> => {
    if (!email || !email.id) {
      console.log('No email provided, skipping quick reply generation');
      return [];
    }

    const cacheKey = `${email.id}_quick`;
    
    // Check cache first
    const cached = ResponseCache.get(cacheKey);
    
    if (cached) {
      console.log(`✅ Using cached quick reply for email ${email.id}`);
      
      // Handle cached data
      if (Array.isArray(cached)) {
        const validReplies = cached.filter(
          (item): item is QuickReply => 
            typeof item === 'object' && 
            item !== null && 
            'text' in item && 
            'icon' in item
        );
        if (validReplies.length > 0) {
          setQuickReplies(validReplies);
          return validReplies;
        }
      } else if (typeof cached === 'object' && cached !== null && 'text' in cached && 'icon' in cached) {
        const replies = [cached as QuickReply];
        setQuickReplies(replies);
        return replies;
      }
    }

    // No cache, generate new response
    console.log(`🤖 Generating new quick reply for email ${email.id}`);
    setGenerating(true); // Set loading state
    
    try {
      const response = await fetch('/api/ai/quick-replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Quick reply generation failed');
      }

      const data = await response.json();
      const replies: QuickReply[] = data.replies;

      // Cache the response
      ResponseCache.set(cacheKey, replies as any, { type: 'quick' } as any);
      console.log(`💾 Cached quick reply for email ${email.id}`);

      setQuickReplies(replies);
      return replies;
    } catch (err) {
      console.error('Error generating quick replies:', err);
      setError(err instanceof Error ? err.message : 'Generation failed');
      return [];
    } finally {
      setGenerating(false); // Clear loading state
    }
  }, [email]);

  return {
    suggestion,
    quickReplies,
    generating,
    error,
    generate,
    regenerate,
    generateQuick,
  };
}
