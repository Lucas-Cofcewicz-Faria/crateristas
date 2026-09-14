ALTER TABLE restaurants ADD COLUMN menu_enabled BOOLEAN NOT NULL DEFAULT FALSE;
-- statement-breakpoint
CREATE INDEX visits_restaurant_date_idx ON visits (restaurant_id, visited_at DESC, created_at DESC);
-- statement-breakpoint
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id),
  slug TEXT NOT NULL,
  name VARCHAR(160) NOT NULL,
  category VARCHAR(80) NOT NULL,
  description VARCHAR(500) NOT NULL DEFAULT '',
  price_cents INTEGER CHECK (price_cents BETWEEN 0 AND 100000000),
  created_by UUID NOT NULL REFERENCES members(id),
  publication_state TEXT NOT NULL DEFAULT 'private' CHECK (publication_state IN ('private', 'published', 'hidden')),
  published_by UUID REFERENCES members(id),
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (restaurant_id, slug)
);
-- statement-breakpoint
CREATE TABLE menu_scorecards (
  item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id),
  flavor SMALLINT NOT NULL CHECK (flavor BETWEEN 0 AND 10),
  value SMALLINT NOT NULL CHECK (value BETWEEN 0 AND 10),
  ux SMALLINT NOT NULL CHECK (ux BETWEEN 0 AND 10),
  wait_time SMALLINT CHECK (wait_time BETWEEN 0 AND 10),
  rng SMALLINT CHECK (rng BETWEEN 0 AND 100),
  comment VARCHAR(180) NOT NULL CHECK (char_length(comment) BETWEEN 1 AND 180),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (item_id, member_id)
);
-- statement-breakpoint
CREATE TABLE menu_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES members(id),
  url TEXT NOT NULL,
  pathname TEXT NOT NULL UNIQUE,
  position SMALLINT NOT NULL CHECK (position BETWEEN 1 AND 5),
  UNIQUE (item_id, position)
);
