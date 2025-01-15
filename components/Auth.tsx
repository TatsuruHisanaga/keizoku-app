import React, { useState } from 'react';
import { Alert, View, AppState } from 'react-native';
import { Button, ButtonText } from '@/components/ui/button';
import { Input, InputField } from '@/components/ui/input';
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from '@/components/ui/form-control';
import { VStack } from '@/components/ui/vstack';
import { supabase } from '../lib/supabase';

AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert(error.message);
      setLoading(false);
    }
  }

  async function signUpWithEmail() {
    setLoading(true);
    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) Alert.alert(error.message);
    if (!session)
      Alert.alert('Please check your inbox for email verification!');
    setLoading(false);
  }

  return (
    <VStack className="w-full max-w-[300px] rounded-md border border-background-200 p-4 ">
      <FormControl>
        <FormControlLabel>
          <FormControlLabelText>メールアドレス</FormControlLabelText>
        </FormControlLabel>
        <Input className="mb-2">
          <InputField
            placeholder="メールアドレスを入力"
            value={email}
            onChangeText={(text) => setEmail(text)}
          />
        </Input>
      </FormControl>
      <FormControl>
        <FormControlLabel>
          <FormControlLabelText>パスワード</FormControlLabelText>
        </FormControlLabel>
        <Input className="mb-2">
          <InputField
            secureTextEntry
            placeholder="パスワードを入力"
            value={password}
            onChangeText={(text) => setPassword(text)}
          />
        </Input>
      </FormControl>
      <Button className="mb-2" size="sm" onPress={() => signInWithEmail()} disabled={loading}>
        <ButtonText>サインイン</ButtonText>
      </Button>
      <Button size="sm" onPress={() => signUpWithEmail()} disabled={loading}>
        <ButtonText>サインアップ</ButtonText>
      </Button>
    </VStack>
  );
}
