import { FC, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronDown, Home, RefreshCw } from 'lucide-react';
import { RiAlertLine, RiArrowRightLine } from '@remixicon/react';
import bahhosLogo from '@/assets/images/brand/bahhos-logo.png';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignBadge from '@/align-ui/components/ui/badge';

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
    const message = error?.message ?? '';

    return (
        <div className="nitro-loading flex items-center justify-center bg-bg-weak-50 p-6">
            <div className="nitro-loading__grid" aria-hidden="true" />

            <motion.div
                initial={ { opacity: 0, y: 12 } }
                animate={ { opacity: 1, y: 0 } }
                transition={ { duration: 0.3, ease: [ 0.16, 1, 0.3, 1 ] } }
                className="relative z-[1] w-full max-w-[480px] rounded-3xl border border-stroke-soft-200 bg-bg-white-0 p-8 shadow-regular-md"
            >
                { /* Header */ }
                <div className="flex items-center gap-3">
                    <img
                        src={ bahhosLogo }
                        alt="Bahhos"
                        draggable={ false }
                        className="size-10 shrink-0"
                        style={ { imageRendering: 'pixelated' } }
                    />
                    <div className="flex min-w-0 flex-1 flex-col">
                        <div className="text-label-md font-semibold leading-tight text-text-strong-950">
                            BAHHOS
                        </div>
                        <div className="text-paragraph-xs text-text-soft-400">
                            Hotel · v1.0
                        </div>
                    </div>
                    <AlignBadge.Root color="red" variant="light" size="small">
                        <AlignBadge.Dot />
                        Fehler
                    </AlignBadge.Root>
                </div>

                <div className="my-6 h-px w-full bg-stroke-soft-200" />

                { /* Error Alert */ }
                <div className="flex flex-col gap-5">
                    <div className="flex items-start gap-3 rounded-2xl bg-error-lighter p-4">
                        <RiAlertLine className="mt-0.5 size-5 shrink-0 text-error-base" />
                        <div className="flex flex-col gap-1">
                            <div className="text-label-sm text-text-strong-950">
                                Etwas ist schiefgelaufen
                            </div>
                            <div className="text-paragraph-sm text-text-sub-600">
                                Der Client ist auf einen unerwarteten Fehler gestoßen. Lade die Seite neu, um fortzufahren.
                            </div>
                        </div>
                    </div>

                    { /* Auto-Reload Countdown */ }
                    { autoReloadSeconds > 0 && (
                        <div className="flex items-center justify-center gap-2 rounded-full bg-bg-weak-50 px-3 py-2 text-paragraph-xs text-text-sub-600">
                            { paused ? (
                                <span>Auto-Reload pausiert</span>
                            ) : (
                                <span>
                                    Automatischer Reload in <strong className="font-semibold text-text-strong-950">{ remaining }s</strong>
                                </span>
                            ) }
                            <span className="text-text-soft-400">·</span>
                            <button
                                type="button"
                                onClick={ togglePause }
                                className="font-medium text-primary-base underline-offset-2 hover:underline"
                            >
                                { paused ? 'Fortsetzen' : 'Anhalten' }
                            </button>
                        </div>
                    ) }

                    { /* Action Buttons */ }
                    <div className="flex flex-col gap-2">
                        <AlignButton.Root
                            variant="primary"
                            mode="filled"
                            size="medium"
                            onClick={ handleReload }
                            className="w-full"
                        >
                            <AlignButton.Icon as={ RefreshCw } className="size-4" />
                            Neu laden
                            <AlignButton.Icon as={ RiArrowRightLine } />
                        </AlignButton.Root>
                        <AlignButton.Root
                            variant="neutral"
                            mode="stroke"
                            size="medium"
                            onClick={ handleHome }
                            className="w-full"
                        >
                            <AlignButton.Icon as={ Home } className="size-4" />
                            Zur Startseite
                        </AlignButton.Root>
                    </div>

                    { /* Collapsible Technical Details */ }
                    { (stack || info || message) && (
                        <div className="border-t border-stroke-soft-200 pt-4">
                            <button
                                type="button"
                                onClick={ () => setShowDetails(v => !v) }
                                aria-expanded={ showDetails }
                                className="inline-flex items-center gap-1.5 text-paragraph-xs font-medium text-text-sub-600 transition-colors hover:text-text-strong-950"
                            >
                                <ChevronDown
                                    className={ `size-3.5 transition-transform ${ showDetails ? 'rotate-180' : '' }` }
                                />
                                Technische Details
                            </button>
                            { showDetails && (
                                <pre className="mt-2 max-h-[200px] overflow-auto whitespace-pre-wrap break-words rounded-xl bg-bg-weak-50 p-3 font-mono text-[11px] leading-relaxed text-text-sub-600">
                                    { message }{ stack ? `\n\n${ stack }` : '' }{ info ? `\n\n${ info }` : '' }
                                </pre>
                            ) }
                        </div>
                    ) }
                </div>

                { /* Footer */ }
                <div className="mt-7 flex items-center justify-center">
                    <div className="text-paragraph-xs uppercase tracking-[0.12em] text-text-soft-400">
                        Bahhos · Powered by Nitro
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
