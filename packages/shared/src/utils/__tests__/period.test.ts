import {
  computePeriodRange,
  shiftPeriodRange,
  DEFAULT_PERIOD_SETTINGS,
  type PeriodSettings,
} from '../period';

// 基準日: 2026-07-03 (金曜日)
const BASE = new Date(2026, 6, 3);

describe('computePeriodRange', () => {
  it('computes a week range starting on the configured start day of week', () => {
    const settings: PeriodSettings = { ...DEFAULT_PERIOD_SETTINGS, startDayOfWeek: 1 }; // 月曜始まり
    const range = computePeriodRange('week', settings, BASE);
    // 2026-07-03(金)を含む月曜始まりの週は 2026-06-29(月)〜2026-07-05(日)
    expect(range).toEqual({ startDate: '2026-06-29', endDate: '2026-07-05' });
  });

  it('computes a month range starting on the configured start day of month', () => {
    const settings: PeriodSettings = { ...DEFAULT_PERIOD_SETTINGS, startDayOfMonth: 25, holidayAdjustment: 'none' };
    const range = computePeriodRange('month', settings, BASE);
    // 2026-07-25 は今日(07-03)より後なので前月の25日始まり: 2026-06-25 〜 2026-07-24
    expect(range).toEqual({ startDate: '2026-06-25', endDate: '2026-07-24' });
  });

  it('computes a year range starting on the configured start month/day', () => {
    const settings: PeriodSettings = { ...DEFAULT_PERIOD_SETTINGS, startMonth: 1, startMonthDay: 1 };
    const range = computePeriodRange('year', settings, BASE);
    expect(range).toEqual({ startDate: '2026-01-01', endDate: '2026-12-31' });
  });

  it('returns null for custom preset', () => {
    expect(computePeriodRange('custom', DEFAULT_PERIOD_SETTINGS, BASE)).toBeNull();
  });

  // #106 回帰テスト: 開始日 25 日 + 休日前倒しで隣接期間が重複・欠落しないこと
  it('does not overlap or leave a gap between adjacent month periods when holiday-adjusted (before)', () => {
    const settings: PeriodSettings = { ...DEFAULT_PERIOD_SETTINGS, startDayOfMonth: 25, holidayAdjustment: 'before' };
    const current = computePeriodRange('month', settings, BASE)!;
    // 2026-07-25 は土曜日なので前倒しで 07-24 になる。終了日は前日の 07-23。
    expect(current).toEqual({ startDate: '2026-06-25', endDate: '2026-07-23' });

    const next = shiftPeriodRange('month', settings, current, 'next')!;
    // 次期間の開始日は現期間の終了日の翌日でなければならない
    const dayAfterCurrentEnd = new Date(current.endDate);
    dayAfterCurrentEnd.setDate(dayAfterCurrentEnd.getDate() + 1);
    const y = dayAfterCurrentEnd.getFullYear();
    const m = String(dayAfterCurrentEnd.getMonth() + 1).padStart(2, '0');
    const d = String(dayAfterCurrentEnd.getDate()).padStart(2, '0');
    expect(next.startDate).toBe(`${y}-${m}-${d}`);
  });

  it('does not overlap or leave a gap between adjacent month periods when holiday-adjusted (after)', () => {
    const settings: PeriodSettings = { ...DEFAULT_PERIOD_SETTINGS, startDayOfMonth: 25, holidayAdjustment: 'after' };
    const current = computePeriodRange('month', settings, BASE)!;
    const next = shiftPeriodRange('month', settings, current, 'next')!;

    const dayAfterCurrentEnd = new Date(current.endDate);
    dayAfterCurrentEnd.setDate(dayAfterCurrentEnd.getDate() + 1);
    const y = dayAfterCurrentEnd.getFullYear();
    const m = String(dayAfterCurrentEnd.getMonth() + 1).padStart(2, '0');
    const d = String(dayAfterCurrentEnd.getDate()).padStart(2, '0');
    expect(next.startDate).toBe(`${y}-${m}-${d}`);

    const prev = shiftPeriodRange('month', settings, current, 'prev')!;
    const dayBeforeCurrentStart = new Date(current.startDate);
    dayBeforeCurrentStart.setDate(dayBeforeCurrentStart.getDate() - 1);
    const y2 = dayBeforeCurrentStart.getFullYear();
    const m2 = String(dayBeforeCurrentStart.getMonth() + 1).padStart(2, '0');
    const d2 = String(dayBeforeCurrentStart.getDate()).padStart(2, '0');
    expect(prev.endDate).toBe(`${y2}-${m2}-${d2}`);
  });
});

describe('shiftPeriodRange', () => {
  it('round-trips week ranges via prev/next', () => {
    const settings = DEFAULT_PERIOD_SETTINGS;
    const current = computePeriodRange('week', settings, BASE)!;
    const next = shiftPeriodRange('week', settings, current, 'next')!;
    const back = shiftPeriodRange('week', settings, next, 'prev')!;
    expect(back).toEqual(current);
  });

  it('round-trips month ranges via prev/next', () => {
    const settings: PeriodSettings = { ...DEFAULT_PERIOD_SETTINGS, startDayOfMonth: 25, holidayAdjustment: 'before' };
    const current = computePeriodRange('month', settings, BASE)!;
    const next = shiftPeriodRange('month', settings, current, 'next')!;
    const back = shiftPeriodRange('month', settings, next, 'prev')!;
    expect(back).toEqual(current);
  });

  it('round-trips year ranges via prev/next', () => {
    const settings = DEFAULT_PERIOD_SETTINGS;
    const current = computePeriodRange('year', settings, BASE)!;
    const next = shiftPeriodRange('year', settings, current, 'next')!;
    const back = shiftPeriodRange('year', settings, next, 'prev')!;
    expect(back).toEqual(current);
  });

  it('returns null for custom preset', () => {
    expect(
      shiftPeriodRange('custom', DEFAULT_PERIOD_SETTINGS, { startDate: '2026-07-01', endDate: '2026-07-31' }, 'next')
    ).toBeNull();
  });
});
