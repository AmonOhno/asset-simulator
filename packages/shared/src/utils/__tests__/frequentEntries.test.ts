import {
  aggregateFrequentEntrySets,
  buildEntrySuggestions,
  buildReturnDescription,
  findPendingReturnTrips,
  normalizePlace,
  parseRoute,
} from '../frequentEntries';
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
  it.each([
    '渋谷〜新宿',
    '渋谷 ～ 新宿',
    '渋谷~新宿',
    '渋谷→新宿',
    '渋谷⇒新宿',
    '渋谷->新宿',
    '渋谷>新宿',
    '渋谷-新宿',
    '渋谷－新宿',
    '渋谷―新宿',
    '渋谷から新宿',
  ])('区切り表記の揺れを許容する: %s', (description) => {
    expect(parseRoute(description)?.stops).toEqual(['渋谷', '新宿']);
  });

  it('前後の注記を経路から切り離す', () => {
    expect(parseRoute('電車 渋谷〜新宿')).toMatchObject({ prefix: '電車 ', stops: ['渋谷', '新宿'] });
    expect(parseRoute('交通費:渋谷〜新宿')).toMatchObject({ prefix: '交通費:', stops: ['渋谷', '新宿'] });
    expect(parseRoute('【電車】渋谷〜新宿')).toMatchObject({ prefix: '【電車】', stops: ['渋谷', '新宿'] });
    expect(parseRoute('渋谷〜新宿 JR')).toMatchObject({ stops: ['渋谷', '新宿'], suffix: ' JR' });
    expect(parseRoute('渋谷〜新宿(JR)')).toMatchObject({ stops: ['渋谷', '新宿'], suffix: '(JR)' });
    expect(parseRoute('渋谷〜新宿行き')).toMatchObject({ stops: ['渋谷', '新宿'], destinationMarker: '行き' });
    expect(parseRoute('東京から大阪まで')).toMatchObject({ stops: ['東京', '大阪'], destinationMarker: 'まで' });
  });

  it('経由地を含む経路を解釈する', () => {
    expect(parseRoute('自宅〜渋谷〜新宿')?.stops).toEqual(['自宅', '渋谷', '新宿']);
  });

  it('「帰り」「復路」を含む摘要は isReturn', () => {
    expect(parseRoute('新宿〜渋谷 帰り')?.isReturn).toBe(true);
    expect(parseRoute('復路 新宿〜渋谷')?.isReturn).toBe(true);
    expect(parseRoute('渋谷〜新宿')?.isReturn).toBe(false);
  });

  it.each(['コーヒー', '〜新宿', '渋谷〜', '渋谷〜渋谷', '渋谷駅〜渋谷', '渋谷〜新宿 往復', '渋谷⇔新宿', '1月〜3月', '10:00〜12:00', 'センター'])(
    '経路でない摘要は null: %s',
    (description) => {
      expect(parseRoute(description)).toBeNull();
    }
  );
});

describe('normalizePlace', () => {
  it('全角/半角・空白・括弧書き・末尾の「駅」の揺れを吸収する', () => {
    expect(normalizePlace('渋谷駅')).toBe('渋谷');
    expect(normalizePlace('渋谷（JR）')).toBe('渋谷');
    expect(normalizePlace('ＪＲ 渋谷')).toBe('jr渋谷');
    expect(normalizePlace('Shibuya')).toBe(normalizePlace('SHIBUYA'));
  });
});

describe('buildReturnDescription', () => {
  const reverse = (description: string) => buildReturnDescription(parseRoute(description)!);

  it('経路を逆向きにし、区切り表記と注記は入力の書き方を引き継ぐ', () => {
    expect(reverse('渋谷〜新宿')).toBe('新宿〜渋谷');
    expect(reverse('渋谷 → 新宿')).toBe('新宿 → 渋谷');
    expect(reverse('電車 渋谷〜新宿 JR')).toBe('電車 新宿〜渋谷 JR');
    expect(reverse('自宅〜渋谷→新宿')).toBe('新宿→渋谷〜自宅');
    expect(reverse('東京から大阪まで')).toBe('大阪から東京まで');
    expect(reverse('渋谷〜新宿行き')).toBe('新宿〜渋谷行き');
  });

  it('注記の「行き」「往路」は「帰り」「復路」に置き換える', () => {
    expect(reverse('行き 渋谷〜新宿')).toBe('帰り 新宿〜渋谷');
    expect(reverse('渋谷〜新宿（往路）')).toBe('新宿〜渋谷（復路）');
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

  it('帰りの表記・勘定科目・金額が行きと違っても帰り入力済みとみなす', () => {
    const result = findPendingReturnTrips([
      entry('2026-07-01', '電車 新宿駅→渋谷 帰り', 'jacc_train', 'jacc_cash', 200),
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

  it('「帰り」と明示された仕訳は、対応する行きが無くても行きとして扱わない', () => {
    expect(findPendingReturnTrips([entry('2026-07-01', '新宿〜渋谷 帰り', 'jacc_travel', 'jacc_ic', 180)])).toEqual([]);
  });

  it('同日内は後から入力した行きを先に返す', () => {
    const result = findPendingReturnTrips([
      entry('2026-07-01', 'B〜C', 'jacc_travel', 'jacc_ic', 200),
      entry('2026-07-01', 'X〜Y', 'jacc_travel', 'jacc_ic', 100),
    ]);
    expect(result.map((s) => s.description)).toEqual(['C〜B', 'Y〜X']);
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

  it('勘定科目が欠けた行きは候補にしない', () => {
    expect(findPendingReturnTrips([entry('2026-07-01', '渋谷〜新宿', '', 'jacc_ic', 180)])).toEqual([]);
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
    expect(result.map((s) => s.description)).toEqual(['新宿〜渋谷', '渋谷〜新宿', 'コーヒー']);
  });
});
