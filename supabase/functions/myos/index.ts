// MyOS 連携用の読み取り専用 Finance API（Issue #114）
// エンドポイント: GET /summary, GET /categories, GET /events
// 認証: Authorization: Bearer <ast_...> トークン（api_tokens.token_hash で照合）

import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ALLOWED_ORIGINS = (Deno.env.get('MYOS_ALLOWED_ORIGINS') ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const MONTH_RE = /^\d{4}-\d{2}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function corsHeaders(origin: string | null): Record<string, string> {
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    Vary: 'Origin',
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };
}

function json(body: unknown, status: number, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// month='YYYY-MM' → [YYYY-MM-01, YYYY-MM-末日]（日付文字列を手組みし TZ ずれを避ける）
function monthRange(month: string): { start: string; end: string } {
  const [yearStr, monthStr] = month.split('-');
  const year = Number(yearStr);
  const mon = Number(monthStr);
  const lastDay = new Date(year, mon, 0).getDate();
  return {
    start: `${yearStr}-${monthStr}-01`,
    end: `${yearStr}-${monthStr}-${pad2(lastDay)}`,
  };
}

Deno.serve(async (req) => {
  const cors = corsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }

  // 認証: Bearer トークンを SHA-256 ハッシュ化して api_tokens と照合
  const authHeader = req.headers.get('authorization') ?? '';
  const match = authHeader.match(/^Bearer (.+)$/);
  if (!match) {
    return json({ error: 'unauthorized' }, 401, cors);
  }

  let userId: string;
  let tokenId: string;
  try {
    const tokenHash = await sha256Hex(match[1]);
    const { data: tokenRow } = await supabase
      .from('api_tokens')
      .select('id, user_id')
      .eq('token_hash', tokenHash)
      .maybeSingle();

    if (!tokenRow) {
      return json({ error: 'unauthorized' }, 401, cors);
    }
    userId = tokenRow.user_id;
    tokenId = tokenRow.id;
  } catch (err) {
    console.error('myos: auth lookup failed', err);
    return json({ error: 'internal error' }, 500, cors);
  }

  // last_used_at 更新は結果を待たず失敗も無視する
  supabase
    .from('api_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', tokenId)
    .then(undefined, () => {});

  const url = new URL(req.url);
  const route = url.pathname.replace(/^.*\/myos\/?/, '');

  if (!['summary', 'categories', 'events'].includes(route)) {
    return json({ error: 'not found' }, 404, cors);
  }
  if (req.method !== 'GET') {
    return json({ error: 'method not allowed' }, 405, cors);
  }

  try {
    if (route === 'summary') {
      return await handleSummary(url, userId, cors);
    }
    if (route === 'categories') {
      return await handleCategories(url, userId, cors);
    }
    return await handleEvents(url, userId, cors);
  } catch (err) {
    console.error('myos: request failed', err);
    return json({ error: 'internal error' }, 500, cors);
  }
});

// month/date クエリパラメータから期間を解決する。
// 両方または片方も指定されていない場合は null（呼び出し側で 400 を返す）。
function resolvePeriod(url: URL): { start: string; end: string; label: Record<string, string> } | null {
  const month = url.searchParams.get('month');
  const date = url.searchParams.get('date');

  if (month !== null && date !== null) return null;

  if (date !== null) {
    if (!DATE_RE.test(date)) return null;
    return { start: date, end: date, label: { date } };
  }

  if (month !== null) {
    if (!MONTH_RE.test(month)) return null;
    const { start, end } = monthRange(month);
    return { start, end, label: { month } };
  }

  return null;
}

async function handleSummary(url: URL, userId: string, cors: Record<string, string>): Promise<Response> {
  const period = resolvePeriod(url);
  if (!period) {
    return json({ error: 'invalid month or date' }, 400, cors);
  }
  const { start, end, label } = period;

  const { data, error } = await supabase.rpc('fn_profit_loss', {
    p_start_date: start,
    p_end_date: end,
    p_user_id: userId,
  });
  if (error) throw error;

  let income = 0;
  let expense = 0;
  for (const row of data ?? []) {
    if (row.category === 'Revenue') income += Number(row.sum_amount);
    if (row.category === 'Expense') expense += Number(row.sum_amount);
  }

  return json({ ...label, income, expense, net: income - expense }, 200, cors);
}

async function handleCategories(url: URL, userId: string, cors: Record<string, string>): Promise<Response> {
  const period = resolvePeriod(url);
  if (!period) {
    return json({ error: 'invalid month or date' }, 400, cors);
  }
  const { start, end, label } = period;

  const { data, error } = await supabase.rpc('fn_profit_loss', {
    p_start_date: start,
    p_end_date: end,
    p_user_id: userId,
  });
  if (error) throw error;

  const categories = (data ?? [])
    .filter((row: { category: string }) => row.category === 'Expense')
    .map((row: { name: string; sum_amount: number }) => ({ name: row.name, amount: Number(row.sum_amount) }))
    .sort((a: { amount: number }, b: { amount: number }) => b.amount - a.amount);

  return json({ ...label, categories }, 200, cors);
}

async function handleEvents(url: URL, userId: string, cors: Record<string, string>): Promise<Response> {
  const range = url.searchParams.get('range') ?? '';
  const parts = range.split('..');
  if (parts.length !== 2 || !DATE_RE.test(parts[0]) || !DATE_RE.test(parts[1]) || parts[0] > parts[1]) {
    return json({ error: 'invalid range' }, 400, cors);
  }
  const [startDate, endDate] = parts;

  const minAmountParam = url.searchParams.get('min_amount');
  const minAmount = minAmountParam === null ? 0 : Number(minAmountParam);
  if (Number.isNaN(minAmount)) {
    return json({ error: 'invalid min_amount' }, 400, cors);
  }

  const { data: accounts, error: accountsError } = await supabase
    .from('journal_accounts')
    .select('id, category')
    .eq('user_id', userId);
  if (accountsError) throw accountsError;

  const categoryByAccountId = new Map<string, string>((accounts ?? []).map((a: { id: string; category: string }) => [a.id, a.category]));

  const { data: entries, error: entriesError } = await supabase
    .from('journal_entries')
    .select('date, description, amount, debit_account_id')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .gte('amount', minAmount)
    .order('date', { ascending: true });
  if (entriesError) throw entriesError;

  const events = (entries ?? [])
    .filter((e: { debit_account_id: string }) => categoryByAccountId.get(e.debit_account_id) === 'Expense')
    .map((e: { date: string; description: string; amount: number }) => ({
      date: e.date,
      title: e.description,
      amount: -Number(e.amount),
    }));

  return json({ events }, 200, cors);
}
