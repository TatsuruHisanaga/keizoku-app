import { Home, UserRoundCog, Flame } from 'lucide-react-native';
import { Tabs } from 'expo-router';
import { Icon } from '@/components/ui/icon';

export default function TabLayout() {
  return (
    <Tabs>
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
