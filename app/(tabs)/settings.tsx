import {
  Text,
  View,
  TextInput,
  Image,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import Auth from '@/components/Auth';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { VStack } from '@/components/ui/vstack';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { LogOut } from 'lucide-react-native';
import { Divider } from '@/components/ui/divider';
import * as ImagePicker from 'expo-image-picker';

export default function Index() {
  const [session, setSession] = useState<Session | null>(null);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [uploading, setUploading] = useState(false);

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
    // usernameが条件を満たしているかチェック（例: 最低3文字以上）
    if (username.trim().length < 3) {
      console.error('Username must be at least 3 characters long.');
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

  return (
    <View className="h-full p-4">
      {session && session.user ? (
        <VStack space="lg">
          {/* ユーザープロフィールセクション with inline editing */}
          <VStack space="sm" className="items-center p-4">
            {avatar ? (
              <Pressable onPress={pickImage}>
                <Image
                  source={{ uri: avatar }}
                  style={{ width: 80, height: 80, borderRadius: 40 }}
                />
              </Pressable>
            ) : (
              <Pressable onPress={pickImage}>
                <View className="w-16 h-16 rounded-full bg-gray-200 items-center justify-center">
                  <Text>画像を選択</Text>
                </View>
              </Pressable>
            )}
            <Text className="text-lg font-semibold">{session.user.email}</Text>
            <TextInput
              placeholder="ユーザー名"
              value={username}
              onChangeText={setUsername}
              style={{
                borderWidth: 1,
                borderColor: '#ccc',
                padding: 8,
                marginVertical: 8,
                width: '100%',
              }}
            />
            <TextInput
              placeholder="自己紹介"
              value={bio}
              onChangeText={setBio}
              multiline
              style={{
                borderWidth: 1,
                borderColor: '#ccc',
                padding: 8,
                marginVertical: 8,
                height: 80,
                width: '100%',
                textAlignVertical: 'top',
              }}
            />
            {uploading ? (
              <ActivityIndicator />
            ) : (
              <Button variant="solid" onPress={handleSave}>
                <ButtonText>保存する</ButtonText>
              </Button>
            )}
          </VStack>

          <Divider />

          {/* アカウント設定セクション */}
          <VStack space="sm">
            <Text className="text-lg font-semibold">アカウント設定</Text>
            <Button
              variant="outline"
              className="w-full"
              onPress={() => supabase.auth.signOut()}
            >
              <ButtonText>ログアウト</ButtonText>
              <ButtonIcon as={LogOut} />
            </Button>
          </VStack>

          {/* アプリ設定セクション */}
          <VStack space="sm">
            <Text className="text-lg font-semibold">アプリ設定</Text>
            {/* ここに通知設定などのオプションを追加できます */}
          </VStack>
        </VStack>
      ) : (
        <Auth />
      )}
    </View>
  );
}
