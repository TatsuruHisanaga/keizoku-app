import {
  Avatar,
  AvatarFallbackText,
  AvatarImage,
} from '@/components/ui/avatar';
import { Box } from '@/components/ui/box';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Input, InputField } from '@/components/ui/input';
import {
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
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
      aspect: [1, 1], // 正方形のクロップを強制
      quality: 0.8,
    });
    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!session) return;

    if (userIdentifier) {
      const trimmedId = userIdentifier.trim().toLowerCase();

      const userIdPattern = /^[a-z0-9_]{3,20}$/;
      if (!userIdPattern.test(trimmedId)) {
        Alert.alert(
          'エラー',
          'ユーザーIDは3~20文字の半角英小文字、数字、アンダースコアのみ使用できます',
        );
        return;
      }

      if (userIdentifier !== originalUserIdentifier) {
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_identifier', trimmedId)
          .single();

        if (existingUser) {
          Alert.alert('エラー', 'このユーザーIDは既に使用されています');
          return;
        }
      }
    }

    setUploading(true);

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: session.user.id,
        username,
        bio,
        avatar_url: avatar,
        user_identifier: userIdentifier.trim().toLowerCase(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Profile update error:', error);
    } else {
      // 保存成功後に元の値を更新
      setOriginalUsername(username);
      setOriginalBio(bio);
      setOriginalUserIdentifier(userIdentifier.trim().toLowerCase());
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <VStack space="lg" className="p-4">
              <HStack className="justify-between items-center mb-4">
                <Text className="text-xl font-semibold">プロフィール</Text>
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={handleEditStart}
                    className="border-gray-300"
                  >
                    <ButtonText className="text-gray-600">編集</ButtonText>
                    <ButtonIcon
                      as={SquarePen}
                      size="sm"
                      className="text-gray-600 ml-1"
                    />
                  </Button>
                )}
              </HStack>

              <HStack className="items-center w-full mb-2 justify-between">
                <Pressable
                  onPress={isEditing ? pickImage : undefined}
                  className="relative"
                >
                  <Avatar
                    size="lg"
                    style={{
                      opacity: isEditing ? 0.8 : 1,
                      borderWidth: isEditing ? 2 : 0,
                      borderColor: isEditing ? '#3b82f6' : 'transparent',
                    }}
                  >
                    <AvatarFallbackText>
                      {username?.[0]?.toUpperCase() || '?'}
                    </AvatarFallbackText>
                    {avatar && <AvatarImage source={{ uri: avatar }} />}
                  </Avatar>
                  {isEditing && (
                    <Box className="absolute right-0 bottom-0 bg-blue-500 rounded-full p-1.5">
                      <Icon as={SquarePen} size="xs" className="text-white" />
                    </Box>
                  )}
                </Pressable>

                <VStack className="flex-1 mx-3">
                  <Text className="text-lg font-bold">
                    {username || '未設定'}
                  </Text>
                  <Text className="text-sm text-gray-500">
                    {userIdentifier ? `@${userIdentifier}` : ''}
                  </Text>
                </VStack>

                <HStack className="items-center space-x-4">
                  <TouchableOpacity
                    onPress={() => router.push(`/followers/${session.user.id}`)}
                    className="items-center"
                  >
                    <Text className="font-bold">{followersCount}</Text>
                    <Text className="text-gray-600 text-xs">フォロワー</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => router.push(`/following/${session.user.id}`)}
                    className="items-center"
                  >
                    <Text className="font-bold">{followingCount}</Text>
                    <Text className="text-gray-600 text-xs">フォロー中</Text>
                  </TouchableOpacity>
                </HStack>
              </HStack>

              {!isEditing && bio && (
                <Text className="text-base leading-5 mb-2">{bio}</Text>
              )}

              {isEditing ? (
                <VStack space="md" className="w-full">
                  <VStack space="xs">
                    <Text className="text-sm font-medium text-gray-600">
                      ユーザー名
                    </Text>
                    <Input
                      className="w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                      size="md"
                    >
                      <InputField
                        placeholder="ユーザー名を入力"
                        value={username}
                        onChangeText={setUsername}
                        maxLength={16}
                      />
                    </Input>
                  </VStack>

                  <VStack space="xs">
                    <Text className="text-sm font-medium text-gray-600">
                      ユーザーID
                    </Text>
                    <Input
                      className="w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                      size="md"
                    >
                      <InputField
                        placeholder="ユーザーID（英小文字、数字、_のみ）"
                        value={userIdentifier}
                        onChangeText={setUserIdentifier}
                        maxLength={20}
                      />
                    </Input>
                    <Text className="text-xs text-gray-500">
                      3〜20文字の半角英小文字、数字、アンダースコア(_)が使用可能
                    </Text>
                  </VStack>

                  <VStack space="xs">
                    <Text className="text-sm font-medium text-gray-600">
                      自己紹介
                    </Text>
                    <Input
                      className="w-full border border-gray-200 rounded-lg mb-1 py-2 min-h-[80px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                      size="md"
                    >
                      <InputField
                        placeholder="自己紹介を入力（最大200文字）"
                        value={bio}
                        onChangeText={setBio}
                        multiline
                        textAlignVertical="top"
                        maxLength={200}
                        numberOfLines={3}
                      />
                    </Input>
                    <Text className="text-xs text-gray-500 text-right">
                      {bio.length}/200文字
                    </Text>
                  </VStack>
                </VStack>
              ) : (
                <VStack space="md" className="w-full">
                  <Box className="bg-white border border-gray-100 rounded-xl p-4">
                    <Text className="text-sm text-gray-500 mb-1">
                      メールアドレス
                    </Text>
                    <Text className="text-base">{session.user.email}</Text>
                  </Box>
                </VStack>
              )}

              <VStack space="sm" className="w-full mt-4">
                {isEditing ? (
                  uploading ? (
                    <Box className="items-center py-4">
                      <ActivityIndicator size="small" color="#3b82f6" />
                      <Text className="text-gray-600 mt-2 text-sm">
                        保存中...
                      </Text>
                    </Box>
                  ) : (
                    <>
                      <Button
                        variant="solid"
                        onPress={() => {
                          handleSave();
                          setIsEditing(false);
                        }}
                        className="w-full"
                        style={{ backgroundColor: '#3b82f6' }}
                      >
                        <ButtonText className="text-white font-medium">
                          保存する
                        </ButtonText>
                      </Button>

                      <Button
                        variant="outline"
                        onPress={handleCancel}
                        className="w-full border-gray-300 mt-2"
                      >
                        <ButtonText className="text-gray-600">
                          キャンセル
                        </ButtonText>
                      </Button>
                    </>
                  )
                ) : (
                  <Button
                    variant="outline"
                    onPress={handleLogout}
                    className="w-full border-red-500 mt-4"
                  >
                    <ButtonIcon as={LogOut} className="text-red-500 mr-1" />
                    <ButtonText className="text-red-500">ログアウト</ButtonText>
                  </Button>
                )}
              </VStack>
            </VStack>
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        <Auth />
      )}
    </Box>
  );
}
