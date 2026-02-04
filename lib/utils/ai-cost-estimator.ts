/**
 * AI Cost Estimator
 * Calculate estimated costs for AI analysis
 */

// Cost per 1M tokens (as of 2024)
const COSTS = {
  haiku: { input: 0.25, output: 1.25 },
  sonnet: { input: 3.00, output: 15.00 },
};

export function estimateTokens(text: string): number {
  // Rough estimate: 4 characters = 1 token
  return Math.ceil(text.length / 4);
}

export function estimateCostForEmails(
  emailCount: number,
  averageBodyLength: number = 500
): {
  quick: number;
  deep: number;
  smart: number;
  smartBreakdown: {
    quickPass: number;
    deepPass: number;
    highPriorityPercent: number;
  };
} {
  const tokensPerEmail = estimateTokens('a'.repeat(averageBodyLength));
  
  // Quick: All emails with Haiku (100 output tokens)
  const quickInputCost = (emailCount * tokensPerEmail * COSTS.haiku.input) / 1_000_000;
  const quickOutputCost = (emailCount * 100 * COSTS.haiku.output) / 1_000_000;
  const quick = quickInputCost + quickOutputCost;
  
  // Deep: All emails with Sonnet (2000 output tokens)
  const deepInputCost = (emailCount * tokensPerEmail * COSTS.sonnet.input) / 1_000_000;
  const deepOutputCost = (emailCount * 2000 * COSTS.sonnet.output) / 1_000_000;
  const deep = deepInputCost + deepOutputCost;
  
  // Smart: All with Haiku, 30% with Sonnet (estimated)
  const highPriorityPercent = 0.3;
  const highPriorityCount = Math.ceil(emailCount * highPriorityPercent);
  
  const smartQuickPass = quick;
  const smartDeepPass = (
    (highPriorityCount * tokensPerEmail * COSTS.sonnet.input +
     highPriorityCount * 2000 * COSTS.sonnet.output) / 1_000_000
  );
  const smart = smartQuickPass + smartDeepPass;
  
  return {
    quick: Math.round(quick * 10000) / 10000,
    deep: Math.round(deep * 10000) / 10000,
    smart: Math.round(smart * 10000) / 10000,
    smartBreakdown: {
      quickPass: Math.round(smartQuickPass * 10000) / 10000,
      deepPass: Math.round(smartDeepPass * 10000) / 10000,
      highPriorityPercent,
    },
  };
}

// Helper for dev console
if (typeof window !== 'undefined') {
  (window as any).estimateAICost = estimateCostForEmails;
  console.log('💰 Cost estimator available: window.estimateAICost(emailCount, avgBodyLength)');
}
