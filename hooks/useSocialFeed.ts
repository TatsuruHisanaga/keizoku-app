import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { triggerNotification } from '@/utils/notifications';
import { haptics } from '@/utils/soundUtils';

export interface PublicHabit {
  id: string;
  name: string;
  streak: number;
  completed_dates: string[];
  updated_at: string;
  achieved_at: string;
  likes?: number;
  profiles: {
    id: string;
    username: string;
    avatar_url: string;
  };
}

export function useSocialFeed() {
  const [publicHabits, setPublicHabits] = useState<PublicHabit[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [likedHabits, setLikedHabits] = useState<{ [id: string]: boolean }>({});
  const [followings, setFollowings] = useState<string[]>([]);
  const [selectedTab, setSelectedTab] = useState<'all' | 'following'>('all');

  // いいねしたハビットを取得
  const fetchUserLikes = useCallback(async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from('likes')
        .select('habit_id')
        .eq('user_id', userData.user.id);

      if (error) throw error;

      if (data && data.length > 0) {
        const userLikes = data.reduce(
          (acc: { [id: string]: boolean }, like) => {
            acc[like.habit_id] = true;
            return acc;
          },
          {},
        );
        setLikedHabits(userLikes);
      }
    } catch (error) {
      console.error('Error fetching user likes:', error);
    }
  }, []);

  // 公開ハビットを取得
  const fetchPublicHabits = useCallback(async () => {
    setRefreshing(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('habits')
        .select(
          `
          *,
          profiles!habits_user_id_fkey (
            id,
            username,
            avatar_url
          ),
          likes:likes_habit_id_fk (id)
        `,
        )
        .eq('is_public', true)
        .contains('completed_dates', [today])
        .order('achieved_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      if (data) {
        const processedData = data.map((habit: any) => ({
          ...habit,
          likes: Array.isArray(habit.likes) ? habit.likes.length : 0,
        }));
        setPublicHabits(processedData);
      } else {
        setPublicHabits([]);
      }
    } catch (error) {
      console.error('Error fetching public habits:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // フォロー中のユーザーを取得
  const fetchFollowings = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', user.id);

      if (error) {
        console.error('Error fetching followings:', error);
      } else if (data) {
        const followedIds = data.map((follow: any) => follow.followed_id);
        setFollowings(followedIds);
      }
    } catch (error) {
      console.error('Error fetching followings:', error);
    }
  }, []);

  // いいねの処理
  const toggleLike = useCallback(
    async (habitId: string): Promise<void> => {
      await haptics.light();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('User is not logged in');
        await haptics.error();
        return;
      }

      const habit = publicHabits.find((h) => h.id === habitId);
      if (!habit) return;

      const newLiked = !likedHabits[habitId];
      const userId = user.id;

      // 現在の状態を保存（エラー時の復元用）
      const prevLikedState = { ...likedHabits };
      const prevHabits = [...publicHabits];

      // 楽観的UI更新（即座に表示を更新）
      const currentLikes = habit.likes ?? 0;
      const newLikeCount = newLiked
        ? currentLikes + 1
        : Math.max(currentLikes - 1, 0);

      setLikedHabits((prev) => ({ ...prev, [habitId]: newLiked }));
      setPublicHabits((prev) =>
        prev.map((h) => (h.id === habitId ? { ...h, likes: newLikeCount } : h)),
      );

      try {
        // バックグラウンドでデータベース更新
        if (newLiked) {
          const { error } = await supabase
            .from('likes')
            .insert({ user_id: userId, habit_id: habitId });

          if (error) throw error;

          // 通知は非同期で処理
          sendLikeNotification(habit, user).catch((error) =>
            console.error('Error sending notification:', error),
          );
        } else {
          const { error } = await supabase
            .from('likes')
            .delete()
            .eq('user_id', userId)
            .eq('habit_id', habitId);

          if (error) throw error;
        }
      } catch (error) {
        // エラー発生時は元の状態に戻す
        console.error('Error updating like:', error);
        setLikedHabits(prevLikedState);
        setPublicHabits(prevHabits);
        await haptics.error();
      }
    },
    [publicHabits, likedHabits],
  );

  // いいね通知の送信
  const sendLikeNotification = async (habit: PublicHabit, user: any) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('push_token, username')
        .eq('id', habit.profiles.id)
        .single();

      if (profileError) {
        console.error(
          'Error fetching profile data for notification:',
          profileError,
        );
        return;
      }

      if (profileData?.push_token) {
        await triggerNotification(
          habit.profiles.id,
          profileData.push_token,
          'like',
          {
            senderId: user.id,
            senderName: user.user_metadata?.username || user.email || 'Unknown',
            habitName: habit.name,
            habitId: habit.id,
          },
        );
      } else {
        console.warn(
          'No expo push token found for habit owner. Notification not sent.',
        );
      }
    } catch (notifError) {
      console.error('Error triggering like notification:', notifError);
    }
  };

  // データの初期ロード
  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([
        fetchPublicHabits(),
        fetchUserLikes(),
        fetchFollowings(),
      ]);
    };

    loadInitialData();
  }, [fetchPublicHabits, fetchUserLikes, fetchFollowings]);

  // リフレッシュ処理
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchPublicHabits(), fetchUserLikes()]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchPublicHabits, fetchUserLikes]);

  // 選択したタブに基づきフィルタリング
  const filteredHabits = useMemo(
    () =>
      selectedTab === 'all'
        ? publicHabits
        : publicHabits.filter((habit) =>
            followings.includes(habit.profiles.id),
          ),
    [publicHabits, followings, selectedTab],
  );

  return {
    publicHabits,
    filteredHabits,
    refreshing,
    likedHabits,
    selectedTab,
    setSelectedTab,
    toggleLike,
    handleRefresh,
  };
}
