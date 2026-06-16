import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useAuthStore } from "@asset-simulator/shared";
export default function LoginScreen() {
    const client = useAuthStore((s) => s.client);
    return (_jsxs("main", { style: {
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
            background: "#F3F4F6",
            color: "#111827",
            padding: "1rem",
        }, children: [_jsx("h1", { style: { fontSize: 24, fontWeight: 700, marginBottom: 8, color: "#4B5563" }, children: "\u4F1A\u8A08\uFF06\u8CC7\u7523\u30B7\u30DF\u30E5\u30EC\u30FC\u30BF\u30FC" }), _jsx("p", { style: { color: "#6B7280", marginBottom: 32, fontSize: 14 }, children: "\u30ED\u30B0\u30A4\u30F3\u3057\u3066\u304F\u3060\u3055\u3044" }), _jsx("div", { style: { width: "100%", maxWidth: 400 }, children: _jsx(Auth, { supabaseClient: client, appearance: {
                        theme: ThemeSupa,
                        variables: {
                            default: {
                                colors: { brand: "#3B82F6", brandAccent: "#2563EB" },
                            },
                        },
                    }, providers: ["google", "github"] }) })] }));
}
