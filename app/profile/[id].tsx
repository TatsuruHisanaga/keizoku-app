import { useEffect, useState } from 'react';
import { ScrollView, TouchableOpacity, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams, Link } from 'expo-router';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import {
  Avatar,
  AvatarImage,
  AvatarFallbackText,
} from '@/components/ui/avatar';
import { Button, ButtonText } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { HStack } from '@/components/ui/hstack';

interface Profile {
  id: string;
  username: string;
  bio: string;
  avatar_url: string;
  followers_count?: number;
  following_count?: number;
}

interface Habit {
  id: string;
  name: string;
  streak: number;
  achieved_at: string;
}

export default function ProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchHabits = async () => {
    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', id)
        .order('achieved_at', { ascending: false });
      if (error) {
        console.error('Error fetching habits:', error);
      } else {
        setHabits(data ?? []);
      }
    } catch (error) {
      console.error('Error fetching habits:', error);
    }
  };

  const fetchFollowStatus = async () => {
    if (!user) return;
    if (user.id === id) return;
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', user.id)
        .eq('followed_id', id)
        .maybeSingle();
      if (error) {
        console.error('Error fetching follow status:', error);
      } else {
        setIsFollowing(!!data);
      }
    } catch (error) {
      console.error('Error fetching follow status:', error);
    }
  };

  const fetchFollowCounts = async () => {
    try {
      const { count: followersCount, error: followersError } = await supabase
        .from('follows')
        .select('*', { count: 'exact' })
        .eq('followed_id', id);

      const { count: followingCount, error: followingError } = await supabase
        .from('follows')
        .select('*', { count: 'exact' })
        .eq('follower_id', id);

      if (!followersError && !followingError) {
        setFollowersCount(followersCount || 0);
        setFollowingCount(followingCount || 0);
      }
    } catch (error) {
      console.error('Error fetching follow counts:', error);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchHabits();
    fetchFollowStatus();
    fetchFollowCounts();
    setLoading(false);
  }, [id, user]);

  const handleFollowToggle = async () => {
    if (!user) return;
    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('followed_id', id);
        if (error) {
          console.error('Error unfollowing:', error);
        } else {
          setIsFollowing(false);
        }
      } else {
        const { error } = await supabase.from('follows').insert({
          follower_id: user.id,
          followed_id: id,
        });
        if (error) {
          console.error('Error following:', error);
        } else {
          setIsFollowing(true);
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  if (loading || !profile) {
    return (
      <Box className="flex-1 items-center justify-center">
        <Text>読み込み中...</Text>
      </Box>
    );
  }

  return (
    <Box className="flex-1 bg-white">
      <ScrollView>
        <Box className="p-4">
          <HStack space="lg" className="items-center w-full mb-6">
            <Pressable className="relative">
              <Avatar size="lg">
                {profile.avatar_url ? (
                  <AvatarImage source={{ uri: profile.avatar_url }} />
                ) : (
                  <AvatarFallbackText>
                    {profile.username?.[0]?.toUpperCase() || '?'}
                  </AvatarFallbackText>
                )}
              </Avatar>
            </Pressable>

            <HStack space="md">
              <Link href={`/followers/${id}`} asChild>
                <TouchableOpacity>
                  <Box className="items-center">
                    <Text className="font-bold">{followersCount}</Text>
                    <Text className="text-gray-600">フォロワー</Text>
                  </Box>
                </TouchableOpacity>
              </Link>

              <Link href={`/following/${id}`} asChild>
                <TouchableOpacity>
                  <Box className="items-center">
                    <Text className="font-bold">{followingCount}</Text>
                    <Text className="text-gray-600">フォロー中</Text>
                  </Box>
                </TouchableOpacity>
              </Link>
            </HStack>

            {user && user.id !== id && (
              <Button
                onPress={handleFollowToggle}
                variant="solid"
                className="border-gray-300"
              >
                <ButtonText>
                  {isFollowing ? 'フォロー解除' : 'フォローする'}
                </ButtonText>
              </Button>
            )}
          </HStack>

          <Box className="items-start">
            <Text className="text-xl font-bold">{profile.username}</Text>
            <Text className="mt-1">
              {profile.bio || '自己紹介がありません'}
            </Text>
          </Box>
          <Box className="mt-6">
            <Text className="text-lg font-bold mb-2">タイムライン</Text>
            {habits.length === 0 ? (
              <Text>投稿がありません</Text>
            ) : (
              habits.map((habit) => (
                <Box
                  key={habit.id}
                  className="p-4 bg-gray-50 rounded-lg mb-2 border border-gray-200"
                >
                  <Text className="font-bold">{habit.name}</Text>
                  <Text className="text-sm text-gray-500">
                    {new Date(habit.achieved_at).toLocaleString('ja-JP', {
                      timeZone: 'Asia/Tokyo',
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </Text>
                </Box>
              ))
            )}
          </Box>
        </Box>
      </ScrollView>
    </Box>
  );
}

// Expo Router の screenOptions などで「右から左にスライドするアニメーション」などの設定も可能です
