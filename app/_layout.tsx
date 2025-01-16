import { Stack } from "expo-router";
import "@/global.css";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "../global.css";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';

export default function RootLayout() {
  return (
    <GluestackUIProvider>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer>
        <Drawer.Screen
          name="index"
          options={{ title: "Home" }}
        />
        <Drawer.Screen
          name="settings"
          options={{ title: "Settings" }}
        />
      </Drawer>
    </GestureHandlerRootView>
    </GluestackUIProvider>
  )
}

