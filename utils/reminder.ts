// utils/reminder.ts
import * as Notifications from 'expo-notifications';
import { supabase } from '../lib/supabase';

export async function scheduleReminder(triggerDate: Date) {
  // 現在時刻との差分を秒で計算
  const seconds = Math.floor((triggerDate.getTime() - Date.now()) / 1000);
  if (seconds <= 0) return; // 過去の場合は設定しない

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
    // @ts-ignore - 型エラーがあるが、実行時には問題なく動作する
    trigger: { seconds },
  });
}

// 未完了の習慣がある場合に20:00に通知を送る
export async function scheduleHabitReminderAt8PM() {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) return;

  // Cancel any existing 8PM reminders first
  await cancelHabitReminder();

  // Calculate today's date in the local timezone (YYYY-MM-DD format)
  const today = new Date().toISOString().split('T')[0];

  // Set the notification time to 8:00 PM today
  const reminderTime = new Date();
  reminderTime.setHours(20, 0, 0, 0); // 20:00:00

  // If it's already past 8PM, don't schedule for today
  if (new Date() > reminderTime) {
    return;
  }

  // 20:00までの秒数を計算
  const seconds = Math.floor((reminderTime.getTime() - Date.now()) / 1000);
  if (seconds <= 0) return; // 既に20:00を過ぎている場合は設定しない

  // Schedule the notification for 8:00 PM
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Keizoku',
      body: '記録の時間です',
      data: {
        type: 'daily_reminder',
        date: today,
        recipientId: userId,
      },
      sound: 'default',
    },
    // @ts-ignore - 型エラーがあるが、実行時には問題なく動作する
    trigger: { seconds },
  });
}

// 通知をキャンセルする
export async function cancelHabitReminder() {
  const scheduledNotifications =
    await Notifications.getAllScheduledNotificationsAsync();

  for (const notification of scheduledNotifications) {
    if (notification.content.data?.type === 'daily_reminder') {
      await Notifications.cancelScheduledNotificationAsync(
        notification.identifier,
      );
    }
  }
}

// 今日の未完了習慣の数を取得する
export async function getUncompletedHabitsCount() {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) return 0;

  // 今日の日付をYYYY-MM-DD形式で取得
  const today = new Date().toISOString().split('T')[0];

  // すべての習慣を取得
  const { data: habits, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching habits:', error);
    return 0;
  }

  if (!habits || habits.length === 0) {
    return 0; // 習慣がない場合は0を返す
  }

  // 今日完了していない習慣の数をカウント
  const uncompletedCount = habits.filter((habit) => {
    const completedDates = habit.completed_dates || [];
    return !completedDates.includes(today);
  }).length;

  return uncompletedCount;
}

// アプリ起動時に呼び出す、習慣の完了状態をチェックして通知をスケジュールする
export async function setupDailyHabitReminder() {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) return;

  // 未完了の習慣の数を取得
  const uncompletedCount = await getUncompletedHabitsCount();

  // 未完了の習慣がある場合のみ通知をスケジュール
  if (uncompletedCount > 0) {
    await scheduleHabitReminderAt8PM();
  } else {
    // 未完了の習慣がない場合は、既存の通知をキャンセル
    await cancelHabitReminder();
  }
}

// 習慣の完了状態が変更されたときに呼び出し、リマインダーを更新する
export async function updateReminderAfterHabitToggle() {
  // 未完了の習慣の数を取得
  const uncompletedCount = await getUncompletedHabitsCount();

  // 時間をチェック
  const now = new Date();
  const isPast8PM = now.getHours() >= 20;

  if (uncompletedCount === 0) {
    // すべての習慣が完了した場合は通知をキャンセル
    await cancelHabitReminder();
  } else if (!isPast8PM) {
    // まだ20:00前で、未完了の習慣がある場合は通知をスケジュール
    await scheduleHabitReminderAt8PM();
  }
}
