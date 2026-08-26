ALTER TABLE scorecards
  ADD COLUMN IF NOT EXISTS dish VARCHAR(80);
-- statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'scorecards_dish_length_check'
  ) THEN
    ALTER TABLE scorecards
      ADD CONSTRAINT scorecards_dish_length_check
      CHECK (dish IS NULL OR char_length(btrim(dish)) BETWEEN 1 AND 80);
  END IF;
END
$$;
