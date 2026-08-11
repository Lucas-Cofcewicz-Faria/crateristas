CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  display_name VARCHAR(80) NOT NULL,
  avatar_url TEXT,
  society_title VARCHAR(100),
  member_number SMALLINT NOT NULL UNIQUE CHECK (member_number BETWEEN 1 AND 8),
  bio VARCHAR(280) NOT NULL DEFAULT '',
  favorite_cuisine VARCHAR(100),
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name VARCHAR(160) NOT NULL,
  cuisine VARCHAR(100) NOT NULL,
  neighborhood VARCHAR(120) NOT NULL,
  city VARCHAR(120) NOT NULL DEFAULT 'São Paulo',
  address TEXT,
  price_band VARCHAR(4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id),
  created_by UUID REFERENCES members(id),
  visited_at DATE NOT NULL,
  quorum SMALLINT NOT NULL DEFAULT 6 CHECK (quorum BETWEEN 1 AND 8),
  publication_state TEXT NOT NULL DEFAULT 'private' CHECK (publication_state IN ('private', 'published', 'hidden')),
  publication_reason TEXT CHECK (publication_reason IN ('quorum', 'admin_override')),
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES members(id),
  hidden_at TIMESTAMPTZ,
  hidden_by UUID REFERENCES members(id),
  version INTEGER NOT NULL DEFAULT 1,
  legacy_review_id VARCHAR(50) UNIQUE,
  legacy_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS scorecards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id),
  food SMALLINT NOT NULL CHECK (food BETWEEN 0 AND 10),
  service SMALLINT NOT NULL CHECK (service BETWEEN 0 AND 10),
  ambience SMALLINT NOT NULL CHECK (ambience BETWEEN 0 AND 10),
  value SMALLINT NOT NULL CHECK (value BETWEEN 0 AND 10),
  access SMALLINT NOT NULL CHECK (access BETWEEN 0 AND 10),
  wait_time SMALLINT NOT NULL CHECK (wait_time BETWEEN 0 AND 10),
  comment VARCHAR(180) NOT NULL CHECK (char_length(comment) BETWEEN 1 AND 180),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (visit_id, member_id)
);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS visit_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES members(id),
  url TEXT NOT NULL,
  pathname TEXT NOT NULL UNIQUE,
  content_type VARCHAR(40) CHECK (content_type = 'image/webp'),
  size_bytes INTEGER CHECK (size_bytes BETWEEN 1 AND 750000),
  position SMALLINT NOT NULL CHECK (position BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (visit_id, position)
);
-- statement-breakpoint
CREATE TABLE IF NOT EXISTS publication_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES members(id),
  action TEXT NOT NULL CHECK (action IN ('quorum_publish', 'publish_early', 'hide', 'republish')),
  participant_count SMALLINT NOT NULL CHECK (participant_count BETWEEN 1 AND 8),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS visits_public_idx ON visits (published_at DESC) WHERE publication_state = 'published';
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS scorecards_visit_idx ON scorecards (visit_id);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS scorecards_member_idx ON scorecards (member_id, visit_id);
