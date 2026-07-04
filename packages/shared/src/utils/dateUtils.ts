// src/utils/dateUtils.ts

export type HolidayAdjustment = 'none' | 'before' | 'after';

/** ローカルタイムゾーンで YYYY-MM-DD にフォーマット（タイムゾーンずれ防止） */
export function formatDateLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 今日のローカル日付文字列 YYYY-MM-DD */
export function todayLocalString(): string {
  return formatDateLocal(new Date());
}

/**
 * 土日調整: 土曜は before=-1日/after=+2日、日曜は before=-2日/after=+1日、none は無変更。
 * 引数の Date は変更せずコピーを返す。
 */
export function adjustWeekendDate(date: Date, adj: HolidayAdjustment): Date {
  const result = new Date(date);
  if (adj === 'none') return result;

  const day = result.getDay();
  if (day === 0) {
    // 日曜日
    result.setDate(result.getDate() + (adj === 'after' ? 1 : -2));
  } else if (day === 6) {
    // 土曜日
    result.setDate(result.getDate() + (adj === 'after' ? 2 : -1));
  }
  return result;
}
