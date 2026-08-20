DO $$
BEGIN
  IF to_regclass('reviews') IS NOT NULL THEN
    EXECUTE 'DELETE FROM reviews';
  END IF;
END
$$;
