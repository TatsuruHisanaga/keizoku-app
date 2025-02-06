import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import {
  Avatar,
  AvatarImage,
  AvatarFallbackText,
} from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { TouchableOpacity } from 'react-native';
import { useAuth } from '@/hooks/useAuth';

interface Following {
  profiles: {
    id: string;
    username: string;
    avatar_url: string;
  };
  is_following?: boolean;
}

export default function FollowingScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [following, setFollowing] = useState<Following[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFollowing = async () => {
    if (!user) return;
    try {
      const { data: followingData, error: followingError } = await supabase
        .from('follows')
        .select(
          `
          followed_id,
          profiles!follows_followed_id_fkey (
            id,
            username,
            avatar_url
          )
        `,
        )
        .eq('follower_id', id);

      if (followingError) {
        console.error('Error fetching following:', followingError);
        return;
      }

      // 現在のユーザーのフォロー状態を取得
      const { data: currentFollowing, error: currentFollowingError } =
        await supabase
          .from('follows')
          .select('followed_id')
          .eq('follower_id', user.id);

      if (currentFollowingError) {
        console.error(
          'Error fetching current following status:',
          currentFollowingError,
        );
        return;
      }

      const followingSet = new Set(currentFollowing.map((f) => f.followed_id));
      const processedFollowing = followingData.map((follow) => {
        // profiles が配列なら最初の要素を取得
        const profile = Array.isArray(follow.profiles)
          ? follow.profiles[0]
          : follow.profiles;
        return {
          ...follow,
          profiles: profile, // 単一のオブジェクトに変換
          is_following: followingSet.has(profile.id),
        };
      });

      setFollowing(processedFollowing);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowing();
  }, [id, user]);

  const handleFollowToggle = async (followingId: string) => {
    if (!user) return;
    try {
      const followingUser = following.find(
        (f) => f.profiles.id === followingId,
      );
      if (!followingUser) return;

      if (followingUser.is_following) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('followed_id', followingId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('follows').insert({
          follower_id: user.id,
          followed_id: followingId,
        });

        if (error) throw error;
      }

      setFollowing((prev) =>
        prev.map((f) =>
          f.profiles.id === followingId
            ? { ...f, is_following: !f.is_following }
            : f,
        ),
      );
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  return (
    <Box className="flex-1 bg-white">
      <Box className="p-4 flex-row items-center justify-between border-b border-gray-200">
        <Button onPress={() => router.back()}>
          <ButtonText>戻る</ButtonText>
        </Button>
        <Text className="font-bold text-lg">フォロー中</Text>
        <Box className="w-[60px]" />
      </Box>

      <ScrollView>
        <VStack space="sm" className="p-4">
          {following.map((follow) => (
            <Box
              key={follow.profiles.id}
              className="flex-row items-center justify-between p-2"
            >
              <TouchableOpacity
                onPress={() => router.push(`/profile/${follow.profiles.id}`)}
                className="flex-1"
              >
                <HStack space="sm" className="items-center">
                  <Avatar size="md">
                    {follow.profiles.avatar_url ? (
                      <AvatarImage
                        source={{ uri: follow.profiles.avatar_url }}
                      />
                    ) : (
                      <AvatarFallbackText>
                        {follow.profiles.username?.[0]?.toUpperCase() || '?'}
                      </AvatarFallbackText>
                    )}
                  </Avatar>
                  <Text className="flex-1">{follow.profiles.username}</Text>
                </HStack>
              </TouchableOpacity>

              {user && user.id !== follow.profiles.id && (
                <Button
                  variant="solid"
                  size="sm"
                  onPress={() => handleFollowToggle(follow.profiles.id)}
                  className={follow.is_following ? 'border-gray-300' : ''}
                >
                  <ButtonText>
                    {follow.is_following ? 'フォロー解除' : 'フォロー'}
                  </ButtonText>
                </Button>
              )}
            </Box>
          ))}
          {following.length === 0 && !loading && (
            <Text className="text-center text-gray-500 mt-4">
              フォロー中のユーザーはいません
            </Text>
          )}
        </VStack>
      </ScrollView>
    </Box>
  );
}
