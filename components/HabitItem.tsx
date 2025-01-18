import { Check, EllipsisVertical, Pencil, Trash } from 'lucide-react-native';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Heading } from './ui/heading';
import { Box } from './ui/box';
import { Text } from './ui/text';
import { useEffect, useState } from 'react';

export interface HabitItemProps {
  habit: {
    id: string;
    name: string;
    streak: number;
    completedDates: string[];
    totalDays: number;
  };
  onToggle: (date: string) => void;
  onEdit: (newName: string) => void;
}

export function HabitItem({ habit, onToggle, onEdit }: HabitItemProps) {
  const today = new Date().toISOString().split('T')[0];
  const isCompleted = habit.completedDates.includes(today);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(habit.name);
  const [error, setError] = useState('');

  const handleSave = () => {
    if (editedName.trim() === '') {
      setError('習慣名を入力してください');
      return;
    }
    onEdit(editedName);
    setIsEditing(false);
    setError('');
  };

  const handleCancel = () => {
    setEditedName(habit.name);
    setIsEditing(false);
    setIsMenuOpen(false);
    setError('');
  };

  useEffect(() => {
    setError('');
  }, [isEditing]);

  return (
    <Box className="bg-white rounded-2xl shadow-sm p-4">
      <Box className="flex flex-row items-center justify-between">
        <Box>
          <Heading className="text-lg font-medium text-gray-900">
            {habit.name}
          </Heading>
          <Text className="text-sm text-gray-500">
            {habit.streak}日連続達成
          </Text>
        </Box>
        <Box className="flex flex-row gap-2">
          {isEditing ? (
            <>
              <Button>
                <ButtonText>保存</ButtonText>
              </Button>
              <Button onPress={handleCancel}>
                <ButtonText>キャンセル</ButtonText>
              </Button>
            </>
          ) : isMenuOpen ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className={`w-10 h-10 rounded-xl border-gray-300`}
                onPress={() => setIsEditing(true)}
              >
                <ButtonIcon as={Pencil} className={`h-5 w-5`} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={`w-10 h-10 rounded-xl border-gray-300`}
              >
                <ButtonIcon as={Trash} className={`h-5 w-5`} />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                className={`w-10 h-10 rounded-xl border-gray-300 ${
                  isCompleted
                    ? 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100'
                    : 'hover:bg-gray-100'
                }`}
                onPress={() => onToggle(today)}
              >
                <ButtonIcon
                  as={Check}
                  className={`h-5 w-5 ${isCompleted ? 'color-green-600' : ''}`}
                />
              </Button>

              <Button
                variant="outline"
                size="sm"
                className={`w-10 h-10 rounded-xl border-gray-300`}
                onPress={() => setIsMenuOpen(true)}
              >
                <ButtonIcon as={EllipsisVertical} className={`h-5 w-5`} />
              </Button>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}
