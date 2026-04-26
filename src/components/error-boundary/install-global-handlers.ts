import { reportClientError } from './report-client-error';

let installed = false;

/**
 * Installiert globale window-Handler für JS-Fehler die React Error-Boundaries
 * NICHT abfangen (async errors, Promise-Rejections, Event-Handler).
 *
 * Diese Errors werden ans CMS gemeldet, brechen aber NICHT die UI ab —
 * Render-Fehler werden weiterhin von der ErrorBoundary abgefangen.
 */
export function installGlobalErrorHandlers(): void
{
    if(installed || typeof window === 'undefined') return;
    installed = true;

    window.addEventListener('error', event =>
    {
        // Resource-Errors (img/script load fails) haben kein `error`-Property
        if(!event.error && !event.message) return;

        reportClientError({
            kind: 'window',
            message: event.message ?? String(event.error?.message ?? event.error ?? 'Unknown error'),
            stack: event.error?.stack ?? null,
        });
    });

    window.addEventListener('unhandledrejection', event =>
    {
        const reason: any = event.reason;
        const message =
            (reason && (reason.message ?? reason.toString?.())) ??
            'Unhandled Promise rejection';

        reportClientError({
            kind: 'unhandledrejection',
            message: String(message),
            stack: reason?.stack ?? null,
        });
    });
}
