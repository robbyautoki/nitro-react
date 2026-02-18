import { Info } from 'lucide-react';
import { FC, useCallback, useEffect, useState } from 'react';
import { NotificationBubbleItem, OpenUrl } from '../../../../api';
import { TransitionAnimation, TransitionAnimationTypes } from '../../../../common/transitions';

export interface NotificationDefaultBubbleViewProps
{
    item: NotificationBubbleItem;
    onClose: () => void;
}

export const NotificationDefaultBubbleView: FC<NotificationDefaultBubbleViewProps> = props =>
{
    const { item = null, onClose = null } = props;
    const [ isVisible, setIsVisible ] = useState(false);

    // Content is server-provided and pre-sanitized via cleanText() in useNotification hook.
    const htmlText = item.message.replace(/\r\n|\r|\n/g, '<br />');

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
            <div
                className="pointer-events-auto w-full cursor-pointer"
                onClick={ handleClick }
            >
                <div className="relative texture-panel backdrop-blur-xl rounded-2xl overflow-hidden">
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={ {
                            backgroundImage: `
                                linear-gradient(45deg, transparent 49%, rgba(255,255,255,0.045) 49%, rgba(255,255,255,0.045) 51%, transparent 51%),
                                linear-gradient(-45deg, transparent 49%, rgba(255,255,255,0.045) 49%, rgba(255,255,255,0.045) 51%, transparent 51%)
                            `,
                            backgroundSize: '24px 24px',
                            maskImage: 'radial-gradient(ellipse 90% 90% at 0% 100%, #000 40%, transparent 85%)',
                            WebkitMaskImage: 'radial-gradient(ellipse 90% 90% at 0% 100%, #000 40%, transparent 85%)',
                        } }
                    />
                    <div className="relative flex items-center gap-3 px-4 py-3.5">
                        { (item.iconUrl && item.iconUrl.length)
                            ? <img className="no-select size-5 shrink-0" src={ item.iconUrl } alt="" />
                            : <Info className="size-5 shrink-0 text-blue-400" />
                        }
                        <div className="flex flex-col gap-0.5 min-w-0">
                            <div className="text-sm font-semibold tracking-wide text-white">Notification</div>
                            <div className="text-sm text-white/60 leading-relaxed">
                                <span dangerouslySetInnerHTML={ { __html: htmlText } } />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </TransitionAnimation>
    );
}
