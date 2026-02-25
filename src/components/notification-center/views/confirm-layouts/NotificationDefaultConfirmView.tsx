import { FC } from 'react';
import { NotificationConfirmItem } from '../../../../api';
import { DraggableWindow, DraggableWindowPosition } from '../../../../common/draggable-window';
import { Frame, FramePanel } from '../../../ui/frame';
import { Button } from '../../../ui/button';
import { X } from 'lucide-react';

export interface NotificationDefaultConfirmViewProps
{
    item: NotificationConfirmItem;
    onClose: () => void;
}

export const NotificationDefaultConfirmView: FC<NotificationDefaultConfirmViewProps> = props =>
{
    const { item = null, onClose = null } = props;
    const { message = null, onConfirm = null, onCancel = null, confirmText = null, cancelText = null, title = null } = item;

    const confirm = () =>
    {
        if(onConfirm) onConfirm();
        onClose();
    };

    const cancel = () =>
    {
        if(onCancel) onCancel();
        onClose();
    };

    return (
        <DraggableWindow handleSelector=".drag-handler" windowPosition={ DraggableWindowPosition.CENTER }>
            <div className="w-[420px]">
                <Frame className="relative">
                    <div className="drag-handler absolute inset-0 cursor-move" />
                    <FramePanel className="overflow-hidden p-0! relative z-10">
                        <div className="flex items-center justify-between px-4 py-2.5 border-b">
                            <span className="text-sm font-semibold">{ title || 'Bestätigung' }</span>
                            <button className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" onClick={ onClose }>
                                <X className="size-3.5" />
                            </button>
                        </div>
                        <div className="px-4 py-4 text-sm text-muted-foreground text-center">
                            { message }
                        </div>
                        <div className="px-4 pb-3 flex gap-2">
                            <Button variant="destructive" size="sm" className="flex-1" onClick={ cancel }>{ cancelText }</Button>
                            <Button size="sm" className="flex-1" onClick={ confirm }>{ confirmText }</Button>
                        </div>
                    </FramePanel>
                </Frame>
            </div>
        </DraggableWindow>
    );
}
