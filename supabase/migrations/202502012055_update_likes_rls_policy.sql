-- This migration creates a new Row-Level Security (RLS) policy that allows an authenticated user
-- to update the "likes" column for any habit that is public.
-- Ensure that your habits table has RLS enabled:
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows update to the "likes" column if the habit is public.
CREATE POLICY "Allow update likes on public habits"
  ON habits
  FOR UPDATE
  TO authenticated
  USING (is_public = true)
  WITH CHECK (true); 