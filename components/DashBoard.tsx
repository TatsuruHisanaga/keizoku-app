import { Input, InputField } from '@/components/ui/input';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { AddIcon } from '@/components/ui/icon';
import { VStack } from './ui/vstack';
import { useState } from 'react';
import { Heading } from './ui/heading';
import { HabitItem } from '@/components/HabitItem';
import { Box } from './ui/box';

export default function DashBoard() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const now = new Date()
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(now.setDate(diff))
  })
  
  const getDatesForWeek = () => {
    const dates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart)
      date.setDate(currentWeekStart.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const weekDates = getDatesForWeek()
  const today = new Date()

  const formatDateRange = () => {
    const start = weekDates[0]
    const end = weekDates[6]
    return `${start.toLocaleDateString('ja-JP', { month: 'long' })} ${start.getDate()} - ${end.getDate()}`
  }

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString()
  }

  const [habits, setHabits] = useState<{
    id: string;
    name: string;
    streak: number;
    completedDates: string[];
  }[]>([]);
  const [newHabit, setNewHabit] = useState('');

  const addHabit = () => {
    if (newHabit.trim()) {
      setHabits([
        ...habits,
        {
          id: Math.random().toString(36).substr(2, 9),
          name: newHabit,
          streak: 0,
          completedDates: []
        }
      ])
      setNewHabit('')
    }
  }


  return (
    <VStack className="w-full">
      <Heading>{formatDateRange()}</Heading>
      <Input
        variant="outline"
        size="lg"
        isDisabled={false}
        isInvalid={false}
        isReadOnly={false}
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

      <Box className="space-y-4">
        {habits.map(habit => (
          <HabitItem
            key={habit.id}
            habit={{
              ...habit,
              totalDays: habit.completedDates.length
            }}
            onToggle={(date) => true}
          />
        ))}
      </Box>

    </VStack>

    
  );
}
