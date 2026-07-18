import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  authenticateWithPasskey,
  passkeyAvailable,
  registerPasskey,
} from "../lib/passkey";

type Status =
  | { kind: "idle" }
  | { kind: "busy" }
  | { kind: "ok"; message: string }
  | { kind: "error"; message: string };

/** パスキー（WebAuthn）ログイン・登録ページ */
export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const available = passkeyAvailable();

  const onRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setStatus({ kind: "busy" });
    try {
      await registerPasskey(username.trim());
      setStatus({ kind: "ok", message: t("auth.success") });
    } catch (err) {
      setStatus({
        kind: "error",
        message: t("auth.error", { message: (err as Error).message }),
      });
    }
  };

  const onAuthenticate = async () => {
    setStatus({ kind: "busy" });
    try {
      await authenticateWithPasskey();
      setStatus({ kind: "ok", message: t("auth.success") });
      navigate("/");
    } catch (err) {
      setStatus({
        kind: "error",
        message: t("auth.error", { message: (err as Error).message }),
      });
    }
  };

  return (
    <main id="main" className="container">
      <div className="auth-card">
        <h1>{t("auth.passkeyTitle")}</h1>
        <p>{t("auth.passkeyDescription")}</p>
        {!available && <p className="auth-message">{t("auth.notConfigured")}</p>}
        <form onSubmit={onRegister}>
          <label htmlFor="username">{t("auth.username")}</label>
          <input
            id="username"
            name="username"
            autoComplete="username webauthn"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={!available || status.kind === "busy"}
          >
            {t("auth.register")}
          </button>
        </form>
        <button
          type="button"
          className="btn-secondary"
          onClick={onAuthenticate}
          disabled={!available || status.kind === "busy"}
        >
          {t("auth.authenticate")}
        </button>
        {(status.kind === "ok" || status.kind === "error") && (
          <p
            role="status"
            className={`auth-message${status.kind === "error" ? " auth-message--error" : ""}`}
          >
            {status.message}
          </p>
        )}
      </div>
    </main>
  );
}
