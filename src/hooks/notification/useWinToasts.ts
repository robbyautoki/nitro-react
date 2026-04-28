import { NotificationDialogMessageEvent } from '@nitrots/nitro-renderer';
import { useCallback, useState } from 'react';
import { useBetween } from 'use-between';
import { useMessageEvent } from '../events';

export interface WinToast
{
    id: number;
    username: string;
    level: number;
}

const WIN_TOAST_TTL = 5000;

let toastIdCounter = 0;

const useWinToastsState = () =>
{
    const [ toasts, setToasts ] = useState<WinToast[]>([]);

    const dismiss = useCallback((id: number) =>
    {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

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
        }, WIN_TOAST_TTL);
    });

    return { toasts, dismiss };
};

/**
 * Geteilter Win-Toast-State. Wird in `NotificationCenterView` gemountet,
 * sodass alle Win-Broadcasts im Unified-Stack erscheinen.
 */
export const useWinToasts = () => useBetween(useWinToastsState);
