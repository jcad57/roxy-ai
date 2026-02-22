-- Migration: Add unique constraint to email_enrichments table
-- This allows upsert operations to work properly for AI enrichments
-- Created: 2026-02-04

-- =====================================================
-- Add unique constraint on (user_id, outlook_message_id)
-- =====================================================

-- First, remove any duplicate entries (keep the most recent)
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, outlook_message_id 
      ORDER BY analyzed_at DESC NULLS LAST, created_at DESC
    ) as rn
  FROM email_enrichments
  WHERE outlook_message_id IS NOT NULL
)
DELETE FROM email_enrichments
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Now add the unique constraint
ALTER TABLE email_enrichments
  ADD CONSTRAINT email_enrichments_user_outlook_unique 
  UNIQUE (user_id, outlook_message_id);

-- Create index to support the constraint (if not already exists)
CREATE INDEX IF NOT EXISTS idx_email_enrichments_user_outlook 
  ON email_enrichments(user_id, outlook_message_id);

-- Add comment for documentation
COMMENT ON CONSTRAINT email_enrichments_user_outlook_unique ON email_enrichments 
  IS 'Ensures one enrichment per email per user for upsert operations';
