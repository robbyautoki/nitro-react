import { IRoomSession, RoomPreviewer } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { PawPrint } from 'lucide-react';
import { UnseenItemCategory } from '../../../../api';
import { useInventoryPets, useInventoryUnseenTracker } from '../../../../hooks';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import { InventoryPetItemView } from './InventoryPetItemView';
import { InventoryCategoryEmptyView } from '../InventoryCategoryEmptyView';

interface InventoryPetViewProps {
    roomSession: IRoomSession;
    roomPreviewer: RoomPreviewer;
}

export const InventoryPetView: FC<InventoryPetViewProps> = ({ roomSession }) =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const { petItems, selectedPet, activate, deactivate } = useInventoryPets();
    const { isUnseen, removeUnseen, resetCategory } = useInventoryUnseenTracker();

    useEffect(() =>
    {
        if (!selectedPet || !isUnseen(UnseenItemCategory.PET, selectedPet.petData.id)) return;
        removeUnseen(UnseenItemCategory.PET, selectedPet.petData.id);
    }, [ selectedPet, isUnseen, removeUnseen ]);

    useEffect(() =>
    {
        if (!isVisible) return;
        const id = activate();
        return () => deactivate(id);
    }, [ isVisible, activate, deactivate ]);

    useEffect(() =>
    {
        if (!isVisible) return;
        return () => { resetCategory(UnseenItemCategory.PET); };
    }, [ isVisible, resetCategory ]);

    useEffect(() =>
    {
        setIsVisible(true);
        return () => setIsVisible(false);
    }, []);

    if (!petItems || !petItems.length)
    {
        return (
            <InventoryCategoryEmptyView
                title="Keine Haustiere vorhanden"
                desc="Kaufe Haustiere im Katalog"
                icon={ PawPrint }
            />
        );
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col bg-bg-white-0">
            <div className="flex shrink-0 items-center justify-between border-b border-stroke-soft-200 bg-bg-weak-50 px-3 py-1.5">
                <span className="text-paragraph-xs font-medium text-text-sub-600">
                    { petItems.length } { petItems.length === 1 ? 'Haustier' : 'Haustiere' }
                </span>
                <AlignBadge.Root color="gray" variant="lighter" size="small">
                    { petItems.length }
                </AlignBadge.Root>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-1.5">
                { petItems.map(item => (
                    <InventoryPetItemView
                        key={ item.petData.id }
                        petItem={ item }
                        hasRoomSession={ !!roomSession }
                    />
                )) }
            </div>
        </div>
    );
};
