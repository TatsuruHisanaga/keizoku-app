import Auth from '@/components/Auth';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { VStack } from '@/components/ui/vstack';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { AddIcon } from '@/components/ui/icon';
import AchievementModal from '../../components/AchievementModal';
import { Box } from '@/components/ui/box';
import { Input, InputField } from '@/components/ui/input';
import { HabitItem } from '@/components/HabitItem';
import { WeekView } from '@/components/WeekView';
import { HStack } from '@/components/ui/hstack';
import { Audio } from 'expo-av';
import NewHabitModal from '@/components/NewHabitModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text } from '@/components/ui/text';

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

  const [habits, setHabits] = useState<
    {
      id: string;
      name: string;
      streak: number;
      completedDates: string[];
      totalDays: number;
    }[]
  >([]);
  const [newHabit, setNewHabit] = useState('');
  const [showError, setShowError] = useState(false);
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

  const user = session?.user;

  // habitデータの取得
  useEffect(() => {
    if (session?.user) {
      fetchHabits();
    }
  }, [session]);

  const fetchHabits = async () => {
    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data) {
        // データの形式を変換し、completed_datesがnullの場合は空配列を設定
        const formattedData = data.map((habit) => ({
          id: habit.id,
          name: habit.name,
          streak: habit.streak || 0,
          completedDates: habit.completed_dates || [],
          totalDays: habit.total_days || 0,
        }));
        setHabits(formattedData);
      }
    } catch (error) {
      console.error('Error fetching habits:', error);
    }
  };

  // 習慣の追加
  const addHabit = async () => {
    if (!newHabit.trim()) {
      setShowError(true);
      return;
    }
    if (newHabit.length > 16) {
      setShowError(true);
      return;
    }
    if (habits.some((habit) => habit.name === newHabit.trim())) {
      setShowError(true);
      return;
    }
    setShowError(false);
    if (habits.length >= 3) {
      alert('習慣は3個までしか追加できません');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('habits')
        .insert([
          {
            name: newHabit,
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
          habitName: newHabit,
        });
        setNewHabit('');
      }
    } catch (error) {
      console.error('Error adding habit:', error);
    }
    setShowError(false);
  };

  // 習慣の完了状態の切り替え
  const toggleComplete = async (habitId: string, date: string) => {
    try {
      const habit = habits.find((h) => h.id === habitId);
      if (!habit) return;

      const completedDates = habit.completedDates || [];
      const isCompleted = completedDates.includes(date);
      const updatedCompletedDates = isCompleted
        ? completedDates.filter((d) => d !== date)
        : [...completedDates, date];

      const streak = getMaxConsecutiveDays(updatedCompletedDates);

      // Update habit completion
      const { error: habitError } = await supabase
        .from('habits')
        .update({
          completed_dates: updatedCompletedDates,
          streak,
          total_days: updatedCompletedDates.length,
        })
        .eq('id', habitId);

      if (habitError) throw habitError;

      // If habit was completed (not uncompleted), create activity
      if (!isCompleted) {
        const { error: activityError } = await supabase
          .from('habit_activities')
          .insert([
            {
              user_id: user?.id,
              habit_id: habitId,
              habit_name: habit.name,
              completed_date: date,
              streak: streak,
            },
          ]);

        if (activityError) throw activityError;
      }

      // UI更新とサウンド再生
      const playSound = async () => {
        await Audio.Sound.createAsync(
          require('../../assets/sounds/click.mp3'),
          {
            shouldPlay: true,
          },
        );
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
    } catch (error) {
      console.error('Error toggling habit:', error);
    }
  };

  const editHabitName = async (habitId: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('habits')
        .update({ name: newName })
        .eq('id', habitId);

      if (error) throw error;

      setHabits(
        habits.map((habit) =>
          habit.id === habitId ? { ...habit, name: newName } : habit,
        ),
      );
    } catch (error) {
      console.error('Error updating habit name:', error);
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
    } catch (error) {
      console.error('Error deleting habit:', error);
    }
  };

  return (
    <Box className="justify-center h-full p-4">
      {session && session.user ? (
        <VStack>
          <HStack space="md">
            <Box className="flex-1">
              <Input
                variant="outline"
                size="lg"
                isDisabled={false}
                isInvalid={showError}
                isReadOnly={false}
              >
                <InputField
                  placeholder="新しい習慣を入力..."
                  value={newHabit}
                  onChangeText={(text) => {
                    setNewHabit(text);
                    setShowError(false);
                  }}
                />
              </Input>
              {showError && (
                <Text size="sm" style={{ color: '#EF4444' }} className="mt-1">
                  {!newHabit.trim()
                    ? '習慣名を入力してください'
                    : newHabit.length > 16
                      ? '習慣名は16文字以内で入力してください'
                      : '同じ名前の習慣が既に存在します'}
                </Text>
              )}
            </Box>
            <Button size="lg" onPress={addHabit}>
              <ButtonIcon as={AddIcon} />
              <ButtonText>追加</ButtonText>
            </Button>
          </HStack>

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
          />

          {/* 週間ビュー */}
          <Box className="mt-8">
            <WeekView habits={habits} onToggle={toggleComplete} />
          </Box>
        </VStack>
      ) : (
        <Auth />
      )}
    </Box>
  );
}
