ALTER TABLE visits
  ADD COLUMN IF NOT EXISTS deletion_started_at TIMESTAMPTZ;
-- statement-breakpoint
ALTER TABLE visits
  ADD COLUMN IF NOT EXISTS deletion_started_by UUID REFERENCES members(id);
