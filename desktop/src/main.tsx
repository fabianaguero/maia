import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App-v0";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { MonitorProvider } from "./features/monitor/MonitorContext";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <MonitorProvider>
        <App />
      </MonitorProvider>
    </AppErrorBoundary>
  </React.StrictMode>,
);
