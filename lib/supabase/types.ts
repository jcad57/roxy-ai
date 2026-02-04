/**
 * Supabase Database Types
 * Generated from schema.sql
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          theme_mode: 'light' | 'dark' | 'system'
          theme_palette: string
          compact_mode: boolean
          show_avatars: boolean
          enable_notifications: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          theme_mode?: 'light' | 'dark' | 'system'
          theme_palette?: string
          compact_mode?: boolean
          show_avatars?: boolean
          enable_notifications?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          theme_mode?: 'light' | 'dark' | 'system'
          theme_palette?: string
          compact_mode?: boolean
          show_avatars?: boolean
          enable_notifications?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      view_preferences: {
        Row: {
          id: string
          user_id: string
          view_id: 'inbox' | 'priority' | 'spatial' | 'conversation' | 'calendar' | 'kanban'
          enabled: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          view_id: 'inbox' | 'priority' | 'spatial' | 'conversation' | 'calendar' | 'kanban'
          enabled?: boolean
          display_order: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          view_id?: 'inbox' | 'priority' | 'spatial' | 'conversation' | 'calendar' | 'kanban'
          enabled?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      custom_categories: {
        Row: {
          id: string
          user_id: string
          label: string
          color: string
          tag_ids: string[]
          email_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          label: string
          color: string
          tag_ids: string[]
          email_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          label?: string
          color?: string
          tag_ids?: string[]
          email_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      email_enrichments: {
        Row: {
          id: string
          user_id: string
          email_id: string
          ai_priority: number | null
          priority_reason: string | null
          summary: string | null
          ai_sentiment: 'positive' | 'negative' | 'neutral' | null
          ai_category: 'urgent' | 'work' | 'automated' | 'personal' | null
          ai_cluster: 'operations' | 'content' | 'partnerships' | 'analytics' | 'finance' | 'other' | null
          suggested_tags: string[]
          action_items: Json
          key_dates: Json
          needs_reply: boolean
          estimated_read_time: number | null
          analyzed_at: string
          analysis_version: string
          model: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email_id: string
          ai_priority?: number | null
          priority_reason?: string | null
          summary?: string | null
          ai_sentiment?: 'positive' | 'negative' | 'neutral' | null
          ai_category?: 'urgent' | 'work' | 'automated' | 'personal' | null
          ai_cluster?: 'operations' | 'content' | 'partnerships' | 'analytics' | 'finance' | 'other' | null
          suggested_tags?: string[]
          action_items?: Json
          key_dates?: Json
          needs_reply?: boolean
          estimated_read_time?: number | null
          analyzed_at?: string
          analysis_version?: string
          model?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email_id?: string
          ai_priority?: number | null
          priority_reason?: string | null
          summary?: string | null
          ai_sentiment?: 'positive' | 'negative' | 'neutral' | null
          ai_category?: 'urgent' | 'work' | 'automated' | 'personal' | null
          ai_cluster?: 'operations' | 'content' | 'partnerships' | 'analytics' | 'finance' | 'other' | null
          suggested_tags?: string[]
          action_items?: Json
          key_dates?: Json
          needs_reply?: boolean
          estimated_read_time?: number | null
          analyzed_at?: string
          analysis_version?: string
          model?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
