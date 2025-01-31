-- Enable moddatetime extension if not already enabled
create extension if not exists moddatetime schema public;

-- Create habits table
create table public.habits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  streak int default 0,
  total_days int default 0,
  completed_dates date[] default array[]::date[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.habits enable row level security;

-- Create indexes
create index habits_user_id_idx on public.habits(user_id);
create index habits_completed_dates_idx on public.habits using gin(completed_dates);

-- Set up auto-updating updated_at timestamp
create trigger set_updated_at
  before update on public.habits
  for each row
  execute procedure public.moddatetime();

-- RLS Policies
create policy "Users can view their own habits"
on public.habits for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own habits"
on public.habits for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own habits"
on public.habits for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own habits"
on public.habits for delete
to authenticated
using (auth.uid() = user_id);