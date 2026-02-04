/**
 * User Preferences Hook
 * Manages user UI/theme preferences in Supabase
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createBrowserClient } from "@supabase/ssr";
import { useAuth } from "../providers/auth-provider";
import type { Database } from "../supabase/types";

type UserPreferences = Database["public"]["Tables"]["user_preferences"]["Row"];
type UserPreferencesUpdate =
  Database["public"]["Tables"]["user_preferences"]["Update"];

// Create typed Supabase client
const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function useUserPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user preferences
  const {
    data: preferences,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["user-preferences", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await (supabase.from("user_preferences") as any)
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        // If no preferences exist yet, return defaults
        if (error.code === "PGRST116") {
          return {
            id: "",
            user_id: user.id,
            theme_mode: "dark" as const,
            theme_palette: "default",
            compact_mode: false,
            show_avatars: true,
            enable_notifications: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }
        throw error;
      }

      return data as UserPreferences;
    },
    enabled: !!user,
    staleTime: 300000, // Cache for 5 minutes
  });

  // Update preferences
  const updateMutation = useMutation({
    mutationFn: async (updates: UserPreferencesUpdate) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await (supabase.from("user_preferences") as any)
        .update(updates)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data as UserPreferences;
    },
    onMutate: async (updates) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["user-preferences"] });

      // Snapshot previous value
      const previous = queryClient.getQueryData(["user-preferences", user?.id]);

      // Optimistically update
      queryClient.setQueryData(["user-preferences", user?.id], (old: any) => ({
        ...old,
        ...updates,
      }));

      return { previous };
    },
    onError: (_err, _updates, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(
          ["user-preferences", user?.id],
          context.previous
        );
      }
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: ["user-preferences"] });
    },
  });

  return {
    preferences,
    isLoading,
    error,
    updatePreferences: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}
