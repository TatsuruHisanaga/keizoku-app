import { useEffect, useState } from 'react';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Box } from '@/components/ui/box';
import {
  Avatar,
  AvatarImage,
  AvatarFallbackText,
} from '@/components/ui/avatar';
import { HStack } from '@/components/ui/hstack';
import { BicepsFlexed, Flame, Medal, GraduationCap } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { RefreshControl, ScrollView, TouchableOpacity } from 'react-native';
import { Icon } from '@/components/ui/icon';

interface PublicHabit {
  id: string;
  name: string;
  streak: number;
  completed_dates: string[];
  updated_at: string;
  achieved_at: string;
  likes?: number;
  profiles: {
    id: string;
    username: string;
    avatar_url: string;
  };
}

interface StreakBadgeProps {
  streak: number;
}

function StreakBadge({ streak }: StreakBadgeProps) {
  const getBadgeStyle = (streak: number) => {
    if (streak >= 30) {
      return {
        bg: 'bg-purple-100',
        text: 'text-purple-600',
        iconColor: '#A855F7',
        icon: GraduationCap,
        label: '絶好調',
      };
    } else if (streak >= 14) {
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-600',
        iconColor: '#3B82F6',
        icon: Medal,
        label: '好調',
      };
    } else if (streak >= 7) {
      return {
        bg: 'bg-orange-100',
        text: 'text-orange-600',
        iconColor: '#F97316',
        icon: Flame,
        label: '順調',
      };
    } else {
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-600',
        iconColor: '#6B7280',
        icon: BicepsFlexed,
        label: 'チャレンジ中',
      };
    }
  };

  const style = getBadgeStyle(streak);
  const Icon = style.icon;

  return (
    <Box className={`${style.bg} px-3 py-1 rounded-full`}>
      <HStack space="xs" className="items-center">
        <Icon color={style.iconColor} size={16} />
        <Text className={`${style.text} font-bold`}>{streak}日連続</Text>
      </HStack>
    </Box>
  );
}

export default function Social() {
  const [publicHabits, setPublicHabits] = useState<PublicHabit[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [likedHabits, setLikedHabits] = useState<{ [id: string]: boolean }>({});

  const toggleLike = async (habitId: string): Promise<void> => {
    const habit = publicHabits.find((h) => h.id === habitId);
    if (!habit) return;

    const currentLikes = habit.likes ?? 0;
    const newLiked = !likedHabits[habitId];
    const newLikeCount = newLiked
      ? currentLikes + 1
      : Math.max(currentLikes - 1, 0);

    const { error } = await supabase
      .from('habits')
      .update({ likes: newLikeCount })
      .eq('id', habitId);
    if (error) {
      console.error('Error updating like count:', error);
      return;
    }

    setLikedHabits((prev) => ({ ...prev, [habitId]: newLiked }));
    setPublicHabits((prev) =>
      prev.map((h) => (h.id === habitId ? { ...h, likes: newLikeCount } : h)),
    );
  };

  const fetchPublicHabits = async () => {
    setRefreshing(true);
    try {
      // 今日の日付を取得（YYYY-MM-DD形式）
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('habits')
        .select(
          `
          *,
          profiles!habits_user_id_fkey (
            id,
            username,
            avatar_url
          )
        `,
        )
        .eq('is_public', true)
        .contains('completed_dates', [today])
        .order('updated_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPublicHabits(data || []);
    } catch (error) {
      console.error('Error fetching public habits:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPublicHabits();
  }, []);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}分前`;
    }
    return date.toLocaleTimeString('ja-JP', {
      timeZone: 'Asia/Tokyo',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box className="h-full">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchPublicHabits}
          />
        }
      >
        <Box className="p-4">
          <Text className="text-xl font-bold mb-4">今日のみんなの取り組み</Text>
          <VStack space="md">
            {publicHabits.map((habit) => (
              <Box
                key={habit.id}
                className="p-4 bg-white rounded-lg shadow-sm border border-gray-100"
              >
                <VStack space="sm">
                  {/* 習慣名と連続日数を目立たせる */}
                  <HStack className="items-center justify-between">
                    <Text className="text-lg font-bold">{habit.name}</Text>
                    <StreakBadge streak={habit.streak} />
                  </HStack>

                  {/* ユーザー情報と達成時刻 */}
                  <HStack space="md" className="items-center">
                    <Avatar size="sm">
                      <AvatarFallbackText>
                        {habit.profiles?.username?.[0]?.toUpperCase() || '?'}
                      </AvatarFallbackText>
                      {habit.profiles?.avatar_url && (
                        <AvatarImage
                          source={{
                            uri: habit.profiles.avatar_url,
                          }}
                        />
                      )}
                    </Avatar>
                    <Text className="text-sm text-gray-500">
                      {habit.profiles?.username || '名なしさん'}
                    </Text>
                  </HStack>

                  {/* 総達成日数 */}
                  <Text className="text-sm text-gray-500">
                    累計{habit.completed_dates?.length || 0}日達成
                  </Text>
                  <HStack className="items-center justify-between">
                    <Text className="text-sm text-gray-400">
                      {formatTime(habit.achieved_at)}
                    </Text>
                    <TouchableOpacity
                      onPress={() => toggleLike(habit.id)}
                      className="flex-row items-center"
                    >
                      <Icon
                        as={Flame}
                        color={likedHabits[habit.id] ? 'red' : 'gray'}
                        size="lg"
                      />
                      <Text className="text-sm text-gray-500 min-w-[20px] text-center">
                        {habit.likes}
                      </Text>
                    </TouchableOpacity>
                  </HStack>
                </VStack>
              </Box>
            ))}

            {publicHabits.length === 0 && (
              <Box className="py-8">
                <Text className="text-center text-gray-500">
                  今日はまだ達成された習慣がありません
                </Text>
              </Box>
            )}
          </VStack>
        </Box>
      </ScrollView>
    </Box>
  );
}
