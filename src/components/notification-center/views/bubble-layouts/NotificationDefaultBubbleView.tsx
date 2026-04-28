import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { NotificationBubbleItem, NotificationBubbleType, OpenUrl } from '../../../../api';
import * as AlignCompactButton from '@/align-ui/components/ui/compact-button';
import {
    RiAwardFill,
    RiCheckboxCircleFill,
    RiChat3Fill,
    RiCloseLine,
    RiHeart3Fill,
    RiInformation2Fill,
    RiMedalFill,
    RiMusic2Fill,
    RiRecycleFill,
    RiShoppingBag3Fill,
    RiUserAddFill,
    RiUserStarFill,
    RiUserUnfollowFill,
    RiVipCrown2Fill,
    type RemixiconComponentType,
} from '@remixicon/react';

const BUBBLE_EXIT_MS = 180;

export interface NotificationDefaultBubbleViewProps
{
    item: NotificationBubbleItem;
    onClose: () => void;
}

type BubbleTone = 'error' | 'warning' | 'success' | 'information' | 'feature' | 'neutral';

interface BubbleConfig
{
    icon: RemixiconComponentType;
    tone: BubbleTone;
    eyebrow: string;
}

const TONE_CLASSES: Record<BubbleTone, { tile: string; eyebrow: string; bar: string }> = {
    error: { tile: 'bg-error-lighter text-error-base', eyebrow: 'text-error-base', bar: 'bg-error-base' },
    warning: { tile: 'bg-warning-lighter text-warning-base', eyebrow: 'text-warning-base', bar: 'bg-warning-base' },
    success: { tile: 'bg-success-lighter text-success-base', eyebrow: 'text-success-base', bar: 'bg-success-base' },
    information: { tile: 'bg-information-lighter text-information-base', eyebrow: 'text-information-base', bar: 'bg-information-base' },
    feature: { tile: 'bg-faded-lighter text-faded-base', eyebrow: 'text-faded-base', bar: 'bg-faded-base' },
    neutral: { tile: 'bg-bg-weak-50 text-text-sub-600 ring-1 ring-inset ring-stroke-soft-200', eyebrow: 'text-text-sub-600', bar: 'bg-text-sub-600' },
};

const BUBBLE_CONFIG_MAP: Record<string, BubbleConfig> = {
    [NotificationBubbleType.FRIENDONLINE]:                  { icon: RiUserAddFill,         tone: 'success',     eyebrow: 'Freund · Online' },
    [NotificationBubbleType.THIRDPARTYFRIENDONLINE]:        { icon: RiUserAddFill,         tone: 'success',     eyebrow: 'Freund · Online' },
    [NotificationBubbleType.FRIENDOFFLINE]:                 { icon: RiUserUnfollowFill,    tone: 'feature',     eyebrow: 'Freund · Offline' },
    [NotificationBubbleType.THIRDPARTYFRIENDOFFLINE]:       { icon: RiUserUnfollowFill,    tone: 'feature',     eyebrow: 'Freund · Offline' },
    [NotificationBubbleType.ACHIEVEMENT]:                   { icon: RiAwardFill,           tone: 'warning',     eyebrow: 'Achievement · Freigeschaltet' },
    [NotificationBubbleType.BADGE_RECEIVED]:                { icon: RiMedalFill,           tone: 'information', eyebrow: 'Badge · Neu' },
    [NotificationBubbleType.RESPECT]:                       { icon: RiHeart3Fill,          tone: 'warning',     eyebrow: 'Respekt · Erhalten' },
    [NotificationBubbleType.PETLEVEL]:                      { icon: RiUserStarFill,        tone: 'success',     eyebrow: 'Pet · Level Up' },
    [NotificationBubbleType.BUYFURNI]:                      { icon: RiShoppingBag3Fill,    tone: 'success',     eyebrow: 'Möbel · Gekauft' },
    [NotificationBubbleType.INFO]:                          { icon: RiInformation2Fill,    tone: 'information', eyebrow: 'Information' },
    [NotificationBubbleType.RECYCLEROK]:                    { icon: RiRecycleFill,         tone: 'success',     eyebrow: 'Recycling · Fertig' },
    [NotificationBubbleType.SOUNDMACHINE]:                  { icon: RiMusic2Fill,          tone: 'feature',     eyebrow: 'Soundmachine' },
    [NotificationBubbleType.VIP]:                           { icon: RiVipCrown2Fill,       tone: 'warning',     eyebrow: 'VIP' },
    [NotificationBubbleType.CLUB]:                          { icon: RiVipCrown2Fill,       tone: 'warning',     eyebrow: 'Club' },
    [NotificationBubbleType.ROOMMESSAGESPOSTED]:            { icon: RiChat3Fill,           tone: 'information', eyebrow: 'Raum · Nachrichten' },
};

const DEFAULT_CONFIG: BubbleConfig = { icon: RiCheckboxCircleFill, tone: 'information', eyebrow: 'Benachrichtigung' };

export const NotificationDefaultBubbleView: FC<NotificationDefaultBubbleViewProps> = props =>
{
    const { item = null, onClose = null } = props;
    const [ isVisible, setIsVisible ] = useState(false);
    const [ imageFailed, setImageFailed ] = useState(false);
    const isClosing = useRef(false);
    const closeTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

    const htmlText = (item.message || '').replace(/\r\n|\r|\n/g, '<br />');

    const config = BUBBLE_CONFIG_MAP[item.notificationType] || DEFAULT_CONFIG;
    const toneClasses = TONE_CLASSES[config.tone];
    const useCustomIcon = !!(item.iconUrl && item.iconUrl.length && !imageFailed);
    const Icon = config.icon;

    const closeBubble = useCallback(() =>
    {
        if(isClosing.current) return;

        isClosing.current = true;
        setIsVisible(false);
        closeTimerRef.current = window.setTimeout(() => onClose(), BUBBLE_EXIT_MS);
    }, [ onClose ]);

    const handleClick = useCallback(() =>
    {
        if(item.linkUrl && item.linkUrl.length) OpenUrl(item.linkUrl);
        closeBubble();
    }, [ item, closeBubble ]);

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
        <div
            className={ `nitro-notification-bubble-card pointer-events-auto w-full max-w-[340px] cursor-pointer overflow-hidden rounded-xl bg-bg-white-0 shadow-regular-md ${ isVisible ? 'is-visible' : 'is-closing' }` }
            onClick={ handleClick }
        >
            <div className="grid grid-cols-[36px_minmax(0,1fr)_24px] items-start gap-2.5 px-3 py-2.5">
                <div className={ `flex size-9 items-center justify-center overflow-hidden rounded-lg ${ useCustomIcon ? 'bg-bg-weak-50 ring-1 ring-inset ring-stroke-soft-200' : toneClasses.tile }` }>
                    { useCustomIcon ? (
                        <img
                            src={ item.iconUrl }
                            alt=""
                            className="h-full w-full object-cover"
                            onError={ () => setImageFailed(true) }
                        />
                    ) : (
                        <Icon className="size-4" />
                    ) }
                </div>
                <div className="flex min-w-0 flex-col gap-0.5">
                    <div className={ `text-[10px] uppercase tracking-[0.08em] ${ toneClasses.eyebrow }` }>{ config.eyebrow }</div>
                    <div className="text-paragraph-xs leading-snug text-text-strong-950">
                        <span dangerouslySetInnerHTML={ { __html: htmlText } } />
                    </div>
                </div>
                <AlignCompactButton.Root
                    variant="ghost"
                    size="medium"
                    onClick={ (e) =>
                    {
                        e.stopPropagation();
                        closeBubble();
                    } }
                >
                    <AlignCompactButton.Icon as={ RiCloseLine } />
                </AlignCompactButton.Root>
            </div>
            <div className="nitro-notification-bubble-progress">
                <div
                    className={ `nitro-notification-bubble-progress-bar ${ toneClasses.bar }` }
                    style={ { animationDuration: '8000ms' } }
                    onAnimationEnd={ closeBubble }
                />
            </div>
        </div>
    );
}
