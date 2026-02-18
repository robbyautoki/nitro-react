import { IRoomSession, RoomObjectVariable, RoomPreviewer } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { attemptBotPlacement, GetRoomEngine, LocalizeText, UnseenItemCategory } from '../../../../api';
import { AutoGrid, Button, Column } from '../../../../common';
import { useInventoryBots, useInventoryUnseenTracker } from '../../../../hooks';
import { InventoryCategoryEmptyView } from '../InventoryCategoryEmptyView';
import { InventoryBotItemView } from './InventoryBotItemView';

interface InventoryBotViewProps
{
    roomSession: IRoomSession;
    roomPreviewer: RoomPreviewer;
}

export const InventoryBotView: FC<InventoryBotViewProps> = props =>
{
    const { roomSession = null, roomPreviewer = null } = props;
    const [ isVisible, setIsVisible ] = useState(false);
    const { botItems = [], selectedBot = null, activate = null, deactivate = null } = useInventoryBots();
    const { isUnseen = null, removeUnseen = null } = useInventoryUnseenTracker();

    useEffect(() =>
    {
        if(!selectedBot || !roomPreviewer) return;

        const botData = selectedBot.botData;

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
        roomPreviewer.addAvatarIntoRoom(botData.figure, 0);
    }, [ roomPreviewer, selectedBot ]);

    useEffect(() =>
    {
        if(!selectedBot || !isUnseen(UnseenItemCategory.BOT, selectedBot.botData.id)) return;

        removeUnseen(UnseenItemCategory.BOT, selectedBot.botData.id);
    }, [ selectedBot, isUnseen, removeUnseen ]);

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

    if(!botItems || !botItems.length) return <InventoryCategoryEmptyView title={ LocalizeText('inventory.empty.bots.title') } desc={ LocalizeText('inventory.empty.bots.desc') } />;

    return (
        <Column grow gap={ 0 } style={{ minHeight: 0 }}>
            <div className="inv-items-grid">
                <AutoGrid columnCount={ 7 }>
                    { botItems && (botItems.length > 0) && botItems.map(item => <InventoryBotItemView key={ item.botData.id } botItem={ item } />) }
                </AutoGrid>
            </div>
            { selectedBot &&
                <div className="inv-footer">
                    <div className="inv-footer-info">
                        <div className="inv-footer-name">{ selectedBot.botData.name }</div>
                        <div className="inv-footer-actions">
                            { !!roomSession &&
                                <Button variant="success" size="sm" onClick={ event => attemptBotPlacement(selectedBot) }>
                                    { LocalizeText('inventory.furni.placetoroom') }
                                </Button> }
                        </div>
                    </div>
                </div> }
        </Column>
    );
}
