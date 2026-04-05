import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import { MonitorProvider } from "./features/monitor/MonitorContext";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MonitorProvider>
      <App />
    </MonitorProvider>
  </React.StrictMode>,
);

