import { FC, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { LocalizeText, NotificationAlertItem, NotificationAlertType, OpenUrl } from '../../../../api';
import { Base, Button, LayoutAvatarImageView, LayoutNotificationAlertViewProps } from '../../../../common';

interface NotificationDefaultAlertViewProps extends LayoutNotificationAlertViewProps
{
    item: NotificationAlertItem;
}

export const NotificationDefaultAlertView: FC<NotificationDefaultAlertViewProps> = props =>
{
    const { item = null, title = ((props.item && props.item.title) || ''), onClose = null } = props;
    const [ imageFailed, setImageFailed ] = useState<boolean>(false);

    const hasFrank = (item.alertType === NotificationAlertType.DEFAULT) && !item.figure;
    const hasAvatar = !!item.figure;
    const hasSidebar = hasFrank || hasAvatar;

    const visitUrl = () =>
    {
        OpenUrl(item.clickUrl);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-auto">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={ onClose } />

            {/* outer ring */}
            <div className="relative w-[420px] rounded-2xl border border-white/[0.08] bg-white/[0.04] p-0.5 shadow-2xl">
                {/* inner panel */}
                <div className="relative overflow-hidden rounded-[14px] border border-white/[0.06] bg-[rgba(12,12,16,0.97)] before:pointer-events-none before:absolute before:inset-0 before:rounded-[13px] before:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-gradient-to-b from-white/[0.06] to-transparent">
                        <span className="text-sm font-semibold text-white/90 tracking-tight">{ title }</span>
                        <button
                            className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.08] transition-all"
                            onClick={ onClose }
                        >
                            <FaTimes className="size-3" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className={ hasSidebar && !item.imageUrl ? 'flex' : 'px-4 py-4' }>
                        { hasAvatar && !item.imageUrl && (
                            <div className="relative w-[90px] shrink-0 flex items-center justify-center overflow-hidden pointer-events-none">
                                <LayoutAvatarImageView figure={ item.figure } direction={ 2 } />
                            </div>
                        ) }
                        { hasFrank && !item.imageUrl && (
                            <div className="relative w-[90px] shrink-0 flex items-end justify-center pb-2 overflow-hidden pointer-events-none">
                                <div
                                    className="absolute inset-0"
                                    style={ {
                                        backgroundImage: `linear-gradient(45deg, transparent 49%, rgba(255,255,255,0.04) 49%, rgba(255,255,255,0.04) 51%, transparent 51%), linear-gradient(-45deg, transparent 49%, rgba(255,255,255,0.04) 49%, rgba(255,255,255,0.04) 51%, transparent 51%)`,
                                        backgroundSize: '20px 20px',
                                    } }
                                />
                                <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-[rgba(12,12,16,0.8)] to-transparent" />
                                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[rgba(12,12,16,0.95)] to-transparent" />
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-10 bg-blue-500/10 blur-xl rounded-full" />
                                <Base className="notification-frank relative z-10 shrink-0" />
                            </div>
                        ) }

                        { item.imageUrl && !imageFailed &&
                            <img
                                src={ item.imageUrl }
                                alt={ item.title }
                                onError={ () => setImageFailed(true) }
                                className="self-center rounded-lg max-h-24 object-contain mx-4 mt-4"
                            />
                        }

                        {/* Text + Button */}
                        <div className={ `flex flex-col gap-3 min-w-0 ${ hasSidebar && !item.imageUrl ? 'px-4 py-4' : '' }` }>
                            <div className="flex flex-col gap-1 text-sm text-white/75 leading-relaxed">
                                { item.messages.map((message, index) =>
                                {
                                    const htmlText = message.replace(/\r\n|\r|\n/g, '<br />');
                                    return <div key={ index } dangerouslySetInnerHTML={ { __html: htmlText } } />;
                                }) }
                            </div>
                            <div>
                                { !item.clickUrl &&
                                    <Button fullWidth size="lg" onClick={ onClose }>{ LocalizeText('generic.close') }</Button> }
                                { item.clickUrl && item.clickUrl.length > 0 &&
                                    <Button fullWidth size="lg" onClick={ visitUrl }>{ LocalizeText(item.clickUrlText) }</Button> }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
