import { Input, InputField } from '@/components/ui/input';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { AddIcon } from '@/components/ui/icon';
import { VStack } from './ui/vstack';
import { useState } from 'react';
import { Heading } from './ui/heading';
import { HabitItem } from '@/components/HabitItem';
import { Box } from './ui/box';
import AchievementModal from '@/components/AchievementModal';

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

  const [achievementData, setAchievementData] = useState<{
    isOpen: boolean
    streak: number
    habitName: string
  }>({
    isOpen: false,
    streak: 0,
    habitName: ''
  })

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

  const toggleComplete = (habitId: string, date: string) => {
    setHabits(habits.map(habit => {
      if (habit.id === habitId) {
        const isCompleted = habit.completedDates.includes(date)
        const completedDates = isCompleted
          ? habit.completedDates.filter(d => d !== date)
          : [...habit.completedDates, date]
        
        const streak = completedDates.length
        
        if (!isCompleted && streak > 0) {
          setAchievementData({
            isOpen: true,
            streak,
            habitName: habit.name
          })
        }
        
        return {
          ...habit,
          completedDates,
          streak: completedDates.length
        }
      }
      return habit
    }))
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
            onToggle={(date) => toggleComplete(habit.id, date)}
          />
        ))}
      </Box>

      <AchievementModal
        isOpen={achievementData.isOpen}
        onClose={() => setAchievementData(prev => ({ ...prev, isOpen: false }))}
        streak={achievementData.streak}
        habitName={achievementData.habitName}
      />

    </VStack>

    
  );
}
