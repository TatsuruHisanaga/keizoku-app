-- This migration adds a "likes" column to the "habits" table.
ALTER TABLE habits
ADD COLUMN likes integer DEFAULT 0 NOT NULL;