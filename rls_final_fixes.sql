-- =============================================================
-- Run this in Supabase SQL Editor
-- =============================================================

-- 1. Add author_name column to tournament_posts (denormalized)
--    so author names display even when users RLS blocks the join
ALTER TABLE tournament_posts
  ADD COLUMN IF NOT EXISTS author_name text;

-- Backfill existing posts with author name from users table
UPDATE tournament_posts tp
SET author_name = u.full_name
FROM users u
WHERE tp.author_id = u.id AND tp.author_name IS NULL;

-- 2. Re-confirm the get_calendar_slots function exists and is correct
CREATE OR REPLACE FUNCTION get_calendar_slots()
RETURNS TABLE(
  id uuid,
  start_time timestamptz,
  end_time timestamptz,
  duration integer,
  price numeric,
  status text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id, start_time, end_time, duration, price, status
  FROM bookings
  WHERE status NOT IN ('cancelled', 'rejected');
$$;

GRANT EXECUTE ON FUNCTION get_calendar_slots() TO anon, authenticated;

-- 3. Drop the calendar_slots view if it still exists
DROP VIEW IF EXISTS calendar_slots;
