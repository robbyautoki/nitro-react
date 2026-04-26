import { FC, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaTrash } from 'react-icons/fa';
import { GroupItem } from '../../../../api';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignInput from '@/align-ui/components/ui/input';
import * as AlignSlider from '@/align-ui/components/ui/slider';

interface InventoryDeleteDialogProps
{
    groupItem: GroupItem;
    maxCount: number;
    onConfirm: (itemIds: number[]) => void;
    onClose: () => void;
}

export const InventoryDeleteDialog: FC<InventoryDeleteDialogProps> = ({ groupItem, maxCount, onConfirm, onClose }) =>
{
    const [ count, setCount ] = useState(1);

    const onSubmit = useCallback(() =>
    {
        const items = groupItem.items.filter(i => !i.locked);
        const toDelete = items.slice(0, count).map(i => i.id);

        if(toDelete.length > 0) onConfirm(toDelete);
    }, [ groupItem, count, onConfirm ]);

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-overlay backdrop-blur-sm" onClick={ onClose }>
            <div className="w-[300px] overflow-hidden rounded-20 border border-stroke-soft-200 bg-bg-white-0 text-text-strong-950 shadow-regular-md" onClick={ e => e.stopPropagation() }>
                <div className="flex items-center gap-2 border-b border-stroke-soft-200 bg-bg-weak-50 px-4 py-3 text-label-sm">
                    <FaTrash className="size-3.5 text-error-base" />
                    <span>Möbel löschen</span>
                </div>
                <div className="space-y-3 p-4">
                    <div className="truncate text-label-sm text-text-strong-950">{ groupItem.name }</div>
                    { maxCount > 1 && (
                        <>
                            <div className="text-paragraph-xs text-text-sub-600">
                                Wie viele löschen? <span className="text-text-soft-400">(du besitzt: { maxCount } Stück)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <AlignButton.Root
                                    type="button"
                                    variant="neutral"
                                    mode="stroke"
                                    size="xxsmall"
                                    className="size-7 p-0"
                                    onClick={ () => setCount(Math.max(1, count - 1)) }
                                    disabled={ count <= 1 }
                                >
                                    -
                                </AlignButton.Root>
                                <AlignInput.Root size="xsmall" className="flex-1">
                                    <AlignInput.Wrapper>
                                        <AlignInput.Input
                                            type="number"
                                            className="h-7 text-center text-paragraph-xs [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                            value={ count }
                                            min={ 1 }
                                            max={ maxCount }
                                            onChange={ e =>
                                            {
                                                const val = parseInt(e.target.value) || 1;
                                                setCount(Math.max(1, Math.min(maxCount, val)));
                                            } }
                                        />
                                    </AlignInput.Wrapper>
                                </AlignInput.Root>
                                <AlignButton.Root
                                    type="button"
                                    variant="neutral"
                                    mode="stroke"
                                    size="xxsmall"
                                    className="size-7 p-0"
                                    onClick={ () => setCount(Math.min(maxCount, count + 1)) }
                                    disabled={ count >= maxCount }
                                >
                                    +
                                </AlignButton.Root>
                                <AlignButton.Root
                                    type="button"
                                    variant="neutral"
                                    mode="stroke"
                                    size="xxsmall"
                                    onClick={ () => setCount(maxCount) }
                                    className="min-w-9 text-[10px]"
                                >
                                    Alle
                                </AlignButton.Root>
                            </div>
                            <AlignSlider.Root
                                min={ 1 }
                                max={ maxCount }
                                step={ 1 }
                                value={ [ count ] }
                                onValueChange={ (val) => setCount(val[0]) }
                                className="[&_[data-radix-slider-range]]:bg-error-base"
                            >
                                <AlignSlider.Thumb className="bg-error-base" />
                            </AlignSlider.Root>
                            <div className="mt-0.5 text-center text-[11px] text-text-soft-400">
                                { count } von { maxCount } löschen
                            </div>
                        </>
                    ) }
                    { maxCount === 1 && (
                        <div className="text-paragraph-xs text-text-sub-600">
                            Dieses Möbelstück unwiderruflich löschen?
                        </div>
                    ) }
                </div>
                <div className="flex justify-end gap-2 border-t border-stroke-soft-200 px-4 py-3">
                    <AlignButton.Root type="button" variant="neutral" mode="stroke" size="xxsmall" onClick={ onClose }>Abbrechen</AlignButton.Root>
                    <AlignButton.Root type="button" variant="error" mode="filled" size="xxsmall" onClick={ onSubmit }>
                        Löschen
                    </AlignButton.Root>
                </div>
            </div>
        </div>,
        document.body
    );
};
