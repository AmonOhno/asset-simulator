// src/utils/frequentEntries.ts

import { JournalEntry } from '../types/common';

/** 集計対象となる仕訳の最小フィールドセット */
export type FrequentEntrySource = Pick<
  JournalEntry,
  'date' | 'description' | 'debitAccountId' | 'creditAccountId' | 'amount'
>;

/** 取引入力画面でサジェストする「よく使う取引入力値セット」 */
export interface FrequentEntrySet {
  description: string; // 摘要
  debitAccountId: string; // 借方勘定科目のID
  creditAccountId: string; // 貸方勘定科目のID
  amount: number; // 金額
  useCount: number; // 出現回数
  lastUsedDate: string; // 最終使用日 (YYYY-MM-DD)
}

// 摘要に含まれ得ない NUL 文字で連結し、フィールド境界の衝突を防ぐ
const KEY_SEPARATOR = '\u0000';

/**
 * 仕訳履歴から（摘要・借方・貸方・金額）の組み合わせごとに出現回数を集計し、
 * 出現回数の多い順（同数なら最終使用日の新しい順）に上位 limit 件を返す。
 */
export function aggregateFrequentEntrySets(
  entries: FrequentEntrySource[],
  limit = 5
): FrequentEntrySet[] {
  const sets = new Map<string, FrequentEntrySet>();

  for (const entry of entries) {
    // 摘要・勘定科目が欠けた行はサジェストとして再利用できないため除外
    if (!entry.description || !entry.debitAccountId || !entry.creditAccountId) continue;

    const key = [entry.description, entry.debitAccountId, entry.creditAccountId, entry.amount].join(KEY_SEPARATOR);
    const existing = sets.get(key);
    if (existing) {
      existing.useCount += 1;
      if (entry.date > existing.lastUsedDate) existing.lastUsedDate = entry.date;
    } else {
      sets.set(key, {
        description: entry.description,
        debitAccountId: entry.debitAccountId,
        creditAccountId: entry.creditAccountId,
        amount: entry.amount,
        useCount: 1,
        lastUsedDate: entry.date,
      });
    }
  }

  return Array.from(sets.values())
    .sort(
      (a, b) =>
        b.useCount - a.useCount || b.lastUsedDate.localeCompare(a.lastUsedDate)
    )
    .slice(0, Math.max(0, limit));
}
