/**
 * View Preferences Hook
 * Manages email view layout order and enabled state in Supabase
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createBrowserClient } from "@supabase/ssr";
import { useAuth } from "../providers/auth-provider";
import type { Database } from "../supabase/types";
import type { LayoutId } from "../types/layout";

type ViewPreference = Database["public"]["Tables"]["view_preferences"]["Row"];
type ViewPreferenceUpdate =
  Database["public"]["Tables"]["view_preferences"]["Update"];

// Create typed Supabase client
const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function useViewPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch view preferences
  const {
    data: viewPreferences = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["view-preferences", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await (supabase.from("view_preferences") as any)
        .select("*")
        .eq("user_id", user.id)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as ViewPreference[];
    },
    enabled: !!user,
    staleTime: 300000, // Cache for 5 minutes
  });

  // Update single view preference
  const updateMutation = useMutation({
    mutationFn: async ({
      viewId,
      updates,
    }: {
      viewId: LayoutId;
      updates: ViewPreferenceUpdate;
    }) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await (supabase.from("view_preferences") as any)
        .update(updates)
        .eq("user_id", user.id)
        .eq("view_id", viewId)
        .select()
        .single();

      if (error) throw error;
      return data as ViewPreference;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["view-preferences"] });
    },
  });

  // Bulk update view order
  const updateOrderMutation = useMutation({
    mutationFn: async (orderedViews: { viewId: LayoutId; order: number }[]) => {
      if (!user) throw new Error("User not authenticated");

      // Update each view's display order
      const updates = orderedViews.map((view) =>
        (supabase.from("view_preferences") as any)
          .update({ display_order: view.order })
          .eq("user_id", user.id)
          .eq("view_id", view.viewId)
      );

      const results = await Promise.all(updates);
      const errors = results.filter((r) => r.error);

      if (errors.length > 0) {
        throw new Error("Failed to update view order");
      }

      return orderedViews;
    },
    onMutate: async (orderedViews) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["view-preferences"] });

      const previous = queryClient.getQueryData(["view-preferences", user?.id]);

      queryClient.setQueryData(["view-preferences", user?.id], (old: any[]) => {
        const updated = [...old];
        orderedViews.forEach(({ viewId, order }) => {
          const index = updated.findIndex((v) => v.view_id === viewId);
          if (index !== -1) {
            updated[index] = { ...updated[index], display_order: order };
          }
        });
        return updated.sort((a, b) => a.display_order - b.display_order);
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ["view-preferences", user?.id],
          context.previous
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["view-preferences"] });
    },
  });

  // Helper to get enabled views in order
  const enabledViews = viewPreferences
    .filter((v) => v.enabled)
    .map((v) => v.view_id as LayoutId);

  return {
    viewPreferences,
    enabledViews,
    isLoading,
    error,
    updateView: updateMutation.mutateAsync,
    updateViewOrder: updateOrderMutation.mutateAsync,
    isUpdating: updateMutation.isPending || updateOrderMutation.isPending,
  };
}
