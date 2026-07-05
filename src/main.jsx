import React from "react";
import ReactDOM from "react-dom/client";
import * as Sentry from "@sentry/react";
import posthog from "posthog-js";
import App from "./App.jsx";

// Sentry — error tracking
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.2,
  });
}

// PostHog — product analytics
if (import.meta.env.VITE_POSTHOG_KEY) {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || "https://eu.i.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: true,
  });
}

const SentryApp = import.meta.env.VITE_SENTRY_DSN
  ? Sentry.withProfiler(App)
  : App;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: 16, fontFamily: "sans-serif" }}>
        <div style={{ fontSize: 48 }}>⚠️</div>
        <h2 style={{ margin: 0 }}>Une erreur inattendue s'est produite.</h2>
        <button onClick={() => window.location.reload()} style={{ padding: "10px 24px", borderRadius: 8, cursor: "pointer" }}>
          Recharger la page
        </button>
      </div>
    }>
      <SentryApp />
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
