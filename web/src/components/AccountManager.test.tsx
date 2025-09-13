
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AccountManager } from './AccountManager';
import { useFinancialStore } from '@asset-simulator/shared';

// Zustandストアをモックします
jest.mock('../stores/financialStore');

const mockUseFinancialStore = useFinancialStore as unknown as jest.Mock;

describe('AccountManager', () => {
  const addAccountMock = jest.fn();

  beforeEach(() => {
    // 各テストの前にモックをリセットします
    addAccountMock.mockClear();
    mockUseFinancialStore.mockReturnValue({
      accounts: [
        { id: 1, name: '給与振込口座', institution: '三菱UFJ銀行', type: 'savings', initialBalance: 100000 },
      ],
      addAccount: addAccountMock,
    });
  });

  test('コンポーネントが正しくレンダリングされる', () => {
    render(<AccountManager />);
    
    // 主要な要素が表示されていることを確認
    expect(screen.getByText('金融口座管理')).toBeInTheDocument();
    expect(screen.getByText('新しい口座を追加')).toBeInTheDocument();
    expect(screen.getByText('登録済み口座')).toBeInTheDocument();
  });

  test('既存の口座がテーブルに表示される', () => {
    render(<AccountManager />);

    // モックした口座情報が表示されていることを確認
    expect(screen.getByText('給与振込口座')).toBeInTheDocument();
    expect(screen.getByText('三菱UFJ銀行')).toBeInTheDocument();
    expect(screen.getByText('100,000円')).toBeInTheDocument();
  });

  test('新しい口座を追加できる', () => {
    render(<AccountManager />);

    // フォームに入力
    fireEvent.change(screen.getByLabelText('口座名'), { target: { value: '新しい証券口座' } });
    fireEvent.change(screen.getByLabelText('金融機関'), { target: { value: '楽天証券' } });
    fireEvent.change(screen.getByLabelText('口座種別'), { target: { value: 'investment' } });
    fireEvent.change(screen.getByLabelText('初期残高'), { target: { value: '50000' } });

    // 追加ボタンをクリック
    fireEvent.click(screen.getByRole('button', { name: '追加' }));

    // addAccount関数が正しい引数で呼び出されたことを確認
    expect(addAccountMock).toHaveBeenCalledWith({
      name: '新しい証券口座',
      institution: '楽天証券',
      type: 'investment',
      initialBalance: 50000,
      user_id: '',
    });
  });
});
