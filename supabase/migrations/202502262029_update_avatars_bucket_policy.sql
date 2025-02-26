-- まず既存のポリシーを削除
DROP POLICY IF EXISTS "Anyone can upload an avatar." ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;

-- シンプルなアップロードポリシー（認証済みユーザーのみ）
CREATE POLICY "認証済みユーザーはアバターをアップロード可能" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'avatars');

-- 更新ポリシー
CREATE POLICY "認証済みユーザーはアバターを更新可能" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'avatars');

-- 削除ポリシー
CREATE POLICY "認証済みユーザーはアバターを削除可能" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'avatars');

-- 読み取りポリシー（公開アクセス）
CREATE POLICY "アバター画像は公開アクセス可能" 
ON storage.objects FOR SELECT 
TO anon, authenticated
USING (bucket_id = 'avatars');