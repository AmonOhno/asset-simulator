import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** エラー時に表示する内容。未指定の場合は既定のフォールバック画面を表示する */
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

const containerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "100vh",
  padding: "1rem",
  background: "#F3F4F6",
  color: "#111827",
  textAlign: "center",
};

/**
 * レンダリング中の例外でアプリ全体が真っ白になるのを防ぐエラーバウンダリ。
 * 想定外のデータ形状（例: 旧形式の永続データ）でクラッシュした場合でも、
 * 再読み込み手段とキャッシュ削除手段を利用者に提示する。
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Unhandled rendering error:", error, errorInfo.componentStack);
  }

  private handleReload = () => {
    window.location.reload();
  };

  // 破損した永続キャッシュが原因のことがあるため、localStorage を消してから再読み込みする
  private handleClearCache = () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error("Failed to clear localStorage:", error);
    }
    window.location.reload();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <main style={containerStyle}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
          画面の表示中にエラーが発生しました
        </h1>
        <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 24 }}>
          再読み込みしても直らない場合は、保存データを削除してから再読み込みしてください。
        </p>
        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          <button
            onClick={this.handleReload}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              background: "#4F46E5",
              color: "#FFFFFF",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            再読み込み
          </button>
          <button
            onClick={this.handleClearCache}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "1px solid #D1D5DB",
              background: "#FFFFFF",
              color: "#374151",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            保存データを削除して再読み込み
          </button>
        </div>
        <pre
          style={{
            maxWidth: "100%",
            overflowX: "auto",
            fontSize: 12,
            color: "#9CA3AF",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {error.message}
        </pre>
      </main>
    );
  }
}
