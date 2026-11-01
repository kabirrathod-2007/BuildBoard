USE buildboard;

-- ----------------------------------------------------------------------
-- Milestone 8: Persistent View Counts & Funnel Analytics
-- ----------------------------------------------------------------------

ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS views_count INT UNSIGNED NOT NULL DEFAULT 0;
