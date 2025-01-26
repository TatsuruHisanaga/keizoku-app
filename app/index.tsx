import Auth from '@/components/Auth';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { VStack } from '@/components/ui/vstack';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { AddIcon } from '@/components/ui/icon';
import AchievementModal from '../components/AchievementModal';
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

  const addHabit = () => {
    if (newHabit.trim()) {
      if (newHabit.length > 16) {
        setShowError(true);
        return;
      }
      setShowError(false);
      if (habits.length >= 3) {
        alert('習慣は3個までしか追加できません');
        return;
      }
      setHabits([
        ...habits,
        {
          id: Math.random().toString(36).substr(2, 9),
          name: newHabit,
          streak: 0,
          completedDates: [],
        },
      ]);
      setNewHabitModalData({
        isOpen: true,
        habitName: newHabit,
      });
      setNewHabit('');
    }
  };

  const toggleComplete = (habitId: string, date: string) => {
    const playSound = async () => {
      await Audio.Sound.createAsync(require('../assets/sounds/click.mp3'), {
        shouldPlay: true,
      });
    };
    setHabits(
      habits.map((habit) => {
        if (habit.id === habitId) {
          const isCompleted = habit.completedDates.includes(date);
          const completedDates = isCompleted
            ? habit.completedDates.filter((d) => d !== date)
            : [...habit.completedDates, date];

          const streak = completedDates.length;

          if (!isCompleted && streak > 0) {
            playSound();
            setAchievementData({
              isOpen: true,
              streak,
              habitName: habit.name,
            });
          }
          const newMaxStreak = getMaxConsecutiveDays(completedDates);
          return {
            ...habit,
            completedDates,
            streak: newMaxStreak,
          };
        }
        return habit;
      }),
    );
  };

  const editHabitName = (habitId: string, newName: string) => {
    setHabits(
      habits.map((habit) =>
        habit.id === habitId ? { ...habit, name: newName } : habit,
      ),
    );
  };

  const handleDeleteHabit = (habitId: string) => {
    setHabits((prevHabits) =>
      prevHabits.filter((habit) => habit.id !== habitId),
    );

    // もし AsyncStorage を使用している場合は、ストレージからも削除
    AsyncStorage.getItem('habits').then((habitsJson) => {
      if (habitsJson) {
        const storedHabits = JSON.parse(habitsJson);
        const updatedHabits = storedHabits.filter(
          (habit: any) => habit.id !== habitId,
        );
        AsyncStorage.setItem('habits', JSON.stringify(updatedHabits));
      }
    });
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
                  習慣名は16文字以内で入力してください
                </Text>
              )}
            </Box>
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
