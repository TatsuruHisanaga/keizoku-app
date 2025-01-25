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
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';
import { EyeIcon, EyeOffIcon } from '@/components/ui/icon';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Center } from './ui/center';
import { Image } from '@/components/ui/image';

const redirectTo = makeRedirectUri();
console.log({ redirectTo });

const createSessionFromUrl = async (url: string) => {
  const { params, errorCode } = QueryParams.getQueryParams(url);

  if (errorCode) throw new Error(errorCode);
  const { access_token, refresh_token } = params;

  if (!access_token) return;

  const { data, error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });
  if (error) throw error;
  return data.session;
};

const performOAuth = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });
  if (error) throw error;

  const res = await WebBrowser.openAuthSessionAsync(
    data?.url ?? '',
    redirectTo
  );

  if (res.type === 'success') {
    const { url } = res;
    await createSessionFromUrl(url);
  }
};

const sendMagicLink = async () => {
  const { error } = await supabase.auth.signInWithOtp({
    email: 'valid.email@supabase.io',
    options: {
      emailRedirectTo: redirectTo,
    },
  });

  if (error) throw error;
  // Email sent.
};

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle linking into app from email app.
  const url = Linking.useURL();
  if (url) createSessionFromUrl(url);
  console.log({ url });

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    performOAuth;
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
    sendMagicLink;
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
      <Center className="mb-8">
        <Image
          source={require('../assets/images/icon.png')}
          alt="Keizoku Logo"
          style={{ width: 80, height: 80 }}
          className="mb-4"
        />
        <Heading size="xl" className="mb-2">
          ようこそ
        </Heading>
      </Center>

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
