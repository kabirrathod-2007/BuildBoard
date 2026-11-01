USE buildboard;

-- ----------------------------------------------------------------------
-- Milestone 8: Persistent View Counts & Funnel Analytics
-- ----------------------------------------------------------------------

ALTER TABLE products 
  ADD COLUMN views_count INT UNSIGNED NOT NULL DEFAULT 0;

