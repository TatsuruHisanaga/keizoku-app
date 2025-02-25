CREATE EXTENSION IF NOT EXISTS citext;

-- user_identifierカラムの追加
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS user_identifier citext UNIQUE;

-- user_identifierの制約
ALTER TABLE public.profiles
ADD CONSTRAINT user_identifier_format
CHECK (user_identifier ~ '^[a-zA-Z0-9_]{3,20}$');

-- インデックスの作成
CREATE INDEX IF NOT EXISTS profiles_user_identifier_idx
ON public.profiles(user_identifier);
