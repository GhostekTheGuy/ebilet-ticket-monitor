-- Migration script for existing alebilet tables
-- Run this if you already have tables without event_id column

-- Add event_id column to alebilet_snapshots if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'alebilet_snapshots' AND column_name = 'event_id'
    ) THEN
        ALTER TABLE alebilet_snapshots ADD COLUMN event_id VARCHAR(16) DEFAULT '2026-05-23';
        UPDATE alebilet_snapshots SET event_id = '2026-05-23' WHERE event_id IS NULL;
        ALTER TABLE alebilet_snapshots ALTER COLUMN event_id SET NOT NULL;
    END IF;
END $$;

-- Add event_id column to alebilet_sold if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'alebilet_sold' AND column_name = 'event_id'
    ) THEN
        ALTER TABLE alebilet_sold ADD COLUMN event_id VARCHAR(16) DEFAULT '2026-05-23';
        UPDATE alebilet_sold SET event_id = '2026-05-23' WHERE event_id IS NULL;
        ALTER TABLE alebilet_sold ALTER COLUMN event_id SET NOT NULL;
    END IF;
END $$;

-- Create new indexes
CREATE INDEX IF NOT EXISTS idx_alebilet_snapshots_event_timestamp ON alebilet_snapshots(event_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alebilet_sold_event_sold_at ON alebilet_sold(event_id, sold_at DESC);

-- Drop old indexes if they exist (optional - they still work, just less efficient)
-- DROP INDEX IF EXISTS idx_alebilet_snapshots_timestamp;
-- DROP INDEX IF EXISTS idx_alebilet_sold_sold_at;
