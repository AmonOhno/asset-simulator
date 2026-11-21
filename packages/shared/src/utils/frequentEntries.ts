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

// ---------------------------------------------------------------------------
// 交通費の「帰り」サジェスト
// 摘要の書き方は人によって揺れるため、なるべく広く経路として解釈する。
// 勘定科目名も揺れる（交通費 / 旅費交通費 / 電車代 …）ため科目では絞り込まず、摘要の形だけで判定する。
// ---------------------------------------------------------------------------

// 経路の区切りとして扱う表記（長い表記を先に並べる）。「ー」（長音）はカタカナ語に頻出するため含めない
const ROUTE_SEPARATOR_PATTERN =
  /(\s*(?:->|=>|〜|～|~|→|⇒|➡|➔|⟶|>|＞|－|-|‐|‑|–|—|―|−|から)\s*)/;
// 往復を表す摘要は片道ではないため帰りを提案しない
const ROUND_TRIP_PATTERN = /往復|⇔|↔|⇄|<->|<=>/;
// 帰りであることを明示する語
const RETURN_MARKER_PATTERN = /帰り|復路|帰宅/;
// 行き → 帰り の置き換え（帰りの摘要を作るとき前後の注記に適用）
const OUTBOUND_TO_RETURN: Array<[RegExp, string]> = [
  [/行き/g, '帰り'],
  [/往路/g, '復路'],
];
// 目的地の直後に続けて書かれがちな語
const TRAILING_MARKER_PATTERN = /(?:まで|行き|往路|帰り|復路|片道)+$/;
// 日付・時刻・数値だけの区間（例: 1月〜3月, 10:00〜12:00）は経路とみなさない
const NUMERIC_ONLY_PATTERN = /^[\d０-９\s年月日時分秒/.:：・,，]+$/;

/** 摘要を経路として解釈した結果 */
export interface ParsedRoute {
  /** 経路より前の注記（例: 「電車 渋谷〜新宿」の「電車 」）。区切りの文字を含む */
  prefix: string;
  /** 出発地・経由地・目的地（表記は入力のまま） */
  stops: string[];
  /** 各区間の区切り表記（入力のまま。stops.length - 1 個） */
  separators: string[];
  /** 目的地の直後に続けて書かれた語（例: 「新宿行き」の「行き」、「大阪まで」の「まで」） */
  destinationMarker: string;
  /** 経路より後の注記（例: 「渋谷〜新宿 JR」の「 JR」）。区切りの文字を含む */
  suffix: string;
  /** 摘要に「帰り」「復路」などが含まれる */
  isReturn: boolean;
}

/** 比較用に地名を正規化する（全角/半角・大文字小文字・空白・括弧書き・末尾の「駅」の揺れを吸収） */
export function normalizePlace(place: string): string {
  return place
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[(（[［【].*?[)）\]］】]/g, '')
    .replace(/\s+/g, '')
    .replace(/駅$/, '');
}

/**
 * 摘要を「出発地〜（経由地〜）目的地」の経路として解釈する。経路でなければ null。
 * - 区切り: 〜 ～ ~ → ⇒ > - – — から など
 * - 前後の注記: 「電車 渋谷〜新宿」「【電車】渋谷〜新宿」「渋谷〜新宿 JR」「渋谷〜新宿(JR)」「渋谷〜新宿行き」「東京から大阪まで」
 * - 往復（往復, ⇔ 等）や、数値だけの区間（1月〜3月）は対象外
 */
export function parseRoute(description: string): ParsedRoute | null {
  const text = (description ?? '').trim();
  if (!text || ROUND_TRIP_PATTERN.test(text)) return null;

  const parts = text.split(ROUTE_SEPARATOR_PATTERN);
  // split の結果は [区間, 区切り, 区間, 区切り, ..., 区間]
  const segments = parts.filter((_, i) => i % 2 === 0);
  const separators = parts.filter((_, i) => i % 2 === 1);
  if (segments.length < 2 || segments.some((seg) => !seg.trim())) return null;

  const stops = segments.map((seg) => seg.trim());
  let prefix = '';
  let suffix = '';

  // 先頭区間: 最後の区切り（空白・コロン・読点・閉じ隅付き括弧など）より前を注記とみなす
  //   例: 「電車 渋谷」「交通費:渋谷」「【電車】渋谷」
  const head = /^(.*[\s:：、,，】\]])(.+)$/.exec(stops[0]);
  if (head) {
    prefix = head[1];
    stops[0] = head[2].trim();
  }
  // 末尾区間: 最初の区切り（空白・コロン・括弧など）以降を注記とみなす
  //   例: 「新宿 JR」「新宿(JR)」
  const lastIndex = stops.length - 1;
  const tail = /^(.+?)([\s:：、,，【\[(（].*)$/.exec(stops[lastIndex]);
  if (tail) {
    stops[lastIndex] = tail[1];
    suffix = tail[2];
  }
  // 目的地の直後に付いた「まで」「行き」「帰り」なども注記として扱う（例: 「大阪まで」「新宿行き」）
  // 「新宿行き」の「行き」は行き先の意味なので、帰りの摘要でもそのまま新しい目的地の後ろに付ける
  let destinationMarker = '';
  const marker = TRAILING_MARKER_PATTERN.exec(stops[lastIndex]);
  if (marker && marker.index > 0) {
    stops[lastIndex] = stops[lastIndex].slice(0, marker.index);
    destinationMarker = marker[0];
  }

  const normalized = stops.map(normalizePlace);
  if (normalized.some((place) => !place)) return null;
  if (stops.every((stop) => NUMERIC_ONLY_PATTERN.test(stop))) return null;
  if (stops.length === 2 && normalized[0] === normalized[1]) return null;

  return { prefix, stops, separators, destinationMarker, suffix, isReturn: RETURN_MARKER_PATTERN.test(text) };
}

/** 解釈した経路を逆向きにした摘要を作る（区切り表記・注記は入力の書き方を引き継ぐ） */
export function buildReturnDescription(route: ParsedRoute): string {
  const swapMarker = (note: string) =>
    OUTBOUND_TO_RETURN.reduce((acc, [pattern, replacement]) => acc.replace(pattern, replacement), note);
  const stops = [...route.stops].reverse();
  const separators = [...route.separators].reverse();
  const body = stops.reduce((acc, stop, i) => (i === 0 ? stop : `${acc}${separators[i - 1]}${stop}`), '');
  return `${swapMarker(route.prefix)}${body}${route.destinationMarker}${swapMarker(route.suffix)}`;
}

const routeKey = (stops: string[]) => stops.map(normalizePlace).join(KEY_SEPARATOR);

/**
 * 摘要が経路（出発地〜目的地）の仕訳（交通費の行き）のうち、まだ帰り（逆向きの経路）が
 * 入力されていないものについて、帰りの取引入力値セット（同じ借方・貸方・金額）を生成する。
 * 古い順に走査し、行きの後に逆向きの経路の仕訳があれば帰り入力済みとみなす。
 * 帰りの支払い方法が違うこともあるため、帰り入力済みの判定では勘定科目を問わない。
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

  // key: 行きの経路 → 帰りが未入力の行き仕訳（同じ経路が複数あれば古い順に保持）
  const pending = new Map<string, Array<{ entry: FrequentEntrySource; route: ParsedRoute; order: number }>>();

  chronological.forEach((entry, order) => {
    const route = parseRoute(entry.description);
    if (!route) return;

    const reverseKey = routeKey([...route.stops].reverse());
    const waiting = pending.get(reverseKey);
    if (waiting && waiting.length > 0) {
      // この仕訳は既存の行きに対する帰り
      waiting.shift();
      if (waiting.length === 0) pending.delete(reverseKey);
      return;
    }
    // 「帰り」と明示された仕訳は、対応する行きが見つからなくても行きとして扱わない
    if (route.isReturn) return;

    const key = routeKey(route.stops);
    const list = pending.get(key) ?? [];
    list.push({ entry, route, order });
    pending.set(key, list);
  });

  return Array.from(pending.values())
    .map((list) => list[list.length - 1])
    // 勘定科目が欠けた行きは入力値セットとして再利用できないため除外
    .filter(({ entry }) => entry.debitAccountId && entry.creditAccountId)
    // 新しく入力された行きから順に並べる
    .sort((a, b) => b.order - a.order)
    .slice(0, Math.max(0, limit))
    .map(({ entry, route }) => ({
      description: buildReturnDescription(route),
      debitAccountId: entry.debitAccountId,
      creditAccountId: entry.creditAccountId,
      amount: entry.amount,
      useCount: 0,
      lastUsedDate: entry.date,
      isReturnTrip: true,
    }));
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
