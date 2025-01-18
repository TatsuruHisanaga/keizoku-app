import {
  Check,
  EllipsisVertical,
  SquarePen,
  Trash2,
} from 'lucide-react-native';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Heading } from './ui/heading';
import { Box } from './ui/box';
import { Text } from './ui/text';
import { useEffect, useState } from 'react';
import { Input, InputField } from './ui/input';
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
    setIsMenuOpen(false);
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
      <Box className="flex flex-row items-center justify-between min-h-[42px]">
        <Box className="flex flex-col justify-center">
          {isEditing ? (
            <Box>
              <Input className="w-48">
                <InputField
                  value={editedName}
                  onChangeText={setEditedName}
                  placeholder="新しい習慣名を入力"
                />
              </Input>
              {error && (
                <Text className="text-sm text-red-500 mt-1">{error}</Text>
              )}
            </Box>
          ) : (
            <>
              <Heading className="text-lg font-medium text-gray-900">
                {habit.name}
              </Heading>
              <Text className="text-sm text-gray-500">
                累計{habit.totalDays}日達成
              </Text>
            </>
          )}
        </Box>
        <Box className="flex flex-row gap-2">
          {isEditing ? (
            <>
              <Button
                variant="solid"
                size="md"
                className="rounded-lg border"
                style={{
                  backgroundColor: '#f0fdf4',
                  borderColor: '#bbf7d0',
                }}
                onPress={handleSave}
              >
                <ButtonText style={{ color: '#4b5563' }}>保存</ButtonText>
              </Button>
              <Button
                variant="solid"
                size="md"
                className="rounded-lg border"
                style={{
                  backgroundColor: '#fef2f2',
                  borderColor: '#fecaca',
                }}
                onPress={handleCancel}
              >
                <ButtonText style={{ color: '#4b5563' }}>キャンセル</ButtonText>
              </Button>
            </>
          ) : isMenuOpen ? (
            <>
              <Button
                variant="solid"
                size="sm"
                className={`w-10 h-10 rounded-xl border border-gray-300`}
                style={{ backgroundColor: '#ffffff' }}
                onPress={() => setIsEditing(true)}
              >
                <ButtonIcon
                  as={SquarePen}
                  className={`h-5 w-5`}
                  style={{ color: '#6b7280' }}
                />
              </Button>
              <Button
                variant="solid"
                size="sm"
                className={`w-10 h-10 rounded-xl border border-gray-300`}
                style={{ backgroundColor: '#ffffff' }}
              >
                <ButtonIcon
                  as={Trash2}
                  className={`h-5 w-5`}
                  style={{ color: '#6b7280' }}
                />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="solid"
                size="sm"
                className={`w-10 h-10 rounded-xl border`}
                style={{
                  backgroundColor: isCompleted ? '#f0fdf4' : '#ffffff',
                  borderColor: isCompleted ? '#bbf7d0' : '#e5e7eb',
                }}
                onPress={() => onToggle(today)}
              >
                <ButtonIcon
                  as={Check}
                  className={`h-5 w-5`}
                  style={{ color: isCompleted ? '#16a34a' : '#6b7280' }}
                />
              </Button>

              <Button
                variant="solid"
                size="sm"
                className={`w-10 h-10 rounded-xl border border-gray-300`}
                style={{ backgroundColor: '#ffffff' }}
                onPress={() => setIsMenuOpen(true)}
              >
                <ButtonIcon
                  as={EllipsisVertical}
                  className={`h-5 w-5`}
                  style={{ color: '#6b7280' }}
                />
              </Button>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}
