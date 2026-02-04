/**
 * Context Tags Hook
 * Manages AI-generated context tags and custom categories (Supabase)
 */

import { useMemo } from "react";
import type { Email } from "@/lib/types/email";
import {
  extractContextTagsFromEmails,
  groupTagsByCategory,
} from "@/lib/services/storage/context-tags-service";
import { useSupabaseCategories } from "./use-supabase-categories";

/**
 * Hook to manage context tags from AI analysis and custom categories
 */
export function useContextTags(emails: Email[]) {
  // Extract tags from emails (memoized to avoid recalculation)
  const tags = useMemo(() => {
    return extractContextTagsFromEmails(emails);
  }, [emails]);

  // Group tags by category (memoized)
  const groupedTags = useMemo(() => {
    return groupTagsByCategory(tags);
  }, [tags]);

  // Get custom categories from Supabase
  const {
    categories,
    isLoading: isLoadingCategories,
    createCategory: createSupabaseCategory,
    updateCategory,
    deleteCategory,
    isCreating: isCreatingCategory,
    isDeleting: isDeletingCategory,
  } = useSupabaseCategories();

  // Wrapper for createCategory to match the expected interface
  const createCategory = async ({
    label,
    color,
    tagIds,
  }: {
    label: string;
    color: string;
    tagIds: string[];
  }) => {
    return await createSupabaseCategory({
      label,
      color,
      tag_ids: tagIds,
      email_count: 0,
    });
  };

  return {
    // Context tags (extracted from emails)
    tags,
    groupedTags,

    // Custom categories (Supabase)
    categories,
    isLoadingCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    isCreatingCategory,
    isDeletingCategory,
  };
}
