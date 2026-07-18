-- シードデータ（app/src/data/fallbackContent.ts と同一内容を保つこと）
-- URL はすべて現行さいたま市公式サイトの実在ページ（WebSearch で確認済み）

insert into public.news (title, url, category, published_at) values
  ('新着情報一覧はこちら（現行サイト）', 'https://www.city.saitama.lg.jp/news.html', 'お知らせ', '2026-07-01'),
  ('市報さいたま 最新号のご案内', 'https://www.city.saitama.lg.jp/006/014/010/001/index.html', '広報', '2026-07-01'),
  ('子育てに関する援助のご案内', 'https://www.city.saitama.lg.jp/003/001/011/index.html', '子育て', '2026-06-15');

insert into public.emergency_notices (title, url, severity, active, published_at) values
  ('（デモ）緊急情報はここに表示されます。災害・防災情報の確認先はこちら', 'https://www.city.saitama.lg.jp/', 'warning', true, '2026-07-01');

insert into public.events (title, venue, url, starts_at) values
  ('（デモ）区役所休日窓口', '各区役所', 'https://www.city.saitama.lg.jp/008/001/index.html', '2026-07-26'),
  ('（デモ）市民健康まつり', '市内会場', 'https://www.city.saitama.lg.jp/002/index.html', '2026-08-02');
