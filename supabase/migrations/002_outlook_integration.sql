-- =====================================================
-- MIGRATION: Outlook Integration Tables
-- Created: 2026-02-06
-- Purpose: Add email metadata and Outlook connection tables
-- =====================================================

-- =====================================================
-- 1. EMAIL_METADATA TABLE
-- Stores lightweight email metadata (no body content)
-- =====================================================

CREATE TABLE IF NOT EXISTS email_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  outlook_message_id text NOT NULL,
  
  -- Core metadata from Outlook
  subject text NOT NULL,
  from_name text NOT NULL,
  from_address text NOT NULL,
  received_at timestamptz NOT NULL,
  conversation_id text,
  
  -- Email flags
  is_read boolean DEFAULT false NOT NULL,
  has_attachments boolean DEFAULT false NOT NULL,
  importance text DEFAULT 'normal' CHECK (importance IN ('low', 'normal', 'high')),
  
  -- AI enrichment status tracking
  ai_status text DEFAULT 'pending' NOT NULL CHECK (ai_status IN ('pending', 'processing', 'enriched', 'failed', 'skipped')),
  ai_retry_count integer DEFAULT 0 NOT NULL,
  ai_last_error text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Prevent duplicate emails per user
  CONSTRAINT unique_user_outlook_message UNIQUE(user_id, outlook_message_id)
);

-- Indexes for performance
CREATE INDEX idx_email_metadata_user_id ON email_metadata(user_id);
CREATE INDEX idx_email_metadata_user_status ON email_metadata(user_id, ai_status);
CREATE INDEX idx_email_metadata_user_received ON email_metadata(user_id, received_at DESC);
CREATE INDEX idx_email_metadata_outlook_id ON email_metadata(outlook_message_id);
CREATE INDEX idx_email_metadata_conversation ON email_metadata(conversation_id) WHERE conversation_id IS NOT NULL;

-- Row Level Security
ALTER TABLE email_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own email metadata"
  ON email_metadata FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email metadata"
  ON email_metadata FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email metadata"
  ON email_metadata FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own email metadata"
  ON email_metadata FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_email_metadata_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_metadata_updated_at
  BEFORE UPDATE ON email_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_email_metadata_timestamp();

-- =====================================================
-- 2. OUTLOOK_CONNECTIONS TABLE
-- Tracks Outlook OAuth connection per user
-- =====================================================

CREATE TABLE IF NOT EXISTS outlook_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Outlook account info
  outlook_email text NOT NULL,
  outlook_user_id text NOT NULL,
  outlook_display_name text,
  
  -- Connection timestamps
  connected_at timestamptz DEFAULT now() NOT NULL,
  last_sync_at timestamptz,
  
  -- Delta sync state (for Microsoft Graph delta queries)
  delta_link text,
  
  -- Connection status
  sync_status text DEFAULT 'active' NOT NULL CHECK (sync_status IN ('active', 'disconnected', 'error')),
  
  -- Statistics
  total_emails_synced integer DEFAULT 0 NOT NULL,
  last_sync_email_count integer DEFAULT 0,
  last_error text,
  last_error_at timestamptz,
  
  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX idx_outlook_connections_user_id ON outlook_connections(user_id);
CREATE INDEX idx_outlook_connections_sync_status ON outlook_connections(sync_status);

-- Row Level Security
ALTER TABLE outlook_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own Outlook connection"
  ON outlook_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Outlook connection"
  ON outlook_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Outlook connection"
  ON outlook_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Outlook connection"
  ON outlook_connections FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update timestamp
CREATE TRIGGER outlook_connections_updated_at
  BEFORE UPDATE ON outlook_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_email_metadata_timestamp();

-- =====================================================
-- 3. UPDATE EMAIL_ENRICHMENTS TABLE
-- Add reference to email_metadata
-- =====================================================

-- Add outlook_message_id column
ALTER TABLE email_enrichments 
  ADD COLUMN IF NOT EXISTS outlook_message_id text;

-- Create index for joins
CREATE INDEX IF NOT EXISTS idx_email_enrichments_outlook_id 
  ON email_enrichments(outlook_message_id);

-- Add foreign key constraint (optional - helps maintain referential integrity)
-- Note: This assumes email_id matches outlook_message_id
ALTER TABLE email_enrichments
  ADD CONSTRAINT fk_email_enrichments_metadata
    FOREIGN KEY (user_id, outlook_message_id)
    REFERENCES email_metadata(user_id, outlook_message_id)
    ON DELETE CASCADE
    DEFERRABLE INITIALLY DEFERRED;

-- =====================================================
-- 4. HELPER FUNCTIONS
-- =====================================================

-- Function to get pending emails needing AI analysis
CREATE OR REPLACE FUNCTION get_pending_emails(
  p_user_id uuid,
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  outlook_message_id text,
  subject text,
  from_name text,
  from_address text,
  received_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    em.id,
    em.outlook_message_id,
    em.subject,
    em.from_name,
    em.from_address,
    em.received_at
  FROM email_metadata em
  WHERE em.user_id = p_user_id
    AND em.ai_status = 'pending'
    AND em.ai_retry_count < 3
  ORDER BY em.received_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark email as processing
CREATE OR REPLACE FUNCTION mark_email_processing(
  p_user_id uuid,
  p_outlook_message_id text
)
RETURNS void AS $$
BEGIN
  UPDATE email_metadata
  SET 
    ai_status = 'processing',
    updated_at = now()
  WHERE user_id = p_user_id
    AND outlook_message_id = p_outlook_message_id
    AND ai_status = 'pending';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark email as enriched
CREATE OR REPLACE FUNCTION mark_email_enriched(
  p_user_id uuid,
  p_outlook_message_id text
)
RETURNS void AS $$
BEGIN
  UPDATE email_metadata
  SET 
    ai_status = 'enriched',
    updated_at = now()
  WHERE user_id = p_user_id
    AND outlook_message_id = p_outlook_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark email as failed (with retry logic)
CREATE OR REPLACE FUNCTION mark_email_failed(
  p_user_id uuid,
  p_outlook_message_id text,
  p_error_message text
)
RETURNS void AS $$
DECLARE
  current_retry_count integer;
BEGIN
  -- Get current retry count
  SELECT ai_retry_count INTO current_retry_count
  FROM email_metadata
  WHERE user_id = p_user_id
    AND outlook_message_id = p_outlook_message_id;
  
  -- If under retry limit, set back to pending, else mark as skipped
  IF current_retry_count < 2 THEN
    UPDATE email_metadata
    SET 
      ai_status = 'pending',
      ai_retry_count = ai_retry_count + 1,
      ai_last_error = p_error_message,
      updated_at = now()
    WHERE user_id = p_user_id
      AND outlook_message_id = p_outlook_message_id;
  ELSE
    UPDATE email_metadata
    SET 
      ai_status = 'skipped',
      ai_retry_count = ai_retry_count + 1,
      ai_last_error = p_error_message,
      updated_at = now()
    WHERE user_id = p_user_id
      AND outlook_message_id = p_outlook_message_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. VIEWS FOR COMMON QUERIES
-- =====================================================

-- View: Enriched emails (metadata + AI enrichments)
CREATE OR REPLACE VIEW enriched_emails_view AS
SELECT 
  em.*,
  ee.ai_priority,
  ee.priority_reason,
  ee.summary,
  ee.ai_sentiment,
  ee.ai_category,
  ee.ai_cluster,
  ee.suggested_tags,
  ee.action_items,
  ee.key_dates,
  ee.needs_reply,
  ee.estimated_read_time,
  ee.analyzed_at,
  ee.analysis_version,
  ee.model
FROM email_metadata em
LEFT JOIN email_enrichments ee 
  ON em.user_id = ee.user_id 
  AND em.outlook_message_id = ee.outlook_message_id;

-- =====================================================
-- ROLLBACK (if needed)
-- =====================================================

-- To rollback this migration, run:
-- DROP VIEW IF EXISTS enriched_emails_view;
-- DROP FUNCTION IF EXISTS mark_email_failed(uuid, text, text);
-- DROP FUNCTION IF EXISTS mark_email_enriched(uuid, text);
-- DROP FUNCTION IF EXISTS mark_email_processing(uuid, text);
-- DROP FUNCTION IF EXISTS get_pending_emails(uuid, integer);
-- ALTER TABLE email_enrichments DROP CONSTRAINT IF EXISTS fk_email_enrichments_metadata;
-- ALTER TABLE email_enrichments DROP COLUMN IF EXISTS outlook_message_id;
-- DROP TABLE IF EXISTS outlook_connections;
-- DROP TABLE IF EXISTS email_metadata;
