import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import {
  getMaxConsecutiveDays,
  getCurrentConsecutiveDays,
} from '@/utils/habitUtils';
import { playClickSound, haptics } from '@/utils/soundUtils';
import { updateReminderAfterHabitToggle } from '@/utils/reminder';

export type Habit = {
  id: string;
  name: string;
  streak: number;
  completedDates: string[];
  totalDays: number;
  is_public: boolean;
  achieved_at?: string;
  goal?: number;
};

export function useHabits(session: Session | null) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [achievementData, setAchievementData] = useState<{
    isOpen: boolean;
    streak: number;
    habitName: string;
  }>({
    isOpen: false,
    streak: 0,
    habitName: '',
  });
  const [newHabitModalData, setNewHabitModalData] = useState<{
    isOpen: boolean;
    habitName: string;
  }>({
    isOpen: false,
    habitName: '',
  });

  // habitデータの取得
  const fetchHabits = useCallback(async () => {
    try {
      if (!session?.user?.id) return;

      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data) {
        const formattedData = data.map((habit) => ({
          id: habit.id,
          name: habit.name,
          streak: habit.streak || 0,
          completedDates: habit.completed_dates || [],
          totalDays: habit.total_days || 0,
          is_public: habit.is_public || true,
          achieved_at: habit.achieved_at,
          goal: habit.goal,
        }));
        setHabits(formattedData);
      }
    } catch (error) {
      console.error('Error fetching habits:', error);
    }
  }, [session]);

  // 習慣を追加する
  const addHabit = async (habitName: string) => {
    if (!habitName.trim() || habitName.length > 16) {
      return true; // エラーあり
    }
    if (habits.some((habit) => habit.name === habitName.trim())) {
      return true; // エラーあり
    }

    try {
      const { data, error } = await supabase
        .from('habits')
        .insert([
          {
            name: habitName,
            streak: 0,
            completed_dates: [],
            user_id: session?.user?.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setHabits([...habits, data]);
        setNewHabitModalData({
          isOpen: true,
          habitName: habitName,
        });
        return false; // エラーなし
      }
    } catch (error: any) {
      console.error('Error adding habit:', error);
    }
    return true; // エラーあり
  };

  // 習慣の完了状態を切り替える
  const toggleComplete = async (habitId: string, date: string) => {
    try {
      // Trigger light feedback for toggling.
      await haptics.light();

      const habit = habits.find((h) => h.id === habitId);
      if (!habit) {
        console.error('Habit not found');
        return;
      }

      // 日付が有効かチェック
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        console.error('Invalid date:', date);
        return;
      }

      const completedDates = habit.completedDates || [];
      const isCompleted = completedDates.includes(date);
      const updatedCompletedDates = isCompleted
        ? completedDates.filter((d) => d !== date)
        : [...completedDates, date];

      const streak = getMaxConsecutiveDays(updatedCompletedDates);

      // 当日の日付を取得
      const today = new Date().toISOString().split('T')[0];

      // achieved_at の更新ロジック
      let newAchievedAt = habit.achieved_at;

      if (!isCompleted && date === today) {
        // すでに achieved_at が設定されているか確認
        const achievedDate = habit.achieved_at
          ? new Date(habit.achieved_at).toISOString().split('T')[0]
          : null;

        // achieved_at が未設定、または達成日が今日でない場合のみ更新
        if (!achievedDate || achievedDate !== today) {
          newAchievedAt = new Date().toISOString();
        }
      }

      // Update habit completion
      const { data: updatedHabit, error: habitError } = await supabase
        .from('habits')
        .update({
          completed_dates: updatedCompletedDates,
          streak,
          total_days: updatedCompletedDates.length,
          achieved_at: newAchievedAt,
        })
        .eq('id', habitId)
        .eq('user_id', session?.user?.id)
        .select()
        .single();

      if (habitError) {
        console.error('Error updating habit:', habitError);
        throw habitError;
      }

      if (!updatedHabit) {
        console.error('No habit was updated');
        return;
      }

      setHabits(
        habits.map((h) => {
          if (h.id === habitId) {
            const today = new Date().toISOString().split('T')[0];
            if (
              date === today &&
              !isCompleted &&
              updatedCompletedDates.length > 0
            ) {
              playClickSound();
              const currentStreak = getCurrentConsecutiveDays(
                updatedCompletedDates,
              );
              setAchievementData({
                isOpen: true,
                streak: currentStreak, // 現在の日付を含めた連続日数を表示
                habitName: h.name,
              });
            }
            return {
              ...h,
              streak: getMaxConsecutiveDays(updatedCompletedDates),
              completedDates: updatedCompletedDates,
              totalDays: updatedCompletedDates.length,
            };
          }
          return h;
        }),
      );

      // If this is today's habit, update the reminder settings
      if (date === today) {
        // Use the utility to check and update reminder settings
        await updateReminderAfterHabitToggle();
      }
    } catch (error: any) {
      console.error('Error toggling habit:', error.message || error);
      // On error, trigger error haptic feedback.
      await haptics.error();
      alert('習慣の更新中にエラーが発生しました。もう一度お試しください。');
    }
  };

  // 習慣名を編集する
  const editHabitName = async (habitId: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('habits')
        .update({ name: newName })
        .eq('id', habitId);

      if (error) throw error;

      // On successful editing, trigger light feedback.
      await haptics.light();

      setHabits(
        habits.map((habit) =>
          habit.id === habitId ? { ...habit, name: newName } : habit,
        ),
      );
    } catch (error: any) {
      console.error('Error updating habit name:', error);
      // On error, trigger error haptic feedback.
      await haptics.error();
    }
  };

  // 習慣を削除する
  const deleteHabit = async (habitId: string) => {
    try {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', habitId);

      if (error) throw error;

      setHabits((prevHabits) =>
        prevHabits.filter((habit) => habit.id !== habitId),
      );
    } catch (error: any) {
      console.error('Error deleting habit:', error);
    }
  };

  // セッション変更時に習慣を取得
  useEffect(() => {
    if (session?.user) {
      fetchHabits();
    }
  }, [session, fetchHabits]);

  // モーダル状態のリセット
  const closeAchievementModal = () => {
    setAchievementData((prev) => ({ ...prev, isOpen: false }));
  };

  const closeNewHabitModal = () => {
    setNewHabitModalData((prev) => ({ ...prev, isOpen: false }));
  };

  return {
    habits,
    achievementData,
    newHabitModalData,
    fetchHabits,
    addHabit,
    toggleComplete,
    editHabitName,
    deleteHabit,
    closeAchievementModal,
    closeNewHabitModal,
  };
}
