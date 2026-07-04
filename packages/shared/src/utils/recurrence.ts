// src/utils/recurrence.ts

import { formatDateLocal, adjustWeekendDate } from './dateUtils';
import type { RecurringTransaction } from '../types/common';

/**
 * dateOfYear の形式を判定してパースする。
 * "YYYY-MM-DD"（date input の値）なら [1],[2] を月/日として使用し、
 * "MM-DD" ならそのまま [0],[1] を月/日として使用する。
 */
function parseDateOfYear(dateOfYear: string): { month: number; day: number } | undefined {
  const isoMatch = /^\d{4}-\d{2}-\d{2}$/.test(dateOfYear);
  const shortMatch = /^\d{2}-\d{2}$/.test(dateOfYear);

  if (isoMatch) {
    const parts = dateOfYear.split('-').map(Number);
    return { month: parts[1], day: parts[2] };
  }
  if (shortMatch) {
    const parts = dateOfYear.split('-').map(Number);
    return { month: parts[0], day: parts[1] };
  }
  return undefined;
}

const WEEKDAY_FLAGS: (t: RecurringTransaction) => (boolean | undefined)[] = (t) => [
  t.sunFlgOfWeek,
  t.monFlgOfWeek,
  t.tueFlgOfWeek,
  t.wedFlgOfWeek,
  t.thuFlgOfWeek,
  t.friFlgOfWeek,
  t.satFlgOfWeek,
];

/** 指定日が定期取引の実行日かどうか（開始日・終了日の範囲チェックを含む） */
export function isExecutionDate(t: RecurringTransaction, date: Date = new Date()): boolean {
  const dateStr = formatDateLocal(date);

  if (t.startDate && dateStr < t.startDate) return false;
  if (t.endDate && dateStr > t.endDate) return false;

  switch (t.frequency) {
    case 'daily':
      return true;

    case 'weekly': {
      const dayFlags = WEEKDAY_FLAGS(t);
      const dayOfWeek = date.getDay();
      let shouldExecute = Boolean(dayFlags[dayOfWeek]);
      if (shouldExecute && t.publicHolidayExFlgOfWeek) {
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          shouldExecute = false;
        }
      }
      return shouldExecute;
    }

    case 'monthly': {
      if (!t.dateOfMonth) return false;
      const currentMonthLastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
      const targetDay = Math.min(t.dateOfMonth, currentMonthLastDay);
      const targetDate = adjustWeekendDate(
        new Date(date.getFullYear(), date.getMonth(), targetDay),
        t.holidayDivOfMonth
      );
      return formatDateLocal(targetDate) === dateStr;
    }

    case 'yearly': {
      if (!t.dateOfYear) return false;
      const parsed = parseDateOfYear(t.dateOfYear);
      if (!parsed) return false;
      const targetDate = adjustWeekendDate(
        new Date(date.getFullYear(), parsed.month - 1, parsed.day),
        t.holidayDivOfMonth
      );
      return formatDateLocal(targetDate) === dateStr;
    }

    case 'free':
    default:
      return false;
  }
}

/** 次回実行予定日（free は undefined、終了日超過も undefined） */
export function getNextExecutionDate(t: RecurringTransaction, today: Date = new Date()): Date | undefined {
  const todayStr = formatDateLocal(today);

  if (t.endDate) {
    const endDate = new Date(t.endDate);
    if (today > endDate) {
      // 終了日を過ぎている場合は次の実行日を計算しない
      return undefined;
    }
  }

  // 本日が実行日で、まだ実行されていない場合は本日を返す
  if (isExecutionDate(t, today) && t.lastExecutedDate !== todayStr) {
    return today;
  }

  let nextDate = new Date(today);

  switch (t.frequency) {
    case 'weekly': {
      const daysOfWeek = WEEKDAY_FLAGS(t);
      const todayIndex = today.getDay();
      let foundNextDay = false;

      // 今週の残り日数をチェック
      for (let i = todayIndex + 1; i < 7; i++) {
        if (daysOfWeek[i]) {
          nextDate.setDate(today.getDate() + (i - todayIndex));
          foundNextDay = true;
          break;
        }
      }

      // 今週に該当日がない場合、来週以降をチェック
      if (!foundNextDay) {
        let weekOffset = 1;
        while (!foundNextDay) {
          for (let i = 0; i < 7; i++) {
            if (daysOfWeek[i]) {
              nextDate.setDate(today.getDate() + (7 * weekOffset) - todayIndex + i);
              foundNextDay = true;
              break;
            }
          }
          weekOffset++;
          if (weekOffset > 4) break; // 無限ループ防止
        }
      }
      return nextDate;
    }

    case 'monthly': {
      nextDate = adjustWeekendDate(
        new Date(today.getFullYear(), today.getMonth(), t.dateOfMonth || 1),
        t.holidayDivOfMonth
      );
      // 今月の該当日が過ぎている場合は来月を設定
      if (nextDate < today) {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }
      return nextDate;
    }

    case 'yearly': {
      if (!t.dateOfYear) return undefined;
      const parsed = parseDateOfYear(t.dateOfYear);
      if (!parsed) return undefined;
      nextDate = adjustWeekendDate(
        new Date(today.getFullYear() + 1, parsed.month - 1, parsed.day),
        t.holidayDivOfMonth
      );
      return nextDate;
    }

    case 'free':
    case 'daily':
    default:
      return undefined;
  }
}
