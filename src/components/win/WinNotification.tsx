import { FC, useCallback, useState } from 'react';
import { NotificationDialogMessageEvent } from '@nitrots/nitro-renderer';
import { useMessageEvent } from '../../hooks';
import { Frame, FramePanel } from '../ui/frame';
import { Trophy } from 'lucide-react';

interface WinToast {
    id: number;
    username: string;
    level: number;
}

let toastIdCounter = 0;

export const WinNotification: FC<{}> = () =>
{
    const [ toasts, setToasts ] = useState<WinToast[]>([]);

    useMessageEvent<NotificationDialogMessageEvent>(NotificationDialogMessageEvent, event =>
    {
        const parser = event.getParser();
        if(parser.type !== 'win.broadcast') return;

        const params = parser.parameters;
        const username = params?.get('username') || '';
        const level = parseInt(params?.get('level') || '0');
        if(!username) return;

        const toast: WinToast = { id: ++toastIdCounter, username, level };
        setToasts(prev => [ ...prev, toast ]);

        setTimeout(() =>
        {
            setToasts(prev => prev.filter(t => t.id !== toast.id));
        }, 5000);
    });

    if(toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[300] flex flex-col gap-2 pointer-events-none" style={{ maxWidth: 320 }}>
            { toasts.map(toast => (
                <div key={ toast.id } className="pointer-events-auto animate-in slide-in-from-right fade-in duration-300">
                    <Frame>
                        <FramePanel className="!p-0">
                            <div className="flex items-center gap-2.5 px-3.5 py-2.5">
                                <Trophy className="size-5 text-amber-500 shrink-0" />
                                <div>
                                    <div className="text-xs font-semibold text-foreground">
                                        { toast.username } hat einen Win erhalten!
                                    </div>
                                    <div className="text-[10px] text-amber-500/80 mt-0.5">
                                        Level { toast.level }
                                    </div>
                                </div>
                            </div>
                        </FramePanel>
                    </Frame>
                </div>
            )) }
        </div>
    );
};
