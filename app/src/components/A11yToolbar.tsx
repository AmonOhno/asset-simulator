import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * F04: 文字サイズ・色合い切替（現行サイトのアクセシビリティ機能を踏襲）。
 * 設定は localStorage に保存し、html 要素の data 属性で全体に適用する。
 */
export function A11yToolbar() {
  const { t } = useTranslation();
  const [fontScale, setFontScale] = useState(
    () => localStorage.getItem("fontScale") ?? "normal",
  );
  const [contrast, setContrast] = useState(
    () => localStorage.getItem("contrast") ?? "normal",
  );

  useEffect(() => {
    document.documentElement.dataset.fontScale = fontScale;
    localStorage.setItem("fontScale", fontScale);
  }, [fontScale]);

  useEffect(() => {
    document.documentElement.dataset.contrast = contrast;
    localStorage.setItem("contrast", contrast);
  }, [contrast]);

  return (
    <div data-ui="F04" role="group" aria-label={`${t("a11y.fontSize")} / ${t("a11y.contrast")}`}>
      <button
        type="button"
        className="utility-btn"
        aria-pressed={fontScale === "large"}
        onClick={() => setFontScale(fontScale === "large" ? "normal" : "large")}
      >
        {t("a11y.fontSize")}: {fontScale === "large" ? t("a11y.fontSizeLarge") : t("a11y.fontSizeNormal")}
      </button>
      <button
        type="button"
        className="utility-btn"
        aria-pressed={contrast === "high"}
        onClick={() => setContrast(contrast === "high" ? "normal" : "high")}
      >
        {t("a11y.contrast")}: {contrast === "high" ? t("a11y.contrastHigh") : t("a11y.contrastNormal")}
      </button>
    </div>
  );
}
