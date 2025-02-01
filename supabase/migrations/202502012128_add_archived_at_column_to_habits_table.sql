-- supabase/migrations/202502012100_add_achieved_at_column_to_habits_table.sql
-- This migration adds the achieved_at column to the habits table.

ALTER TABLE habits
ADD COLUMN achieved_at timestamp with time zone;