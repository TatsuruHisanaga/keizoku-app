import Auth from '@/components/Auth';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
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
    }[]
  >([]);
  const [newHabit, setNewHabit] = useState('');

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
      setHabits([
        ...habits,
        {
          id: Math.random().toString(36).substr(2, 9),
          name: newHabit,
          streak: 0,
          completedDates: [],
        },
      ]);
      setNewHabit('');
    }
  };

  const toggleComplete = (habitId: string, date: string) => {
    setHabits(
      habits.map((habit) => {
        if (habit.id === habitId) {
          const isCompleted = habit.completedDates.includes(date);
          const completedDates = isCompleted
            ? habit.completedDates.filter((d) => d !== date)
            : [...habit.completedDates, date];

          const streak = completedDates.length;

          if (!isCompleted && streak > 0) {
            setAchievementData({
              isOpen: true,
              streak,
              habitName: habit.name,
            });
          }

          return {
            ...habit,
            completedDates,
            streak: completedDates.length,
          };
        }
        return habit;
      })
    );
  };

  return (
    <Box className="justify-center h-full p-4">
      {session && session.user ? (
        <VStack>
          {/* <Text>Welcome {session.user.email}</Text>
          <Button onPress={() => supabase.auth.signOut()}>
            <ButtonText>Sign Out</ButtonText>
          </Button>
          <Heading>{formatDateRange()}</Heading> */}
          <HStack
            space="md"
          >
            <Input
              variant="outline"
              size="lg"
              isDisabled={false}
              isInvalid={false}
              isReadOnly={false}
              className='flex-1'
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
