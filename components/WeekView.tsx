import React, { useState, useEffect, useMemo } from 'react';
import { Box } from './ui/box';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
} from '@/components/ui/icon';
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
    // Replace with actual logic to return an array of dates
    const startOfWeek = new Date();
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i + weekOffset * 7);
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
    [habits, weekDates]
  );
  const formatWeekRange = () => {
    const start = weekDates[0];
    const end = weekDates[6];
    return `${start.getMonth() + 1}月 ${start.getDate()} - ${end.getDate()}`;
  };

  if (!mounted) return null;

  return (
    <Box className="bg-gray-900 rounded-3xl p-6 shadow-xl">
      <Box className="flex flex-row items-center justify-between mb-6">
        <Button
          className="text-gray-400 hover:text-white rounded-xl p-1"
          onPress={() => setWeekOffset((prev) => prev - 1)}
        >
          <ButtonIcon as={ChevronLeftIcon} />
        </Button>
        <Box>
          <Text className="text-white text-lg font-semibold">{formatWeekRange()}</Text>
        </Box>
        <Button
          className="text-gray-400 hover:text-white hover:bg-gray-700 rounded-xl p-1"
          onPress={() => setWeekOffset((prev) => prev + 1)}
        >
          <ButtonIcon as={ChevronRightIcon} />
        </Button>
      </Box>

      {memoizedHabits.map((habit) => (
        <Box key={habit.id} className="mb-4">
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
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${
                    isCompleted
                      ? 'bg-teal-500 text-white'
                      : 'bg-gray-700 text-gray-400'
                  } ${isToday ? 'border-2 border-teal-300' : ''}`}
                >
                  <ButtonText>{dateObj.getDate()}</ButtonText>
                </Button>
              );
            })}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
