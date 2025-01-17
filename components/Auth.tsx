import React, { useState } from 'react';
import { Alert } from 'react-native';
import { Button, ButtonText } from '@/components/ui/button';
import { Input, InputField, InputSlot, InputIcon } from '@/components/ui/input';
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from '@/components/ui/form-control';
import { VStack } from '@/components/ui/vstack';
import { supabase } from '../lib/supabase';
import { EyeIcon, EyeOffIcon } from '@/components/ui/icon';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Center } from './ui/center';

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

  const [showPassword, setShowPassword] = React.useState(false);
  const handleState = () => {
    setShowPassword((showState) => {
      return !showState;
    });
  };

  return (
    <VStack className="w-full rounded-md p-4">
      <Heading className="mb-2">ログイン</Heading>
      <FormControl className="mb-2">
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
        <Input className="mb-4">
          <InputField
            type={showPassword ? 'text' : 'password'}
            placeholder="パスワードを入力"
            value={password}
            onChangeText={(text) => setPassword(text)}
          />
          <InputSlot className="pr-3" onPress={handleState}>
            <InputIcon as={showPassword ? EyeIcon : EyeOffIcon} />
          </InputSlot>
        </Input>
      </FormControl>
      <Button
        className="mb-2"
        size="sm"
        onPress={() => signInWithEmail()}
        disabled={loading}
      >
        <ButtonText>ログイン</ButtonText>
      </Button>
      <Center>
        <Text>or</Text>
      </Center>
      <Button
        className="mt-2"
        size="sm"
        onPress={() => signUpWithEmail()}
        variant="outline"
        disabled={loading}
      >
        <ButtonText>新規登録</ButtonText>
      </Button>
    </VStack>
  );
}
