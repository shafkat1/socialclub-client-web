import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

export function initSentry(dsn?: string) {
  if (!dsn) return;
  // Prevent double init
  if ((window as any).__sentry_inited) return;
  Sentry.init({
    dsn,
    integrations: [new BrowserTracing()],
    tracesSampleRate: 0.1,
    release: `web@${import.meta.env?.VITE_APP_VERSION || '1.0.0'}`,
    environment: import.meta.env?.MODE || 'development',
  });
  (window as any).__sentry_inited = true;
}


