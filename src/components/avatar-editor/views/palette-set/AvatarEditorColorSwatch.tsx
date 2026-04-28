import { FC, useEffect, useState } from 'react';
import { Check, Lock } from 'lucide-react';
import { AvatarEditorGridColorItem } from '../../../../api';
import { cn } from '../../../../align-ui/utils/cn';

export interface AvatarEditorColorSwatchProps
{
    colorItem: AvatarEditorGridColorItem;
    hcDisabled: boolean;
    onClick?: () => void;
}

export const AvatarEditorColorSwatch: FC<AvatarEditorColorSwatchProps> = props =>
{
    const { colorItem, hcDisabled, onClick } = props;
    const [ , setUpdateId ] = useState(-1);

    useEffect(() =>
    {
        if(!colorItem) return;

        const rerender = () => setUpdateId(prev => prev + 1);
        colorItem.notify = rerender;

        return () => { colorItem.notify = null; };
    }, [ colorItem ]);

    if(!colorItem) return null;

    const isActive = colorItem.isSelected;
    const isLocked = !hcDisabled && colorItem.isHC;

    return (
        <button
            type="button"
            onClick={ onClick }
            disabled={ isLocked }
            className={ cn(
                'group relative aspect-square rounded-md ring-1 ring-inset ring-stroke-soft-200 transition-all duration-150',
                isLocked && 'cursor-not-allowed opacity-60',
                isActive && 'z-10 ring-2 ring-primary-base ring-offset-2 ring-offset-bg-weak-50',
                !isActive && !isLocked && 'hover:z-10 hover:scale-110 hover:ring-2 hover:ring-stroke-strong-950'
            ) }
            style={ { backgroundColor: colorItem.color } }
        >
            { isActive && (
                <Check
                    className="absolute inset-0 m-auto size-4 text-static-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]"
                    strokeWidth={ 3 }
                />
            ) }
            { isLocked && (
                <span className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full bg-bg-white-0 ring-1 ring-stroke-soft-200 shadow-regular-xs">
                    <Lock className="size-2.5 text-text-sub-600" />
                </span>
            ) }
        </button>
    );
}
