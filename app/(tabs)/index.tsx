import Auth from '@/components/Auth';
import { useAuth } from '@/hooks/useAuth';
import { useHabits } from '@/hooks/useHabits';
import { VStack } from '@/components/ui/vstack';
import AchievementModal from '../../components/AchievementModal';
import { Box } from '@/components/ui/box';
import { HabitItem } from '@/components/HabitItem';
import { WeekView } from '@/components/WeekView';
import NewHabitModal from '@/components/NewHabitModal';
import { Text } from '@/components/ui/text';
import HabitFab from '@/components/HabitFab';
import { ScrollView } from 'react-native';

export default function Index() {
  // 認証状態を取得
  const { session } = useAuth();

  // 習慣データと関連機能を取得
  const {
    habits,
    achievementData,
    newHabitModalData,
    fetchHabits,
    addHabit,
    toggleComplete,
    editHabitName,
    deleteHabit,
    closeAchievementModal,
    closeNewHabitModal,
  } = useHabits(session);

  // HabitFabに渡すためのハンドラー
  const handleAddHabitWrapper = async (habitName: string) => {
    return await addHabit(habitName);
  };

  return (
    <Box className="justify-center h-full p-4 relative">
      {session && session.user ? (
        <>
          <ScrollView className="flex-1">
            <VStack>
              <Box className="mt-4 gap-4">
                {habits.length === 0 ? (
                  <VStack space="md" className="items-center py-8">
                    <Text size="lg" className="text-center text-gray-600">
                      まだ習慣がありません
                    </Text>
                    <Text size="md" className="text-center text-gray-500">
                      新しい習慣を登録して、継続の力を実感しましょう！
                    </Text>
                  </VStack>
                ) : (
                  habits.map((habit) => (
                    <HabitItem
                      key={habit.id}
                      habit={{
                        ...habit,
                        totalDays: habit.completedDates?.length || 0,
                      }}
                      allHabits={habits}
                      onToggle={(date) => toggleComplete(habit.id, date)}
                      onEdit={(newName) => editHabitName(habit.id, newName)}
                      onDelete={() => deleteHabit(habit.id)}
                    />
                  ))
                )}
              </Box>

              <AchievementModal
                isOpen={achievementData.isOpen}
                onClose={closeAchievementModal}
                streak={achievementData.streak}
                habitName={achievementData.habitName}
              />

              <NewHabitModal
                isOpen={newHabitModalData.isOpen}
                onClose={closeNewHabitModal}
                habitName={newHabitModalData.habitName}
                onGoalSet={fetchHabits}
              />

              {/* 週間ビュー */}
              <Box className="mt-8 mb-20">
                <WeekView habits={habits} onToggle={toggleComplete} />
              </Box>
            </VStack>
          </ScrollView>
          <Box className="absolute bottom-4 right-4">
            <HabitFab
              onAddHabit={handleAddHabitWrapper}
              maxHabitsReached={habits.length >= 3}
            />
          </Box>
        </>
      ) : (
        <Auth />
      )}
    </Box>
  );
}
