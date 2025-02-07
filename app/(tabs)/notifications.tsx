// app/(tabs)/notifications.tsx
import { useState, useEffect, useRef } from 'react';
import {
  Text,
  View,
  Button,
  Platform,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { scheduleReminder } from '@/utils/reminder';
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
  // 通知オブジェクトに read プロパティを付加して管理
  const [notificationsList, setNotificationsList] = useState<
    {
      id: string;
      notification: Notifications.Notification;
      read: boolean;
    }[]
  >([]);
  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    registerForPushNotificationsAsync()
      .then((token) => setExpoPushToken(token ?? ''))
      .catch((error: any) => console.error(error));

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        // 通知IDを適宜生成または notification.request.identifier を利用
        setNotificationsList((prev) => [
          { id: String(Date.now()), notification, read: false },
          ...prev,
        ]);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(response);
        // タップした際に、対象の通知を既読にする処理などを入れることも可能
      });

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

  // 通知タップ時の既読マーク処理（例として index で更新）
  const markAsRead = (index: number) => {
    setNotificationsList((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, read: true } : item)),
    );
  };

  const renderItem = ({
    item,
    index,
  }: {
    item: {
      id: string;
      notification: Notifications.Notification;
      read: boolean;
    };
    index: number;
  }) => (
    <TouchableOpacity onPress={() => markAsRead(index)}>
      <View
        style={{
          padding: 10,
          backgroundColor: item.read ? '#fff' : '#e6f7ff',
          borderBottomWidth: 1,
          borderColor: '#ddd',
        }}
      >
        <Text style={{ fontWeight: 'bold' }}>
          {item.notification.request.content.title}
        </Text>
        <Text>{item.notification.request.content.body}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text>Your Expo push token: {expoPushToken}</Text>
      <FlatList
        data={notificationsList}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />
      {/* デバッグ用に送信ボタン */}
      <Button
        title="Send Test Reminder"
        onPress={async () => {
          // テスト用リマインド（すぐに実行する場合）
          await scheduleReminder(new Date(Date.now() + 1000));
        }}
      />
    </View>
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
