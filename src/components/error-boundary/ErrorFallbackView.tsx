import { FC, useEffect, useState } from 'react';
import { AlertTriangle, ChevronDown, Home, RefreshCw } from 'lucide-react';
import bahhosLogo from '@/assets/images/brand/bahhos-logo.png';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignSurface from '@/align-ui/components/ui/surface';

interface ErrorFallbackViewProps
{
    error: Error | null;
    info?: string | null;
    /** Auto-Reload-Countdown in Sekunden. 0 = deaktiviert. */
    autoReloadSeconds?: number;
}

const HOME_URL = (() =>
{
    if(typeof window === 'undefined') return 'https://www.bahhos.de';
    return window.location.hostname === 'localhost' ? 'http://localhost:3030' : 'https://www.bahhos.de';
})();

export const ErrorFallbackView: FC<ErrorFallbackViewProps> = ({ error, info, autoReloadSeconds = 30 }) =>
{
    const [ remaining, setRemaining ] = useState(autoReloadSeconds);
    const [ paused, setPaused ] = useState(false);
    const [ showDetails, setShowDetails ] = useState(false);

    useEffect(() =>
    {
        if(autoReloadSeconds <= 0 || paused) return;

        if(remaining <= 0)
        {
            window.location.reload();
            return;
        }

        const id = setTimeout(() => setRemaining(r => r - 1), 1000);
        return () => clearTimeout(id);
    }, [ remaining, paused, autoReloadSeconds ]);

    const handleReload = () => window.location.reload();
    const handleHome = () => { window.location.href = HOME_URL; };
    const togglePause = () => setPaused(p => !p);

    const stack = error?.stack ?? null;

    return (
        <div className="nitro-error-overlay">
            <div className="nitro-error-mesh" aria-hidden="true" />
            <div className="nitro-error-noise" aria-hidden="true" />

            <AlignSurface.Panel className="nitro-error-box">
                <img
                    src={ bahhosLogo }
                    alt="Bahhos.de"
                    draggable={ false }
                    className="nitro-error-logo"
                    style={ { imageRendering: 'pixelated' } }
                />

                <div className="nitro-error-icon">
                    <AlertTriangle className="size-7" />
                </div>

                <div className="nitro-error-title">Etwas ist schiefgelaufen</div>
                <div className="nitro-error-message">
                    Der Client ist auf einen unerwarteten Fehler gestoßen. Lade die Seite neu, um fortzufahren.
                </div>

                { autoReloadSeconds > 0 && (
                    <div className="nitro-error-countdown">
                        { paused
                            ? <span>Auto-Reload pausiert</span>
                            : <span>Automatischer Reload in <strong>{ remaining }s</strong></span> }
                        <button type="button" className="nitro-error-pause" onClick={ togglePause }>
                            { paused ? 'Fortsetzen' : 'Anhalten' }
                        </button>
                    </div>
                ) }

                <div className="nitro-error-buttons">
                    <AlignButton.Root type="button" variant="primary" mode="filled" size="medium" className="w-full" onClick={ handleReload }>
                        <AlignButton.Icon as={ RefreshCw } className="size-4" />
                        Neu laden
                    </AlignButton.Root>
                    <AlignButton.Root type="button" variant="neutral" mode="stroke" size="medium" className="w-full" onClick={ handleHome }>
                        <AlignButton.Icon as={ Home } className="size-4" />
                        Zur Startseite
                    </AlignButton.Root>
                </div>

                { (stack || info) && (
                    <div className="nitro-error-details">
                        <button
                            type="button"
                            className="nitro-error-details-toggle"
                            onClick={ () => setShowDetails(v => !v) }
                            aria-expanded={ showDetails }
                        >
                            <ChevronDown className={ `size-3.5 transition-transform ${ showDetails ? 'rotate-180' : '' }` } />
                            Technische Details
                        </button>
                        { showDetails && (
                            <pre className="nitro-error-stack">
                                { (error?.message ?? '') }{ stack ? `\n\n${ stack }` : '' }{ info ? `\n\n${ info }` : '' }
                            </pre>
                        ) }
                    </div>
                ) }
            </AlignSurface.Panel>
        </div>
    );
}
