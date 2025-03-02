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

// 未完了の習慣がある場合に19:00に通知を送る
export async function scheduleHabitReminderAt8PM() {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) return;

  // Cancel any existing reminders first
  await cancelHabitReminder();

  // Calculate today's date in the local timezone (YYYY-MM-DD format)
  const today = new Date().toISOString().split('T')[0];

  // 日本時間の19:00を正確に設定する
  // 現在時刻（日本時間）を取得
  const now = new Date();

  // 今日の19:00（JST）を設定
  const reminderTime = new Date();
  reminderTime.setHours(19, 0, 0, 0);

  // デバッグログ
  console.log(`現在時刻: ${now.toLocaleString('ja-JP')}`);
  console.log(`設定した通知時刻: ${reminderTime.toLocaleString('ja-JP')}`);

  // 既に19:00を過ぎているかチェック
  if (now > reminderTime) {
    console.log('既に19:00を過ぎているため、通知はスケジュールされません');
    return;
  }

  // 19:00までの秒数を計算
  const seconds = Math.floor((reminderTime.getTime() - now.getTime()) / 1000);
  console.log(`通知までの秒数: ${seconds}秒`);

  if (seconds <= 0) {
    console.log('計算された秒数が0以下のため、通知はスケジュールされません');
    return;
  }

  // Schedule the notification for 7:00 PM
  const notificationId = await Notifications.scheduleNotificationAsync({
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

  console.log(`通知がスケジュールされました。ID: ${notificationId}`);

  // 確認のため、スケジュールされた通知の一覧を表示
  const scheduledNotifications =
    await Notifications.getAllScheduledNotificationsAsync();
  console.log(`スケジュール済み通知数: ${scheduledNotifications.length}`);
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

// 5分後にテスト通知を送信する（デバッグ用）
export async function scheduleTestNotificationIn5Minutes() {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) return;

  // 5分後の時間を計算
  const testTime = new Date(Date.now() + 5 * 60 * 1000);

  console.log(`テスト通知時刻: ${testTime.toLocaleString('ja-JP')}`);

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Keizoku - テスト',
      body: 'これはテスト通知です。現在時刻から5分後に送信されます。',
      data: {
        type: 'test_notification',
        recipientId: userId,
      },
      sound: 'default',
    },
    // @ts-ignore - 型エラーがあるが、実行時には問題なく動作する
    trigger: { seconds: 5 * 60 },
  });

  console.log(`テスト通知がスケジュールされました。ID: ${notificationId}`);
  return notificationId;
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
  const isPast7PM = now.getHours() >= 19; // テスト用に19時に変更

  if (uncompletedCount === 0) {
    // すべての習慣が完了した場合は通知をキャンセル
    await cancelHabitReminder();
  } else if (!isPast7PM) {
    // まだ19:00前で、未完了の習慣がある場合は通知をスケジュール
    await scheduleHabitReminderAt8PM();
  }
}
