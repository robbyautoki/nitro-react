import { FC, useCallback, useEffect, useState } from 'react';
import { NotificationBubbleItem, NotificationBubbleType, OpenUrl } from '../../../../api';
import { TransitionAnimation, TransitionAnimationTypes } from '../../../../common/transitions';
import { Frame, FramePanel } from '../../../ui/frame';
import {
    Info, Users, UserMinus, Award, BadgeCheck, Heart, PawPrint, ShoppingBag,
    Crown, Music, Recycle, MessageCircle, X
} from 'lucide-react';

export interface NotificationDefaultBubbleViewProps
{
    item: NotificationBubbleItem;
    onClose: () => void;
}

const BUBBLE_ICON_MAP: Record<string, { icon: FC<any>; color: string }> = {
    [NotificationBubbleType.FRIENDONLINE]: { icon: Users, color: 'text-emerald-500' },
    [NotificationBubbleType.THIRDPARTYFRIENDONLINE]: { icon: Users, color: 'text-emerald-500' },
    [NotificationBubbleType.FRIENDOFFLINE]: { icon: UserMinus, color: 'text-gray-400' },
    [NotificationBubbleType.THIRDPARTYFRIENDOFFLINE]: { icon: UserMinus, color: 'text-gray-400' },
    [NotificationBubbleType.ACHIEVEMENT]: { icon: Award, color: 'text-amber-500' },
    [NotificationBubbleType.BADGE_RECEIVED]: { icon: BadgeCheck, color: 'text-blue-500' },
    [NotificationBubbleType.RESPECT]: { icon: Heart, color: 'text-pink-500' },
    [NotificationBubbleType.PETLEVEL]: { icon: PawPrint, color: 'text-emerald-500' },
    [NotificationBubbleType.BUYFURNI]: { icon: ShoppingBag, color: 'text-emerald-500' },
    [NotificationBubbleType.INFO]: { icon: Info, color: 'text-blue-500' },
    [NotificationBubbleType.RECYCLEROK]: { icon: Recycle, color: 'text-emerald-500' },
    [NotificationBubbleType.SOUNDMACHINE]: { icon: Music, color: 'text-purple-500' },
    [NotificationBubbleType.VIP]: { icon: Crown, color: 'text-amber-500' },
    [NotificationBubbleType.CLUB]: { icon: Crown, color: 'text-amber-500' },
    [NotificationBubbleType.ROOMMESSAGESPOSTED]: { icon: MessageCircle, color: 'text-blue-500' },
};

const BUBBLE_TITLE_MAP: Record<string, string> = {
    [NotificationBubbleType.FRIENDONLINE]: 'Freund online',
    [NotificationBubbleType.THIRDPARTYFRIENDONLINE]: 'Freund online',
    [NotificationBubbleType.FRIENDOFFLINE]: 'Freund offline',
    [NotificationBubbleType.THIRDPARTYFRIENDOFFLINE]: 'Freund offline',
    [NotificationBubbleType.ACHIEVEMENT]: 'Achievement freigeschaltet!',
    [NotificationBubbleType.BADGE_RECEIVED]: 'Neues Badge!',
    [NotificationBubbleType.RESPECT]: 'Respekt erhalten',
    [NotificationBubbleType.PETLEVEL]: 'Pet Level Up!',
    [NotificationBubbleType.BUYFURNI]: 'Möbel gekauft',
    [NotificationBubbleType.INFO]: 'Information',
    [NotificationBubbleType.RECYCLEROK]: 'Recycling abgeschlossen',
    [NotificationBubbleType.SOUNDMACHINE]: 'Soundmachine',
    [NotificationBubbleType.VIP]: 'VIP',
    [NotificationBubbleType.CLUB]: 'Club',
    [NotificationBubbleType.ROOMMESSAGESPOSTED]: 'Raum-Nachrichten',
};

export const NotificationDefaultBubbleView: FC<NotificationDefaultBubbleViewProps> = props =>
{
    const { item = null, onClose = null } = props;
    const [ isVisible, setIsVisible ] = useState(false);

    const htmlText = item.message.replace(/\r\n|\r|\n/g, '<br />');

    const iconEntry = BUBBLE_ICON_MAP[item.notificationType] || { icon: Info, color: 'text-blue-500' };
    const IconComponent = iconEntry.icon;
    const titleText = BUBBLE_TITLE_MAP[item.notificationType] || 'Notification';

    const handleClick = useCallback(() =>
    {
        if(item.linkUrl && item.linkUrl.length) OpenUrl(item.linkUrl);
        onClose();
    }, [ item, onClose ]);

    useEffect(() =>
    {
        setIsVisible(true);
        return () => setIsVisible(false);
    }, []);

    useEffect(() =>
    {
        const timeout = setTimeout(() =>
        {
            setIsVisible(false);
            setTimeout(() => onClose(), 300);
        }, 8000);

        return () => clearTimeout(timeout);
    }, [ onClose ]);

    return (
        <TransitionAnimation type={ TransitionAnimationTypes.FADE_IN } inProp={ isVisible } timeout={ 300 }>
            <div className="pointer-events-auto w-full max-w-xs cursor-pointer" onClick={ handleClick }>
                <Frame>
                    <FramePanel className="!p-0">
                        <div className="flex items-center gap-3 px-3.5 py-2.5">
                            { item.iconUrl && item.iconUrl.length
                                ? <img className="no-select size-5 shrink-0" src={ item.iconUrl } alt="" />
                                : <IconComponent className={ `size-4 shrink-0 ${iconEntry.color}` } />
                            }
                            <div className="min-w-0 flex-1">
                                <div className="text-xs font-semibold text-foreground truncate">{ titleText }</div>
                                <div className="text-xs text-muted-foreground truncate">
                                    <span dangerouslySetInnerHTML={ { __html: htmlText } } />
                                </div>
                            </div>
                            <button
                                className="p-0.5 rounded text-muted-foreground hover:text-foreground"
                                onClick={ (e) => { e.stopPropagation(); onClose(); } }
                            >
                                <X className="size-3" />
                            </button>
                        </div>
                    </FramePanel>
                </Frame>
            </div>
        </TransitionAnimation>
    );
}
