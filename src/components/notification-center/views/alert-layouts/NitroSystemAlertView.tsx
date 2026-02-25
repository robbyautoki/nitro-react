import { FC } from 'react';
import { GetRendererVersion, GetUIVersion, NotificationAlertItem } from '../../../../api';
import { DraggableWindow, DraggableWindowPosition } from '../../../../common/draggable-window';
import { Frame, FramePanel } from '../../../ui/frame';
import { Button } from '../../../ui/button';
import { CircleHelp, X } from 'lucide-react';

interface NitroSystemAlertViewProps
{
    item: NotificationAlertItem;
    onClose: () => void;
}

export const NitroSystemAlertView: FC<NitroSystemAlertViewProps> = props =>
{
    const { onClose = null } = props;

    return (
        <DraggableWindow handleSelector=".drag-handler" windowPosition={ DraggableWindowPosition.CENTER }>
            <div className="w-[380px]">
                <Frame className="relative">
                    <div className="drag-handler absolute inset-0 cursor-move" />
                    <FramePanel className="overflow-hidden p-0! relative z-10">
                        <div className="flex items-center justify-between px-4 py-2.5 border-b">
                            <div className="flex items-center gap-2">
                                <CircleHelp className="size-4 text-blue-500" />
                                <span className="text-sm font-semibold">Nitro</span>
                            </div>
                            <button className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" onClick={ onClose }>
                                <X className="size-3.5" />
                            </button>
                        </div>
                        <div className="px-4 py-3 flex items-center gap-4">
                            <div className="size-14 rounded-xl bg-muted flex items-center justify-center shrink-0">
                                <span className="text-2xl font-black text-primary">N</span>
                            </div>
                            <div className="text-sm space-y-1">
                                <div className="font-semibold text-foreground">Nitro React</div>
                                <div className="text-muted-foreground">Client: v{ GetUIVersion() }</div>
                                <div className="text-muted-foreground">Renderer: v{ GetRendererVersion() }</div>
                            </div>
                        </div>
                        <div className="px-4 pb-3 flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1" onClick={ () => window.open('https://discord.nitrodev.co') }>Discord</Button>
                            <Button variant="outline" size="sm" className="flex-1" onClick={ () => window.open('https://git.krews.org/nitro/nitro-react') }>Git</Button>
                            <Button variant="outline" size="sm" className="flex-1" onClick={ () => window.open('https://git.krews.org/nitro/nitro-react/-/issues') }>Bug Report</Button>
                        </div>
                    </FramePanel>
                </Frame>
            </div>
        </DraggableWindow>
    );
}
