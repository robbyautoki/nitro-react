import React, { ComponentPropsWithoutRef, useRef } from 'react';
import { cn } from '@/lib/utils';

interface MarqueeProps extends ComponentPropsWithoutRef<'div'>
{
    reverse?: boolean;
    pauseOnHover?: boolean;
    children: React.ReactNode;
    vertical?: boolean;
    repeat?: number;
}

export function Marquee({
    className,
    reverse = false,
    pauseOnHover = false,
    children,
    vertical = false,
    repeat = 4,
    ...props
}: MarqueeProps)
{
    const marqueeRef = useRef<HTMLDivElement>(null);

    return (
        <div
            { ...props }
            ref={ marqueeRef }
            className={ cn(
                'group flex overflow-hidden p-2 [--duration:40s] [--gap:1rem] [gap:var(--gap)]',
                vertical ? 'flex-col' : 'flex-row',
                className,
            ) }
        >
            { Array.from({ length: repeat }, (_, i) => (
                <div
                    key={ i }
                    className={ cn(
                        'flex shrink-0 justify-around',
                        vertical ? 'flex-col [gap:var(--gap)] animate-marquee-vertical' : 'flex-row [gap:var(--gap)]',
                        pauseOnHover && 'group-hover:[animation-play-state:paused]',
                        reverse && '[animation-direction:reverse]',
                    ) }
                >
                    { children }
                </div>
            )) }
        </div>
    );
}
