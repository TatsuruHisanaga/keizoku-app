import React, { useState, useEffect, useMemo } from 'react';
import { Box } from './ui/box';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/ui/icon';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { MonthView } from './MonthView';

interface WeekViewProps {
  habits: {
    id: string;
    name: string;
    completedDates: string[];
  }[];
  onToggle: (habitId: string, date: string) => void;
  achievedDates?: string[];
}

export function WeekView({
  habits,
  onToggle,
  achievedDates = [],
}: WeekViewProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

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
    const weekDates = getWeekDates();
    const start = weekDates[0];
    const end = weekDates[6];
    const startMonth = start.getMonth() + 1;
    const endMonth = end.getMonth() + 1;

    return `${startMonth}月${start.getDate()}日 - ${
      startMonth !== endMonth ? `${endMonth}月` : ''
    }${end.getDate()}日`;
  };

  const isAchieved = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return achievedDates.includes(dateStr);
  };

  const renderWeekView = () => {
    return (
      <Box>
        {memoizedHabits.length === 0 ? (
          <Box className="bg-gray-800 rounded-xl p-6">
            <Text className="text-gray-400 text-center">
              まだ習慣が登録されていません
            </Text>
          </Box>
        ) : (
          memoizedHabits.map((habit) => (
            <Box
              key={habit.id}
              className="bg-gray-800 rounded-xl px-4 py-2 mb-2"
            >
              <Box className="mb-4">
                <Box>
                  <Text className="text-white font-medium mb-2">
                    {habit.name}
                  </Text>
                </Box>
                <Box className="flex flex-row justify-between">
                  {weekDates.map((dateObj) => {
                    const dateStr = dateObj.toISOString().split('T')[0];
                    const completedDates = habit?.completedDates ?? [];
                    const isCompleted = completedDates.includes(dateStr);
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
          ))
        )}
      </Box>
    );
  };

  const formatMonthYear = () => {
    return `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月`;
  };

  if (!mounted) return null;

  return (
    <Box className="bg-gray-900 rounded-3xl p-6">
      <Box className="flex flex-row items-center justify-between mb-6">
        <Button
          onPress={() => {
            if (viewMode === 'week') {
              setWeekOffset(weekOffset - 1);
            } else {
              const newDate = new Date(currentDate);
              newDate.setMonth(newDate.getMonth() - 1);
              setCurrentDate(newDate);
            }
          }}
          className="h-10 w-10 bg-gray-800/50 rounded-xl p-1"
        >
          <ButtonIcon as={ChevronLeftIcon} className="text-gray-400" />
        </Button>

        <Box style={{ alignItems: 'center', gap: 8 }}>
          <Box
            className="flex flex-row bg-gray-800/50 rounded-xl p-1"
            style={{ borderWidth: 1, borderColor: '#ffffff20' }}
          >
            <Button
              onPress={() => setViewMode('week')}
              className={`px-4 py-1.5 rounded-lg ${
                viewMode === 'week' ? 'bg-gray-700' : 'bg-transparent'
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  viewMode === 'week' ? 'text-white' : 'text-gray-400'
                }`}
              >
                週間
              </Text>
            </Button>
            <Button
              onPress={() => setViewMode('month')}
              className={`px-4 py-1.5 rounded-lg ${
                viewMode === 'month' ? 'bg-gray-700' : 'bg-transparent'
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  viewMode === 'month' ? 'text-white' : 'text-gray-400'
                }`}
              >
                月間
              </Text>
            </Button>
          </Box>
          <Text className="text-white font-medium text-lg">
            {viewMode === 'week' ? formatWeekRange() : formatMonthYear()}
          </Text>
        </Box>

        <Button
          onPress={() => {
            if (viewMode === 'week') {
              setWeekOffset(weekOffset + 1);
            } else {
              const newDate = new Date(currentDate);
              newDate.setMonth(newDate.getMonth() + 1);
              setCurrentDate(newDate);
            }
          }}
          className="h-10 w-10 bg-gray-800/50 rounded-xl p-1"
        >
          <ButtonIcon as={ChevronRightIcon} className="text-gray-400" />
        </Button>
      </Box>
      {viewMode === 'week' ? (
        renderWeekView()
      ) : (
        <Box>
          {memoizedHabits.length === 0 ? (
            <Box className="bg-gray-800 rounded-xl p-6">
              <Text className="text-gray-400 text-center">
                まだ習慣が登録されていません
              </Text>
            </Box>
          ) : (
            memoizedHabits.map((habit) => (
              <Box key={habit.id} className="mb-4">
                <Text className="text-white font-medium mb-2">
                  {habit.name}
                </Text>
                <MonthView habits={[habit]} currentDate={currentDate} />
              </Box>
            ))
          )}
        </Box>
      )}
    </Box>
  );
}
