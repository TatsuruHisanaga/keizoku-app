import { Stack } from 'expo-router';
import '@/global.css';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import '../global.css';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GluestackUIProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </GestureHandlerRootView>
    </GluestackUIProvider>
  );
}
