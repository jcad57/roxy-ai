/**
 * Supabase Custom Categories Hook
 * Manages user-created email categories stored in Supabase
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createBrowserClient } from "@supabase/ssr";
import { useAuth } from "../providers/auth-provider";
import type { Database } from "../supabase/types";

type CustomCategory = Database["public"]["Tables"]["custom_categories"]["Row"];
type CustomCategoryInsert =
  Database["public"]["Tables"]["custom_categories"]["Insert"];
type CustomCategoryUpdate =
  Database["public"]["Tables"]["custom_categories"]["Update"];

// Create typed Supabase client
const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function useSupabaseCategories() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all custom categories for the user
  const {
    data: categories = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["supabase-categories", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("custom_categories")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as CustomCategory[];
    },
    enabled: !!user,
    staleTime: 60000, // Cache for 1 minute
  });

  // Create new category
  const createMutation = useMutation({
    mutationFn: async (category: Omit<CustomCategoryInsert, "user_id">) => {
      if (!user) throw new Error("User not authenticated");

      const newCategory: CustomCategoryInsert = {
        ...category,
        user_id: user.id,
      };

      const { data, error } = await (supabase.from("custom_categories") as any)
        .insert(newCategory)
        .select()
        .single();

      if (error) throw error;
      return data as CustomCategory;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["supabase-categories"] });
    },
  });

  // Update category
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: CustomCategoryUpdate;
    }) => {
      const { data, error } = await (supabase.from("custom_categories") as any)
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as CustomCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supabase-categories"] });
    },
  });

  // Delete category
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("custom_categories")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supabase-categories"] });
    },
  });

  return {
    categories,
    isLoading,
    error,
    createCategory: createMutation.mutateAsync,
    updateCategory: updateMutation.mutateAsync,
    deleteCategory: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
