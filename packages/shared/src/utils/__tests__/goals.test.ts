import {
  computeGoalProgress,
  formatGoalLabel,
  isSameAccountSet,
  sumGoalActual,
} from '../goals';

const actual = {
  jacc_food: 30000,
  jacc_eatout: 12000,
  jacc_daily: 8000,
};

describe('sumGoalActual', () => {
  it('対象勘定科目の実績を合計する', () => {
    expect(sumGoalActual(['jacc_food', 'jacc_eatout'], actual)).toBe(42000);
  });

  it('実績のない科目は 0 として扱う', () => {
    expect(sumGoalActual(['jacc_food', 'jacc_unknown'], actual)).toBe(30000);
  });

  it('対象科目が空なら 0', () => {
    expect(sumGoalActual([], actual)).toBe(0);
  });
});

describe('computeGoalProgress', () => {
  it('複数科目の合計に対する達成率と残額を返す', () => {
    const progress = computeGoalProgress(
      { accountIds: ['jacc_food', 'jacc_eatout', 'jacc_daily'], amount: 100000 },
      actual
    );
    expect(progress).toEqual({ actual: 50000, percent: 50, overBudget: false, diff: 50000 });
  });

  it('超過時は overBudget と超過額を返す', () => {
    const progress = computeGoalProgress(
      { accountIds: ['jacc_food', 'jacc_eatout'], amount: 40000 },
      actual
    );
    expect(progress.overBudget).toBe(true);
    expect(progress.diff).toBe(2000);
  });

  it('目標金額が 0 の場合は達成率 0 で 0 除算しない', () => {
    const progress = computeGoalProgress({ accountIds: ['jacc_food'], amount: 0 }, actual);
    expect(progress.percent).toBe(0);
    expect(progress.overBudget).toBe(true);
  });
});

describe('isSameAccountSet', () => {
  it('順序が異なっても同一セットとみなす', () => {
    expect(isSameAccountSet(['a', 'b'], ['b', 'a'])).toBe(true);
  });

  it('要素数が異なれば false', () => {
    expect(isSameAccountSet(['a', 'b'], ['a'])).toBe(false);
  });

  it('要素が異なれば false', () => {
    expect(isSameAccountSet(['a', 'b'], ['a', 'c'])).toBe(false);
  });
});

describe('formatGoalLabel', () => {
  const names = { jacc_food: '食費', jacc_eatout: '外食費', jacc_daily: '日用品費' };

  it('name が設定されていればそれを使う', () => {
    expect(formatGoalLabel({ name: '食まわり', accountIds: ['jacc_food'] }, names)).toBe('食まわり');
  });

  it('name が空なら対象科目名を連結する', () => {
    expect(formatGoalLabel({ name: '', accountIds: ['jacc_food', 'jacc_eatout'] }, names)).toBe(
      '食費 + 外食費'
    );
  });

  it('科目数が上限を超える場合は「ほか N 件」に省略する', () => {
    expect(
      formatGoalLabel({ name: '', accountIds: ['jacc_food', 'jacc_eatout', 'jacc_daily'] }, names)
    ).toBe('食費 + 外食費 ほか 1 件');
  });

  it('対象科目が空の場合のフォールバック', () => {
    expect(formatGoalLabel({ name: '', accountIds: [] }, names)).toBe('(対象科目なし)');
  });
});
