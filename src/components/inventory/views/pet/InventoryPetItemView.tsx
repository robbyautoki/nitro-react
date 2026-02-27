import { FC, MouseEvent, useState } from 'react';
import { attemptPetPlacement, IPetItem, UnseenItemCategory } from '../../../../api';
import { LayoutPetImageView } from '../../../../common';
import { useInventoryPets, useInventoryUnseenTracker } from '../../../../hooks';

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

    const handleDblClick = () => {
        if (hasRoomSession) attemptPetPlacement(petItem);
    };

    const handlePlace = (e: MouseEvent) => {
        e.stopPropagation();
        attemptPetPlacement(petItem);
    };

    return (
        <div
            className={
                'flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all ' +
                (isActive
                    ? 'bg-accent'
                    : 'bg-transparent hover:bg-accent')
            }
            onClick={handleClick}
            onDoubleClick={handleDblClick}
        >
            {/* Pet Image */}
            <div className="w-10 h-10 shrink-0 rounded-md bg-accent flex items-center justify-center overflow-hidden relative">
                <LayoutPetImageView figure={petItem.petData.figureData.figuredata} direction={2} headOnly={false} scale={1} style={{ imageRendering: 'pixelated' }} />
                {unseen && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.6)]" />
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground leading-tight truncate">
                    {petItem.petData.name}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-accent text-muted-foreground leading-none">
                        Lv. {petItem.petData.level}
                    </span>
                </div>
            </div>

            {/* Place Button */}
            {hasRoomSession && isActive && (
                <button
                    className="shrink-0 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors cursor-pointer"
                    onClick={handlePlace}
                >
                    Platzieren
                </button>
            )}
        </div>
    );
};
