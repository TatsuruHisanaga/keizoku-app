// utils/notifications.ts
import * as Notifications from 'expo-notifications';
import { supabase } from '@/lib/supabase';

export async function saveNotificationToDb(
  recipientId: string,
  senderId: string | null,
  type: 'follow' | 'like' | 'reminder',
  message: string,
  payload: Record<string, any> = {},
) {
  const { error } = await supabase.from('notifications').insert({
    recipient_id: recipientId,
    sender_id: senderId,
    type,
    message,
    payload,
    is_read: false,
  });

  if (error) {
    console.error('Error saving notification:', error);
    throw error;
  }
}

export async function triggerNotification(
  recipientId: string,
  expoPushToken: string,
  type: 'follow' | 'like' | 'reminder',
  data: Record<string, any>,
) {
  let title = 'Keizoku';
  let body = '';

  switch (type) {
    case 'follow':
      // data.senderName を渡す前提
      body = `${data.senderName}さんがあなたをフォローしました！`;
      break;
    case 'like':
      body = `${data.senderName}さんがあなたの習慣にいいねしました！`;
      // オプションで、data.habitName などを付加する
      if (data.habitName) {
        body += ` [${data.habitName}]`;
      }
      break;
    case 'reminder':
      body = '今日取り組んだ習慣をタップで記録しましょう！';
      break;
  }

  // Save to Supabase
  await saveNotificationToDb(
    recipientId,
    data.senderId || null,
    type,
    body,
    data,
  );

  // Send push notification
  const message = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data: { type, ...data },
  };

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
}
