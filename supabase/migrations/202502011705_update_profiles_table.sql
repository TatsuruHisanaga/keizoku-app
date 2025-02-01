-- RLS (Row Level Security) の有効化
alter table profiles enable row level security;

-- 既存のprofilesテーブルを更新

-- bioカラムの追加（存在しない場合）
do $$ 
begin
  if not exists (select from pg_attribute 
    where attrelid = 'profiles'::regclass 
    and attname = 'bio'
    and not attisdropped) then
    alter table profiles add column bio text;
  end if;
end $$;

-- updated_atカラムの追加（存在しない場合）
do $$ 
begin
  if not exists (select from pg_attribute 
    where attrelid = 'profiles'::regclass 
    and attname = 'updated_at'
    and not attisdropped) then
    alter table profiles add column updated_at timestamptz;
  end if;
end $$;

-- user_id カラムが存在しない場合にのみ追加する
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- セキュリティポリシーの更新
drop policy if exists "プロフィールは誰でも閲覧可能" on profiles;
drop policy if exists "ユーザーは自分のプロフィールのみ更新可能" on profiles;

create policy "プロフィールは誰でも閲覧可能" 
  on profiles for select 
  using ( true );

create policy "ユーザーは自分のプロフィールのみ更新可能" 
  on profiles for update 
  using ( auth.uid() = user_id );

create policy "ユーザーは自分のプロフィールのみ作成可能" 
  on profiles for insert 
  with check ( auth.uid() = user_id );

-- 新規ユーザー登録時に自動的にプロフィールを作成するトリガー
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, user_id)
  values (new.id, new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();