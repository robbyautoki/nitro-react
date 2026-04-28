import { FC, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { RiAlertLine, RiArrowRightLine, RiInformationLine } from '@remixicon/react';
import * as AlignProgress from '@/align-ui/components/ui/progress-bar';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import { SlidingNumber } from '../ui/sliding-number';
import bahhosIcon from '@/assets/images/brand/bahhos-icon.png';

interface LoadingViewProps
{
    isError: boolean;
    message: string;
    percent: number;
}

const LOADING_TIPS = [
    'Willkommen bei Bahhos!',
    'Gestalte deinen eigenen Raum',
    'Triff neue Freunde im Hotel',
    'Sammle seltene Möbel',
    'Erstelle deine eigene Gruppe',
    'Entdecke Events und Spiele',
    'Handle mit anderen Habbos',
    'Werde kreativ mit Wired',
];

interface PhaseInfo
{
    label: string;
    step: number;
}

const getPhase = (percent: number): PhaseInfo =>
{
    if(percent >= 100) return { label: 'Bereit', step: 5 };
    if(percent >= 91) return { label: 'Letzter Schliff', step: 5 };
    if(percent >= 71) return { label: 'Synchronisiere Daten', step: 4 };
    if(percent >= 41) return { label: 'Lade Avatare und Möbel', step: 3 };
    if(percent >= 16) return { label: 'Lade Räume und Inventar', step: 2 };
    return { label: 'Verbinden mit Hotel', step: 1 };
};

export const LoadingView: FC<LoadingViewProps> = props =>
{
    const { isError = false, message = '', percent = 0 } = props;
    const [ tipIndex, setTipIndex ] = useState(0);

    useEffect(() =>
    {
        if(isError) return;
        const interval = setInterval(() => setTipIndex(prev => (prev + 1) % LOADING_TIPS.length), 4000);
        return () => clearInterval(interval);
    }, [ isError ]);

    const clampedPercent = Math.min(Math.max(percent, 0), 100);
    const phase = useMemo(() => getPhase(clampedPercent), [ clampedPercent ]);

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
                        src={ bahhosIcon }
                        alt="Bahhos"
                        draggable={ false }
                        className="size-10 shrink-0 rounded-[10px] ring-1 ring-stroke-soft-200"
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
                    { isError ? (
                        <AlignBadge.Root color="red" variant="light" size="small">
                            <AlignBadge.Dot />
                            Fehler
                        </AlignBadge.Root>
                    ) : (
                        <AlignBadge.Root color="blue" variant="light" size="small">
                            <AlignBadge.Dot />
                            Lädt
                        </AlignBadge.Root>
                    ) }
                </div>

                <div className="my-6 h-px w-full bg-stroke-soft-200" />

                { isError ? (
                    <div className="flex flex-col gap-5">
                        <div className="flex items-start gap-3 rounded-2xl bg-error-lighter p-4">
                            <RiAlertLine className="mt-0.5 size-5 shrink-0 text-error-base" />
                            <div className="flex flex-col gap-1">
                                <div className="text-label-sm text-text-strong-950">
                                    Verbindung fehlgeschlagen
                                </div>
                                <div className="text-paragraph-sm text-text-sub-600">
                                    { message || 'Die Verbindung zum Hotel konnte nicht hergestellt werden.' }
                                </div>
                            </div>
                        </div>
                        <AlignButton.Root
                            variant="primary"
                            mode="filled"
                            size="medium"
                            onClick={ () => window.location.reload() }
                            className="w-full"
                        >
                            Erneut versuchen
                            <AlignButton.Icon as={ RiArrowRightLine } />
                        </AlignButton.Root>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        { /* Phase + percent */ }
                        <div className="flex items-baseline justify-between gap-3">
                            <div className="flex flex-col gap-0.5 min-w-0">
                                <div className="text-paragraph-xs uppercase tracking-[0.08em] text-text-soft-400">
                                    Schritt { phase.step } von 5
                                </div>
                                <div className="text-label-md text-text-strong-950 truncate">
                                    { phase.label }
                                </div>
                            </div>
                            <div className="flex items-baseline gap-0.5 tabular-nums text-text-strong-950">
                                <span className="text-2xl font-semibold leading-none">
                                    <SlidingNumber value={ Math.round(clampedPercent) } />
                                </span>
                                <span className="text-label-sm text-text-sub-600">%</span>
                            </div>
                        </div>

                        { /* Progress */ }
                        <AlignProgress.Root value={ clampedPercent } color="blue" className="h-2" />

                        { /* Tip */ }
                        <div className="mt-1 flex min-h-[20px] items-center gap-2 text-text-sub-600">
                            <RiInformationLine className="size-4 shrink-0 text-text-soft-400" />
                            <AnimatePresence mode="wait">
                                <motion.span
                                    key={ tipIndex }
                                    initial={ { opacity: 0, y: 4 } }
                                    animate={ { opacity: 1, y: 0 } }
                                    exit={ { opacity: 0, y: -4 } }
                                    transition={ { duration: 0.35, ease: 'easeOut' } }
                                    className="text-paragraph-sm"
                                >
                                    { LOADING_TIPS[tipIndex] }
                                </motion.span>
                            </AnimatePresence>
                        </div>
                    </div>
                ) }

                <div className="mt-7 flex items-center justify-center">
                    <div className="text-paragraph-xs uppercase tracking-[0.12em] text-text-soft-400">
                        Bahhos · Powered by Nitro
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
