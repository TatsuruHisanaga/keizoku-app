import React, { useState, useEffect, useMemo } from 'react';
import { Box } from './ui/box';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/ui/icon';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

interface WeekViewProps {
  habits: {
    id: string;
    name: string;
    completedDates: string[];
  }[];
  onToggle: (habitId: string, date: string) => void;
}

export function WeekView({ habits, onToggle }: WeekViewProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getWeekDates = (): Date[] => {
    const today = new Date();
    const startOfWeek = new Date(today);
    // 現在の曜日を取得（0: 日曜日, 1: 月曜日, ..., 6: 土曜日）
    const currentDay = startOfWeek.getDay();
    // 週の開始日（月曜日）に調整
    // 日曜日の場合は6を引く（次の月曜日まで戻る）、それ以外は現在の曜日から1を引く
    const daysToSubtract = currentDay === 0 ? 6 : currentDay - 1;
    startOfWeek.setDate(today.getDate() - daysToSubtract + weekOffset * 7);

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates();
  const today = new Date().toISOString().split('T')[0];

  // ...existing code...

  const getCompletionRate = (dates: string[]) => {
    // ...existing code...
  };

  const memoizedHabits = useMemo(
    () =>
      habits.map((habit) => ({
        ...habit,
        completionRate: getCompletionRate(habit.completedDates),
      })),
    [habits, weekDates],
  );
  const formatWeekRange = () => {
    const start = weekDates[0];
    const end = weekDates[6];
    const startMonth = start.getMonth() + 1;
    const endMonth = end.getMonth() + 1;

    return `${startMonth}月${start.getDate()}日 - ${
      startMonth !== endMonth ? `${endMonth}月` : ''
    }${end.getDate()}日`;
  };

  if (!mounted) return null;

  return (
    <Box className="bg-gray-900 rounded-3xl p-6 shadow-xl">
      <Box className="flex flex-row items-center justify-between mb-6">
        <Button
          className="h-10 w-10 text-gray-400 hover:text-white hover:bg-gray-700 rounded-xl p-1"
          onPress={() => setWeekOffset((prev) => prev - 1)}
        >
          <ButtonIcon as={ChevronLeftIcon} />
        </Button>
        <Box>
          <Text className="text-white text-lg font-semibold">
            {formatWeekRange()}
          </Text>
        </Box>
        <Button
          className="h-10 w-10 text-gray-400 hover:text-white hover:bg-gray-700 rounded-xl p-1"
          onPress={() => setWeekOffset((prev) => prev + 1)}
        >
          <ButtonIcon as={ChevronRightIcon} />
        </Button>
      </Box>
      {memoizedHabits.map((habit) => (
        <Box key={habit.id} className="bg-gray-800 rounded-xl px-4 py-2 mb-2">
          <Box className="mb-4">
            <Box>
              <Text className="text-white font-medium mb-2">{habit.name}</Text>
            </Box>
            <Box className="flex flex-row justify-between">
              {weekDates.map((dateObj) => {
                const dateStr = dateObj.toISOString().split('T')[0];
                const isCompleted = habit.completedDates.includes(dateStr);
                const isToday = dateStr === today;

                return (
                  <Button
                    key={dateStr}
                    onPress={() => onToggle(habit.id, dateStr)}
                    className={`p-0 w-10 h-10 rounded-lg
                      ${isCompleted ? 'bg-teal-500' : 'bg-gray-700'} 
                      ${isToday ? 'border-2 border-teal-300' : ''}
                    `}
                  >
                    <ButtonText
                      className={`font-semibold
                        ${isCompleted ? 'text-white' : 'text-gray-400'}
                      `}
                    >
                      {dateObj.getDate().toString()}
                    </ButtonText>
                  </Button>
                );
              })}
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  );
}
