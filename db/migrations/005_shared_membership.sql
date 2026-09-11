-- Preserve every existing member, number, scorecard and publication event.
ALTER TABLE members DROP CONSTRAINT members_member_number_check;
-- statement-breakpoint
ALTER TABLE members ALTER COLUMN member_number TYPE INTEGER;
-- statement-breakpoint
ALTER TABLE members ADD CONSTRAINT members_member_number_check CHECK (member_number > 0);
-- statement-breakpoint
CREATE SEQUENCE member_number_seq AS INTEGER;
-- statement-breakpoint
SELECT setval('member_number_seq', COALESCE((SELECT MAX(member_number) FROM members), 0) + 1, false);
-- statement-breakpoint
ALTER SEQUENCE member_number_seq OWNED BY members.member_number;
-- statement-breakpoint
ALTER TABLE members ALTER COLUMN member_number SET DEFAULT nextval('member_number_seq');
-- statement-breakpoint
ALTER TABLE publication_events DROP CONSTRAINT publication_events_participant_count_check;
-- statement-breakpoint
ALTER TABLE publication_events ALTER COLUMN participant_count TYPE INTEGER;
-- statement-breakpoint
ALTER TABLE publication_events ADD CONSTRAINT publication_events_participant_count_check CHECK (participant_count >= 1);
-- statement-breakpoint
CREATE TABLE membership_invite (
  singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton),
  version UUID NOT NULL DEFAULT gen_random_uuid(),
  active BOOLEAN NOT NULL DEFAULT FALSE,
  updated_by UUID REFERENCES members(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- statement-breakpoint
INSERT INTO membership_invite (singleton) VALUES (TRUE);
-- statement-breakpoint
CREATE TABLE membership_enrollments (
  token_hash CHAR(64) PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name VARCHAR(80) NOT NULL,
  invite_version UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  consumed_by TEXT,
  consumed_at TIMESTAMPTZ
);
-- statement-breakpoint
CREATE INDEX membership_enrollments_created_at_idx ON membership_enrollments(created_at);
