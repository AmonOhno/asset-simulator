export type PeriodPreset = "week" | "month" | "year" | "custom";
export type HolidayAdjustment = "none" | "before" | "after";

export interface PeriodRange {
  startDate: string;
  endDate: string;
}

export interface PeriodSettings {
  /** 週単位の開始曜日（0:日 〜 6:土） */
  startDayOfWeek: number;
  /** 月単位の開始日（1〜31） */
  startDayOfMonth: number;
  /** 月単位の休日（土日）ずらし */
  holidayAdjustment: HolidayAdjustment;
  /** 年単位の開始月（1〜12） */
  startMonth: number;
  /** 年単位の開始日（1〜31） */
  startMonthDay: number;
}

export const DEFAULT_PERIOD_SETTINGS: PeriodSettings = {
  startDayOfWeek: 1, // 月曜
  startDayOfMonth: 25,
  holidayAdjustment: "none",
  startMonth: 1,
  startMonthDay: 1,
};

// タイムゾーンのズレを防ぐフォーマット (YYYY-MM-DD)
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// 休日（土日）調整: before=前倒し / after=後倒し / none=何もしない
function adjustHoliday(date: Date, adj: HolidayAdjustment): Date {
  const result = new Date(date);
  if (adj === "none") return result;
  const day = result.getDay();
  if (day === 0) {
    // 日曜
    result.setDate(result.getDate() + (adj === "after" ? 1 : -2));
  } else if (day === 6) {
    // 土曜
    result.setDate(result.getDate() + (adj === "after" ? 2 : -1));
  }
  return result;
}

/**
 * プリセットと設定から期間（開始日・終了日）を計算する。
 * custom の場合は null を返す（呼び出し側で既存の値を維持する）。
 */
export function computePeriodRange(
  preset: PeriodPreset,
  settings: PeriodSettings,
  base: Date = new Date()
): PeriodRange | null {
  const today = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  let start: Date;
  let end: Date;

  switch (preset) {
    case "week": {
      const currentDay = today.getDay();
      const diff = (currentDay < settings.startDayOfWeek ? 7 : 0) + currentDay - settings.startDayOfWeek;
      start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - diff);
      end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
      break;
    }
    case "month": {
      start = new Date(today.getFullYear(), today.getMonth(), settings.startDayOfMonth);
      if (start > today) start.setMonth(start.getMonth() - 1);
      // 終了日は「翌期間の（調整後）開始日の前日」とし、期間が重複・欠落しないようにする
      end = adjustHoliday(
        new Date(start.getFullYear(), start.getMonth() + 1, settings.startDayOfMonth),
        settings.holidayAdjustment
      );
      end.setDate(end.getDate() - 1);
      start = adjustHoliday(start, settings.holidayAdjustment);
      break;
    }
    case "year": {
      start = new Date(today.getFullYear(), settings.startMonth - 1, settings.startMonthDay);
      if (start > today) start.setFullYear(start.getFullYear() - 1);
      end = new Date(start.getFullYear() + 1, start.getMonth(), start.getDate() - 1);
      break;
    }
    default:
      return null;
  }

  return { startDate: formatDate(start), endDate: formatDate(end) };
}

/** 前/次の期間へ移動した範囲を計算する。custom は null。 */
export function shiftPeriodRange(
  preset: PeriodPreset,
  settings: PeriodSettings,
  current: PeriodRange,
  direction: "prev" | "next"
): PeriodRange | null {
  const offset = direction === "next" ? 1 : -1;
  const currentStart = new Date(current.startDate);
  let start: Date;
  let end: Date;

  switch (preset) {
    case "week": {
      start = new Date(currentStart);
      start.setDate(currentStart.getDate() + offset * 7);
      end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
      break;
    }
    case "month": {
      // currentStart は調整後の日付なので、開始日設定から未調整の基準日を復元して移動する
      const anchor = new Date(currentStart.getFullYear(), currentStart.getMonth() + offset, settings.startDayOfMonth);
      // 終了日は「翌期間の（調整後）開始日の前日」とし、期間が重複・欠落しないようにする
      end = adjustHoliday(
        new Date(anchor.getFullYear(), anchor.getMonth() + 1, settings.startDayOfMonth),
        settings.holidayAdjustment
      );
      end.setDate(end.getDate() - 1);
      start = adjustHoliday(anchor, settings.holidayAdjustment);
      break;
    }
    case "year": {
      start = new Date(currentStart);
      start.setFullYear(currentStart.getFullYear() + offset);
      end = new Date(start.getFullYear() + 1, start.getMonth(), start.getDate() - 1);
      break;
    }
    default:
      return null;
  }

  return { startDate: formatDate(start), endDate: formatDate(end) };
}
