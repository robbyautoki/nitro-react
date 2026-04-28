import { FC, useEffect, useMemo, useState } from 'react';
import { Coins, Lock, X } from 'lucide-react';
import { AvatarEditorGridPartItem } from '../../../../api';
import { cn } from '../../../../align-ui/utils/cn';

export interface AvatarEditorPartTileProps
{
    partItem: AvatarEditorGridPartItem;
    hcDisabled: boolean;
    onClick?: () => void;
}

export const AvatarEditorPartTile: FC<AvatarEditorPartTileProps> = props =>
{
    const { partItem, hcDisabled, onClick } = props;
    const [ , setUpdateId ] = useState(-1);

    useEffect(() =>
    {
        if(!partItem) return;

        const rerender = () => setUpdateId(prev => prev + 1);
        partItem.notify = rerender;

        return () =>
        {
            partItem.notify = null;
        };
    }, [ partItem ]);

    const tooltip = useMemo(() =>
    {
        if(!partItem) return '';
        if(partItem.isClear) return 'Kein Item';

        const parts: string[] = [];
        const isLocked = !hcDisabled && partItem.isHC;

        if(isLocked) parts.push('HC-Item (Habbo Club)');
        if(partItem.isSellable) parts.push('Kaufbar im Katalog');
        if(partItem.isSelected) parts.push('Ausgewählt');

        return parts.join(' · ');
    }, [ partItem, hcDisabled ]);

    if(!partItem) return null;

    const isActive = partItem.isSelected;
    const isLocked = !hcDisabled && partItem.isHC;

    return (
        <button
            type="button"
            onClick={ onClick }
            title={ tooltip }
            className={ cn(
                'group relative flex aspect-square items-center justify-center rounded-xl',
                'border-2 bg-bg-white-0 transition-all duration-150',
                isActive
                    ? 'border-primary-base bg-primary-alpha-10 shadow-regular-md'
                    : 'border-stroke-soft-200 hover:-translate-y-0.5 hover:border-stroke-sub-300 hover:shadow-regular-md'
            ) }
        >
            { !partItem.isClear && partItem.imageUrl && (
                <div
                    className={ cn(
                        'size-full bg-center bg-no-repeat',
                        isLocked && 'opacity-50 grayscale'
                    ) }
                    style={ { backgroundImage: `url(${ partItem.imageUrl })`, backgroundSize: 'auto', imageRendering: 'pixelated' } }
                />
            ) }
            { partItem.isClear && (
                <X className="size-6 text-text-sub-600" strokeWidth={ 2.5 } />
            ) }

            { isLocked && (
                <div className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-warning-base shadow-regular-xs ring-2 ring-bg-white-0">
                    <Lock className="size-3 text-static-white" strokeWidth={ 2.75 } />
                </div>
            ) }

            { partItem.isSellable && !isLocked && (
                <div className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-information-base shadow-regular-xs ring-2 ring-bg-white-0">
                    <Coins className="size-3 text-static-white" strokeWidth={ 2.5 } />
                </div>
            ) }
        </button>
    );
}
