-- 1. Remove duplicate snapshots where total_available is the same as previous record
DELETE FROM ticket_snapshots
WHERE id IN (
  SELECT id FROM (
    SELECT
      id,
      total_available,
      LAG(total_available) OVER (ORDER BY timestamp) as prev_total
    FROM ticket_snapshots
  ) sub
  WHERE total_available = prev_total
);

-- 2. Create index on timestamp for faster queries (if not exists)
CREATE INDEX IF NOT EXISTS idx_ticket_snapshots_timestamp ON ticket_snapshots(timestamp DESC);

-- 3. Show results
SELECT COUNT(*) as remaining_records FROM ticket_snapshots;
