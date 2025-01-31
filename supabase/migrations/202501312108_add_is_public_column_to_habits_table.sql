-- Add is_public column to habits table
alter table public.habits 
add column is_public boolean default true;

-- Update existing records
update habits set is_public = true where is_public is null;