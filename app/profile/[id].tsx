import { useEffect, useState } from 'react';
import { ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
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

interface Profile {
  id: string;
  username: string;
  bio: string;
  avatar_url: string;
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

  useEffect(() => {
    fetchProfile();
    fetchHabits();
    fetchFollowStatus();
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
      <Box className="p-4 flex-row items-center">
        <Button onPress={() => router.back()}>
          <ButtonText>戻る</ButtonText>
        </Button>
      </Box>
      <ScrollView>
        <Box className="p-4">
          <Box className="items-center">
            <Avatar size="xl">
              {profile.avatar_url ? (
                <AvatarImage source={{ uri: profile.avatar_url }} />
              ) : (
                <AvatarFallbackText>
                  {profile.username?.[0]?.toUpperCase() || '?'}
                </AvatarFallbackText>
              )}
            </Avatar>
            <Text className="mt-2 text-xl font-bold">{profile.username}</Text>
            <Text className="mt-1 text-gray-600">
              {profile.bio || '自己紹介がありません'}
            </Text>
            {user && user.id !== id && (
              <Button onPress={handleFollowToggle} className="mt-4">
                <ButtonText>
                  {isFollowing ? 'フォロー解除' : 'フォローする'}
                </ButtonText>
              </Button>
            )}
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
                      hour: '2-digit',
                      minute: '2-digit',
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
