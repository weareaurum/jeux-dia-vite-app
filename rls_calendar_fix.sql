-- =============================================================
-- Run this in Supabase SQL Editor (after rls_security_fix.sql)
-- =============================================================

-- The calendar_slots VIEW doesn't bypass RLS, so non-admin users
-- only see their own bookings in the calendar. This SECURITY DEFINER
-- function bypasses RLS and returns only non-PII columns.

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

-- Drop the view (no longer needed)
DROP VIEW IF EXISTS calendar_slots;
