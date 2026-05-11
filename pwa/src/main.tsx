import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    const scope = import.meta.env.BASE_URL;
    navigator.serviceWorker.register(`${scope}sw.js`, { scope }).catch(() => {
      // The app remains usable if service worker registration is blocked.
    });
  });
}
