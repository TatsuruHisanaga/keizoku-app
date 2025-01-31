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
import { supabase } from '@/lib/supabase';
import { RefreshControl, ScrollView } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

interface Activity {
  id: string;
  created_at: string;
  user_id: string;
  habit_name: string;
  streak: number;
  user: {
    email: string;
    user_metadata?: {
      name?: string;
      avatar_url?: string;
    };
  };
}

export default function Social() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('habit_activities')
        .select(
          `
          *,
          user:user_id (
            email,
            user_metadata
          )
        `,
        )
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchActivities();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  return (
    <Box className="h-full">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Box className="p-4">
          <Text className="text-xl font-bold mb-4">みんなの習慣</Text>
          <VStack space="md">
            {activities.map((activity) => (
              <Box
                key={activity.id}
                className="p-4 bg-white rounded-lg shadow-sm"
              >
                <HStack space="md" className="items-center">
                  <Avatar size="md">
                    <AvatarFallbackText>
                      {activity.user?.user_metadata?.name?.[0] ||
                        activity.user?.email?.[0]?.toUpperCase() ||
                        '?'}
                    </AvatarFallbackText>
                    {activity.user?.user_metadata?.avatar_url && (
                      <AvatarImage
                        source={{
                          uri: activity.user.user_metadata.avatar_url,
                        }}
                      />
                    )}
                  </Avatar>
                  <VStack className="flex-1">
                    <Text className="font-semibold">
                      {activity.user?.user_metadata?.name ||
                        activity.user?.email?.split('@')[0]}
                    </Text>
                    <Text className="text-gray-600">
                      「{activity.habit_name}」を達成しました！
                    </Text>
                    <HStack className="mt-1" space="sm">
                      <Text className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(activity.created_at), {
                          addSuffix: true,
                          locale: ja,
                        })}
                      </Text>
                      <Text className="text-sm text-gray-500">
                        🔥 {activity.streak}日連続
                      </Text>
                    </HStack>
                  </VStack>
                </HStack>
              </Box>
            ))}
          </VStack>
        </Box>
      </ScrollView>
    </Box>
  );
}
