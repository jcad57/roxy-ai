/**
 * Development Helpers
 * Exposes useful functions to window for easy testing in console
 */

import { DBUtils, EmailDB, EnrichmentDB } from './indexeddb';
import { clearAIEnrichments, clearAllData } from '../email-service';

import { estimateCostForEmails } from '@/lib/utils/ai-cost-estimator';

if (typeof window !== 'undefined') {
  // Show storage statistics
  (window as any).showEmailStats = async () => {
    const stats = await DBUtils.getStats();
    console.log('📊 Email Storage Statistics:');
    console.log(`  Total emails: ${stats.totalEmails}`);
    console.log(`  AI enriched: ${stats.enrichedEmails}`);
    console.log(`  Not enriched: ${stats.unenrichedEmails}`);
    return stats;
  };

  // Show raw emails
  (window as any).showRawEmails = async () => {
    const emails = await EmailDB.getAll();
    console.log(`📧 ${emails.length} Raw Emails:`, emails);
    return emails;
  };

  // Show AI enrichments
  (window as any).showEnrichments = async () => {
    const enrichments = Array.from((await EnrichmentDB.getAll()).values());
    console.log(`🤖 ${enrichments.length} AI Enrichments:`, enrichments);
    return enrichments;
  };

  // Clear only AI enrichments (keep emails)
  (window as any).clearAICache = async () => {
    await clearAIEnrichments();
    console.log('🗑️  AI enrichments cleared! Refresh the page to re-analyze.');
  };

  // Clear all data
  (window as any).clearEmailData = async () => {
    await clearAllData();
    console.log('🗑️  All email data cleared! Refresh to reload.');
  };

  // Estimate AI analysis cost
  (window as any).estimateAICost = (emailCount: number, avgBodyLength: number = 500) => {
    const costs = estimateCostForEmails(emailCount, avgBodyLength);
    console.log(`💰 Cost Estimates for ${emailCount} emails:`);
    console.log(`  Quick (Haiku only): $${costs.quick.toFixed(4)}`);
    console.log(`  Deep (Sonnet only): $${costs.deep.toFixed(4)}`);
    console.log(`  Smart (recommended): $${costs.smart.toFixed(4)}`);
    console.log(`    └─ Quick pass: $${costs.smartBreakdown.quickPass.toFixed(4)}`);
    console.log(`    └─ Deep pass: $${costs.smartBreakdown.deepPass.toFixed(4)}`);
    console.log(`    └─ High-priority: ~${Math.round(costs.smartBreakdown.highPriorityPercent * 100)}%`);
    return costs;
  };

  console.log('💡 Email Data Helpers:');
  console.log('  - await window.showEmailStats() - Show storage statistics');
  console.log('  - await window.showRawEmails() - Show raw email data');
  console.log('  - await window.showEnrichments() - Show AI enrichment data');
  console.log('  - await window.clearAICache() - Clear AI data only');
  console.log('  - await window.clearEmailData() - Clear ALL data');
  console.log('  - window.estimateAICost(count, avgLength) - Estimate analysis cost');
}
