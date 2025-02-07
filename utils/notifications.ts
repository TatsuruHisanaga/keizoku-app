// utils/notifications.ts
import * as Notifications from 'expo-notifications';

export async function triggerNotification(
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
