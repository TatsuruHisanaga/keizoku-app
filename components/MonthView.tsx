import React from 'react';
import { Box } from './ui/box';
import { Text } from './ui/text';

interface Habit {
  id: string;
  name: string;
  completedDates: string[];
}

interface MonthViewProps {
  habits: Habit[];
  currentDate: Date;
}

export function MonthView({ habits, currentDate }: MonthViewProps) {
  // Helper function to convert a date to JST.
  function getJSTDate(date?: Date): Date {
    const baseDate = date ? new Date(date) : new Date();
    // Convert local time to UTC then add 9 hours for JST.
    const utc = baseDate.getTime() + baseDate.getTimezoneOffset() * 60000;
    return new Date(utc + 9 * 60 * 60000);
  }

  // Helper function to get day of week as per JST.
  const getJSTDay = (date: Date) => getJSTDate(date).getDay();

  // Convert the provided currentDate to JST.
  const jstCurrentDate = getJSTDate(currentDate);
  const year = jstCurrentDate.getFullYear();
  const month = jstCurrentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startDate = new Date(firstDayOfMonth);
  const firstDay = getJSTDay(firstDayOfMonth);
  const daysToSubtract = firstDay === 0 ? 6 : firstDay - 1;
  startDate.setDate(firstDayOfMonth.getDate() - daysToSubtract);

  const endDate = new Date(lastDayOfMonth);
  const lastDay = getJSTDay(lastDayOfMonth);
  const daysToAdd = lastDay === 0 ? 0 : 7 - lastDay;
  endDate.setDate(lastDayOfMonth.getDate() + daysToAdd);

  const dayCells: Date[] = [];
  const iterator = new Date(startDate);
  while (iterator <= endDate) {
    dayCells.push(new Date(iterator));
    iterator.setDate(iterator.getDate() + 1);
  }

  const weeks: Date[][] = [];
  for (let i = 0; i < dayCells.length; i += 7) {
    weeks.push(dayCells.slice(i, i + 7));
  }

  const allCompletedDates = habits.reduce((acc, habit) => {
    return [...acc, ...habit.completedDates];
  }, [] as string[]);

  // 日付の各部分がJSTの値と一致するようにローカルのフォーマット関数を使用
  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  const today = formatDate(new Date());

  return (
    <Box className="bg-gray-800 rounded-xl p-4">
      {/* Weekday header (Monday-first) */}
      <Box style={{ flexDirection: 'row', marginBottom: 8 }}>
        {['月', '火', '水', '木', '金', '土', '日'].map((day, index) => (
          <Box
            key={index}
            style={{
              flex: 1,
              alignItems: 'center',
              padding: 4,
            }}
          >
            <Text style={{ color: '#9CA3AF' }}>{day}</Text>
          </Box>
        ))}
      </Box>

      {/* Calendar grid */}
      {weeks.map((week, wi) => (
        <Box key={wi} style={{ flexDirection: 'row', marginBottom: 4 }}>
          {week.map((day, di) => {
            const dateStr = formatDate(day);
            const isCompleted = allCompletedDates.includes(dateStr);
            const isToday = dateStr === today;
            const isCurrentMonth = day.getMonth() === month;
            return (
              <Box
                key={di}
                style={{
                  flex: 1,
                  padding: 4,
                  alignItems: 'center',
                }}
              >
                <Box
                  style={{
                    backgroundColor: isCompleted ? '#14B8A6' : 'transparent',
                    padding: 8,
                    borderRadius: 8,
                    opacity: isCurrentMonth ? 1 : 0.5,
                    borderWidth: isToday ? 2 : 0,
                    borderColor: '#14B8A6',
                  }}
                >
                  <Text
                    style={{
                      color: isCurrentMonth ? '#FFFFFF' : '#6B7280',
                      opacity: isCurrentMonth ? 1 : 0.5,
                    }}
                  >
                    {day.getDate()}
                  </Text>
                </Box>
              </Box>
            );
          })}
        </Box>
      ))}
    </Box>
  );
}
