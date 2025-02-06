import {
  Check,
  EllipsisVertical,
  SquarePen,
  Trash2,
  Milestone,
} from 'lucide-react-native';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Heading } from './ui/heading';
import { Box } from './ui/box';
import { Text } from './ui/text';
import { useEffect, useState, useRef } from 'react';
import { Input, InputField } from './ui/input';
import { Animated, View } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export interface HabitItemProps {
  habit: {
    id: string;
    name: string;
    streak: number;
    completedDates: string[];
    totalDays: number;
    goal?: number;
  };
  allHabits: {
    id: string;
    name: string;
    streak: number;
    completedDates: string[];
  }[];
  onToggle: (date: string) => void;
  onEdit: (newName: string) => void;
  onDelete: () => void;
}

export function HabitItem({
  habit,
  allHabits,
  onToggle,
  onEdit,
  onDelete,
}: HabitItemProps) {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  const completedDates = habit?.completedDates ?? [];
  const isCompleted = completedDates.includes(today);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(habit.name);
  const [error, setError] = useState('');
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [editedGoal, setEditedGoal] = useState(
    habit.goal ? habit.goal.toString() : '',
  );
  const [goalError, setGoalError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [containerHeight, setContainerHeight] = useState<number>(0);

  const handleSave = async () => {
    if (editedName.trim() === '') {
      setError('習慣名を入力してください');
      return;
    }

    try {
      const { error } = await supabase
        .from('habits')
        .update({ name: editedName })
        .eq('id', habit.id)
        .eq('user_id', user?.id);

      if (error) throw error;

      if (editedName.length > 16) {
        setError('習慣名は16文字以内で入力してください');
        return;
      }
      const isDuplicate = allHabits.some(
        (h) => h.id !== habit.id && h.name === editedName.trim(),
      );

      if (isDuplicate) {
        setError('同じ名前の習慣が既に存在します');
        return;
      }

      onEdit(editedName);
      setIsEditing(false);
      setIsMenuOpen(false);
      setError('');
    } catch (error) {
      console.error('Error updating habit:', error);
      setError('更新に失敗しました');
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
    setIsMenuOpen(false);
  };

  const handleLayout = (event: any) => {
    const { height } = event.nativeEvent.layout;
    if (containerHeight === 0) {
      setContainerHeight(height);
    }
  };

  const animateAndDelete = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onDelete) {
        onDelete();
      }
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', habit.id)
        .eq('user_id', user?.id);

      if (error) throw error;

      setShowDeleteConfirm(false);
      animateAndDelete();
    } catch (error) {
      console.error('Error deleting habit:', error);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  const handleCancel = () => {
    setEditedName(habit.name);
    setIsEditing(false);
    setIsMenuOpen(false);
    setError('');
  };

  // Handler for saving goal changes
  const handleGoalSave = async () => {
    const parsedGoal = parseInt(editedGoal, 10);
    if (isNaN(parsedGoal) || parsedGoal <= 0) {
      setGoalError('有効な目標日数を入力してください');
      return;
    }
    try {
      const { error } = await supabase
        .from('habits')
        .update({ goal: parsedGoal })
        .eq('id', habit.id)
        .eq('user_id', user?.id);

      if (error) throw error;

      setIsEditingGoal(false);
      setIsMenuOpen(false);
      setGoalError('');
    } catch (error) {
      console.error('Error updating habit goal:', error);
      setGoalError('更新に失敗しました');
    }
  };

  const handleGoalCancel = () => {
    setEditedGoal(habit.goal ? habit.goal.toString() : '');
    setIsEditingGoal(false);
    setIsMenuOpen(false);
    setGoalError('');
  };

  useEffect(() => {
    setError('');
  }, [isEditing]);

  useEffect(() => {
    setGoalError('');
  }, [isEditingGoal]);

  return (
    <View style={{ height: containerHeight }}>
      <Animated.View
        onLayout={handleLayout}
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          position: 'absolute',
          width: '100%',
          paddingHorizontal: 2,
        }}
      >
        <Box
          className="bg-white rounded-2xl p-4"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.03,
            shadowRadius: 2,
            elevation: 1,
          }}
        >
          {showDeleteConfirm ? (
            <Box className="flex flex-row items-center justify-between min-h-[42px]">
              <Text className="text-md text-gray-900">
                本当に削除しますか？
              </Text>
              <Box className="flex flex-row gap-2">
                <Button
                  variant="solid"
                  size="md"
                  className="rounded-lg border"
                  style={{
                    backgroundColor: '#fef2f2',
                    borderColor: '#fecaca',
                  }}
                  onPress={handleDeleteConfirm}
                >
                  <ButtonText style={{ color: '#dc2626' }}>削除する</ButtonText>
                </Button>
                <Button
                  variant="solid"
                  size="md"
                  className="rounded-lg border"
                  style={{
                    backgroundColor: '#f3f4f6',
                    borderColor: '#e5e7eb',
                  }}
                  onPress={handleDeleteCancel}
                >
                  <ButtonText style={{ color: '#4b5563' }}>
                    キャンセル
                  </ButtonText>
                </Button>
              </Box>
            </Box>
          ) : (
            <Box className="flex flex-row items-center justify-between min-h-[42px]">
              {isEditing ? (
                <Box className="flex-1">
                  <Box className="flex flex-row items-center gap-2">
                    <Box className="flex-1">
                      <Input isInvalid={!!error}>
                        <InputField
                          value={editedName}
                          onChangeText={setEditedName}
                          placeholder="新しい習慣名を入力"
                        />
                      </Input>
                    </Box>
                    <Box className="flex flex-row gap-2">
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
                        <ButtonText style={{ color: '#4b5563' }}>
                          保存
                        </ButtonText>
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
                        <ButtonText style={{ color: '#4b5563' }}>
                          キャンセル
                        </ButtonText>
                      </Button>
                    </Box>
                  </Box>
                  {error && (
                    <Text style={{ color: '#EF4444' }} className="text-sm mt-1">
                      {error}
                    </Text>
                  )}
                </Box>
              ) : isEditingGoal ? (
                <Box className="flex-1">
                  <Box className="flex flex-row items-center gap-2">
                    <Box className="flex-1">
                      <Input isInvalid={!!goalError}>
                        <InputField
                          value={editedGoal}
                          onChangeText={setEditedGoal}
                          placeholder="目標日数を入力"
                          keyboardType="numeric"
                        />
                      </Input>
                    </Box>
                    <Box className="flex flex-row gap-2">
                      <Button
                        variant="solid"
                        size="md"
                        className="rounded-lg border"
                        style={{
                          backgroundColor: '#f0fdf4',
                          borderColor: '#bbf7d0',
                        }}
                        onPress={handleGoalSave}
                      >
                        <ButtonText style={{ color: '#4b5563' }}>
                          保存
                        </ButtonText>
                      </Button>
                      <Button
                        variant="solid"
                        size="md"
                        className="rounded-lg border"
                        style={{
                          backgroundColor: '#fef2f2',
                          borderColor: '#fecaca',
                        }}
                        onPress={handleGoalCancel}
                      >
                        <ButtonText style={{ color: '#4b5563' }}>
                          キャンセル
                        </ButtonText>
                      </Button>
                    </Box>
                  </Box>
                  {goalError && (
                    <Text style={{ color: '#EF4444' }} className="text-sm mt-1">
                      {goalError}
                    </Text>
                  )}
                </Box>
              ) : (
                <Box className="flex flex-col justify-center">
                  <Heading className="text-lg font-medium text-gray-900">
                    {habit.name}
                  </Heading>
                  <Text className="text-sm text-gray-500">
                    累計{habit.totalDays}日達成 / 最高連続{habit.streak}日
                  </Text>
                  {habit.goal != null && (
                    <Text className="text-sm text-gray-500">
                      目標: {habit.goal}日
                    </Text>
                  )}
                </Box>
              )}
              {isEditing || isEditingGoal ? null : (
                <Box className="flex flex-row gap-2">
                  {isMenuOpen ? (
                    <>
                      {/* <Button
                        variant="solid"
                        size="sm"
                        className="w-10 h-10 rounded-xl border border-gray-300"
                        style={{ backgroundColor: '#ffffff' }}
                        onPress={() => setIsEditingGoal(true)}
                      >
                        <ButtonIcon
                          as={Milestone}
                          className="h-5 w-5"
                          style={{ color: '#6b7280' }}
                        />
                      </Button> */}
                      <Button
                        variant="solid"
                        size="sm"
                        className="w-10 h-10 rounded-xl border border-gray-300"
                        style={{ backgroundColor: '#ffffff' }}
                        onPress={() => setIsEditing(true)}
                      >
                        <ButtonIcon
                          as={SquarePen}
                          className="h-5 w-5"
                          style={{ color: '#6b7280' }}
                        />
                      </Button>
                      <Button
                        variant="solid"
                        size="sm"
                        className="w-10 h-10 rounded-xl border border-gray-300"
                        style={{ backgroundColor: '#ffffff' }}
                        onPress={handleDeleteClick}
                      >
                        <ButtonIcon
                          as={Trash2}
                          className="h-5 w-5"
                          style={{ color: '#6b7280' }}
                        />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="solid"
                        size="sm"
                        className="w-10 h-10 rounded-xl border"
                        style={{
                          backgroundColor: isCompleted ? '#f0fdf4' : '#ffffff',
                          borderColor: isCompleted ? '#bbf7d0' : '#e5e7eb',
                        }}
                        onPress={() => onToggle(today)}
                      >
                        <ButtonIcon
                          as={Check}
                          className="h-5 w-5"
                          style={{ color: isCompleted ? '#16a34a' : '#6b7280' }}
                        />
                      </Button>

                      <Button
                        variant="solid"
                        size="sm"
                        className="w-10 h-10 rounded-xl border border-gray-300"
                        style={{ backgroundColor: '#ffffff' }}
                        onPress={() => setIsMenuOpen(true)}
                      >
                        <ButtonIcon
                          as={EllipsisVertical}
                          className="h-5 w-5"
                          style={{ color: '#6b7280' }}
                        />
                      </Button>
                    </>
                  )}
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Animated.View>
    </View>
  );
}
