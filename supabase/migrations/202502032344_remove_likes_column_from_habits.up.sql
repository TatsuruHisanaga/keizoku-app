-- habitsテーブルからlikesカラムを削除するマイグレーション
ALTER TABLE habits DROP COLUMN IF EXISTS likes; 