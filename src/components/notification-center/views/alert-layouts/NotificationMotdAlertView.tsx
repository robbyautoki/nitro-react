import { Info, X } from 'lucide-react';
import { FC } from 'react';
import { NotificationAlertItem, OpenUrl } from '../../../../api';
import { DraggableWindow, DraggableWindowPosition } from '../../../../common/draggable-window';
import { Alert, AlertDescription, AlertTitle } from '../../../ui/alert';
import { Frame, FramePanel } from '../../../ui/frame';

interface NotificationMotdAlertViewProps
{
    item: NotificationAlertItem;
    onClose: () => void;
}

export const NotificationMotdAlertView: FC<NotificationMotdAlertViewProps> = props =>
{
    const { item = null, onClose = null } = props;

    // Note: dangerouslySetInnerHTML is used here consistently with the rest of the
    // notification system (NotificationDefaultAlertView, NotificationDefaultBubbleView).
    // MOTD messages are server-provided and pre-sanitized via cleanText() in useNotification.

    return (
        <DraggableWindow handleSelector=".drag-handler" windowPosition={ DraggableWindowPosition.CENTER }>
            <div className="w-[380px]">
                <Frame className="relative">
                    <div className="drag-handler absolute inset-0 cursor-move" />
                    <FramePanel className="overflow-hidden p-0! relative z-10">
                        <button
                            onClick={ onClose }
                            className="absolute top-2 right-2 z-20 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                            <X className="size-4" />
                        </button>
                        <Alert className="border-0 shadow-none pr-8">
                            <Info className="size-4 text-blue-500" />
                            <AlertTitle>{ item.title || 'Message' }</AlertTitle>
                            <AlertDescription>
                                { item.messages.map((message, index) =>
                                {
                                    const htmlText = message.replace(/\r\n|\r|\n/g, '<br />');
                                    return <span key={ index } dangerouslySetInnerHTML={ { __html: htmlText } } />;
                                }) }
                            </AlertDescription>
                            { item.clickUrl && item.clickUrl.length > 0 &&
                                <div className="col-left-2 mt-2">
                                    <button
                                        onClick={ () => { OpenUrl(item.clickUrl); onClose(); } }
                                        className="text-sm text-blue-500 hover:text-blue-600 hover:underline transition-colors"
                                    >
                                        { item.clickUrlText || 'More info' } &rarr;
                                    </button>
                                </div>
                            }
                        </Alert>
                    </FramePanel>
                </Frame>
            </div>
        </DraggableWindow>
    );
}
