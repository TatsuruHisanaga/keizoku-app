-- pgcrypto拡張機能の有効化（UUIDを生成するため）
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- followsテーブルの作成
CREATE TABLE public.follows (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    followed_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    -- 同じフォロー関係を重複して作成できないように制約を追加
    CONSTRAINT unique_follow UNIQUE (follower_id, followed_id),
    -- 自分自身をフォローできないように制約を追加
    CONSTRAINT no_self_follow CHECK (follower_id != followed_id)
);

-- インデックスの作成（検索パフォーマンス向上のため）
CREATE INDEX follows_follower_id_idx ON public.follows(follower_id);
CREATE INDEX follows_followed_id_idx ON public.follows(followed_id);

-- RLSの有効化
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- RLSポリシーの作成
-- フォロー情報の閲覧は誰でも可能
CREATE POLICY "フォロー情報は誰でも閲覧可能"
ON public.follows FOR SELECT
USING (true);

-- フォローの作成は認証済みユーザーのみ可能
CREATE POLICY "認証済みユーザーのみフォロー作成可能"
ON public.follows FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = follower_id);

-- フォローの削除は作成者のみ可能
CREATE POLICY "フォロー作成者のみ削除可能"
ON public.follows FOR DELETE
TO authenticated
USING (auth.uid() = follower_id);