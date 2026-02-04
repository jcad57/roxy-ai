/**
 * Supabase Client
 * Singleton client for browser-side Supabase operations
 */

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

/**
 * Create Supabase client with proper Database typing
 * This must be called at module level to preserve types
 */
export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Export type for convenience
 */
export type TypedSupabaseClient = typeof supabase;
