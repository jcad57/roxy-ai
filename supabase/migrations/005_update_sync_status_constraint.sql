-- Migration: Update sync_status constraint to include delta token states
-- Purpose: Add 'delta_pending' and 'delta_unavailable' status values
-- Date: 2026-02-04

-- Drop old constraint
ALTER TABLE outlook_connections 
  DROP CONSTRAINT IF EXISTS outlook_connections_sync_status_check;

-- Add new constraint with additional states
ALTER TABLE outlook_connections 
  ADD CONSTRAINT outlook_connections_sync_status_check 
  CHECK (sync_status IN ('active', 'disconnected', 'error', 'delta_pending', 'delta_unavailable'));

-- Comment explaining the new states
COMMENT ON COLUMN outlook_connections.sync_status IS 
  'Connection sync status: 
   - active: Delta token established, incremental sync active
   - delta_pending: Background establishing delta token, using /messages fallback
   - delta_unavailable: Delta token failed, using /messages fallback
   - disconnected: User disconnected Outlook
   - error: Sync error occurred';
