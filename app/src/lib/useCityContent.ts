import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import {
  fallbackEmergencies,
  fallbackEvents,
  fallbackNews,
  type EmergencyNotice,
  type EventItem,
  type NewsItem,
} from "../data/fallbackContent";

export type DataSource = "supabase" | "fallback";

interface CityContent {
  news: NewsItem[];
  emergencies: EmergencyNotice[];
  events: EventItem[];
  source: DataSource;
}

const fallback: CityContent = {
  news: fallbackNews,
  emergencies: fallbackEmergencies,
  events: fallbackEvents,
  source: "fallback",
};

/**
 * 変数系コンテンツ（D01 緊急情報 / D02 新着情報 / D03 イベント）の取得。
 * Supabase 未接続・エラー時はフォールバックデータに切り替える。
 */
export function useCityContent(): CityContent {
  const [content, setContent] = useState<CityContent>(fallback);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;

    (async () => {
      const [newsRes, emgRes, eventRes] = await Promise.all([
        supabase
          .from("news")
          .select("id, title, url, category, published_at")
          .order("published_at", { ascending: false })
          .limit(10),
        supabase
          .from("emergency_notices")
          .select("id, title, url, severity, published_at")
          .eq("active", true)
          .order("published_at", { ascending: false }),
        supabase
          .from("events")
          .select("id, title, venue, url, starts_at")
          .gte("starts_at", new Date().toISOString().slice(0, 10))
          .order("starts_at", { ascending: true })
          .limit(6),
      ]);

      if (cancelled || newsRes.error || emgRes.error || eventRes.error) return;

      setContent({
        news: newsRes.data.map((r) => ({
          id: r.id,
          title: r.title,
          url: r.url,
          category: r.category,
          publishedAt: r.published_at,
        })),
        emergencies: emgRes.data.map((r) => ({
          id: r.id,
          title: r.title,
          url: r.url,
          severity: r.severity,
          publishedAt: r.published_at,
        })),
        events: eventRes.data.map((r) => ({
          id: r.id,
          title: r.title,
          venue: r.venue,
          url: r.url,
          startsAt: r.starts_at,
        })),
        source: "supabase",
      });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return content;
}
