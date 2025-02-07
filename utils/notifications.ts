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
    case 'follow': {
      // Retrieve sender's username from the profiles table using senderId
      let username = data.senderName;
      if (data.senderId) {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', data.senderId)
          .single();
        if (error) {
          console.error("Error fetching sender's username:", error);
        } else if (profileData) {
          username = profileData.username;
        }
      }
      body = `${username}さんがあなたをフォローしました！`;
      break;
    }
    case 'like': {
      let username = data.senderName;
      if (data.senderId) {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', data.senderId)
          .single();
        if (error) {
          console.error("Error fetching sender's username:", error);
        } else if (profileData) {
          username = profileData.username;
        }
      }
      body = `${username}さんがあなたの習慣にいいねしました！`;
      if (data.habitName) {
        body += ` [${data.habitName}]`;
      }
      break;
    }
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

  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
  const resData = await res.json();
  console.log('Push notification response:', resData);
}

// -------------------------------------------
// New function to update the push token in the database
export async function updatePushToken() {
  try {
    // Get the push token from the device
    const token = await Notifications.getExpoPushTokenAsync();
    if (!token) return;

    // Retrieve the currently authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('User not found.');
      return;
    }

    // Update the push token for the user in the profiles table
    const { error } = await supabase
      .from('profiles')
      .update({ push_token: token })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating push token:', error);
    } else {
      console.log('Push token updated successfully.');
    }
  } catch (error) {
    console.error('Unexpected error updating push token:', error);
  }
}
