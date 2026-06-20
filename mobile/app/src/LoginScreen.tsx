import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useAuthStore } from "@asset-simulator/shared";

export default function LoginScreen() {
  const client = useAuthStore((s) => s.client);

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "#F3F4F6",
        color: "#111827",
        padding: "1rem",
      }}
    >
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: "#4B5563" }}>
        会計＆資産シミュレーター
      </h1>
      <p style={{ color: "#6B7280", marginBottom: 32, fontSize: 14 }}>ログインしてください</p>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <Auth
          supabaseClient={client}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: { brand: "#3B82F6", brandAccent: "#2563EB" },
              },
            },
          }}
          providers={["google", "github"]}
        />
      </div>
    </main>
  );
}
