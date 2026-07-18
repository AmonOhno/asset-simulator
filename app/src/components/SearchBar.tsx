import { useMemo, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { categories, popularMenus, wards } from "../data/siteData";

/**
 * F05: サイト内検索。現行サイトは全文検索だが、本デモでは
 * 収集済みリンク集（実URL）に対するクライアントサイド検索。
 * D05: 検索結果（入力に応じて変化する変数要素）。
 */
export function SearchBar() {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");

  const corpus = useMemo(() => [...categories, ...popularMenus, ...wards], []);

  const results = useMemo(() => {
    if (!submitted) return null;
    const q = submitted.toLowerCase();
    return corpus.filter(
      (item) =>
        item.title.includes(submitted) ||
        item.titleEn.toLowerCase().includes(q) ||
        (item.description ?? "").includes(submitted),
    );
  }, [submitted, corpus]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(query.trim());
  };

  return (
    <div className="container">
      <form data-ui="F05" className="search-form" role="search" onSubmit={onSubmit}>
        <label htmlFor="site-search" className="visually-hidden">
          {t("search.label")}
        </label>
        <input
          id="site-search"
          type="search"
          placeholder={t("search.placeholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit">{t("search.button")}</button>
      </form>
      {results && (
        <div data-ui="D05" className="search-results" role="status">
          {results.length > 0 ? (
            <>
              <span>{t("search.resultCount", { count: results.length })}</span>
              <ul>
                {results.map((r) => (
                  <li key={r.id}>
                    <a href={r.url}>
                      {i18n.language === "en" ? r.titleEn : r.title}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <span>{t("search.noResult", { query: submitted })}</span>
          )}
        </div>
      )}
    </div>
  );
}
