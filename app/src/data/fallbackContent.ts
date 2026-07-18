/**
 * Supabase 未接続時のフォールバックデータ。
 * supabase/seed.sql と同一内容を保つこと（変数系 UI: D01〜D03 のデモ用）。
 * 実運用では Supabase (ローカル: supabase start) から取得する。
 */
export interface NewsItem {
  id: string;
  title: string;
  url: string;
  category: string;
  publishedAt: string; // ISO 8601
}

export interface EmergencyNotice {
  id: string;
  title: string;
  url: string | null;
  severity: "info" | "warning" | "critical";
  publishedAt: string;
}

export interface EventItem {
  id: string;
  title: string;
  venue: string;
  url: string | null;
  startsAt: string;
}

export const fallbackNews: NewsItem[] = [
  {
    id: "news_demo_1",
    title: "新着情報一覧はこちら（現行サイト）",
    url: "https://www.city.saitama.lg.jp/news.html",
    category: "お知らせ",
    publishedAt: "2026-07-01",
  },
  {
    id: "news_demo_2",
    title: "市報さいたま 最新号のご案内",
    url: "https://www.city.saitama.lg.jp/006/014/010/001/index.html",
    category: "広報",
    publishedAt: "2026-07-01",
  },
  {
    id: "news_demo_3",
    title: "子育てに関する援助のご案内",
    url: "https://www.city.saitama.lg.jp/003/001/011/index.html",
    category: "子育て",
    publishedAt: "2026-06-15",
  },
];

export const fallbackEmergencies: EmergencyNotice[] = [
  {
    id: "emg_demo_1",
    title: "（デモ）緊急情報はここに表示されます。災害・防災情報の確認先はこちら",
    url: "https://www.city.saitama.lg.jp/",
    severity: "warning",
    publishedAt: "2026-07-01",
  },
];

export const fallbackEvents: EventItem[] = [
  {
    id: "event_demo_1",
    title: "（デモ）区役所休日窓口",
    venue: "各区役所",
    url: "https://www.city.saitama.lg.jp/008/001/index.html",
    startsAt: "2026-07-26",
  },
  {
    id: "event_demo_2",
    title: "（デモ）市民健康まつり",
    venue: "市内会場",
    url: "https://www.city.saitama.lg.jp/002/index.html",
    startsAt: "2026-08-02",
  },
];
