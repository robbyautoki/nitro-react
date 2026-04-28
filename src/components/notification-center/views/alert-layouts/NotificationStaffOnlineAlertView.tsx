import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LocalizeText, NotificationAlertItem } from '../../../../api';
import * as AlignCompactButton from '@/align-ui/components/ui/compact-button';
import { RiCloseLine, RiShieldStarFill } from '@remixicon/react';

const STAFF_EXIT_MS = 200;
const STAFF_DURATION_MS = 9000;

interface NotificationStaffOnlineAlertViewProps
{
    item: NotificationAlertItem;
    onClose: () => void;
}

const resolveRankAccent = (rank: number) =>
{
    // Owner = lila, Admin = gold, sonst Mod = blau
    if(rank >= 19) return { ringClass: 'staff-online-ring--owner', glowClass: 'staff-online-glow--owner', label: 'Owner' };
    if(rank >= 7)  return { ringClass: 'staff-online-ring--admin', glowClass: 'staff-online-glow--admin', label: 'Admin' };
    if(rank >= 5)  return { ringClass: 'staff-online-ring--mod',   glowClass: 'staff-online-glow--mod',   label: 'Moderator' };
    return { ringClass: 'staff-online-ring--mod', glowClass: 'staff-online-glow--mod', label: 'Staff' };
}

export const NotificationStaffOnlineAlertView: FC<NotificationStaffOnlineAlertViewProps> = props =>
{
    const { item = null, onClose = null } = props;
    const [ isVisible, setIsVisible ] = useState(false);
    const isClosing = useRef(false);
    const closeTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
    const [ imageFailed, setImageFailed ] = useState(false);

    const rank = ((item as any)?.rank as number) ?? 5;
    const rankLabel = ((item as any)?.rankLabel as string) ?? 'Staff';
    const accent = useMemo(() => resolveRankAccent(rank), [ rank ]);

    const messages = item?.messages || [];
    const headline = messages[0] ?? `${ rankLabel } online`;
    const subline = messages[1] ?? '';
    const title = item?.title || headline;
    const hasImage = !!item?.imageUrl && !imageFailed;

    const closeToast = useCallback(() =>
    {
        if(isClosing.current) return;
        isClosing.current = true;
        setIsVisible(false);
        closeTimerRef.current = window.setTimeout(() => onClose?.(), STAFF_EXIT_MS);
    }, [ onClose ]);

    useEffect(() =>
    {
        const frame = window.requestAnimationFrame(() => setIsVisible(true));
        const auto = window.setTimeout(() => closeToast(), STAFF_DURATION_MS);

        return () =>
        {
            window.cancelAnimationFrame(frame);
            window.clearTimeout(auto);
            if(closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
        }
    }, [ closeToast ]);

    return (
        <div
            className={ `staff-online-toast pointer-events-auto w-full overflow-hidden rounded-xl bg-bg-white-0 shadow-regular-md ${ accent.glowClass } ${ isVisible ? 'is-visible' : 'is-closing' }` }
            role="status"
            aria-live="polite"
        >
            <div className="staff-online-toast__shimmer" aria-hidden="true" />

            <div className="relative flex items-center gap-2.5 px-3 py-2.5 pr-10">
                <div className={ `staff-online-avatar relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-bg-soft-200 ${ accent.ringClass }` }>
                    { hasImage ? (
                        <img
                            src={ item.imageUrl }
                            alt=""
                            onError={ () => setImageFailed(true) }
                            className="h-full w-full object-cover"
                            style={ { imageRendering: 'pixelated' } }
                        />
                    ) : (
                        <RiShieldStarFill className="size-5 text-text-strong-950" />
                    ) }
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className={ `staff-online-eyebrow inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.08em]` }>
                        <RiShieldStarFill className="size-2.5" />
                        <span>{ rankLabel }</span>
                    </div>
                    <div className="text-label-sm leading-snug text-text-strong-950 truncate">{ title }</div>
                    { subline && (
                        <div className="text-paragraph-xs leading-snug text-text-sub-600 truncate">{ subline }</div>
                    ) }
                </div>

                <AlignCompactButton.Root
                    variant="ghost"
                    size="medium"
                    className="absolute right-2 top-2"
                    aria-label={ LocalizeText('generic.close') }
                    onClick={ closeToast }
                >
                    <AlignCompactButton.Icon as={ RiCloseLine } />
                </AlignCompactButton.Root>
            </div>

            <div className="staff-online-toast__progress" aria-hidden="true">
                <div
                    className="staff-online-toast__progress-bar"
                    style={ { animationDuration: `${ STAFF_DURATION_MS }ms` } }
                />
            </div>
        </div>
    );
}
