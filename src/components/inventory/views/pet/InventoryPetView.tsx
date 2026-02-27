import { IRoomSession, RoomPreviewer } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { UnseenItemCategory } from '../../../../api';
import { useInventoryPets, useInventoryUnseenTracker } from '../../../../hooks';
import { InventoryPetItemView } from './InventoryPetItemView';

interface InventoryPetViewProps {
    roomSession: IRoomSession;
    roomPreviewer: RoomPreviewer;
}

export const InventoryPetView: FC<InventoryPetViewProps> = ({ roomSession }) =>
{
    const [isVisible, setIsVisible] = useState(false);
    const { petItems, selectedPet, activate, deactivate } = useInventoryPets();
    const { isUnseen, removeUnseen, resetCategory } = useInventoryUnseenTracker();

    useEffect(() => {
        if (!selectedPet || !isUnseen(UnseenItemCategory.PET, selectedPet.petData.id)) return;
        removeUnseen(UnseenItemCategory.PET, selectedPet.petData.id);
    }, [selectedPet, isUnseen, removeUnseen]);

    useEffect(() => {
        if (!isVisible) return;
        const id = activate();
        return () => deactivate(id);
    }, [isVisible, activate, deactivate]);

    useEffect(() => {
        if (!isVisible) return;
        return () => { resetCategory(UnseenItemCategory.PET); };
    }, [isVisible, resetCategory]);

    useEffect(() => {
        setIsVisible(true);
        return () => setIsVisible(false);
    }, []);

    if (!petItems || !petItems.length) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 opacity-40 select-none py-12">
                <span className="text-3xl">🐾</span>
                <span className="text-sm font-medium">Keine Haustiere vorhanden</span>
                <span className="text-xs opacity-60">Kaufe Haustiere im Katalog</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1" style={{ minHeight: 0 }}>
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06]">
                <span className="text-xs font-medium text-[oklch(var(--foreground))]/50">
                    {petItems.length} {petItems.length === 1 ? 'Haustier' : 'Haustiere'}
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-1.5 flex flex-col gap-0.5" style={{ minHeight: 0 }}>
                {petItems.map(item => (
                    <InventoryPetItemView
                        key={item.petData.id}
                        petItem={item}
                        hasRoomSession={!!roomSession}
                    />
                ))}
            </div>
        </div>
    );
};
