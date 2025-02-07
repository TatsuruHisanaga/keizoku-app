// app/(tabs)/notifications.tsx
import { useState, useEffect, useRef } from 'react';
import { Platform, FlatList, RefreshControl } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { scheduleReminder } from '@/utils/reminder';
import { supabase } from '@/lib/supabase';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from 'react-native';
import { Button, ButtonText } from '@/components/ui/button';
import { Badge, BadgeText } from '@/components/ui/badge';
// 既存の通知ハンドラ設定はそのまま再利用
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function NotificationsScreen() {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notifications, setNotifications] = useState<
    {
      id: string;
      type: string;
      message: string;
      created_at: string;
      is_read: boolean;
      sender_id: string | null;
      recipient_id: string;
    }[]
  >([]);
  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    registerForPushNotificationsAsync()
      .then((token) => setExpoPushToken(token ?? ''))
      .catch((error: any) => console.error(error));

    notificationListener.current =
      Notifications.addNotificationReceivedListener(async (notification) => {
        const newNotification = {
          id: notification.request.identifier,
          type: notification.request.content.data?.type as string,
          message: notification.request.content.body ?? '',
          created_at: new Date().toISOString(),
          is_read: false,
          sender_id: notification.request.content.data?.senderId as
            | string
            | null,
          recipient_id: notification.request.content.data
            ?.recipientId as string,
        };

        // Save to Supabase
        const { error } = await supabase
          .from('notifications')
          .insert(newNotification);

        if (error) {
          console.error('Error saving notification to Supabase:', error);
          return;
        }

        // Update local state
        setNotifications((prev) => [newNotification, ...prev]);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(response);
        // タップした際に、対象の通知を既読にする処理などを入れることも可能
      });

    fetchNotifications();

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current,
        );
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  async function fetchNotifications() {
    setRefreshing(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setRefreshing(false);
      return;
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
    } else if (data) {
      setNotifications(data);
    }
    setRefreshing(false);
  }

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (error) {
      console.error('Error marking notification as read:', error);
      return;
    }

    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id
          ? { ...notification, is_read: true }
          : notification,
      ),
    );
  };

  // 追加: 全通知をクリアする関数
  const clearNotifications = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('recipient_id', user.id);

    if (error) {
      console.error('Error clearing notifications:', error);
      return;
    }

    setNotifications([]);
  };

  const renderItem = ({ item }: { item: (typeof notifications)[0] }) => (
    <Pressable onPress={() => markAsRead(item.id)}>
      <Box
        className={`p-4 rounded-lg border mb-3 ${
          item.is_read
            ? 'bg-white border-gray-100'
            : 'bg-teal-50 border-teal-100'
        }`}
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.03,
          shadowRadius: 2,
          elevation: 1,
        }}
      >
        <VStack className="space-y-2">
          <HStack className="justify-between items-center">
            <Text
              numberOfLines={2}
              ellipsizeMode="tail"
              className={`flex-1 ${
                item.is_read ? 'text-gray-700' : 'text-gray-900 font-bold'
              }`}
            >
              {item.message}
            </Text>
            {!item.is_read && (
              <Badge style={{ flexShrink: 0 }} className="bg-teal-100 ml-2">
                <BadgeText className="text-teal-600 font-bold">NEW</BadgeText>
              </Badge>
            )}
          </HStack>
          <Text className="text-xs text-gray-500">
            {new Date(item.created_at).toLocaleString('ja-JP')}
          </Text>
        </VStack>
      </Box>
    </Pressable>
  );

  return (
    <Box className="flex-1 bg-white">
      <VStack className="flex-1">
        {notifications.length > 0 ? (
          <>
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={fetchNotifications}
                />
              }
            />
            <Box className="absolute bottom-4 left-4 right-4 space-y-2">
              <Button
                className="h-12"
                onPress={async () => {
                  await scheduleReminder(new Date(Date.now() + 1000));
                }}
              >
                <ButtonText className="text-white font-bold">
                  テスト通知を送信
                </ButtonText>
              </Button>
              <Button
                className="bg-red-500 h-12 mt-2"
                onPress={clearNotifications}
              >
                <ButtonText className="text-white font-bold">
                  通知を全てクリア
                </ButtonText>
              </Button>
            </Box>
          </>
        ) : (
          <VStack space="md" className="items-center justify-center flex-1 p-4">
            <Text size="lg" className="text-center text-gray-600 font-bold">
              通知はありません
            </Text>
            <Text size="md" className="text-center text-gray-500 mb-4">
              新しい通知が届くとここに表示されます
            </Text>
            <Button
              className="bg-blue-500 h-12 w-full"
              onPress={async () => {
                await scheduleReminder(new Date(Date.now() + 1000));
              }}
            >
              <ButtonText className="text-white font-bold">
                テスト通知を送信
              </ButtonText>
            </Button>
          </VStack>
        )}
      </VStack>
    </Box>
  );
}

async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Permission not granted to get push token for push notification!');
      throw new Error('Push notification permission not granted');
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;
    if (!projectId) {
      alert('Project ID not found');
      throw new Error('Project ID not found');
    }
    try {
      const pushTokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      return pushTokenData.data;
    } catch (e: unknown) {
      alert(`Push token error: ${e}`);
      throw new Error(String(e));
    }
  } else {
    alert('Must use physical device for push notifications');
    throw new Error('Must use physical device for push notifications');
  }
}
