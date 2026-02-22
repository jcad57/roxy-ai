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
      email_metadata: {
        Row: {
          id: string
          user_id: string
          outlook_message_id: string
          subject: string
          from_name: string
          from_address: string
          received_at: string
          conversation_id: string | null
          is_read: boolean
          has_attachments: boolean
          importance: 'low' | 'normal' | 'high'
          ai_status: 'pending' | 'processing' | 'enriched' | 'failed' | 'skipped'
          ai_retry_count: number
          ai_last_error: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          outlook_message_id: string
          subject: string
          from_name: string
          from_address: string
          received_at: string
          conversation_id?: string | null
          is_read?: boolean
          has_attachments?: boolean
          importance?: 'low' | 'normal' | 'high'
          ai_status?: 'pending' | 'processing' | 'enriched' | 'failed' | 'skipped'
          ai_retry_count?: number
          ai_last_error?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          outlook_message_id?: string
          subject?: string
          from_name?: string
          from_address?: string
          received_at?: string
          conversation_id?: string | null
          is_read?: boolean
          has_attachments?: boolean
          importance?: 'low' | 'normal' | 'high'
          ai_status?: 'pending' | 'processing' | 'enriched' | 'failed' | 'skipped'
          ai_retry_count?: number
          ai_last_error?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      outlook_connections: {
        Row: {
          id: string
          user_id: string
          outlook_email: string
          outlook_user_id: string
          outlook_display_name: string | null
          connected_at: string
          last_sync_at: string | null
          delta_link: string | null
          sync_status: 'active' | 'disconnected' | 'error'
          total_emails_synced: number
          last_sync_email_count: number
          last_error: string | null
          last_error_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          outlook_email: string
          outlook_user_id: string
          outlook_display_name?: string | null
          connected_at?: string
          last_sync_at?: string | null
          delta_link?: string | null
          sync_status?: 'active' | 'disconnected' | 'error'
          total_emails_synced?: number
          last_sync_email_count?: number
          last_error?: string | null
          last_error_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          outlook_email?: string
          outlook_user_id?: string
          outlook_display_name?: string | null
          connected_at?: string
          last_sync_at?: string | null
          delta_link?: string | null
          sync_status?: 'active' | 'disconnected' | 'error'
          total_emails_synced?: number
          last_sync_email_count?: number
          last_error?: string | null
          last_error_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
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
          outlook_message_id: string | null
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
          outlook_message_id?: string | null
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
          outlook_message_id?: string | null
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
