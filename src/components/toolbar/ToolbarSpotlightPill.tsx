import { FC, useEffect, useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRoom, useSpotlight } from '../../hooks';
import * as AlignTooltip from '@/align-ui/components/ui/tooltip';

const formatRemaining = (seconds: number): string =>
{
    if(seconds <= 0) return '0m';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if(days >= 1) return `${ days }d`;
    if(hours >= 1) return `${ hours }h`;
    return `${ Math.max(1, minutes) }m`;
};

const formatLong = (seconds: number): string =>
{
    if(seconds <= 0) return 'läuft jetzt aus';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    const parts: string[] = [];
    if(days > 0) parts.push(`${ days } Tag${ days === 1 ? '' : 'e' }`);
    if(hours > 0) parts.push(`${ hours } Std`);
    if(minutes > 0 && days === 0) parts.push(`${ minutes } Min`);
    return parts.length ? parts.join(' ') : '< 1 Min';
};

export const ToolbarSpotlightPill: FC = () =>
{
    const { roomSession = null } = useRoom();
    const { isSpotlight, getExpiresAt } = useSpotlight();
    const [ now, setNow ] = useState(() => Math.floor(Date.now() / 1000));

    useEffect(() =>
    {
        const id = window.setInterval(() => setNow(Math.floor(Date.now() / 1000)), 30000);
        return () => window.clearInterval(id);
    }, []);

    const roomId = roomSession?.roomId ?? 0;
    const active = roomId > 0 && isSpotlight(roomId);
    const expiresAt = active ? getExpiresAt(roomId) : null;

    const remaining = useMemo(() =>
    {
        if(!active || !expiresAt) return null;
        return Math.max(0, expiresAt - now);
    }, [ active, expiresAt, now ]);

    if(!active || remaining === null) return null;

    const short = formatRemaining(remaining);
    const long = formatLong(remaining);

    return (
        <div className="nitro-spotlight-pill pointer-events-auto">
            <AlignTooltip.Provider delayDuration={150}>
                <AlignTooltip.Root>
                    <AlignTooltip.Trigger asChild>
                        <div
                            className={cn(
                                'flex items-center gap-1.5 rounded-full px-2.5 py-1 cursor-default select-none',
                                'bg-gradient-to-r from-amber-400/90 via-amber-300/95 to-yellow-400/90',
                                'text-amber-950 shadow-regular-md ring-1 ring-amber-500/40',
                                'backdrop-blur-sm transition-transform duration-200 hover:scale-[1.04]'
                            )}
                            data-spotlight-pill
                            aria-label={`Spotlight aktiv — noch ${ long }`}
                        >
                            <Sparkles className="size-3.5 text-amber-700" strokeWidth={2.5} />
                            <span className="text-label-xs font-semibold tracking-tight tabular-nums leading-none">
                                {short}
                            </span>
                        </div>
                    </AlignTooltip.Trigger>
                    <AlignTooltip.Content side="right" sideOffset={8} size="medium">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-label-sm font-semibold">Raum im Spotlight</span>
                            <span className="text-paragraph-xs opacity-90">Verbleibend: {long}</span>
                        </div>
                    </AlignTooltip.Content>
                </AlignTooltip.Root>
            </AlignTooltip.Provider>
        </div>
    );
};
