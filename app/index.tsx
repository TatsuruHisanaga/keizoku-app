import Auth from '@/components/Auth';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { VStack } from '@/components/ui/vstack';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { AddIcon } from '@/components/ui/icon';
import DashBoard from '../components/DashBoard';
import AchievementModal from '../components/AchievementModal';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { View } from 'react-native';

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
    <View className="justify-center items-center h-full">
      {session && session.user ? (
        <VStack>
          <Text>Welcome {session.user.email}</Text>
          <Button onPress={() => supabase.auth.signOut()}>
            <ButtonText>Sign Out</ButtonText>
            <ButtonIcon>
              <AddIcon />
            </ButtonIcon>
          </Button>
          <DashBoard />
          {/* <AchievementModal isOpen={true} onClose={function (): void {
            throw new Error('Function not implemented.');
          } } streak={0} habitName={''} /> */}
        </VStack>
      ) : (
        <Auth />
      )}
    </View>
  );
}
