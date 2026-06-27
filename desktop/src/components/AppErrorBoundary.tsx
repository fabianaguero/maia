import React from "react";
import { BrandLockup } from "./Branding";
import { I18nContext } from "../i18n/I18nContext";

interface AppErrorBoundaryState {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class AppErrorBoundary extends React.Component<
  React.PropsWithChildren,
  AppErrorBoundaryState
> {
  static contextType = I18nContext;
  declare context: React.ContextType<typeof I18nContext>;

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
    const t = this.context;
    if (!error) {
      return this.props.children;
    }

    return (
      <div className="app-error-boundary">
        <div className="app-error-boundary__panel">
          <div className="app-error-boundary__header">
            <BrandLockup
              className="app-error-boundary__brand"
              wordmarkClassName="app-error-boundary__brand-wordmark"
            />
            <span className="app-error-boundary__eyebrow">
              {t.simpleMode.runtime.desktopRuntime}
            </span>
          </div>
          <div className="app-error-boundary__banner">
            {t.simpleMode.runtime.uiRuntimeError}
          </div>
          <div className="app-error-boundary__body">
            <div className="app-error-boundary__title">
              {t.simpleMode.runtime.crashedWhileRendering}
            </div>
            <div className="app-error-boundary__copy">
              {t.simpleMode.runtime.blackScreenReplacement}
            </div>
            <pre className="app-error-boundary__stack">
              {error.stack || error.message}
            </pre>
            {errorInfo?.componentStack ? (
              <pre className="app-error-boundary__component-stack">
                {errorInfo.componentStack}
              </pre>
            ) : null}
          </div>
        </div>
      </div>
    );
  }
}
