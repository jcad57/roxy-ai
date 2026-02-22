/**
 * Development Helpers
 * Exposes useful functions to window for easy testing in console
 */

import { DBUtils, EmailDB, EnrichmentDB } from "./indexeddb";
import { clearAIEnrichments, clearAllData } from "../email-service";

import { estimateCostForEmails } from "@/lib/utils/ai-cost-estimator";

if (typeof window !== "undefined") {
  // Show storage statistics
  (window as any).showEmailStats = async () => {
    const stats = await DBUtils.getStats();
    console.log("📊 Email Storage Statistics:");
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

  // Clear only AI enrichments (keep emails) - IndexedDB only
  (window as any).clearAICache = async () => {
    await clearAIEnrichments();
    console.log(
      "🗑️  AI enrichments cleared from IndexedDB! Refresh the page to re-analyze."
    );
    console.log(
      "💡 Note: Supabase enrichments are NOT cleared. Use clearSupabaseEnrichments() to clear cloud data."
    );
  };

  // Clear Supabase AI enrichments (requires authenticated user)
  (window as any).clearSupabaseEnrichments = async () => {
    try {
      // Dynamically import Supabase client to avoid SSR issues
      const { supabase } = await import("@/lib/supabase/client");

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.error("❌ Not authenticated. Please log in first.");
        return;
      }

      // Delete all enrichments for this user
      const { error } = await supabase
        .from("email_enrichments")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      console.log("🗑️  All AI enrichments cleared from Supabase!");
      console.log("💡 Refresh the page to re-analyze emails.");
    } catch (error) {
      console.error("❌ Failed to clear Supabase enrichments:", error);
    }
  };

  // Clear ALL AI enrichments (IndexedDB + Supabase) and trigger re-analysis
  (window as any).resetAIAnalysis = async () => {
    console.log("🔄 Resetting AI analysis...");

    // Clear IndexedDB
    await clearAIEnrichments();
    console.log("✅ IndexedDB enrichments cleared");

    // Clear Supabase
    try {
      const { supabase } = await import("@/lib/supabase/client");
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { error } = await supabase
          .from("email_enrichments")
          .delete()
          .eq("user_id", user.id);

        if (error) throw error;
        console.log("✅ Supabase enrichments cleared");
      } else {
        console.warn("⚠️  Not authenticated, skipping Supabase clear");
      }
    } catch (error) {
      console.error("❌ Failed to clear Supabase:", error);
    }

    console.log("");
    console.log("🎉 AI analysis reset complete!");
    console.log("💡 Refresh the page (F5) to re-analyze all emails.");
  };

  // Clear all data
  (window as any).clearEmailData = async () => {
    await clearAllData();
    console.log("🗑️  All email data cleared! Refresh to reload.");
  };

  // Estimate AI analysis cost
  (window as any).estimateAICost = (
    emailCount: number,
    avgBodyLength: number = 500
  ) => {
    const costs = estimateCostForEmails(emailCount, avgBodyLength);
    console.log(`💰 Cost Estimates for ${emailCount} emails:`);
    console.log(`  Quick (Haiku only): $${costs.quick.toFixed(4)}`);
    console.log(`  Deep (Sonnet only): $${costs.deep.toFixed(4)}`);
    console.log(`  Smart (recommended): $${costs.smart.toFixed(4)}`);
    console.log(
      `    └─ Quick pass: $${costs.smartBreakdown.quickPass.toFixed(4)}`
    );
    console.log(
      `    └─ Deep pass: $${costs.smartBreakdown.deepPass.toFixed(4)}`
    );
    console.log(
      `    └─ High-priority: ~${Math.round(
        costs.smartBreakdown.highPriorityPercent * 100
      )}%`
    );
    return costs;
  };

  // Outlook Integration Helpers
  (window as any).clearSupabaseEmails = async () => {
    try {
      const { supabase } = await import("@/lib/supabase/client");
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('❌ No authenticated user');
        return;
      }

      console.log('🗑️ Clearing Supabase email data...');

      // Clear email enrichments
      const { error: enrichmentsError } = await (supabase
        .from('email_enrichments') as any)
        .delete()
        .eq('user_id', user.id);

      if (!enrichmentsError) {
        console.log('✅ Cleared email enrichments');
      }

      // Clear email metadata
      const { error: metadataError } = await (supabase
        .from('email_metadata') as any)
        .delete()
        .eq('user_id', user.id);

      if (!metadataError) {
        console.log('✅ Cleared email metadata');
      }

      // Reset Outlook connection sync state
      const { error: connectionError } = await (supabase
        .from('outlook_connections') as any)
        .update({
          delta_link: null,
          last_sync_at: null,
        })
        .eq('user_id', user.id);

      if (!connectionError) {
        console.log('✅ Reset Outlook sync state');
      }

      console.log('✅ All email data cleared from Supabase');
      console.log('💡 Refresh the page to reload the app');
    } catch (error) {
      console.error('❌ Error clearing Supabase data:', error);
    }
  };

  (window as any).testOutlookConnection = async () => {
    try {
      const { supabase } = await import("@/lib/supabase/client");
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('❌ No authenticated user');
        return;
      }

      console.log('🔍 Testing Outlook connection...');

      const { data, error } = await (supabase
        .from('outlook_connections') as any)
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('❌ No Outlook connection found:', error);
        return;
      }

      console.log('✅ Outlook connection status:', {
        email: data.email,
        syncStatus: data.sync_status,
        lastSync: data.last_sync_at,
        hasDeltaLink: !!data.delta_link,
      });
    } catch (error) {
      console.error('❌ Error testing connection:', error);
    }
  };

  (window as any).testEmailFetch = async () => {
    try {
      console.log('📧 Triggering manual email fetch...');

      const response = await fetch('/api/emails/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Fetch failed:', data);
        return;
      }

      console.log('✅ Email fetch completed:', data);
    } catch (error) {
      console.error('❌ Error fetching emails:', error);
    }
  };

  (window as any).testAIAnalysis = async () => {
    try {
      console.log('🤖 Triggering AI analysis...');

      const response = await fetch('/api/emails/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchSize: 50 }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Analysis failed:', data);
        return;
      }

      console.log('✅ AI analysis completed:', data);
    } catch (error) {
      console.error('❌ Error analyzing emails:', error);
    }
  };

  (window as any).getSystemStatus = async () => {
    try {
      const { supabase } = await import("@/lib/supabase/client");
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('❌ Not authenticated');
        return;
      }

      console.log('📊 System Status Report');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━');

      // Outlook connection
      const { data: connection } = await (supabase
        .from('outlook_connections') as any)
        .select('*')
        .eq('user_id', user.id)
        .single();

      console.log('🔗 Outlook Connection:', connection ? 'Connected' : 'Not Connected');
      if (connection) {
        console.log('  Email:', connection.email);
        console.log('  Status:', connection.sync_status);
        console.log('  Last Sync:', connection.last_sync_at || 'Never');
      }

      // Email metadata count
      const { count: metadataCount } = await (supabase
        .from('email_metadata') as any)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      console.log('\n📧 Email Metadata:', metadataCount || 0, 'emails');

      // AI enrichment status
      const { data: enrichmentStats } = await (supabase
        .from('email_metadata') as any)
        .select('ai_status')
        .eq('user_id', user.id);

      if (enrichmentStats) {
        const stats = enrichmentStats.reduce((acc: any, item: any) => {
          acc[item.ai_status] = (acc[item.ai_status] || 0) + 1;
          return acc;
        }, {});

        console.log('\n🤖 AI Status:');
        console.log('  Pending:', stats.pending || 0);
        console.log('  Processing:', stats.processing || 0);
        console.log('  Enriched:', stats.enriched || 0);
        console.log('  Failed:', stats.failed || 0);
      }

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ System status complete');
    } catch (error) {
      console.error('❌ Error getting system status:', error);
    }
  };

  console.log("💡 Email Data Helpers:");
  console.log("  - await window.showEmailStats() - Show storage statistics");
  console.log("  - await window.showRawEmails() - Show raw email data");
  console.log("  - await window.showEnrichments() - Show AI enrichment data");
  console.log(
    "  - await window.clearAICache() - Clear IndexedDB AI cache only"
  );
  console.log(
    "  - await window.clearSupabaseEnrichments() - Clear Supabase AI enrichments"
  );
  console.log(
    "  - await window.resetAIAnalysis() - Clear ALL AI data and re-analyze (recommended)"
  );
  console.log(
    "  - await window.clearEmailData() - Clear ALL data (emails + AI)"
  );
  console.log(
    "  - window.estimateAICost(count, avgLength) - Estimate analysis cost"
  );
  console.log("");
  console.log("🔗 Outlook Integration Helpers:");
  console.log("  - await window.getSystemStatus() - View system overview");
  console.log("  - await window.testOutlookConnection() - Test Outlook connection");
  console.log("  - await window.testEmailFetch() - Trigger manual email fetch");
  console.log("  - await window.testAIAnalysis() - Trigger AI analysis");
  console.log("  - await window.clearSupabaseEmails() - Clear all Outlook email data");
  console.log("");
  console.log(
    "🔥 Quick Test: await window.resetAIAnalysis() then refresh page (F5)"
  );
}
