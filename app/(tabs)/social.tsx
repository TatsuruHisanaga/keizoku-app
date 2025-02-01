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

interface PublicHabit {
  id: string;
  name: string;
  streak: number;
  completed_dates: string[];
  profiles: {
    id: string;
    username: string;
    avatar_url: string;
  };
}

export default function Social() {
  const [publicHabits, setPublicHabits] = useState<PublicHabit[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPublicHabits = async () => {
    try {
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
        .order('updated_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPublicHabits(data || []);
    } catch (error) {
      console.error('Error fetching public habits:', error);
    }
  };

  useEffect(() => {
    fetchPublicHabits();
  }, []);

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
          <Text className="text-xl font-bold mb-4">みんなの習慣</Text>
          <VStack space="md">
            {publicHabits.map((habit) => (
              <Box key={habit.id} className="p-4 bg-white rounded-lg shadow-sm">
                <HStack space="md" className="items-center">
                  <Avatar size="md">
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
                  <VStack className="flex-1">
                    <Text className="font-semibold">
                      {habit.profiles?.username}
                    </Text>
                    <Text className="text-gray-600">
                      「{habit.name}」を継続中
                    </Text>
                    <HStack className="mt-1" space="sm">
                      <Text className="text-sm text-gray-500">
                        {habit.completed_dates?.length || 0}日達成
                      </Text>
                      <Text className="text-sm text-gray-500">
                        🔥 {habit.streak}日連続
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
