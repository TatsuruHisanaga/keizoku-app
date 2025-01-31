-- Drop all existing policies
drop policy if exists "Users can view their own habits" on habits;
drop policy if exists "Users can insert their own habits" on habits;
drop policy if exists "Users can update their own habits" on habits;
drop policy if exists "Users can delete their own habits" on habits;

-- Create new policies
create policy "Users can view public habits"
on habits for select
to authenticated
using (
  auth.uid() = user_id  -- Can view own habits
  or
  (is_public = true)    -- Can view other users' public habits
);

create policy "Users can insert their own habits"
on habits for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own habits"
on habits for update
to authenticated
using (auth.uid() = user_id);

create policy "Users can delete their own habits"
on habits for delete
to authenticated
using (auth.uid() = user_id); 