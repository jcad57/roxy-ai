/**
 * Email Enrichments Hook
 * Manages AI enrichment data in Supabase
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase/client";
import { useAuth } from "../providers/auth-provider";
import type { Database } from "../supabase/types";
import type { EmailAIEnrichment } from "../types/email-raw";

type EmailEnrichment = Database["public"]["Tables"]["email_enrichments"]["Row"];
type EmailEnrichmentInsert =
  Database["public"]["Tables"]["email_enrichments"]["Insert"];

/**
 * Transform EmailAIEnrichment to Supabase format
 */
function transformToSupabaseFormat(
  enrichment: EmailAIEnrichment,
  userId: string
): EmailEnrichmentInsert {
  return {
    user_id: userId,
    email_id: enrichment.emailId,
    ai_priority: enrichment.aiPriority,
    priority_reason: enrichment.priorityReason,
    summary: enrichment.summary,
    ai_sentiment: enrichment.aiSentiment,
    ai_category: enrichment.aiCategory,
    ai_cluster: enrichment.aiCluster,
    suggested_tags: enrichment.suggestedTags,
    action_items: enrichment.actionItems as any,
    key_dates: enrichment.keyDates as any,
    needs_reply: enrichment.needsReply,
    estimated_read_time: enrichment.estimatedReadTime,
    analyzed_at: enrichment.analyzedAt,
    analysis_version: enrichment.analysisVersion,
    model: enrichment.model,
  };
}

export function useEmailEnrichments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Save single enrichment
  const saveMutation = useMutation({
    mutationFn: async (enrichment: EmailAIEnrichment) => {
      if (!user) throw new Error("User not authenticated");

      const supabaseEnrichment = transformToSupabaseFormat(enrichment, user.id);

      // Upsert (insert or update if exists)
      const { data, error } = await supabase
        .from("email_enrichments")
        .upsert(supabaseEnrichment as any, {
          onConflict: "user_id,email_id",
        })
        .select()
        .single();

      if (error) throw error;
      return data as EmailEnrichment;
    },
    onSuccess: () => {
      // Invalidate email queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ["enrichedEmails"] });
    },
  });

  // Save multiple enrichments (batch)
  const saveManyMutation = useMutation({
    mutationFn: async (enrichments: EmailAIEnrichment[]) => {
      if (!user) throw new Error("User not authenticated");

      const supabaseEnrichments = enrichments.map((e) =>
        transformToSupabaseFormat(e, user.id)
      );

      // Batch upsert
      const { data, error } = await supabase
        .from("email_enrichments")
        .upsert(supabaseEnrichments as any, {
          onConflict: "user_id,email_id",
        })
        .select();

      if (error) throw error;

      console.log(`✅ Saved ${data.length} enrichments to Supabase`);
      return data as EmailEnrichment[];
    },
    onSuccess: (data) => {
      console.log(`✅ ${data.length} enrichments synced to Supabase`);
      // Invalidate email queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ["enrichedEmails"] });
    },
  });

  // Delete enrichment
  const deleteMutation = useMutation({
    mutationFn: async (emailId: string) => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("email_enrichments")
        .delete()
        .eq("user_id", user.id)
        .eq("email_id", emailId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrichedEmails"] });
    },
  });

  // Clear all enrichments for user
  const clearAllMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("email_enrichments")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;
      console.log("🗑️  All AI enrichments cleared from Supabase");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrichedEmails"] });
    },
  });

  return {
    saveEnrichment: saveMutation.mutateAsync,
    saveEnrichments: saveManyMutation.mutateAsync,
    deleteEnrichment: deleteMutation.mutateAsync,
    clearAllEnrichments: clearAllMutation.mutateAsync,
    isSaving: saveMutation.isPending || saveManyMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isClearing: clearAllMutation.isPending,
  };
}
