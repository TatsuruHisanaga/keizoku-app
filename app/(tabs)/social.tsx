import { useCallback } from 'react';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Box } from '@/components/ui/box';
import { RefreshControl, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSocialFeed } from '@/hooks/useSocialFeed';
import { HabitCard } from '@/components/social/HabitCard';
import { TabButton } from '@/components/social/TabButton';

export default function Social() {
  const router = useRouter();
  const {
    filteredHabits,
    refreshing,
    likedHabits,
    selectedTab,
    setSelectedTab,
    toggleLike,
    handleRefresh,
  } = useSocialFeed();

  const handleProfilePress = useCallback(
    (profileId: string) => {
      router.push(`/profile/${profileId}`);
    },
    [router],
  );

  return (
    <Box className="h-full bg-white">
      <Box className="border-b border-gray-200">
        <Box className="flex-row">
          <TabButton
            label="おすすめ"
            isSelected={selectedTab === 'all'}
            onPress={() => setSelectedTab('all')}
          />
          <TabButton
            label="フォロー中"
            isSelected={selectedTab === 'following'}
            onPress={() => setSelectedTab('following')}
          />
        </Box>
      </Box>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <Box className="p-4">
          <VStack space="md">
            {filteredHabits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                isLiked={!!likedHabits[habit.id]}
                onLikeToggle={toggleLike}
                onProfilePress={handleProfilePress}
              />
            ))}

            {filteredHabits.length === 0 && (
              <Box className="py-8">
                <Text className="text-center text-gray-500">
                  {selectedTab === 'all'
                    ? '今日はまだ達成された習慣がありません'
                    : 'フォロー中のユーザーの投稿はありません'}
                </Text>
              </Box>
            )}
          </VStack>
        </Box>
      </ScrollView>
    </Box>
  );
}
