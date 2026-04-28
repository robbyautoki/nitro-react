import { FC, useMemo } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { LocalizeText, NotificationAlertItem, OpenUrl } from '../../../../api';
import { LayoutAvatarImageView } from '../../../../common';
import { DraggableWindow, DraggableWindowPosition } from '../../../../common/draggable-window';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignCompactButton from '@/align-ui/components/ui/compact-button';
import {
    RiArrowRightLine,
    RiCloseLine,
    RiMapPin2Line,
    RiTrophyFill,
    RiUserSmileFill,
} from '@remixicon/react';

interface NotificationEventAlertViewProps
{
    item: NotificationAlertItem;
    onClose: () => void;
}

const safeLocalize = (key: string, fallback: string): string =>
{
    const value = LocalizeText(key);
    return (!value || value === key) ? fallback : value;
};

/**
 * Strippt minimal-HTML aus dem Server-MESSAGE — Newlines bleiben erhalten,
 * <b>/<i>-Tags werden entfernt, <br> → \n. Defensiver Last-Resort-Strip
 * für übrig gebliebene `%token%`-Reste (Locale-Template Cleanup).
 */
const cleanEventMessage = (raw: string): string =>
{
    if(!raw) return '';
    return raw
        .replace(/<br\s*\/?>(\s*)/gi, '\n')
        .replace(/<\/?b>/gi, '')
        .replace(/<\/?i>/gi, '')
        .replace(/\r/g, '')
        .replace(/%[a-zA-Z_][a-zA-Z0-9_]*%/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
};

export const NotificationEventAlertView: FC<NotificationEventAlertViewProps> = props =>
{
    const { item = null, onClose = null } = props;
    const reduceMotion = useReducedMotion();

    const figure = item?.figure || null;
    const hostUsername = ((item as any)?.hostUsername as string) || '';
    const roomName = ((item as any)?.roomName as string) || '';

    const rawMessage = useMemo(() =>
    {
        const lines = (item?.messages || []).filter(Boolean);
        return cleanEventMessage(lines.join('\n'));
    }, [ item?.messages ]);

    const title = item?.title || safeLocalize('notification.hotel.event.title', 'Ein Event beginnt!');
    const eyebrow = safeLocalize('notifications.event.eyebrow', 'Live · Hotel-Event');
    const ctaLabel = item?.clickUrlText
        ? safeLocalize(item.clickUrlText, item.clickUrlText)
        : safeLocalize('notification.hotel.event.linkTitle', 'Los!');
    const incentiveLabel = safeLocalize('notifications.event.incentive', 'Mach mit und gewinne Preise');
    const messageHeading = safeLocalize('notifications.event.message.heading', 'Worum geht\'s?');
    const hostLabel = safeLocalize('notifications.event.host', 'Host');

    const visitUrl = () =>
    {
        if(item?.clickUrl) OpenUrl(item.clickUrl);
        onClose?.();
    };

    return (
        <DraggableWindow handleSelector=".drag-handler" windowPosition={ DraggableWindowPosition.CENTER }>
            <AnimatePresence>
                <motion.div
                    initial={ { opacity: 0, y: 8, scale: 0.98 } }
                    animate={ { opacity: 1, y: 0, scale: 1 } }
                    exit={ { opacity: 0, y: -4, scale: 0.98 } }
                    transition={ reduceMotion ? { duration: 0 } : { type: 'spring', damping: 24, stiffness: 280 } }
                    className="w-[520px] max-w-[calc(100vw-32px)]"
                >
                    <div className="relative overflow-hidden rounded-20 bg-bg-white-0 shadow-regular-md ring-1 ring-stroke-soft-200">
                        {/* === HERO (pure CSS Aurora) — always-dark Hintergrund (theme-stable) === */}
                        <div
                            className="drag-handler relative h-[148px] cursor-move overflow-hidden"
                            style={ { background: 'hsl(var(--align-neutral-950))' } }
                        >
                            {/* Aurora Layer 1 — animated conic blob (GPU-only rotate) */}
                            { !reduceMotion && (
                                <motion.div
                                    aria-hidden="true"
                                    className="absolute -inset-1/2 opacity-65"
                                    style={ {
                                        background:
                                            'conic-gradient(from 0deg at 50% 50%, transparent 0deg, hsl(var(--align-primary-base) / 0.55) 90deg, transparent 180deg, hsl(var(--align-warning-base) / 0.55) 270deg, transparent 360deg)',
                                        filter: 'blur(48px)',
                                        willChange: 'transform',
                                    } }
                                    animate={ { rotate: 360 } }
                                    transition={ { duration: 36, repeat: Infinity, ease: 'linear' } }
                                />
                            ) }
                            { reduceMotion && (
                                <div
                                    aria-hidden="true"
                                    className="absolute inset-0 opacity-55"
                                    style={ {
                                        background:
                                            'radial-gradient(120% 80% at 30% 30%, hsl(var(--align-primary-base) / 0.45) 0%, transparent 60%), radial-gradient(120% 80% at 80% 70%, hsl(var(--align-warning-base) / 0.45) 0%, transparent 60%)',
                                    } }
                                />
                            ) }

                            {/* Aurora Layer 2 — warning highlight oben rechts */}
                            <div
                                aria-hidden="true"
                                className="absolute inset-0"
                                style={ {
                                    background:
                                        'radial-gradient(120% 80% at 90% 0%, hsl(var(--align-warning-base) / 0.28) 0%, transparent 55%)',
                                } }
                            />

                            {/* Vignette / Floor — sauberer Übergang in Body (always-dark) */}
                            <div
                                aria-hidden="true"
                                className="absolute inset-x-0 bottom-0 h-1/2"
                                style={ { background: 'linear-gradient(to bottom, transparent 0%, hsl(var(--align-neutral-950) / 0.55) 100%)' } }
                            />

                            {/* Top accent bar */}
                            <div className="absolute inset-x-0 top-0 h-[3px] bg-warning-base" aria-hidden="true" />

                            {/* Content links: eyebrow + title */}
                            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 px-6 pb-5 pr-14">
                                <div className="min-w-0 flex-1">
                                    <div className="mb-1.5 flex items-center gap-2">
                                        <span className="relative flex h-2 w-2" aria-hidden="true">
                                            { !reduceMotion && (
                                                <motion.span
                                                    className="absolute inline-flex h-full w-full rounded-full bg-warning-base"
                                                    animate={ { scale: [ 1, 2, 1 ], opacity: [ 0.6, 0, 0.6 ] } }
                                                    transition={ { duration: 1.8, repeat: Infinity, ease: 'easeOut' } }
                                                />
                                            ) }
                                            <span className="relative inline-flex h-2 w-2 rounded-full bg-warning-base" />
                                        </span>
                                        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/85">
                                            { eyebrow }
                                        </span>
                                    </div>
                                    <h2 className="text-title-h5 font-semibold leading-tight text-white">
                                        { title }
                                    </h2>
                                </div>
                            </div>

                            {/* Close button */}
                            <AlignCompactButton.Root
                                variant="ghost"
                                size="medium"
                                className="absolute right-3 top-3 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                                onClick={ onClose }
                                onMouseDown={ (e) => e.stopPropagation() }
                                aria-label={ LocalizeText('generic.close') }
                            >
                                <AlignCompactButton.Icon as={ RiCloseLine } />
                            </AlignCompactButton.Root>
                        </div>

                        {/* === HOST-CARD === */}
                        <div className="flex items-center gap-4 px-6 pt-5">
                            <div className="relative size-16 shrink-0 overflow-hidden rounded-full bg-bg-weak-50 ring-2 ring-bg-white-0 shadow-regular-sm">
                                <div className="absolute inset-0 ring-1 ring-inset ring-stroke-soft-200 rounded-full pointer-events-none" />
                                { figure ? (
                                    <div className="flex size-full items-end justify-center overflow-hidden">
                                        <LayoutAvatarImageView figure={ figure } direction={ 2 } scale={ 0.55 } />
                                    </div>
                                ) : (
                                    <div className="flex size-full items-center justify-center text-text-soft-400">
                                        <RiUserSmileFill className="size-7" />
                                    </div>
                                ) }
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-text-soft-400">
                                    { hostLabel }
                                </div>
                                <div className="text-label-md font-medium text-text-strong-950 truncate">
                                    { hostUsername || safeLocalize('notifications.event.host.unknown', 'Habbo Host') }
                                </div>
                                { roomName && (
                                    <div className="mt-0.5 flex items-center gap-1 text-paragraph-xs text-text-sub-600 truncate">
                                        <RiMapPin2Line className="size-3.5 shrink-0 text-text-soft-400" />
                                        <span className="truncate">{ roomName }</span>
                                    </div>
                                ) }
                            </div>
                        </div>

                        {/* === MESSAGE BLOCK === */}
                        { rawMessage.length > 0 && (
                            <div className="px-6 pt-4">
                                <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-text-soft-400 mb-1.5">
                                    { messageHeading }
                                </div>
                                <div className="rounded-xl bg-bg-weak-50 px-4 py-3 ring-1 ring-inset ring-stroke-soft-200">
                                    <p className="whitespace-pre-line text-paragraph-sm leading-relaxed text-text-strong-950">
                                        { rawMessage }
                                    </p>
                                </div>
                            </div>
                        ) }

                        {/* === FOOTER === */}
                        <div className="mt-5 flex items-center justify-between gap-3 border-t border-stroke-soft-200 bg-bg-weak-50/50 px-6 py-3.5">
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-warning-lighter px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-warning-base">
                                <RiTrophyFill className="size-3" />
                                { incentiveLabel }
                            </div>
                            { item?.clickUrl && item.clickUrl.length > 0 && (
                                <AlignButton.Root
                                    variant="primary"
                                    mode="filled"
                                    size="medium"
                                    className="min-w-[112px] shrink-0"
                                    onClick={ visitUrl }
                                >
                                    { ctaLabel }
                                    <AlignButton.Icon as={ RiArrowRightLine } />
                                </AlignButton.Root>
                            ) }
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </DraggableWindow>
    );
}
