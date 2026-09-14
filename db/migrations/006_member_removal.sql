-- Keep identity and foreign keys intact so historical contributions survive.
ALTER TABLE members
  ADD COLUMN removed_at TIMESTAMPTZ,
  ADD COLUMN removed_by UUID REFERENCES members(id),
  ADD CONSTRAINT members_removal_audit_check CHECK ((removed_at IS NULL) = (removed_by IS NULL)),
  ADD CONSTRAINT members_admin_removal_check CHECK (role <> 'admin' OR removed_at IS NULL);
