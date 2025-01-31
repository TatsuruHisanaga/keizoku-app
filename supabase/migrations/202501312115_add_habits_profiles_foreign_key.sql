-- Drop existing foreign key if exists
alter table habits 
drop constraint if exists habits_user_id_fkey;

-- Add new foreign key constraint to profiles
alter table habits
add constraint habits_user_id_fkey
foreign key (user_id)
references profiles(id); 