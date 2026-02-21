import { FC, useCallback, useState } from 'react';
import { NotificationDialogMessageEvent } from '@nitrots/nitro-renderer';
import { useMessageEvent } from '../../hooks';

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
                <div
                    key={ toast.id }
                    className="pointer-events-auto animate-in slide-in-from-right fade-in duration-300"
                    style={{
                        background: 'rgba(12,12,16,0.95)',
                        border: '1px solid rgba(251,146,60,0.2)',
                        borderRadius: 12,
                        padding: '10px 14px',
                        backdropFilter: 'blur(12px)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    }}>
                    <div className="flex items-center gap-2.5">
                        <span className="text-lg">🏆</span>
                        <div>
                            <div className="text-xs font-semibold text-white/90">
                                { toast.username } hat einen Win erhalten!
                            </div>
                            <div className="text-[10px] text-amber-400/70 mt-0.5">
                                Level { toast.level }
                            </div>
                        </div>
                    </div>
                </div>
            )) }
        </div>
    );
};
