import { FC, useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { AvatarEditorGridPartItem } from '../../../../api';
import { cn } from '../../../../align-ui/utils/cn';
import { AvatarEditorIcon } from '../AvatarEditorIcon';

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

    if(!partItem) return null;

    const isActive = partItem.isSelected;
    const isLocked = !hcDisabled && partItem.isHC;

    return (
        <button
            type="button"
            onClick={ onClick }
            className={ cn(
                'group relative flex aspect-square min-h-[50px] items-center justify-center rounded-12',
                'border bg-bg-weak-50 transition-all',
                isActive
                    ? 'border-primary-base ring-2 ring-primary-base/25'
                    : 'border-stroke-soft-200 hover:border-stroke-sub-300 hover:bg-bg-white-0 hover:shadow-regular-xs'
            ) }
        >
            { !partItem.isClear && partItem.imageUrl && (
                <div
                    className="size-full bg-center bg-no-repeat"
                    style={ { backgroundImage: `url(${ partItem.imageUrl })` } }
                />
            ) }
            { partItem.isClear && <AvatarEditorIcon icon="clear" /> }

            { isLocked && (
                <div className="absolute inset-0 flex items-center justify-center rounded-12 bg-bg-weak-50/75 backdrop-blur-[1px]">
                    <Lock className="size-4 text-text-sub-600" />
                </div>
            ) }

            { partItem.isSellable && (
                <AvatarEditorIcon icon="sellable" position="absolute" className="right-1 bottom-1" />
            ) }
        </button>
    );
}
