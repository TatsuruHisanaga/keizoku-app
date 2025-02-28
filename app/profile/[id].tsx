import { useEffect, useState, useCallback } from 'react';
import { ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
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
import { ProfileInfo } from '@/components/ProfileInfo';

interface Profile {
  id: string;
  username: string;
  bio: string;
  avatar_url: string;
  user_identifier?: string;
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
  const { session } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const fetchProfile = useCallback(async () => {
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
  }, [id]);

  const fetchHabits = useCallback(async () => {
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
  }, [id]);

  const fetchFollowStatus = useCallback(async () => {
    if (!session?.user) return;
    if (session.user.id === id) return;
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', session.user.id)
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
  }, [id, session]);

  const fetchFollowCounts = useCallback(async () => {
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
  }, [id]);

  useEffect(() => {
    fetchProfile();
    fetchHabits();
    fetchFollowStatus();
    fetchFollowCounts();
    setLoading(false);
  }, [
    id,
    session,
    fetchProfile,
    fetchHabits,
    fetchFollowStatus,
    fetchFollowCounts,
  ]);

  const handleFollowToggle = async () => {
    if (!session?.user) return;
    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', session.user.id)
          .eq('followed_id', id);
        if (error) {
          console.error('Error unfollowing:', error);
        } else {
          setIsFollowing(false);
        }
      } else {
        const { error } = await supabase.from('follows').insert({
          follower_id: session.user.id,
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

            <ProfileInfo
              username={profile.username}
              userIdentifier={profile.user_identifier || ''}
              followersCount={followersCount}
              followingCount={followingCount}
              session={session}
              profileId={id as string}
            />

            {session?.user && session.user.id !== id && (
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
