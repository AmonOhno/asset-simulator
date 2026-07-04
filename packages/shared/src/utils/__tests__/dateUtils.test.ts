import { formatDateLocal, todayLocalString, adjustWeekendDate } from '../dateUtils';

describe('formatDateLocal', () => {
  it('formats a date as YYYY-MM-DD using local time components', () => {
    expect(formatDateLocal(new Date(2026, 6, 3))).toBe('2026-07-03');
  });

  it('pads single-digit month and day', () => {
    expect(formatDateLocal(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('todayLocalString', () => {
  it('returns formatDateLocal(new Date())', () => {
    expect(todayLocalString()).toBe(formatDateLocal(new Date()));
  });
});

describe('adjustWeekendDate', () => {
  // 2026-07-03 は金曜日, 2026-07-04 は土曜日, 2026-07-05 は日曜日
  const saturday = new Date(2026, 6, 4);
  const sunday = new Date(2026, 6, 5);
  const weekday = new Date(2026, 6, 3); // 金曜日

  it('shifts Saturday back by 1 day for before', () => {
    const result = adjustWeekendDate(saturday, 'before');
    expect(formatDateLocal(result)).toBe('2026-07-03');
  });

  it('shifts Saturday forward by 2 days for after', () => {
    const result = adjustWeekendDate(saturday, 'after');
    expect(formatDateLocal(result)).toBe('2026-07-06');
  });

  it('shifts Sunday back by 2 days for before', () => {
    const result = adjustWeekendDate(sunday, 'before');
    expect(formatDateLocal(result)).toBe('2026-07-03');
  });

  it('shifts Sunday forward by 1 day for after', () => {
    const result = adjustWeekendDate(sunday, 'after');
    expect(formatDateLocal(result)).toBe('2026-07-06');
  });

  it('leaves weekend dates unchanged for none', () => {
    expect(formatDateLocal(adjustWeekendDate(saturday, 'none'))).toBe('2026-07-04');
    expect(formatDateLocal(adjustWeekendDate(sunday, 'none'))).toBe('2026-07-05');
  });

  it('leaves weekday dates unchanged regardless of adjustment', () => {
    expect(formatDateLocal(adjustWeekendDate(weekday, 'before'))).toBe('2026-07-03');
    expect(formatDateLocal(adjustWeekendDate(weekday, 'after'))).toBe('2026-07-03');
    expect(formatDateLocal(adjustWeekendDate(weekday, 'none'))).toBe('2026-07-03');
  });

  it('does not mutate the input date', () => {
    const original = new Date(2026, 6, 4);
    const copy = new Date(original);
    adjustWeekendDate(original, 'before');
    expect(original.getTime()).toBe(copy.getTime());
  });
});
