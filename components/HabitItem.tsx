import { Check } from 'lucide-react-native'
import { Button, ButtonIcon } from '@/components/ui/button'
import { Heading } from './ui/heading'
import { Box } from './ui/box'
import { Text } from './ui/text'
import { Audio } from 'expo-av'
import { useEffect } from 'react'

export interface HabitItemProps {
  habit: {
    id: string
    name: string
    streak: number
    completedDates: string[]
    totalDays: number
  }
  onToggle: (date: string) => void
}

export function HabitItem({ habit, onToggle }: HabitItemProps) {
  const today = new Date().toISOString().split('T')[0]
  const isCompleted = habit.completedDates.includes(today)

  return (
    <Box className="bg-white rounded-2xl shadow-sm p-4">
      <Box className="flex flex-row items-center justify-between">
        <Box>
          <Heading className="text-lg font-medium text-gray-900">{habit.name}</Heading>
          <Text className="text-sm text-gray-500">
            {habit.streak}日連続達成
          </Text>
        </Box>
          <Button
            variant="outline"
            size="sm"
            className={`rounded-xl ${
              isCompleted
                ? 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100'
                : 'hover:bg-gray-100'
            }`}
            onPress={() => onToggle(today)}
          >
            <ButtonIcon as={Check} className={`h-5 w-5 ${isCompleted ? 'color-green-600' : '' }`}  />
          </Button>
      </Box>
    </Box>
  )
}

