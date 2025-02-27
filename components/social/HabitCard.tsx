import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import {
  Avatar,
  AvatarImage,
  AvatarFallbackText,
} from '@/components/ui/avatar';
import { TouchableOpacity } from 'react-native';
import { PublicHabit } from '@/hooks/useSocialFeed';
import { StreakBadge } from '@/components/social/StreakBadge';
import { Icon } from '@/components/ui/icon';
import { Flame } from 'lucide-react-native';

// 時間フォーマット関数
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

interface HabitCardProps {
  habit: PublicHabit;
  isLiked: boolean;
  onLikeToggle: (habitId: string) => Promise<void>;
  onProfilePress: (profileId: string) => void;
}

export function HabitCard({
  habit,
  isLiked,
  onLikeToggle,
  onProfilePress,
}: HabitCardProps) {
  return (
    <TouchableOpacity onPress={() => onProfilePress(habit.profiles.id)}>
      <Box
        className="p-4 bg-white rounded-lg border border-gray-100"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.03,
          shadowRadius: 2,
          elevation: 1,
        }}
      >
        <VStack space="sm">
          <HStack className="items-center justify-between">
            <Text className="text-lg font-bold">{habit.name}</Text>
            <StreakBadge streak={habit.streak} />
          </HStack>
          <HStack space="md" className="items-center">
            <Avatar size="sm">
              <AvatarFallbackText>
                {habit.profiles?.username?.[0]?.toUpperCase() || '?'}
              </AvatarFallbackText>
              {habit.profiles?.avatar_url && (
                <AvatarImage source={{ uri: habit.profiles.avatar_url }} />
              )}
            </Avatar>
            <Text className="text-sm text-gray-500">
              {habit.profiles?.username || '名なしさん'}
            </Text>
          </HStack>
          <Text className="text-sm text-gray-500">
            累計{habit.completed_dates?.length || 0}日達成
          </Text>
          <HStack className="items-center justify-between">
            <Text className="text-sm text-gray-400">
              {formatTime(habit.achieved_at)}
            </Text>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onLikeToggle(habit.id);
              }}
              className="flex-row items-center p-2 -m-2"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon as={Flame} color={isLiked ? 'red' : 'gray'} size="lg" />
              <Text className="text-sm text-gray-500 min-w-[20px] text-center">
                {habit.likes}
              </Text>
            </TouchableOpacity>
          </HStack>
        </VStack>
      </Box>
    </TouchableOpacity>
  );
}
