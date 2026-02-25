import { FC, useState } from 'react';
import { LocalizeText, NotificationAlertItem, NotificationAlertType, OpenUrl } from '../../../../api';
import { LayoutAvatarImageView } from '../../../../common';
import { DraggableWindow, DraggableWindowPosition } from '../../../../common/draggable-window';
import { Frame, FramePanel } from '../../../ui/frame';
import { Button } from '../../../ui/button';
import { AlertTriangle, ShieldAlert, Server, Wrench, X, ExternalLink } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '../../../ui/alert';

interface NotificationDefaultAlertViewProps
{
    item: NotificationAlertItem;
    onClose: () => void;
}

export const NotificationDefaultAlertView: FC<NotificationDefaultAlertViewProps> = props =>
{
    const { item = null, onClose = null } = props;
    const [ imageFailed, setImageFailed ] = useState(false);

    const title = item.title || LocalizeText('notifications.broadcast.title');
    const isModeration = (item.alertType === NotificationAlertType.MODERATION);
    const isAlert = (item.alertType === NotificationAlertType.ALERT);
    const hasFrank = (item.alertType === NotificationAlertType.DEFAULT) && !item.figure;
    const hasAvatar = !!item.figure;

    const visitUrl = () =>
    {
        OpenUrl(item.clickUrl);
        onClose();
    };

    if (isAlert)
    {
        return (
            <DraggableWindow handleSelector=".drag-handler" windowPosition={ DraggableWindowPosition.CENTER }>
                <div className="w-[420px]">
                    <Frame className="relative">
                        <div className="drag-handler absolute inset-0 cursor-move" />
                        <FramePanel className="overflow-hidden p-0! relative z-10">
                            <Alert variant="destructive" className="border-0 shadow-none rounded-none">
                                <AlertTriangle className="size-4" />
                                <AlertTitle>{ title }</AlertTitle>
                                <AlertDescription>
                                    { item.messages.map((message, index) =>
                                    {
                                        const htmlText = message.replace(/\r\n|\r|\n/g, '<br />');
                                        return <span key={ index } dangerouslySetInnerHTML={ { __html: htmlText } } />;
                                    }) }
                                </AlertDescription>
                            </Alert>
                            <div className="px-4 pb-3">
                                <Button variant="destructive" className="w-full" size="sm" onClick={ onClose }>{ LocalizeText('generic.close') }</Button>
                            </div>
                        </FramePanel>
                    </Frame>
                </div>
            </DraggableWindow>
        );
    }

    return (
        <DraggableWindow handleSelector=".drag-handler" windowPosition={ DraggableWindowPosition.CENTER }>
            <div className="w-[420px]">
                <Frame className="relative">
                    <div className="drag-handler absolute inset-0 cursor-move" />
                    <FramePanel className="overflow-hidden p-0! relative z-10">
                        <div className="flex items-center justify-between px-4 py-2.5 border-b">
                            <div className="flex items-center gap-2">
                                { isModeration && <ShieldAlert className="size-4 text-red-500" /> }
                                <span className="text-sm font-semibold">{ title }</span>
                            </div>
                            <button className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" onClick={ onClose }>
                                <X className="size-3.5" />
                            </button>
                        </div>

                        <div className={ hasAvatar && !item.imageUrl ? 'flex' : '' }>
                            { hasAvatar && !item.imageUrl && (
                                <div className="relative w-[90px] shrink-0 flex items-center justify-center overflow-hidden pointer-events-none bg-muted/20">
                                    <LayoutAvatarImageView figure={ item.figure } direction={ 2 } />
                                </div>
                            ) }

                            { item.imageUrl && !imageFailed && (
                                <div className="px-4 pt-3 flex justify-center">
                                    <img
                                        src={ item.imageUrl }
                                        alt={ title }
                                        onError={ () => setImageFailed(true) }
                                        className="rounded-lg max-h-24 object-contain"
                                    />
                                </div>
                            ) }

                            <div className="px-4 py-3 flex flex-col gap-3">
                                <div className="text-sm text-muted-foreground leading-relaxed">
                                    { item.messages.map((message, index) =>
                                    {
                                        const htmlText = message.replace(/\r\n|\r|\n/g, '<br />');
                                        return <div key={ index } dangerouslySetInnerHTML={ { __html: htmlText } } />;
                                    }) }
                                </div>
                            </div>
                        </div>

                        <div className="px-4 pb-3">
                            { !item.clickUrl && (
                                <Button className="w-full" size="sm" onClick={ onClose }>{ LocalizeText('generic.close') }</Button>
                            ) }
                            { item.clickUrl && item.clickUrl.length > 0 && isModeration && (
                                <Button variant="outline" className="w-full" size="sm" onClick={ visitUrl }>
                                    <ExternalLink className="size-3.5" /> { LocalizeText(item.clickUrlText) }
                                </Button>
                            ) }
                            { item.clickUrl && item.clickUrl.length > 0 && !isModeration && (
                                <Button className="w-full" size="sm" onClick={ visitUrl }>{ LocalizeText(item.clickUrlText) }</Button>
                            ) }
                        </div>
                    </FramePanel>
                </Frame>
            </div>
        </DraggableWindow>
    );
}
