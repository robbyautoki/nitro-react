import { FC } from 'react';
import { NavigatorDensity } from './NavigatorSearchResultItemView';

interface Props
{
    density: NavigatorDensity;
    rows?: number;
}

export const NavigatorResultSkeleton: FC<Props> = ({ density, rows = 10 }) =>
{
    const items = Array.from({ length: rows });

    if(density === 'compact')
    {
        return (
            <div className="flex flex-col">
                { items.map((_, i) => (
                    <div key={ i } className="flex h-10 items-center gap-2.5 border-b border-stroke-soft-200/60 px-5">
                        <div className="size-7 shrink-0 animate-pulse rounded bg-bg-weak-50" />
                        <div className="h-3 flex-1 animate-pulse rounded bg-bg-weak-50" />
                        <div className="h-4 w-12 shrink-0 animate-pulse rounded-full bg-bg-weak-50" />
                    </div>
                )) }
            </div>
        );
    }

    return (
        <div className="flex flex-col">
            { items.map((_, i) => (
                <div key={ i } className="flex h-[52px] items-center gap-3 border-b border-stroke-soft-200/60 px-5">
                    <div className="h-7 w-9 shrink-0 animate-pulse rounded bg-bg-weak-50" />
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <div className="h-3 w-2/3 animate-pulse rounded bg-bg-weak-50" />
                        <div className="h-2.5 w-1/2 animate-pulse rounded bg-bg-weak-50" />
                    </div>
                    <div className="h-4 w-12 shrink-0 animate-pulse rounded-full bg-bg-weak-50" />
                </div>
            )) }
        </div>
    );
};
