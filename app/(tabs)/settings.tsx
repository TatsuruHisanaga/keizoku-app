import {
  Avatar,
  AvatarFallbackText,
  AvatarImage,
} from '@/components/ui/avatar';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Input, InputField } from '@/components/ui/input';
import { Pressable, ActivityIndicator } from 'react-native';
import Auth from '@/components/Auth';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { VStack } from '@/components/ui/vstack';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { LogOut, SquarePen } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

export default function Index() {
  const [session, setSession] = useState<Session | null>(null);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [originalUsername, setOriginalUsername] = useState('');
  const [originalBio, setOriginalBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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
          }
        });
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
    // usernameのバリデーションチェック
    if (username.trim().length < 3) {
      console.error('ユーザー名は3文字以上で入力してください。');
      setUploading(false);
      return;
    }
    if (username.length > 16) {
      console.error('ユーザー名は16文字以内で入力してください。');
      setUploading(false);
      return;
    }
    // bioの文字数チェック
    if (bio.length > 200) {
      console.error('自己紹介は200文字以内で入力してください。');
      setUploading(false);
      return;
    }
    setUploading(true);
    let avatar_url = avatar;

    if (avatar && avatar.startsWith('file://')) {
      try {
        const response = await fetch(avatar);
        const blob = await response.blob();
        const ext = avatar.split('.').pop();
        const fileName = `${session.user.id}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, blob, { upsert: true });
        if (uploadError) {
          console.error('Avatar upload error:', uploadError);
        } else {
          const { data } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);
          avatar_url = data.publicUrl;
        }
      } catch (error) {
        console.error('Upload failed', error);
      }
    }

    // プロフィールテーブルの更新
    const { error, data } = await supabase
      .from('profiles')
      .upsert({
        id: session.user.id,
        username,
        bio,
        avatar_url,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Profile update error:', error);
    } else {
      console.log('Profile updated:', data);
      // オプション: 取得した最新の値で state を更新
      setUsername(data.username || '');
      setBio(data.bio || '');
      setAvatar(data.avatar_url || '');
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

  return (
    <Box className="h-full bg-white">
      {session && session.user ? (
        <VStack space="lg" className="p-6">
          <Text className="text-xl font-semibold">プロフィール</Text>

          <VStack space="md" className="items-center">
            <Pressable
              onPress={isEditing ? pickImage : undefined}
              className="mb-4"
            >
              <Avatar size="lg">
                <AvatarFallbackText>
                  {username?.[0]?.toUpperCase() || '?'}
                </AvatarFallbackText>
                {avatar && (
                  <AvatarImage
                    source={{
                      uri: avatar,
                    }}
                  />
                )}
              </Avatar>
            </Pressable>

            <VStack space="sm" className="w-full">
              <Text className="text-sm text-gray-600 mb-1">
                登録中のメールアドレス
              </Text>
              <Text className="text-base">{session.user.email}</Text>

              <Text className="text-sm text-gray-600 mb-1 mt-4">
                ユーザー名
              </Text>
              {isEditing ? (
                <Input className="w-full border border-gray-300 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
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

              <Text className="text-sm text-gray-600 mb-1 mt-4">自己紹介</Text>
              {isEditing ? (
                <Box className="mb-2">
                  <Input className="w-full border border-gray-300 rounded-lg mb-2 py-2 min-h-[60px] focus:outline-none focus:ring-2 focus:ring-blue-500">
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
                </Box>
              ) : (
                <Text className="text-base">
                  {bio || '自己紹介が未設定です'}
                </Text>
              )}
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
                onPress={() => supabase.auth.signOut()}
                className="w-full border-red-500"
              >
                <ButtonText className="text-red-500 text-base">
                  ログアウト
                </ButtonText>
                <ButtonIcon as={LogOut} className="text-red-500" />
              </Button>
            </VStack>
          </VStack>
        </VStack>
      ) : (
        <Auth />
      )}
    </Box>
  );
}
