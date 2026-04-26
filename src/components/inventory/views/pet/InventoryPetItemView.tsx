import { FC, MouseEvent, useState } from 'react';
import { attemptPetPlacement, IPetItem, UnseenItemCategory } from '../../../../api';
import { LayoutPetImageView } from '../../../../common';
import { useInventoryPets, useInventoryUnseenTracker } from '../../../../hooks';
import * as AlignButton from '@/align-ui/components/ui/button';

interface InventoryPetItemViewProps {
    petItem: IPetItem;
    hasRoomSession: boolean;
}

export const InventoryPetItemView: FC<InventoryPetItemViewProps> = ({ petItem, hasRoomSession }) =>
{
    const { selectedPet, setSelectedPet } = useInventoryPets();
    const { isUnseen } = useInventoryUnseenTracker();

    const isActive = selectedPet === petItem;
    const unseen = isUnseen(UnseenItemCategory.PET, petItem.petData.id);

    const handleClick = () => setSelectedPet(petItem);

    const handleDblClick = () =>
    {
        if (hasRoomSession) attemptPetPlacement(petItem);
    };

    const handlePlace = (e: MouseEvent) =>
    {
        e.stopPropagation();
        attemptPetPlacement(petItem);
    };

    return (
        <div
            className={
                'flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all ' +
                (isActive
                    ? 'bg-primary-alpha-10 ring-1 ring-primary-base'
                    : 'bg-transparent hover:bg-bg-weak-50')
            }
            onClick={ handleClick }
            onDoubleClick={ handleDblClick }
        >
            { /* Pet Image */ }
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-bg-weak-50 ring-1 ring-inset ring-stroke-soft-200">
                <LayoutPetImageView figure={ petItem.petData.figureData.figuredata } direction={ 2 } headOnly={ false } scale={ 1 } style={ { imageRendering: 'pixelated' } } />
                { unseen && (
                    <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-success-base ring-2 ring-bg-white-0" />
                ) }
            </div>
            { /* Info */ }
            <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-text-strong-950 leading-tight truncate">
                    { petItem.petData.name }
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-bg-weak-50 text-text-sub-600 leading-none">
                        Lv. { petItem.petData.level }
                    </span>
                </div>
            </div>
            { /* Place Button */ }
            { hasRoomSession && isActive && (
                <AlignButton.Root
                    variant="primary"
                    mode="filled"
                    size="xxsmall"
                    className="shrink-0"
                    onClick={ handlePlace }
                >
                    Platzieren
                </AlignButton.Root>
            ) }
        </div>
    );
};
