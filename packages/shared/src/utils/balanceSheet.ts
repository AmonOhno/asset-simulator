import { JournalAccount } from '../types/common';

/**
 * 勘定科目の `includeInSummary` 設定に従い、サマリー（貸借対照表）集計行から
 * 除外対象（変動資産など）を取り除く。desktop/mobile 双方の BS 表示で共通利用する。
 */
export const filterSummaryIncludedRows = <T extends { accountId: string }>(
  rows: T[],
  accounts: JournalAccount[]
): T[] => {
  const excludedIds = new Set(
    accounts.filter((a) => a.includeInSummary === false).map((a) => a.id)
  );
  return rows.filter((row) => !excludedIds.has(row.accountId));
};
