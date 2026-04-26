import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { LocalizeText, NotificationBubbleItem, OpenUrl } from '../../../../api';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignCompactButton from '@/align-ui/components/ui/compact-button';
import { RiCloseLine, RiVipCrown2Fill } from '@remixicon/react';

const BUBBLE_EXIT_MS = 180;

export interface NotificationClubGiftBubbleViewProps
{
    item: NotificationBubbleItem;
    onClose: () => void;
}

const safeLocalize = (key: string, fallback: string): string =>
{
    const value = LocalizeText(key);
    return (!value || value === key) ? fallback : value;
};

export const NotificationClubGiftBubbleView: FC<NotificationClubGiftBubbleViewProps> = props =>
{
    const { item = null, onClose = null } = props;
    const [ isVisible, setIsVisible ] = useState(false);
    const isClosing = useRef(false);
    const closeTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

    const closeBubble = useCallback(() =>
    {
        if(isClosing.current) return;

        isClosing.current = true;
        setIsVisible(false);
        closeTimerRef.current = window.setTimeout(() => onClose?.(), BUBBLE_EXIT_MS);
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

    return (
        <div className={ `nitro-notification-bubble-card pointer-events-auto w-full max-w-sm overflow-hidden rounded-2xl bg-bg-white-0 shadow-regular-md ${ isVisible ? 'is-visible' : 'is-closing' }` }>
            <div className="grid grid-cols-[44px_minmax(0,1fr)_28px] items-start gap-3 px-3.5 pb-2 pt-3.5">
                <div className="flex size-11 items-center justify-center rounded-xl bg-warning-lighter text-warning-base">
                    <RiVipCrown2Fill className="size-6" />
                </div>
                <div className="flex min-w-0 flex-col gap-1">
                    <div className="text-subheading-2xs uppercase tracking-wider text-warning-base">{ safeLocalize('notifications.bubble.club_gift.eyebrow', 'VIP · Geschenk') }</div>
                    <div className="text-paragraph-sm leading-relaxed text-text-strong-950">{ LocalizeText('notifications.text.club_gift') }</div>
                </div>
                <AlignCompactButton.Root variant="ghost" size="medium" onClick={ closeBubble }>
                    <AlignCompactButton.Icon as={ RiCloseLine } />
                </AlignCompactButton.Root>
            </div>
            <div className="flex items-center gap-2 px-3.5 pb-3.5">
                <AlignButton.Root variant="primary" mode="filled" size="xsmall" className="flex-1" onClick={ () => OpenUrl(item.linkUrl) }>
                    { LocalizeText('notifications.button.show_gift_list') }
                </AlignButton.Root>
                <AlignButton.Root variant="neutral" mode="stroke" size="xsmall" className="flex-1" onClick={ closeBubble }>
                    { LocalizeText('notifications.button.later') }
                </AlignButton.Root>
            </div>
        </div>
    );
}
