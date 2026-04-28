import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LocalizeText, NotificationAlertItem, OpenUrl, parseNotificationMessages } from '../../../../api';
import * as AlignCompactButton from '@/align-ui/components/ui/compact-button';
import * as AlignLinkButton from '@/align-ui/components/ui/link-button';
import {
    RiArrowRightLine,
    RiCloseLine,
    RiMegaphoneFill,
} from '@remixicon/react';

const MOTD_EXIT_MS = 180;
const MIN_MOTD_DURATION_MS = 7000;
const MAX_MOTD_DURATION_MS = 16000;
const BASE_MOTD_DURATION_MS = 4200;
const MOTD_DURATION_PER_CHAR_MS = 38;

interface NotificationMotdAlertViewProps
{
    item: NotificationAlertItem;
    onClose: () => void;
}

const safeLocalize = (key: string, fallback: string): string =>
{
    const value = LocalizeText(key);
    return (!value || value === key) ? fallback : value;
};

const getMotdDuration = (messages: string[]) =>
{
    const characterCount = messages.reduce((total, message) => (total + (message?.length || 0)), 0);

    return Math.min(MAX_MOTD_DURATION_MS, Math.max(MIN_MOTD_DURATION_MS, BASE_MOTD_DURATION_MS + (characterCount * MOTD_DURATION_PER_CHAR_MS)));
}

export const NotificationMotdAlertView: FC<NotificationMotdAlertViewProps> = props =>
{
    const { item = null, onClose = null } = props;
    const [ isVisible, setIsVisible ] = useState(false);
    const isClosing = useRef(false);
    const closeTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

    const messages = item?.messages || [];
    const title = item?.title || safeLocalize('notifications.motd.title', 'Nachrichten für dich');
    const eyebrow = safeLocalize('notifications.motd.eyebrow', 'Bahhos · Tagesnachricht');

    const { body, sender } = useMemo(() => parseNotificationMessages(messages), [ messages ]);
    const displayDuration = useMemo(() => getMotdDuration(messages), [ messages ]);
    const hasClickUrl = !!item?.clickUrl?.length;
    const [ imageFailed, setImageFailed ] = useState(false);
    const hasImage = !!item?.imageUrl && !imageFailed;

    const closeToast = useCallback(() =>
    {
        if(isClosing.current) return;

        isClosing.current = true;
        setIsVisible(false);
        closeTimerRef.current = window.setTimeout(() => onClose?.(), MOTD_EXIT_MS);
    }, [ onClose ]);

    useEffect(() =>
    {
        const frame = window.requestAnimationFrame(() => setIsVisible(true));

        return () =>
        {
            window.cancelAnimationFrame(frame);
            if(closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
            setIsVisible(false);
        }
    }, []);

    const visitUrl = () =>
    {
        if(!hasClickUrl || !item?.clickUrl) return;

        OpenUrl(item.clickUrl);
        closeToast();
    }

    return (
        <div className={ `nitro-motd-toast pointer-events-auto w-full overflow-hidden rounded-xl bg-bg-white-0 shadow-regular-md ${ isVisible ? 'is-visible' : 'is-closing' }` } role="status" aria-live="polite">
            <div className="relative flex items-start gap-2.5 px-3.5 pt-3 pb-2.5 pr-10">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-information-lighter text-information-base">
                    { hasImage ? (
                        <img src={ item.imageUrl } alt="" onError={ () => setImageFailed(true) } className="h-full w-full object-cover" />
                    ) : (
                        <RiMegaphoneFill className="size-5" />
                    ) }
                </div>
                <div className="flex min-w-0 flex-col gap-0.5 flex-1">
                    <div className="text-[10px] uppercase tracking-[0.08em] text-text-soft-400">
                        { eyebrow }
                    </div>
                    <div className="text-label-sm leading-snug text-text-strong-950 truncate">{ title }</div>
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
            <div className="px-3.5 pb-3">
                <div className="max-h-24 space-y-1 overflow-y-auto pr-1 text-paragraph-xs leading-snug text-text-sub-600">
                    { body.length > 0
                        ? body.map((line, index) => <p key={ `${ item?.id ?? 'motd' }-${ index }` }>{ line }</p>)
                        : null
                    }
                </div>
                { sender && (
                    <div className="mt-1.5 text-right text-[10px] italic text-text-soft-400">
                        — { sender }
                    </div>
                ) }
            </div>
            { hasClickUrl && (
                <div className="flex items-center justify-end border-t border-stroke-soft-200 px-3.5 py-2">
                    <AlignLinkButton.Root variant="primary" size="medium" onClick={ visitUrl }>
                        { item.clickUrlText || LocalizeText('generic.more') }
                        <AlignLinkButton.Icon as={ RiArrowRightLine } />
                    </AlignLinkButton.Root>
                </div>
            ) }
            <div className="h-[3px] overflow-hidden bg-bg-soft-200" aria-hidden="true">
                <div
                    className="nitro-motd-toast-progress-bar h-full bg-information-base"
                    style={ { animationDuration: `${ displayDuration }ms` } }
                    onAnimationEnd={ closeToast }
                />
            </div>
        </div>
    );
}
