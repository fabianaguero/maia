import React from "react";

interface AppErrorBoundaryState {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class AppErrorBoundary extends React.Component<
  React.PropsWithChildren,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    error: null,
    errorInfo: null,
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[MAIA:UI] React render error", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    const { error, errorInfo } = this.state;
    if (!error) {
      return this.props.children;
    }

    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(180deg, #070b10 0%, #020305 100%)",
          color: "#e5edf7",
          padding: "32px",
          fontFamily: "'IBM Plex Mono', monospace",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "min(960px, 100%)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "16px",
            background: "rgba(9,14,19,0.92)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              color: "#ff8a94",
              fontSize: "12px",
              letterSpacing: "0.12em",
            }}
          >
            MAIA UI RUNTIME ERROR
          </div>
          <div style={{ padding: "20px" }}>
            <div style={{ fontSize: "18px", marginBottom: "12px", color: "#ffffff" }}>
              The desktop UI crashed while rendering.
            </div>
            <div
              style={{ fontSize: "13px", color: "rgba(229,237,247,0.72)", marginBottom: "16px" }}
            >
              This replaces the previous black screen so the runtime error is visible.
            </div>
            <pre
              style={{
                margin: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontSize: "12px",
                lineHeight: 1.5,
                color: "#ffd7dc",
              }}
            >
              {error.stack || error.message}
            </pre>
            {errorInfo?.componentStack ? (
              <pre
                style={{
                  marginTop: "16px",
                  paddingTop: "16px",
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontSize: "11px",
                  lineHeight: 1.45,
                  color: "rgba(229,237,247,0.58)",
                }}
              >
                {errorInfo.componentStack}
              </pre>
            ) : null}
          </div>
        </div>
      </div>
    );
  }
}
