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
  /** 行きの交通費仕訳から生成した「帰り」の候補なら true */
  isReturnTrip?: boolean;
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

// 「出発地〜目的地」の区切りとして扱う文字（波ダッシュ・全角チルダ・半角チルダ・矢印）
const ROUTE_PATTERN = /^\s*(.+?)\s*[〜～~→]\s*(.+?)\s*$/;
const ROUTE_SEPARATOR = '〜';

/**
 * 摘要が「出発地〜目的地」形式なら出発地と目的地を返す。それ以外は null。
 */
export function parseRoute(description: string): { from: string; to: string } | null {
  const match = ROUTE_PATTERN.exec(description ?? '');
  if (!match) return null;
  const [, from, to] = match;
  if (!from || !to || from === to) return null;
  return { from, to };
}

const routeKey = (from: string, to: string, debitAccountId: string, creditAccountId: string) =>
  [from, to, debitAccountId, creditAccountId].join(KEY_SEPARATOR);

/**
 * 摘要が「出発地〜目的地」の仕訳（交通費の行き）のうち、まだ帰り（目的地〜出発地・同じ借方/貸方）が
 * 入力されていないものについて、帰りの取引入力値セットを生成する。
 * 古い順に走査し、行きの後に逆方向の仕訳があれば帰り入力済みとみなす。
 * 新しい行きから順に、上位 limit 件を返す。
 */
export function findPendingReturnTrips(
  entries: FrequentEntrySource[],
  limit = 2
): FrequentEntrySet[] {
  // 古い順に並べ替える（取得は新しい順のため、同日内は元の並びを反転させて古い入力を先にする）
  const chronological = entries
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => a.entry.date.localeCompare(b.entry.date) || b.index - a.index)
    .map(({ entry }) => entry);

  // key: 行きの経路 → 未対応の行き仕訳（同じ経路が複数あれば配列で保持）
  const pending = new Map<string, FrequentEntrySource[]>();

  for (const entry of chronological) {
    if (!entry.debitAccountId || !entry.creditAccountId) continue;
    const route = parseRoute(entry.description);
    if (!route) continue;

    const reverseKey = routeKey(route.to, route.from, entry.debitAccountId, entry.creditAccountId);
    const waiting = pending.get(reverseKey);
    if (waiting && waiting.length > 0) {
      // この仕訳は既存の行きに対する帰り
      waiting.shift();
      if (waiting.length === 0) pending.delete(reverseKey);
      continue;
    }

    const key = routeKey(route.from, route.to, entry.debitAccountId, entry.creditAccountId);
    const list = pending.get(key) ?? [];
    list.push(entry);
    pending.set(key, list);
  }

  // 新しく入力された行きから順に並べる（chronological は古い順なので位置の逆順＝新しい順）
  const order = new Map(chronological.map((entry, index) => [entry, index]));
  const outbound = Array.from(pending.values())
    .map((list) => list[list.length - 1])
    .sort((a, b) => order.get(b)! - order.get(a)!);

  return outbound.slice(0, Math.max(0, limit)).map((entry) => {
    const route = parseRoute(entry.description)!;
    return {
      description: `${route.to}${ROUTE_SEPARATOR}${route.from}`,
      debitAccountId: entry.debitAccountId,
      creditAccountId: entry.creditAccountId,
      amount: entry.amount,
      useCount: 0,
      lastUsedDate: entry.date,
      isReturnTrip: true,
    };
  });
}

const setKey = (s: Pick<FrequentEntrySet, 'description' | 'debitAccountId' | 'creditAccountId' | 'amount'>) =>
  [s.description, s.debitAccountId, s.creditAccountId, s.amount].join(KEY_SEPARATOR);

/**
 * 取引入力画面のサジェスト一覧を組み立てる。
 * 帰り候補（未入力の帰りがある交通費）を先頭に置き、続けて頻出セットを並べる（重複は除外）。
 */
export function buildEntrySuggestions(
  entries: FrequentEntrySource[],
  limit = 5
): FrequentEntrySet[] {
  const returnTrips = findPendingReturnTrips(entries);
  const returnKeys = new Set(returnTrips.map(setKey));
  const frequent = aggregateFrequentEntrySets(entries, limit).filter((s) => !returnKeys.has(setKey(s)));
  return [...returnTrips, ...frequent];
}
