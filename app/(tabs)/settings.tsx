import { Text, View } from 'react-native';
import Auth from '@/components/Auth';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { VStack } from '@/components/ui/vstack';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { LogOut, User } from 'lucide-react-native';
import { Divider } from '@/components/ui/divider';
import { Box } from '@/components/ui/box';

export default function Index() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  return (
    <View className="h-full p-4">
      {session && session.user ? (
        <VStack space="lg">
          {/* ユーザープロフィールセクション */}
          <VStack space="sm" className="items-center p-4">
            <Box className="w-16 h-16 rounded-full bg-gray-200 items-center justify-center">
              <Icon as={User} size="xl" />
            </Box>
            <Text className="text-lg font-semibold">{session.user.email}</Text>
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
