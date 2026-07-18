import { useTranslation } from "react-i18next";

/** F03: 言語切替（I18N）。現行サイトは機械翻訳リンク方式、本デモは react-i18next。 */
export function LangSwitcher() {
  const { t, i18n } = useTranslation();
  const next = i18n.language === "ja" ? "en" : "ja";

  return (
    <div data-ui="F03" role="group" aria-label={t("lang.switchLabel")}>
      <button
        type="button"
        className="utility-btn"
        lang={next}
        onClick={() => i18n.changeLanguage(next)}
      >
        {t(`lang.${next}`)}
      </button>
    </div>
  );
}
