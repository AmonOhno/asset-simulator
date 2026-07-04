import { isExecutionDate, getNextExecutionDate } from '../recurrence';
import type { RecurringTransaction } from '../../types/common';

// 基準日: 2026-07-03 (金曜日)
const BASE = new Date(2026, 6, 3);

function makeTransaction(overrides: Partial<RecurringTransaction>): RecurringTransaction {
  return {
    user_id: 'user_1',
    id: 'reg_1',
    name: 'テスト取引',
    description: '',
    debitAccountId: 'jacc_1',
    creditAccountId: 'jacc_2',
    amount: 1000,
    frequency: 'free',
    dateOfYear: '',
    dateOfMonth: 0,
    holidayDivOfMonth: 'none',
    ...overrides,
  };
}

describe('isExecutionDate', () => {
  it('daily is always true', () => {
    const t = makeTransaction({ frequency: 'daily' });
    expect(isExecutionDate(t, BASE)).toBe(true);
  });

  describe('weekly', () => {
    it('true when the matching day flag is set', () => {
      // BASE = 2026-07-03 は金曜日
      const t = makeTransaction({ frequency: 'weekly', friFlgOfWeek: true });
      expect(isExecutionDate(t, BASE)).toBe(true);
    });

    it('false when the day flag is not set', () => {
      const t = makeTransaction({ frequency: 'weekly', monFlgOfWeek: true });
      expect(isExecutionDate(t, BASE)).toBe(false);
    });

    it('excludes weekends when publicHolidayExFlgOfWeek is true', () => {
      const saturday = new Date(2026, 6, 4);
      const t = makeTransaction({ frequency: 'weekly', satFlgOfWeek: true, publicHolidayExFlgOfWeek: true });
      expect(isExecutionDate(t, saturday)).toBe(false);
    });

    it('does not exclude weekends when publicHolidayExFlgOfWeek is false', () => {
      const saturday = new Date(2026, 6, 4);
      const t = makeTransaction({ frequency: 'weekly', satFlgOfWeek: true, publicHolidayExFlgOfWeek: false });
      expect(isExecutionDate(t, saturday)).toBe(true);
    });
  });

  describe('monthly', () => {
    it('clamps dateOfMonth to the last day of a shorter month', () => {
      // 2026年6月は30日まで。dateOfMonth=31 は30日にclampされる。
      const june30 = new Date(2026, 5, 30);
      const t = makeTransaction({ frequency: 'monthly', dateOfMonth: 31, holidayDivOfMonth: 'none' });
      expect(isExecutionDate(t, june30)).toBe(true);
    });

    it('applies holiday adjustment (before)', () => {
      // 2026-07-04 は土曜日。前倒しで 2026-07-03(金) に調整される。
      const t = makeTransaction({ frequency: 'monthly', dateOfMonth: 4, holidayDivOfMonth: 'before' });
      expect(isExecutionDate(t, BASE)).toBe(true);
      expect(isExecutionDate(t, new Date(2026, 6, 4))).toBe(false);
    });

    it('is false when dateOfMonth is not set', () => {
      const t = makeTransaction({ frequency: 'monthly', dateOfMonth: 0 });
      expect(isExecutionDate(t, BASE)).toBe(false);
    });
  });

  describe('yearly', () => {
    it('accepts MM-DD format', () => {
      // 2026-07-04 は土曜日。前倒しで 2026-07-03 に調整される。
      const t = makeTransaction({ frequency: 'yearly', dateOfYear: '07-04', holidayDivOfMonth: 'before' });
      expect(isExecutionDate(t, BASE)).toBe(true);
    });

    it('accepts YYYY-MM-DD format', () => {
      const t = makeTransaction({ frequency: 'yearly', dateOfYear: '2020-07-04', holidayDivOfMonth: 'before' });
      expect(isExecutionDate(t, BASE)).toBe(true);
    });

    it('is false when dateOfYear is empty', () => {
      const t = makeTransaction({ frequency: 'yearly', dateOfYear: '' });
      expect(isExecutionDate(t, BASE)).toBe(false);
    });
  });

  it('free is always false', () => {
    const t = makeTransaction({ frequency: 'free' });
    expect(isExecutionDate(t, BASE)).toBe(false);
  });

  describe('date range checks', () => {
    it('false when before startDate', () => {
      const t = makeTransaction({ frequency: 'daily', startDate: '2026-07-04' });
      expect(isExecutionDate(t, BASE)).toBe(false);
    });

    it('false when after endDate', () => {
      const t = makeTransaction({ frequency: 'daily', endDate: '2026-07-02' });
      expect(isExecutionDate(t, BASE)).toBe(false);
    });

    it('true when within range', () => {
      const t = makeTransaction({ frequency: 'daily', startDate: '2026-07-01', endDate: '2026-07-31' });
      expect(isExecutionDate(t, BASE)).toBe(true);
    });
  });
});

describe('getNextExecutionDate', () => {
  it('returns undefined when endDate has already passed', () => {
    const t = makeTransaction({ frequency: 'daily', endDate: '2026-07-01' });
    expect(getNextExecutionDate(t, BASE)).toBeUndefined();
  });

  it('returns today when today is an execution day and not yet executed', () => {
    const t = makeTransaction({ frequency: 'weekly', friFlgOfWeek: true, lastExecutedDate: '2026-07-02' });
    const result = getNextExecutionDate(t, BASE);
    expect(result).toBeDefined();
    expect(result!.getFullYear()).toBe(2026);
    expect(result!.getMonth()).toBe(6);
    expect(result!.getDate()).toBe(3);
  });

  it('does not return today when already executed today', () => {
    const t = makeTransaction({ frequency: 'weekly', friFlgOfWeek: true, lastExecutedDate: '2026-07-03' });
    const result = getNextExecutionDate(t, BASE);
    // 次の金曜日 (2026-07-10) が返るはず
    expect(result).toBeDefined();
    expect(result!.getDate()).toBe(10);
  });

  it('weekly: finds the next matching day later in the week', () => {
    const t = makeTransaction({ frequency: 'weekly', monFlgOfWeek: true }); // 次の月曜は 2026-07-06
    const result = getNextExecutionDate(t, BASE);
    expect(result).toBeDefined();
    expect(result!.getDate()).toBe(6);
  });

  it('monthly: returns this month date if not yet passed', () => {
    const t = makeTransaction({ frequency: 'monthly', dateOfMonth: 20, holidayDivOfMonth: 'none' });
    const result = getNextExecutionDate(t, BASE);
    expect(result).toBeDefined();
    expect(result!.getMonth()).toBe(6);
    expect(result!.getDate()).toBe(20);
  });

  it('monthly: rolls over to next month if this month date has passed', () => {
    const t = makeTransaction({ frequency: 'monthly', dateOfMonth: 1, holidayDivOfMonth: 'none' });
    const result = getNextExecutionDate(t, BASE);
    expect(result).toBeDefined();
    expect(result!.getMonth()).toBe(7); // 8月
    expect(result!.getDate()).toBe(1);
  });

  it('yearly: returns next year date', () => {
    const t = makeTransaction({ frequency: 'yearly', dateOfYear: '01-01', holidayDivOfMonth: 'none' });
    const result = getNextExecutionDate(t, BASE);
    expect(result).toBeDefined();
    expect(result!.getFullYear()).toBe(2027);
    expect(result!.getMonth()).toBe(0);
    expect(result!.getDate()).toBe(1);
  });

  it('free returns undefined', () => {
    const t = makeTransaction({ frequency: 'free' });
    expect(getNextExecutionDate(t, BASE)).toBeUndefined();
  });

  it('daily returns undefined (no next-execution concept)', () => {
    const t = makeTransaction({ frequency: 'daily', lastExecutedDate: '2026-07-03' });
    expect(getNextExecutionDate(t, BASE)).toBeUndefined();
  });
});
