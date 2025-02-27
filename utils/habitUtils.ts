// 連続日数計算のヘルパー関数
export function getMaxConsecutiveDays(dates: string[]): number {
  const sorted = [...dates].sort();
  let maxStreak = 0;
  let currentStreak = 0;
  let prevDate: Date | null = null;

  for (const dateStr of sorted) {
    const dateObj = new Date(dateStr);
    if (
      prevDate &&
      dateObj.getTime() - prevDate.getTime() === 24 * 60 * 60 * 1000
    ) {
      currentStreak++;
    } else {
      currentStreak = 1;
    }
    maxStreak = Math.max(maxStreak, currentStreak);
    prevDate = dateObj;
  }

  return maxStreak;
}

// 現在の日付を含めた連続日数を計算する関数
export function getCurrentConsecutiveDays(dates: string[]): number {
  const dateSet = new Set(dates);
  let currentStreak = 0;
  let date = new Date();
  // 日付フォーマットは "YYYY-MM-DD" で比較
  while (dateSet.has(date.toISOString().split('T')[0])) {
    currentStreak++;
    date.setDate(date.getDate() - 1);
  }
  return currentStreak;
}

// 今日の日付を取得（YYYY-MM-DD形式）
export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

// 日付文字列からDateオブジェクトを作成（エラーチェック付き）
export function parseDateString(dateStr: string): Date | null {
  const dateObj = new Date(dateStr);
  return isNaN(dateObj.getTime()) ? null : dateObj;
}
