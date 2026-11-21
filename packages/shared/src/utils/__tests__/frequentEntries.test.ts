import { aggregateFrequentEntrySets, buildEntrySuggestions, findPendingReturnTrips, parseRoute } from '../frequentEntries';
import type { FrequentEntrySource } from '../frequentEntries';

const entry = (
  date: string,
  description: string,
  debitAccountId: string,
  creditAccountId: string,
  amount: number
): FrequentEntrySource => ({ date, description, debitAccountId, creditAccountId, amount });

describe('aggregateFrequentEntrySets', () => {
  it('同一の（摘要・借方・貸方・金額）をひとつのセットに集計し useCount を数える', () => {
    const result = aggregateFrequentEntrySets([
      entry('2026-07-01', 'コーヒー', 'jacc_exp', 'jacc_cash', 500),
      entry('2026-07-03', 'コーヒー', 'jacc_exp', 'jacc_cash', 500),
      entry('2026-07-02', '昼食', 'jacc_exp', 'jacc_cash', 1000),
    ]);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      description: 'コーヒー',
      debitAccountId: 'jacc_exp',
      creditAccountId: 'jacc_cash',
      amount: 500,
      useCount: 2,
      lastUsedDate: '2026-07-03',
    });
  });

  it('金額が異なる場合は別のセットとして扱う', () => {
    const result = aggregateFrequentEntrySets([
      entry('2026-07-01', 'コーヒー', 'jacc_exp', 'jacc_cash', 500),
      entry('2026-07-02', 'コーヒー', 'jacc_exp', 'jacc_cash', 600),
    ]);
    expect(result).toHaveLength(2);
  });

  it('出現回数の多い順、同数なら最終使用日の新しい順に並べる', () => {
    const result = aggregateFrequentEntrySets([
      entry('2026-07-01', '古い方', 'jacc_exp', 'jacc_cash', 100),
      entry('2026-07-05', '新しい方', 'jacc_exp', 'jacc_cash', 200),
      entry('2026-07-02', 'よく使う', 'jacc_exp', 'jacc_cash', 300),
      entry('2026-07-03', 'よく使う', 'jacc_exp', 'jacc_cash', 300),
    ]);

    expect(result.map((s) => s.description)).toEqual(['よく使う', '新しい方', '古い方']);
  });

  it('上位 limit 件のみ返す（デフォルト 5 件）', () => {
    const entries = Array.from({ length: 10 }, (_, i) =>
      entry('2026-07-01', `摘要${i}`, 'jacc_exp', 'jacc_cash', i * 100)
    );
    expect(aggregateFrequentEntrySets(entries)).toHaveLength(5);
    expect(aggregateFrequentEntrySets(entries, 3)).toHaveLength(3);
  });

  it('摘要や勘定科目が欠けた行は集計から除外する', () => {
    const result = aggregateFrequentEntrySets([
      entry('2026-07-01', '', 'jacc_exp', 'jacc_cash', 500),
      entry('2026-07-01', 'コーヒー', '', 'jacc_cash', 500),
      entry('2026-07-01', 'コーヒー', 'jacc_exp', '', 500),
      entry('2026-07-01', 'コーヒー', 'jacc_exp', 'jacc_cash', 500),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].useCount).toBe(1);
  });

  it('フィールド境界が異なる組み合わせを同一視しない', () => {
    const result = aggregateFrequentEntrySets([
      entry('2026-07-01', 'A', 'B C', 'jacc_cash', 500),
      entry('2026-07-01', 'A B', 'C', 'jacc_cash', 500),
    ]);
    expect(result).toHaveLength(2);
  });

  it('空配列なら空配列を返す', () => {
    expect(aggregateFrequentEntrySets([])).toEqual([]);
  });
});

describe('parseRoute', () => {
  it('「出発地〜目的地」を分解する（区切り文字の揺れも許容）', () => {
    expect(parseRoute('渋谷〜新宿')).toEqual({ from: '渋谷', to: '新宿' });
    expect(parseRoute('渋谷 ～ 新宿')).toEqual({ from: '渋谷', to: '新宿' });
    expect(parseRoute('渋谷~新宿')).toEqual({ from: '渋谷', to: '新宿' });
    expect(parseRoute('渋谷→新宿')).toEqual({ from: '渋谷', to: '新宿' });
  });

  it('経路形式でない摘要は null', () => {
    expect(parseRoute('コーヒー')).toBeNull();
    expect(parseRoute('〜新宿')).toBeNull();
    expect(parseRoute('渋谷〜渋谷')).toBeNull();
  });
});

describe('findPendingReturnTrips', () => {
  it('行きだけ入力されている交通費に対して帰りのセットを返す', () => {
    const result = findPendingReturnTrips([
      entry('2026-07-01', '渋谷〜新宿', 'jacc_travel', 'jacc_ic', 180),
    ]);
    expect(result).toEqual([
      {
        description: '新宿〜渋谷',
        debitAccountId: 'jacc_travel',
        creditAccountId: 'jacc_ic',
        amount: 180,
        useCount: 0,
        lastUsedDate: '2026-07-01',
        isReturnTrip: true,
      },
    ]);
  });

  it('帰りが入力済みなら候補にしない', () => {
    // fetch は日付降順（新しい順）
    const result = findPendingReturnTrips([
      entry('2026-07-01', '新宿〜渋谷', 'jacc_travel', 'jacc_ic', 180),
      entry('2026-07-01', '渋谷〜新宿', 'jacc_travel', 'jacc_ic', 180),
    ]);
    expect(result).toEqual([]);
  });

  it('過去の往復が済んでいても、新しい行きには帰りを提案する', () => {
    const result = findPendingReturnTrips([
      entry('2026-07-03', '渋谷〜新宿', 'jacc_travel', 'jacc_ic', 180),
      entry('2026-07-01', '新宿〜渋谷', 'jacc_travel', 'jacc_ic', 180),
      entry('2026-07-01', '渋谷〜新宿', 'jacc_travel', 'jacc_ic', 180),
    ]);
    expect(result.map((s) => [s.description, s.lastUsedDate])).toEqual([['新宿〜渋谷', '2026-07-03']]);
  });

  it('勘定科目が異なる逆方向の仕訳は帰りとみなさない', () => {
    const result = findPendingReturnTrips([
      entry('2026-07-01', '新宿〜渋谷', 'jacc_travel', 'jacc_cash', 180),
      entry('2026-07-01', '渋谷〜新宿', 'jacc_travel', 'jacc_ic', 180),
    ]);
    expect(result.map((s) => s.description)).toEqual(['渋谷〜新宿', '新宿〜渋谷']);
  });

  it('新しい行きから順に limit 件まで返す', () => {
    const result = findPendingReturnTrips(
      [
        entry('2026-07-03', 'C〜D', 'jacc_travel', 'jacc_ic', 300),
        entry('2026-07-02', 'B〜C', 'jacc_travel', 'jacc_ic', 200),
        entry('2026-07-01', 'A〜B', 'jacc_travel', 'jacc_ic', 100),
      ],
      2
    );
    expect(result.map((s) => s.description)).toEqual(['D〜C', 'C〜B']);
  });
});

describe('buildEntrySuggestions', () => {
  it('帰り候補を先頭に置き、頻出セットとの重複を除く', () => {
    const result = buildEntrySuggestions([
      entry('2026-07-05', '渋谷〜新宿', 'jacc_travel', 'jacc_ic', 180),
      entry('2026-07-02', 'コーヒー', 'jacc_exp', 'jacc_cash', 500),
      entry('2026-07-01', '新宿〜渋谷', 'jacc_travel', 'jacc_ic', 180),
      entry('2026-07-01', '渋谷〜新宿', 'jacc_travel', 'jacc_ic', 180),
    ]);
    expect(result[0]).toMatchObject({ description: '新宿〜渋谷', isReturnTrip: true });
    expect(result.filter((s) => s.description === '新宿〜渋谷')).toHaveLength(1);
    expect(result.map((s) => s.description)).toEqual(['新宿〜渋谷', '渋谷〜新宿', 'コーヒー']);
  });
});
