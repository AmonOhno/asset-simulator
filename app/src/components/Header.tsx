import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { A11yToolbar } from "./A11yToolbar";
import { LangSwitcher } from "./LangSwitcher";
import { supabase } from "../lib/supabase";
import { signOut } from "../lib/passkey";

export function Header() {
  const { t } = useTranslation();
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      setUserName(data.user?.user_metadata?.username ?? data.user?.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserName(
        session?.user?.user_metadata?.username ?? session?.user?.email ?? null,
      );
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <header className="site-header">
      <div className="container">
        <div className="site-header__utility">
          {/* D04: 認証状態（変数） */}
          <div data-ui="D04" className="auth-status" aria-live="polite">
            {userName ? (
              <>
                <span>{t("auth.loggedInAs", { name: userName })}</span>
                <button type="button" className="utility-btn" onClick={() => signOut()}>
                  {t("auth.logout")}
                </button>
              </>
            ) : (
              <Link data-ui="F13" className="utility-btn" to="/login">
                {t("auth.login")}
              </Link>
            )}
          </div>
          <LangSwitcher />
          <A11yToolbar />
        </div>
        <div className="site-header__main">
          {/* F01: サイトロゴ・市名 */}
          <Link data-ui="F01" className="site-logo" to="/">
            <span className="site-logo__mark" aria-hidden="true">彩</span>
            <span>
              <span className="site-logo__name">{t("siteName")}</span>
              <span className="site-logo__tagline">{t("siteTagline")}</span>
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
