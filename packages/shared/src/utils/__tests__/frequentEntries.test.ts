import { aggregateFrequentEntrySets } from '../frequentEntries';
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
