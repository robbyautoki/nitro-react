import { FC, useEffect, useState } from 'react';
import { LocalizeText, NotificationBubbleItem, OpenUrl } from '../../../../api';
import { TransitionAnimation, TransitionAnimationTypes } from '../../../../common/transitions';
import { Frame, FramePanel } from '../../../ui/frame';
import { Button } from '../../../ui/button';
import { Crown } from 'lucide-react';

export interface NotificationClubGiftBubbleViewProps
{
    item: NotificationBubbleItem;
    onClose: () => void;
}

export const NotificationClubGiftBubbleView: FC<NotificationClubGiftBubbleViewProps> = props =>
{
    const { item = null, onClose = null } = props;
    const [ isVisible, setIsVisible ] = useState(false);

    useEffect(() =>
    {
        setIsVisible(true);
        return () => setIsVisible(false);
    }, []);

    return (
        <TransitionAnimation type={ TransitionAnimationTypes.FADE_IN } inProp={ isVisible } timeout={ 300 }>
            <div className="pointer-events-auto w-full max-w-xs">
                <Frame>
                    <FramePanel className="!p-0">
                        <div className="px-3.5 py-2.5 space-y-2">
                            <div className="flex items-center gap-2">
                                <Crown className="size-4 text-amber-500 shrink-0" />
                                <span className="text-xs font-semibold text-foreground">{ LocalizeText('notifications.text.club_gift') }</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button size="sm" className="flex-1 h-7 text-xs" onClick={ () => OpenUrl(item.linkUrl) }>
                                    { LocalizeText('notifications.button.show_gift_list') }
                                </Button>
                                <button className="text-xs text-muted-foreground hover:text-foreground underline" onClick={ onClose }>
                                    { LocalizeText('notifications.button.later') }
                                </button>
                            </div>
                        </div>
                    </FramePanel>
                </Frame>
            </div>
        </TransitionAnimation>
    );
}
