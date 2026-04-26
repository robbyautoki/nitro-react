import { useEffect, useState } from 'react';
import {
    applyClientEffects,
    DEFAULT_EXTENDED_SETTINGS,
    EXTENDED_SETTINGS_EVENT,
    ExtendedSettings,
    fetchExtendedSettings,
} from '../api';

let cachedSettings: ExtendedSettings | null = null;
let pendingFetch: Promise<ExtendedSettings> | null = null;

async function loadOnce(): Promise<ExtendedSettings>
{
    if(cachedSettings) return cachedSettings;
    if(!pendingFetch)
    {
        pendingFetch = fetchExtendedSettings()
            .then(settings =>
            {
                cachedSettings = settings;
                applyClientEffects(settings);
                return settings;
            })
            .finally(() =>
            {
                pendingFetch = null;
            });
    }

    return pendingFetch;
}

/**
 * Loads the user's extended settings (from CMS) once per session and applies
 * them as `data-bahhos-*` attributes on the <html> root, so SCSS can react to
 * them. Listens for `bahhos:extended-settings-changed` window events so the
 * client refreshes immediately after the CMS settings modal saves.
 */
export const useExtendedSettings = (): ExtendedSettings =>
{
    const [ settings, setSettings ] = useState<ExtendedSettings>(cachedSettings || DEFAULT_EXTENDED_SETTINGS);

    useEffect(() =>
    {
        let cancelled = false;

        loadOnce().then(next =>
        {
            if(cancelled) return;
            setSettings(next);
        });

        const handler = (event: Event) =>
        {
            const detail = (event as CustomEvent<Partial<ExtendedSettings>>).detail;
            if(!detail) return;

            cachedSettings = { ...DEFAULT_EXTENDED_SETTINGS, ...cachedSettings, ...detail };
            applyClientEffects(cachedSettings);
            setSettings(cachedSettings);
        };

        window.addEventListener(EXTENDED_SETTINGS_EVENT, handler as EventListener);

        // Cross-window event from the CMS iframe: the CMS dispatches
        // `bahhos:settings-updated` with the extended payload.
        window.addEventListener('bahhos:settings-updated', handler as EventListener);

        return () =>
        {
            cancelled = true;
            window.removeEventListener(EXTENDED_SETTINGS_EVENT, handler as EventListener);
            window.removeEventListener('bahhos:settings-updated', handler as EventListener);
        };
    }, []);

    return settings;
};

export function getCachedExtendedSettings(): ExtendedSettings
{
    return cachedSettings ?? DEFAULT_EXTENDED_SETTINGS;
}
