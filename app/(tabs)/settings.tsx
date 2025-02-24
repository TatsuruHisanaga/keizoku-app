import {
  Avatar,
  AvatarFallbackText,
  AvatarImage,
} from '@/components/ui/avatar';
import { Box } from '@/components/ui/box';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Input, InputField } from '@/components/ui/input';
import { Pressable, ActivityIndicator, Alert } from 'react-native';
import Auth from '@/components/Auth';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { VStack } from '@/components/ui/vstack';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { LogOut, SquarePen } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { HStack } from '@/components/ui/hstack';

export default function Settings() {
  const [session, setSession] = useState<Session | null>(null);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [originalUsername, setOriginalUsername] = useState('');
  const [originalBio, setOriginalBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [followingCount, setFollowingCount] = useState<number>(0);
  const [userIdentifier, setUserIdentifier] = useState('');
  const [originalUserIdentifier, setOriginalUserIdentifier] = useState('');

  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  useEffect(() => {
    if (session?.user) {
      // プロフィールデータの取得
      supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Error fetching profile:', error);
            return;
          }
          if (data) {
            setUsername(data.username || '');
            setBio(data.bio || '');
            setOriginalUsername(data.username || '');
            setOriginalBio(data.bio || '');
            setAvatar(data.avatar_url || '');
            setUserIdentifier(data.user_identifier || '');
            setOriginalUserIdentifier(data.user_identifier || '');
          }
        });
    }
  }, [session]);

  useEffect(() => {
    if (session && session.user) {
      const fetchFollowCounts = async () => {
        try {
          const { count: fetchedFollowersCount, error: followersError } =
            await supabase
              .from('follows')
              .select('*', { count: 'exact' })
              .eq('followed_id', session.user.id);

          const { count: fetchedFollowingCount, error: followingError } =
            await supabase
              .from('follows')
              .select('*', { count: 'exact' })
              .eq('follower_id', session.user.id);

          if (!followersError && !followingError) {
            setFollowersCount(fetchedFollowersCount || 0);
            setFollowingCount(fetchedFollowingCount || 0);
          }
        } catch (error) {
          console.error('Error fetching follow counts:', error);
        }
      };

      fetchFollowCounts();
    }
  }, [session]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!session) return;

    if (userIdentifier) {
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(userIdentifier)) {
        Alert.alert(
          'エラー',
          'ユーザーIDは3~20文字の半角英数字とアンダースコアのみ使用できます',
        );
        return;
      }

      if (userIdentifier !== originalUserIdentifier) {
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_identifier', userIdentifier)
          .single();

        if (existingUser) {
          Alert.alert('エラー', 'このユーザーIDは既に使用されています');
          return;
        }
      }
    }

    setUploading(true);

    // 既存のプロフィール更新処理に user_identifier を追加
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: session.user.id,
        username,
        bio,
        avatar_url: avatar,
        user_identifier: userIdentifier,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Profile update error:', error);
    } else {
      setUsername(session.user.user_metadata.username || '');
      setBio(session.user.user_metadata.bio || '');
      setAvatar(session.user.user_metadata.avatar_url || '');
      setUserIdentifier(session.user.user_metadata.user_identifier || '');
    }

    setUploading(false);
  };

  const handleEditStart = () => {
    setOriginalUsername(username);
    setOriginalBio(bio);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setUsername(originalUsername);
    setBio(originalBio);
    setIsEditing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      '確認',
      '本当にログアウトしますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: 'ログアウト', onPress: () => supabase.auth.signOut() },
      ],
      { cancelable: true },
    );
  };

  return (
    <Box className="h-full bg-white">
      {session && session.user ? (
        <VStack space="lg" className="p-6">
          <Text className="text-xl font-semibold">プロフィール</Text>

          <VStack space="md" className="items-center w-full">
            <HStack space="lg" className="items-center w-full">
              <Pressable
                onPress={isEditing ? pickImage : undefined}
                className="relative"
              >
                <Avatar size="lg" style={{ opacity: isEditing ? 0.7 : 1 }}>
                  <AvatarFallbackText>
                    {username?.[0]?.toUpperCase() || '?'}
                  </AvatarFallbackText>
                  {avatar && <AvatarImage source={{ uri: avatar }} />}
                </Avatar>
                {isEditing && (
                  <Box className="absolute right-0 bottom-0 bg-gray-100 rounded-full p-1">
                    <Icon as={SquarePen} size="sm" className="text-gray-600" />
                  </Box>
                )}
              </Pressable>

              <HStack space="md">
                <TouchableOpacity
                  onPress={() => router.push(`/followers/${session.user.id}`)}
                >
                  <Box className="items-center">
                    <Text className="font-bold">{followersCount}</Text>
                    <Text className="text-gray-600">フォロワー</Text>
                  </Box>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push(`/following/${session.user.id}`)}
                >
                  <Box className="items-center">
                    <Text className="font-bold">{followingCount}</Text>
                    <Text className="text-gray-600">フォロー中</Text>
                  </Box>
                </TouchableOpacity>
              </HStack>
            </HStack>

            <VStack space="sm" className="w-full mt-4">
              <Text className="text-sm text-gray-600 mb-1">
                登録中のメールアドレス
              </Text>
              <Text className="text-base">{session.user.email}</Text>

              <Text className="text-sm text-gray-600 mb-1 mt-4">
                ユーザー名
              </Text>
              <Box className="mb-2 min-h-[40px]">
                {isEditing ? (
                  <Input className="w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <InputField
                      placeholder="ユーザー名を入力"
                      value={username}
                      onChangeText={setUsername}
                      maxLength={16}
                    />
                  </Input>
                ) : (
                  <Text className="text-base">{username || '未設定'}</Text>
                )}
              </Box>

              <Text className="text-sm text-gray-600 mb-1 mt-4">自己紹介</Text>
              <Box className="mb-2 min-h-[100px]">
                {isEditing ? (
                  <>
                    <Input className="w-full border border-gray-300 rounded-lg mb-1 py-2 min-h-[60px] focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <InputField
                        placeholder="自己紹介を入力"
                        value={bio}
                        onChangeText={setBio}
                        multiline
                        textAlignVertical="top"
                        maxLength={200}
                      />
                    </Input>
                    <Text className="text-sm text-gray-500 text-right">
                      {bio.length}/200文字
                    </Text>
                  </>
                ) : (
                  <Text className="text-base">
                    {bio || '自己紹介が未設定です'}
                  </Text>
                )}
              </Box>

              <Text className="text-sm text-gray-600 mb-1 mt-4">
                ユーザーID
              </Text>
              <Box className="mb-2 min-h-[40px]">
                {isEditing ? (
                  <Input className="w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <InputField
                      placeholder="ユーザーIDを入力（半角英数字とアンダースコア）"
                      value={userIdentifier}
                      onChangeText={setUserIdentifier}
                      maxLength={20}
                    />
                  </Input>
                ) : (
                  <Text className="text-base">
                    {userIdentifier ? `@${userIdentifier}` : '未設定'}
                  </Text>
                )}
              </Box>
            </VStack>
          </VStack>

          <VStack space="sm" className="w-full mt-6">
            {isEditing ? (
              uploading ? (
                <ActivityIndicator size="large" color="#0000ff" />
              ) : (
                <>
                  <Button
                    variant="solid"
                    onPress={() => {
                      handleSave();
                      setIsEditing(false);
                    }}
                    className="w-full"
                    style={{ backgroundColor: '#333333' }}
                  >
                    <ButtonText className="text-white text-base">
                      変更を保存
                    </ButtonText>
                  </Button>

                  <Button
                    variant="outline"
                    onPress={handleCancel}
                    className="w-full border-gray-300"
                  >
                    <ButtonText className="text-gray-600 text-base">
                      キャンセル
                    </ButtonText>
                  </Button>
                </>
              )
            ) : (
              <Button
                variant="outline"
                onPress={handleEditStart}
                className="w-full border-gray-300"
              >
                <ButtonText className="text-gray-600 text-base">
                  編集
                </ButtonText>
                <ButtonIcon as={SquarePen} className="text-gray-600" />
              </Button>
            )}

            <Button
              variant="outline"
              onPress={handleLogout}
              className="w-full border-red-500"
            >
              <ButtonText className="text-red-500 text-base">
                ログアウト
              </ButtonText>
              <ButtonIcon as={LogOut} className="text-red-500" />
            </Button>
          </VStack>
        </VStack>
      ) : (
        <Auth />
      )}
    </Box>
  );
}
