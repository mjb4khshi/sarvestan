import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.jsx"
import "./sarv-themes.css"
import "./index.css"
import { loadSnapshotData } from "./services/behestan/store"

if (import.meta.env.DEV) {
  window.__SARVESTAN_DEV__ = {
    load: async (name = 'hazf') => {
      try {
        const res = await fetch(`/dev-data/${name}.json`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        loadSnapshotData(data);
        console.log(`[Dev] داده‌های ${name}.json با موفقیت روی حافظه لوکال قرار گرفت.`);
      } catch (e) {
        console.error(`[Dev] خطا در بارگذاری داده‌های ${name}:`, e);
      }
    },
    loadHazf: () => window.__SARVESTAN_DEV__.load('hazf'),
    loadWait: () => window.__SARVESTAN_DEV__.load('wait'),
  };
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)