-- 既存のテーブルとトリガーを削除
drop trigger if exists set_updated_at on habits;
drop table if exists habits; 