import { useTranslation } from "react-i18next";
import { categories, popularMenus, wards, footerLinks, CITY_ORIGIN } from "../data/siteData";
import type {
  EmergencyNotice,
  EventItem,
  NewsItem,
} from "../data/fallbackContent";
import type { DataSource } from "../lib/useCityContent";

/** F06: グローバルナビ（分野別・実リンク） */
export function GlobalNav() {
  const { t, i18n } = useTranslation();
  const en = i18n.language === "en";
  return (
    <nav data-ui="F06" className="global-nav" aria-label={t("nav.title")}>
      <ul>
        {categories.map((c) => (
          <li key={c.id}>
            <a href={c.url}>{en ? c.titleEn : c.title}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** D01: 緊急情報バナー（Supabase: emergency_notices） */
export function EmergencyBanner({ notices }: { notices: EmergencyNotice[] }) {
  const { t } = useTranslation();
  if (notices.length === 0) return null;
  return (
    <section
      data-ui="D01"
      className="emergency-banner container"
      aria-labelledby="emergency-title"
    >
      <span id="emergency-title" className="emergency-banner__label">
        {t("emergency.title")}
      </span>
      <ul>
        {notices.map((n) => (
          <li key={n.id}>
            {n.url ? <a href={n.url}>{n.title}</a> : n.title}
          </li>
        ))}
      </ul>
    </section>
  );
}

function SourceNote({ source }: { source: DataSource }) {
  const { t } = useTranslation();
  return (
    <p className="data-source-note">
      {source === "supabase" ? t("dataSource.live") : t("dataSource.fallback")}
    </p>
  );
}

/** D02: 新着情報リスト（Supabase: news） */
export function NewsSection({
  news,
  source,
}: {
  news: NewsItem[];
  source: DataSource;
}) {
  const { t } = useTranslation();
  return (
    <section className="home-section" aria-labelledby="news-title">
      <h2 id="news-title">{t("sections.news")}</h2>
      <ul data-ui="D02" className="news-list">
        {news.map((n) => (
          <li key={n.id}>
            <a href={n.url}>
              <time dateTime={n.publishedAt}>{n.publishedAt}</time>
              <span className="news-category">{n.category}</span>
              {n.title}
            </a>
          </li>
        ))}
      </ul>
      <p>
        <a href={`${CITY_ORIGIN}/news.html`}>{t("sections.newsMore")}</a>
      </p>
      <SourceNote source={source} />
    </section>
  );
}

/** D03: イベント情報（Supabase: events） */
export function EventsSection({
  events,
  source,
}: {
  events: EventItem[];
  source: DataSource;
}) {
  const { t } = useTranslation();
  return (
    <section className="home-section" aria-labelledby="events-title">
      <h2 id="events-title">{t("sections.events")}</h2>
      <ul data-ui="D03" className="event-list">
        {events.map((ev) => (
          <li key={ev.id} className="event-card">
            <time dateTime={ev.startsAt}>{ev.startsAt}</time>
            <div>{ev.url ? <a href={ev.url}>{ev.title}</a> : ev.title}</div>
            <div>{ev.venue}</div>
          </li>
        ))}
      </ul>
      <SourceNote source={source} />
    </section>
  );
}

/** F08: カテゴリグリッド（実リンク） */
export function CategoryGrid() {
  const { t, i18n } = useTranslation();
  const en = i18n.language === "en";
  return (
    <section className="home-section" aria-labelledby="categories-title">
      <h2 id="categories-title">{t("sections.categories")}</h2>
      <ul data-ui="F08" className="card-grid">
        {categories.map((c) => (
          <li key={c.id}>
            <a href={c.url}>
              <span className="card-title">{en ? c.titleEn : c.title}</span>
              {c.description && !en && (
                <span className="card-desc">{c.description}</span>
              )}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** F09: 10区の区役所グリッド（実リンク） */
export function WardGrid() {
  const { t, i18n } = useTranslation();
  const en = i18n.language === "en";
  return (
    <section className="home-section" aria-labelledby="wards-title">
      <h2 id="wards-title">{t("sections.wards")}</h2>
      <ul data-ui="F09" className="card-grid card-grid--wards">
        {wards.map((w) => (
          <li key={w.id}>
            <a href={w.url}>
              <span className="card-title">{en ? w.titleEn : w.title}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** F10: よく利用されるメニュー（実リンク） */
export function PopularMenus() {
  const { t, i18n } = useTranslation();
  const en = i18n.language === "en";
  return (
    <section className="home-section" aria-labelledby="popular-title">
      <h2 id="popular-title">{t("sections.popular")}</h2>
      <ul data-ui="F10" className="card-grid">
        {popularMenus.map((m) => (
          <li key={m.id}>
            <a href={m.url}>
              <span className="card-title">{en ? m.titleEn : m.title}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** F11: フッターリンク / F12: 所在地・著作権 */
export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="site-footer">
      <div className="container">
        <nav aria-label={t("footer.links")}>
          <ul data-ui="F11" className="site-footer__links">
            {footerLinks.map((l) => (
              <li key={l.id}>
                <a href={l.url}>{l.title}</a>
              </li>
            ))}
          </ul>
        </nav>
        <div data-ui="F12">
          <address className="site-footer__address">
            {t("footer.address")}
            <br />
            {t("footer.tel")}
          </address>
          <p className="site-footer__copyright">
            {t("footer.copyright")}
            <br />
            {t("footer.disclaimer")}
          </p>
        </div>
      </div>
    </footer>
  );
}
