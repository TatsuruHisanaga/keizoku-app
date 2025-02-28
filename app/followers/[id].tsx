import { useEffect, useState, useCallback } from 'react';
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

interface ProfileData {
  id: string;
  username: string;
  avatar_url: string;
}

interface Follower {
  follower_id: string;
  profile: ProfileData; // データ処理後の単一のプロファイル
  is_following?: boolean;
}

export default function FollowersScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { session } = useAuth();
  const user = session?.user;
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFollowers = useCallback(async () => {
    if (!user) return;
    try {
      // フォロワーを取得
      const { data: followersData, error: followersError } = await supabase
        .from('follows')
        .select(
          `
          follower_id,
          profiles!follows_follower_id_fkey (
            id,
            username,
            avatar_url
          )
        `,
        )
        .eq('followed_id', id);

      if (followersError) {
        console.error('Error fetching followers:', followersError);
        return;
      }

      // 現在のユーザーのフォロー状態を取得
      const { data: followingData, error: followingError } = await supabase
        .from('follows')
        .select('followed_id')
        .eq('follower_id', user.id);

      if (followingError) {
        console.error('Error fetching following status:', followingError);
        return;
      }

      // フォロー状態を組み合わせる
      const followingSet = new Set(followingData.map((f) => f.followed_id));
      const processedFollowers = followersData.map((follower) => {
        // profiles が配列なら最初の要素を取得
        const profileData = Array.isArray(follower.profiles)
          ? follower.profiles[0]
          : follower.profiles;

        return {
          follower_id: follower.follower_id,
          profile: profileData, // 単一のオブジェクトとして保存
          is_following: followingSet.has(follower.follower_id),
        };
      });

      setFollowers(processedFollowers);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    fetchFollowers();
  }, [fetchFollowers]);

  const handleFollowToggle = async (followerId: string) => {
    if (!user) return;
    try {
      const follower = followers.find((f) => f.follower_id === followerId);
      if (!follower) return;

      if (follower.is_following) {
        // フォロー解除
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('followed_id', followerId);

        if (error) throw error;
      } else {
        // フォロー
        const { error } = await supabase.from('follows').insert({
          follower_id: user.id,
          followed_id: followerId,
        });

        if (error) throw error;
      }

      // 状態を更新
      setFollowers((prev) =>
        prev.map((f) =>
          f.follower_id === followerId
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
        <Box className="w-[60px]" />

        <Text className="font-bold text-lg">フォロワー</Text>
        <Box className="w-[60px]" />
      </Box>

      <ScrollView>
        <VStack space="sm" className="p-4">
          {followers.map((follower) => (
            <HStack
              key={follower.follower_id}
              className="items-center justify-between p-2"
            >
              <TouchableOpacity
                onPress={() => router.push(`/profile/${follower.follower_id}`)}
                className="flex-1"
              >
                <HStack space="sm" className="items-center">
                  <Avatar size="md">
                    <AvatarFallbackText>
                      {follower.profile.username?.[0]?.toUpperCase() || '?'}
                    </AvatarFallbackText>
                    {follower.profile.avatar_url && (
                      <AvatarImage
                        source={{ uri: follower.profile.avatar_url }}
                      />
                    )}
                  </Avatar>
                  <Text className="flex-1">{follower.profile.username}</Text>
                </HStack>
              </TouchableOpacity>

              {user && user.id !== follower.follower_id && (
                <Button
                  variant={follower.is_following ? 'outline' : 'solid'}
                  size="sm"
                  onPress={() => handleFollowToggle(follower.follower_id)}
                  className={follower.is_following ? 'border-gray-300' : ''}
                >
                  <ButtonText
                    className={follower.is_following ? 'text-gray-600' : ''}
                  >
                    {follower.is_following ? 'フォロー中' : 'フォロー'}
                  </ButtonText>
                </Button>
              )}
            </HStack>
          ))}
          {followers.length === 0 && !loading && (
            <Text className="text-center text-gray-500 mt-4">
              フォロワーはいません
            </Text>
          )}
        </VStack>
      </ScrollView>
    </Box>
  );
}
