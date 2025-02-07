// utils/reminder.ts
import * as Notifications from 'expo-notifications';

export async function scheduleReminder(triggerDate: Date) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Keizoku',
      body: '今日取り組んだ習慣をタップで記録しましょう！',
      data: { type: 'reminder' },
      sound: 'default',
    },
    trigger: null,
  });
}
