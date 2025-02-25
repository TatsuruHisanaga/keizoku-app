import { Home, UserRoundCog, Flame, Bell } from 'lucide-react-native';
import { Tabs } from 'expo-router';
import { Icon } from '@/components/ui/icon';
import { useAuth } from '@/lib/AuthContext';
import Auth from '@/components/Auth';
import { View } from 'react-native';

export default function TabLayout() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return <View style={{ flex: 1 }}></View>;
  }

  if (!session) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Auth />
      </View>
    );
  }

  return (
    <Tabs screenOptions={{ animation: 'shift' }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'ホーム',
          tabBarActiveTintColor: 'green',
          tabBarIcon: ({ color }) => <Icon as={Home} size="lg" color={color} />,
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: 'みんな',
          tabBarActiveTintColor: 'red',
          tabBarIcon: ({ color }) => (
            <Icon as={Flame} size="lg" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: '通知',
          tabBarActiveTintColor: 'orange',
          tabBarIcon: ({ color }) => <Icon as={Bell} size="lg" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '設定',
          tabBarActiveTintColor: 'black',
          tabBarIcon: ({ color }) => (
            <Icon as={UserRoundCog} size="lg" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
