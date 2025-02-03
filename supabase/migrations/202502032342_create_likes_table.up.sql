-- pgcrypto 拡張機能の有効化（gen_random_uuid() を利用するため）
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS likes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    habit_id uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT likes_user_id_fk FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT likes_habit_id_fk FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
); 