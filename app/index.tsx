import Auth from '@/components/Auth';
import { supabase } from '@/lib/supabase';
import { useEffect, useRef, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { VStack } from '@/components/ui/vstack';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { AddIcon } from '@/components/ui/icon';
import AchievementModal from '../components/AchievementModal';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { Input, InputField } from '@/components/ui/input';
import { HabitItem } from '@/components/HabitItem';
import { WeekView } from '@/components/WeekView';
import { HStack } from '@/components/ui/hstack';
import { Audio } from 'expo-av';
import LottieView from 'lottie-react-native';
import NewHabitModal from '@/components/NewHabitModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // 月曜日を週の始めに設定
    return new Date(now.setDate(diff));
  });

  const getDatesForWeek = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

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

  const weekDates = getDatesForWeek();
  const today = new Date();

  const formatDateRange = () => {
    const start = weekDates[0];
    const end = weekDates[6];
    return `${start.toLocaleDateString('ja-JP', {
      month: 'long',
    })} ${start.getDate()} - ${end.getDate()}`;
  };

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
        // データの形式を変換
        const formattedData = data.map((habit) => ({
          id: habit.id,
          name: habit.name,
          streak: habit.streak,
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
    if (newHabit.trim()) {
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
    }
  };

  // 習慣の完了状態の切り替え
  const toggleComplete = async (habitId: string, date: string) => {
    try {
      const habit = habits.find((h) => h.id === habitId);
      if (!habit) return;

      const isCompleted = habit.completedDates.includes(date);
      const completedDates = isCompleted
        ? habit.completedDates.filter((d) => d !== date)
        : [...habit.completedDates, date];

      const streak = getMaxConsecutiveDays(completedDates);

      const { error } = await supabase
        .from('habits')
        .update({
          completed_dates: completedDates,
          streak,
          total_days: completedDates.length,
        })
        .eq('id', habitId);

      if (error) throw error;

      // UI更新とサウンド再生
      const playSound = async () => {
        await Audio.Sound.createAsync(require('../assets/sounds/click.mp3'), {
          shouldPlay: true,
        });
      };

      setHabits(
        habits.map((h) => {
          if (h.id === habitId) {
            if (!isCompleted && completedDates.length > 0) {
              playSound();
              setAchievementData({
                isOpen: true,
                streak: completedDates.length,
                habitName: h.name,
              });
            }
            return { ...h, completedDates, streak };
          }
          return h;
        })
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
          habit.id === habitId ? { ...habit, name: newName } : habit
        )
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
        prevHabits.filter((habit) => habit.id !== habitId)
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
            <Input
              variant="outline"
              size="lg"
              isDisabled={false}
              isInvalid={false}
              isReadOnly={false}
              className="flex-1"
            >
              <InputField
                placeholder="新しい習慣を入力..."
                value={newHabit}
                onChangeText={(text) => setNewHabit(text)}
              />
            </Input>
            <Button size="lg" onPress={addHabit}>
              <ButtonIcon as={AddIcon} />
              <ButtonText>追加</ButtonText>
            </Button>
          </HStack>

          <Box className="mt-4 gap-4">
            {habits.map((habit) => (
              <HabitItem
                key={habit.id}
                habit={{
                  ...habit,
                  totalDays: habit.completedDates.length,
                }}
                onToggle={(date) => toggleComplete(habit.id, date)}
                onEdit={(newName) => editHabitName(habit.id, newName)}
                onDelete={() => handleDeleteHabit(habit.id)}
              />
            ))}
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
          {habits.length > 0 && (
            <Box className="mt-8">
              <WeekView habits={habits} onToggle={toggleComplete} />
            </Box>
          )}
        </VStack>
      ) : (
        <Auth />
      )}
    </Box>
  );
}
