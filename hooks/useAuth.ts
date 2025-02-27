import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { updatePushToken } from '@/utils/notifications';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // 初期セッションの取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        updatePushToken();
      }
    });

    // 認証状態変更のリスナー
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        updatePushToken();
      }
    });

    // クリーンアップ関数
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { session };
}
