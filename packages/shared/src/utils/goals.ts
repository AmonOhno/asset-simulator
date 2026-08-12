import { Goal } from '../types/common';

/**
 * 支出目標の進捗。目標に紐づく全勘定科目の実績を合計して算出する。
 */
export interface GoalProgress {
  actual: number; // 対象勘定科目の実績合計（円）
  percent: number; // 達成率（%）。目標金額が 0 の場合は 0
  overBudget: boolean; // 実績が目標を超過しているか
  diff: number; // 超過額（overBudget 時）または残額。常に 0 以上
}

/**
 * 勘定科目 ID -> 実績金額 のマップから、目標の対象科目分だけを合計する。
 * マップに存在しない科目（対象期間に取引がない科目）は 0 として扱う。
 */
export const sumGoalActual = (
  accountIds: string[],
  actualByAccount: Record<string, number>
): number => accountIds.reduce((sum, id) => sum + (actualByAccount[id] ?? 0), 0);

/**
 * 目標の進捗（実績合計・達成率・残額/超過額）を算出する。
 */
export const computeGoalProgress = (
  goal: Pick<Goal, 'accountIds' | 'amount'>,
  actualByAccount: Record<string, number>
): GoalProgress => {
  const actual = sumGoalActual(goal.accountIds, actualByAccount);
  const percent = goal.amount > 0 ? Math.round((actual / goal.amount) * 100) : 0;
  const overBudget = actual > goal.amount;
  return {
    actual,
    percent,
    overBudget,
    diff: Math.abs(goal.amount - actual),
  };
};

/**
 * 2 つの勘定科目 ID セットが（順序を無視して）同一かを判定する。
 * 「同じ対象科目・同じ期間」の目標を二重登録させないための重複チェックに使う。
 */
export const isSameAccountSet = (a: string[], b: string[]): boolean => {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((id) => setB.has(id));
};

/**
 * 目標の表示名を決める。`name` が未設定の場合は対象勘定科目名を連結して生成し、
 * 科目数が多い場合は「A, B ほか N 件」に省略する。
 */
export const formatGoalLabel = (
  goal: Pick<Goal, 'name' | 'accountIds'>,
  accountNameById: Record<string, string>,
  maxNames = 2
): string => {
  if (goal.name) return goal.name;
  const names = goal.accountIds.map((id) => accountNameById[id] ?? id);
  if (names.length === 0) return '(対象科目なし)';
  if (names.length <= maxNames) return names.join(' + ');
  return `${names.slice(0, maxNames).join(' + ')} ほか ${names.length - maxNames} 件`;
};
