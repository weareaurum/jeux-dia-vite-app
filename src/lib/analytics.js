import posthog from "posthog-js";
import * as Sentry from "@sentry/react";

export function identify(user) {
  if (!user?.id) return;
  if (import.meta.env.VITE_POSTHOG_KEY) {
    posthog.identify(user.id, {
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      is_member: user.memberStatus === "active",
    });
  }
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.setUser({ id: user.id, email: user.email, username: user.name });
  }
}

export function reset() {
  if (import.meta.env.VITE_POSTHOG_KEY) posthog.reset();
  if (import.meta.env.VITE_SENTRY_DSN) Sentry.setUser(null);
}

export function track(event, props = {}) {
  if (import.meta.env.VITE_POSTHOG_KEY) posthog.capture(event, props);
}
