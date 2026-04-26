import { FC, useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { ProfileEffectData, ResolvedProfileEffect } from './ProfileEffects';

function SpriteLayer({ src, startDelay = 0, cover = true }: { src: string; startDelay?: number; cover?: boolean })
{
    const [ visible, setVisible ] = useState(startDelay === 0);

    useEffect(() =>
    {
        if(startDelay <= 0) return;
        const timeout = setTimeout(() => setVisible(true), startDelay);
        return () => clearTimeout(timeout);
    }, [ startDelay ]);

    if(!visible) return null;

    return (
        <img
            src={ src }
            alt=""
            draggable={ false }
            decoding="async"
            className={ cn('absolute inset-0 h-full w-full', cover ? 'object-cover' : 'object-contain') }
            style={ { willChange: 'transform', transform: 'translateZ(0)' } }
        />
    );
}

function ProfileEffectLayerStack({ effect, cover = true }: { effect: ProfileEffectData; cover?: boolean })
{
    const sorted = useMemo(() => [ ...effect.effects ].sort((a, b) => a.zIndex - b.zIndex), [ effect ]);

    return (
        <>
            { sorted.map((layer, index) => (
                <div key={ `${ effect.id }-${ index }` } className="absolute inset-0" style={ { zIndex: layer.zIndex } }>
                    <SpriteLayer src={ layer.src } startDelay={ layer.start } cover={ cover } />
                </div>
            )) }
        </>
    );
}

const GENERIC_VARIANTS = [
    {
        frame: 'border-primary-base/35',
        band: 'bg-primary-base/20',
        accent: 'bg-primary-base/15',
    },
    {
        frame: 'border-success-base/35',
        band: 'bg-success-base/20',
        accent: 'bg-success-base/15',
    },
    {
        frame: 'border-warning-base/35',
        band: 'bg-warning-base/20',
        accent: 'bg-warning-base/15',
    },
    {
        frame: 'border-information-base/35',
        band: 'bg-information-base/20',
        accent: 'bg-information-base/15',
    },
    {
        frame: 'border-feature-base/35',
        band: 'bg-feature-base/20',
        accent: 'bg-feature-base/15',
    },
];

function GenericProfileEffectVisual({ seed = 0, compact = false, subdued = false }: { seed?: number; compact?: boolean; subdued?: boolean })
{
    const variant = GENERIC_VARIANTS[seed % GENERIC_VARIANTS.length];
    const delay = `${ -(seed % 2200) }ms`;

    return (
        <div className={ cn('absolute inset-0 overflow-hidden bg-bg-soft-200', subdued && 'opacity-75') }>
            <div className={ cn('absolute inset-3 rounded-20 border', variant.frame, compact ? 'opacity-70' : 'opacity-85') } />
            <div
                className={ cn('absolute -left-1/3 top-3 h-10 w-2/3 -rotate-12 animate-shine-sweep blur-sm', variant.band, compact ? 'opacity-70' : 'opacity-90') }
                style={ { animationDelay: delay } }
            />
            <div
                className={ cn('absolute -right-1/3 bottom-5 h-12 w-2/3 rotate-12 animate-shine-sweep blur-sm', variant.accent, compact ? 'opacity-60' : 'opacity-80') }
                style={ { animationDelay: `${ -(seed % 1700) }ms` } }
            />
            <div className="absolute inset-x-6 top-1/2 h-px bg-stroke-soft-200/70" />
            <div className="absolute left-1/2 top-1/2 size-10 -translate-x-1/2 -translate-y-1/2 rounded-10 border border-stroke-soft-200 bg-bg-white-0/70 shadow-regular-xs" />
        </div>
    );
}

export const ProfileEffectPreview: FC<{
    resolution: ResolvedProfileEffect | null;
    compact?: boolean;
    animated?: boolean;
    className?: string;
}> = ({ resolution, compact = false, animated = false, className }) =>
{
    const effect = resolution?.effect ?? null;

    return (
        <div className={ cn(
            'relative flex items-center justify-center overflow-hidden rounded-10 bg-bg-weak-50 ring-1 ring-inset ring-stroke-soft-200',
            compact ? 'h-20' : 'h-28',
            className
        ) }>
            { effect ? (
                animated ? (
                    <div className="absolute left-1/2 top-1/2 h-[210%] w-full max-w-[260px] -translate-x-1/2 -translate-y-1/2">
                        <ProfileEffectLayerStack effect={ effect } cover />
                    </div>
                ) : (
                    <img
                        src={ effect.thumbnailSrc }
                        alt={ effect.title }
                        draggable={ false }
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                    />
                )
            ) : (
                <GenericProfileEffectVisual seed={ resolution?.seed ?? 0 } compact={ compact } />
            ) }
        </div>
    );
};

export const ProfileEffectOverlay: FC<{
    resolution: ResolvedProfileEffect | null;
    className?: string;
    fit?: 'cover' | 'contain';
}> = ({ resolution, className, fit = 'cover' }) =>
{
    if(!resolution) return null;

    const shouldCover = fit === 'cover';

    return (
        <div
            className={ cn('absolute inset-0 pointer-events-none overflow-hidden transition-opacity duration-500', className) }
            style={ { willChange: 'transform, opacity', transform: 'translateZ(0)' } }
        >
            { resolution.effect ? (
                <ProfileEffectLayerStack effect={ resolution.effect } cover={ shouldCover } />
            ) : (
                <GenericProfileEffectVisual seed={ resolution.seed } subdued />
            ) }
        </div>
    );
};
