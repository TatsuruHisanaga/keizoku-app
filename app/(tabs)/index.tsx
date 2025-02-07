import Auth from '@/components/Auth';
import { supabase } from '@/lib/supabase';
import { useEffect, useState, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { VStack } from '@/components/ui/vstack';
import AchievementModal from '../../components/AchievementModal';
import { Box } from '@/components/ui/box';
import { HabitItem } from '@/components/HabitItem';
import { WeekView } from '@/components/WeekView';
import { Audio } from 'expo-av';
import NewHabitModal from '@/components/NewHabitModal';
import { Text } from '@/components/ui/text';
import HabitFab from '@/components/HabitFab';
import { ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';

export default function Index() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  function getMaxConsecutiveDays(dates: string[]): number {
    const sorted = [...dates].sort();
    let maxStreak = 0;
    let currentStreak = 0;
    let prevDate: Date | null = null;

    for (const dateStr of sorted) {
      const dateObj = new Date(dateStr);
      if (
        prevDate &&
        dateObj.getTime() - prevDate.getTime() === 24 * 60 * 60 * 1000
      ) {
        currentStreak++;
      } else {
        currentStreak = 1;
      }
      maxStreak = Math.max(maxStreak, currentStreak);
      prevDate = dateObj;
    }

    return maxStreak;
  }

  type Habit = {
    id: string;
    name: string;
    streak: number;
    completedDates: string[];
    totalDays: number;
    is_public: boolean;
    achieved_at?: string;
    goal?: number;
  };

  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabitModalData, setNewHabitModalData] = useState<{
    isOpen: boolean;
    habitName: string;
  }>({
    isOpen: false,
    habitName: '',
  });

  const [achievementData, setAchievementData] = useState<{
    isOpen: boolean;
    streak: number;
    habitName: string;
  }>({
    isOpen: false,
    streak: 0,
    habitName: '',
  });

  // habitデータの取得
  const fetchHabits = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', session?.user?.id)
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

  useEffect(() => {
    if (session?.user) {
      fetchHabits();
    }
  }, [session, fetchHabits]);

  // 習慣の追加
  const handleAddHabit = async (habitName: string) => {
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

  // 習慣の完了状態の切り替え
  const toggleComplete = async (habitId: string, date: string) => {
    try {
      // Trigger light feedback for toggling.
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

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

      // Update habit completion
      const { data: updatedHabit, error: habitError } = await supabase
        .from('habits')
        .update({
          completed_dates: updatedCompletedDates,
          streak,
          total_days: updatedCompletedDates.length,
          achieved_at: !isCompleted
            ? new Date().toISOString()
            : habit.achieved_at,
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

      // UI更新とサウンド再生
      const playSound = async () => {
        try {
          const { sound } = await Audio.Sound.createAsync(
            require('../../assets/sounds/click.mp3'),
            {
              shouldPlay: true,
            },
          );
          await sound.playAsync();
          // サウンドのクリーンアップ
          return () => {
            sound.unloadAsync();
          };
        } catch (error) {
          console.error('Error playing sound:', error);
        }
      };

      setHabits(
        habits.map((h) => {
          if (h.id === habitId) {
            if (!isCompleted && updatedCompletedDates.length > 0) {
              playSound();
              setAchievementData({
                isOpen: true,
                streak: updatedCompletedDates.length,
                habitName: h.name,
              });
            }
            return {
              ...h,
              completedDates: updatedCompletedDates,
              streak,
              totalDays: updatedCompletedDates.length,
            };
          }
          return h;
        }),
      );
    } catch (error: any) {
      console.error('Error toggling habit:', error.message || error);
      // On error, trigger error haptic feedback.
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      alert('習慣の更新中にエラーが発生しました。もう一度お試しください。');
    }
  };

  const editHabitName = async (habitId: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('habits')
        .update({ name: newName })
        .eq('id', habitId);

      if (error) throw error;

      // On successful editing, trigger light feedback.
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      setHabits(
        habits.map((habit) =>
          habit.id === habitId ? { ...habit, name: newName } : habit,
        ),
      );
    } catch (error: any) {
      console.error('Error updating habit name:', error);
      // On error, trigger error haptic feedback.
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
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

  // HabitFabに渡すためのハンドラー
  const handleAddHabitWrapper = async (habitName: string) => {
    const hasError = await handleAddHabit(habitName);
    if (!hasError) {
      // Removed setNewHabit as newHabit is unused
    }
    return hasError;
  };

  return (
    <Box className="justify-center h-full p-4 relative">
      {session && session.user ? (
        <>
          <ScrollView className="flex-1">
            <VStack>
              <Box className="mt-4 gap-4">
                {habits.length === 0 ? (
                  <VStack space="md" className="items-center py-8">
                    <Text size="lg" className="text-center text-gray-600">
                      まだ習慣がありません
                    </Text>
                    <Text size="md" className="text-center text-gray-500">
                      新しい習慣を登録して、継続の力を実感しましょう！
                    </Text>
                  </VStack>
                ) : (
                  habits.map((habit) => (
                    <HabitItem
                      key={habit.id}
                      habit={{
                        ...habit,
                        totalDays: habit.completedDates?.length || 0,
                      }}
                      allHabits={habits}
                      onToggle={(date) => toggleComplete(habit.id, date)}
                      onEdit={(newName) => editHabitName(habit.id, newName)}
                      onDelete={() => handleDeleteHabit(habit.id)}
                    />
                  ))
                )}
              </Box>

              <AchievementModal
                isOpen={achievementData.isOpen}
                onClose={() =>
                  setAchievementData((prev) => ({ ...prev, isOpen: false }))
                }
                streak={achievementData.streak}
                habitName={achievementData.habitName}
              />

              <NewHabitModal
                isOpen={newHabitModalData.isOpen}
                onClose={() =>
                  setNewHabitModalData((prev) => ({ ...prev, isOpen: false }))
                }
                habitName={newHabitModalData.habitName}
                onGoalSet={fetchHabits}
              />

              {/* 週間ビュー */}
              <Box className="mt-8 mb-20">
                <WeekView habits={habits} onToggle={toggleComplete} />
              </Box>
            </VStack>
          </ScrollView>
          <Box className="absolute bottom-4 right-4">
            <HabitFab
              onAddHabit={handleAddHabitWrapper}
              maxHabitsReached={habits.length >= 3}
            />
          </Box>
        </>
      ) : (
        <Auth />
      )}
    </Box>
  );
}
