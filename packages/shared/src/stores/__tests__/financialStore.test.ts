import { useFinancialStore } from '../financialStore';
import { useAuthStore } from '../authStore';

const CACHE_PREFIX = 'asset_simulator_financial_v1:';

afterEach(() => {
  // reset auth and localStorage
  useAuthStore.getState().setSession(null as any);
  localStorage.clear();
});

describe('financialStore per-user cache', () => {
  test('hydrates state from localStorage when user logs in', () => {
    const userId = 'test-user';
    const cached = {
      accounts: [{ id: 'a1', name: 'Cash' }],
      creditCards: [],
      journalAccounts: [],
      journalEntries: [],
      regularJournalEntries: [],
    };
    localStorage.setItem(CACHE_PREFIX + userId, JSON.stringify(cached));

    // login
    useAuthStore.getState().setSession({ user: { id: userId }, access_token: 't' } as any);

    // financial store should be hydrated
    const accounts = useFinancialStore.getState().accounts;
    expect(accounts).toEqual(cached.accounts);
  });

  test('getAccounts returns cached immediately and updates after background fetch', async () => {
    const userId = 'user-bg';
    const cached = { id: 'a1', name: 'Cached' };
    // setup cache
    localStorage.setItem(CACHE_PREFIX + userId, JSON.stringify({
      accounts: [cached],
      creditCards: [],
      journalAccounts: [],
      journalEntries: [],
      regularJournalEntries: [],
    }));

    useAuthStore.getState().setSession({ user: { id: userId }, access_token: 'token' } as any);

    // mock fetch to return fresh data
    const fresh = [{ id: 'a2', name: 'Fresh' }];
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => fresh });

    const result = await useFinancialStore.getState().getAccounts();
    // immediate return should be cached (because getAccounts returns cached immediately)
    expect(result).toEqual([cached]);

    // allow background task to run
    await new Promise((r) => setTimeout(r, 0));

    // after background fetch, state should be updated to fresh
    expect(useFinancialStore.getState().accounts).toEqual(fresh);
    // localStorage should be updated
    const stored = JSON.parse(localStorage.getItem(CACHE_PREFIX + userId) as string);
    expect(stored.accounts).toEqual(fresh);
  });

  test('mutations update cache and localStorage', async () => {
    const userId = 'user-mutate';
    useAuthStore.getState().setSession({ user: { id: userId }, access_token: 'token' } as any);

    const created = { id: 'a10', name: 'NewAcc' };
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => created });

    await useFinancialStore.getState().addAccount({ name: 'NewAcc' } as any);

    expect(useFinancialStore.getState().accounts.some(a => a.id === 'a10')).toBe(true);

    const stored = JSON.parse(localStorage.getItem(CACHE_PREFIX + userId) as string);
    expect(stored.accounts.some((a: any) => a.id === 'a10')).toBe(true);
  });
});
