import { describeSupabaseError, isNetworkError } from '../supabaseError';

describe('isNetworkError', () => {
  it('supabase-js が fetch 失敗時に詰めるメッセージを通信エラーと判定する', () => {
    expect(isNetworkError({ message: 'TypeError: Failed to fetch' })).toBe(true);
    expect(isNetworkError({ message: 'NetworkError when attempting to fetch resource.' })).toBe(true);
    expect(isNetworkError(new TypeError('Load failed'))).toBe(true);
  });

  it('サーバーから返ったエラーは通信エラーとしない', () => {
    expect(isNetworkError({ code: 'PGRST202', message: 'Could not find the function' })).toBe(false);
  });
});

describe('describeSupabaseError', () => {
  it('通信断のときだけ通信環境の確認を促す', () => {
    expect(describeSupabaseError({ message: 'TypeError: Failed to fetch' })).toContain('通信環境');
  });

  it('RPC・テーブルが見つからない場合はマイグレーション未適用の可能性を示す', () => {
    // save_goal がリモート DB に存在しない場合に PostgREST が返すコード
    const message = describeSupabaseError({
      code: 'PGRST202',
      message: 'Could not find the function public.save_goal(...) in the schema cache',
    });
    expect(message).toContain('マイグレーションが未適用');
    expect(message).toContain('PGRST202');
    expect(message).not.toContain('通信環境');

    expect(describeSupabaseError({ code: '42P01', message: 'relation does not exist' })).toContain(
      'マイグレーションが未適用'
    );
  });

  it('外部キー違反は勘定科目の再読み込みを促す', () => {
    expect(describeSupabaseError({ code: '23503', message: 'violates foreign key constraint' })).toContain(
      '対象の勘定科目が見つかりません'
    );
  });

  it('RLS で弾かれた場合は再ログインを促す', () => {
    expect(describeSupabaseError({ code: '42501', message: 'permission denied' })).toContain('権限がありません');
  });

  it('未知のコードはサーバーのメッセージとコードをそのまま見せる', () => {
    expect(describeSupabaseError({ code: 'P0001', message: '対象勘定科目が指定されていません' })).toBe(
      '対象勘定科目が指定されていません（P0001）'
    );
  });

  it('コードを持たない素の Error はメッセージをそのまま見せる', () => {
    expect(describeSupabaseError(new Error('対象勘定科目が指定されていません'))).toBe(
      '対象勘定科目が指定されていません'
    );
  });

  it('メッセージが取れない場合でも文言を返す', () => {
    expect(describeSupabaseError(undefined)).toContain('原因不明');
    expect(describeSupabaseError({})).toContain('原因不明');
  });
});
