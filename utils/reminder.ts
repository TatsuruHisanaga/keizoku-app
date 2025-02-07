// utils/reminder.ts
import * as Notifications from 'expo-notifications';
import { supabase } from '../lib/supabase';

export async function scheduleReminder(triggerDate: Date) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Keizoku',
      body: '今日取り組んだ習慣をタップで記録しましょう！',
      data: {
        type: 'reminder',
        recipientId: (await supabase.auth.getUser()).data.user?.id,
      },
      sound: 'default',
    },
    trigger: null, //TODO 時間を指定して通知を送る
  });
}
