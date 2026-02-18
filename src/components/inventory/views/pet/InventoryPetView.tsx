import { IRoomSession, RoomObjectVariable, RoomPreviewer } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { attemptPetPlacement, GetRoomEngine, LocalizeText, UnseenItemCategory } from '../../../../api';
import { AutoGrid, Button, Column } from '../../../../common';
import { useInventoryPets, useInventoryUnseenTracker } from '../../../../hooks';
import { InventoryCategoryEmptyView } from '../InventoryCategoryEmptyView';
import { InventoryPetItemView } from './InventoryPetItemView';

interface InventoryPetViewProps
{
    roomSession: IRoomSession;
    roomPreviewer: RoomPreviewer;
}

export const InventoryPetView: FC<InventoryPetViewProps> = props =>
{
    const { roomSession = null, roomPreviewer = null } = props;
    const [ isVisible, setIsVisible ] = useState(false);
    const { petItems = null, selectedPet = null, activate = null, deactivate = null } = useInventoryPets();
    const { isUnseen = null, removeUnseen = null } = useInventoryUnseenTracker();

    useEffect(() =>
    {
        if(!selectedPet || !roomPreviewer) return;

        const petData = selectedPet.petData;
        const roomEngine = GetRoomEngine();

        let wallType = roomEngine.getRoomInstanceVariable<string>(roomEngine.activeRoomId, RoomObjectVariable.ROOM_WALL_TYPE);
        let floorType = roomEngine.getRoomInstanceVariable<string>(roomEngine.activeRoomId, RoomObjectVariable.ROOM_FLOOR_TYPE);
        let landscapeType = roomEngine.getRoomInstanceVariable<string>(roomEngine.activeRoomId, RoomObjectVariable.ROOM_LANDSCAPE_TYPE);

        wallType = (wallType && wallType.length) ? wallType : '101';
        floorType = (floorType && floorType.length) ? floorType : '101';
        landscapeType = (landscapeType && landscapeType.length) ? landscapeType : '1.1';

        roomPreviewer.reset(false);
        roomPreviewer.updateRoomWallsAndFloorVisibility(true, true);
        roomPreviewer.updateObjectRoom(floorType, wallType, landscapeType);
        roomPreviewer.addPetIntoRoom(petData.figureString);
    }, [ roomPreviewer, selectedPet ]);

    useEffect(() =>
    {
        if(!selectedPet || !isUnseen(UnseenItemCategory.PET, selectedPet.petData.id)) return;

        removeUnseen(UnseenItemCategory.PET, selectedPet.petData.id);
    }, [ selectedPet, isUnseen, removeUnseen ]);

    useEffect(() =>
    {
        if(!isVisible) return;

        const id = activate();

        return () => deactivate(id);
    }, [ isVisible, activate, deactivate ]);

    useEffect(() =>
    {
        setIsVisible(true);

        return () => setIsVisible(false);
    }, []);

    if(!petItems || !petItems.length) return <InventoryCategoryEmptyView title={ LocalizeText('inventory.empty.pets.title') } desc={ LocalizeText('inventory.empty.pets.desc') } />;

    return (
        <Column grow gap={ 0 } style={{ minHeight: 0 }}>
            <div className="inv-items-grid">
                <AutoGrid columnCount={ 7 }>
                    { petItems && (petItems.length > 0) && petItems.map(item => <InventoryPetItemView key={ item.petData.id } petItem={ item } />) }
                </AutoGrid>
            </div>
            { selectedPet && selectedPet.petData &&
                <div className="inv-footer">
                    <div className="inv-footer-info">
                        <div className="inv-footer-name">{ selectedPet.petData.name }</div>
                        <div className="inv-footer-actions">
                            { !!roomSession &&
                                <Button variant="success" size="sm" onClick={ event => attemptPetPlacement(selectedPet) }>
                                    { LocalizeText('inventory.furni.placetoroom') }
                                </Button> }
                        </div>
                    </div>
                </div> }
        </Column>
    );
}
