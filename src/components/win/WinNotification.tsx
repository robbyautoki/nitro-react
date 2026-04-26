import { FC, useState } from 'react';
import { NotificationDialogMessageEvent } from '@nitrots/nitro-renderer';
import { useMessageEvent } from '../../hooks';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as AlignSurface from '@/align-ui/components/ui/surface';
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
        <div className="pointer-events-none fixed right-4 top-4 z-[300] flex max-w-[320px] flex-col gap-2">
            { toasts.map(toast => (
                <div key={ toast.id } className="pointer-events-auto animate-in slide-in-from-right fade-in duration-300">
                    <AlignSurface.Panel className="overflow-hidden">
                        <div className="flex items-center gap-2.5 px-3.5 py-2.5">
                            <Trophy className="size-5 shrink-0 text-warning-base" />
                            <div className="min-w-0">
                                <div className="truncate text-label-xs font-semibold text-text-strong-950">
                                    { toast.username } hat einen Win erhalten!
                                </div>
                                <AlignBadge.Root color="orange" variant="lighter" size="small" className="mt-0.5">
                                    Level { toast.level }
                                </AlignBadge.Root>
                            </div>
                        </div>
                    </AlignSurface.Panel>
                </div>
            )) }
        </div>
    );
};
