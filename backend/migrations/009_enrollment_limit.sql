USE buildboard;

-- ----------------------------------------------------------------------
-- Milestone 9: Configurable & Editable Tester Quotas
-- ----------------------------------------------------------------------

ALTER TABLE products 
  ADD COLUMN enrollment_limit INT UNSIGNED NULL DEFAULT NULL;

