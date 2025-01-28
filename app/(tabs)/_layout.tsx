import { Home, UserRoundCog } from 'lucide-react-native';
import { Tabs } from 'expo-router';
import { Icon } from '@/components/ui/icon';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: 'blue' }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'ホーム',
          tabBarIcon: ({ color }) => <Icon as={Home} size="lg" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '設定',
          tabBarIcon: ({ color }) => (
            <Icon as={UserRoundCog} size="lg" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
