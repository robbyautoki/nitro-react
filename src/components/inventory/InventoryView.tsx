import { BadgePointLimitsEvent, ILinkEventTracker, IRoomSession, RoomEngineObjectEvent, RoomEngineObjectPlacedEvent, RoomPreviewer, RoomSessionEvent } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { AddEventLinkTracker, GetLocalization, GetRoomEngine, isObjectMoverRequested, LocalizeText, RemoveLinkEventTracker, setObjectMoverRequested, UnseenItemCategory } from '../../api';
import { NitroCardContentView, NitroCardHeaderView, NitroCardView } from '../../common';
import { useInventoryTrade, useInventoryUnseenTracker, useMessageEvent, useRoomEngineEvent, useRoomSessionManagerEvent } from '../../hooks';
import { InventoryBadgeView } from './views/badge/InventoryBadgeView';
import { InventoryBotView } from './views/bot/InventoryBotView';
import { InventoryFurnitureView } from './views/furniture/InventoryFurnitureView';
import { InventoryTradeView } from './views/furniture/InventoryTradeView';
import { InventoryPetView } from './views/pet/InventoryPetView';

const TAB_FURNITURE: string = 'inventory.furni';
const TAB_BOTS: string = 'inventory.bots';
const TAB_PETS: string = 'inventory.furni.tab.pets';
const TAB_BADGES: string = 'inventory.badges';
const TABS = [ TAB_FURNITURE, TAB_BOTS, TAB_PETS, TAB_BADGES ];
const UNSEEN_CATEGORIES = [ UnseenItemCategory.FURNI, UnseenItemCategory.BOT, UnseenItemCategory.PET, UnseenItemCategory.BADGE ];

export const InventoryView: FC<{}> = props =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ currentTab, setCurrentTab ] = useState<string>(TABS[0]);
    const [ roomSession, setRoomSession ] = useState<IRoomSession>(null);
    const [ roomPreviewer, setRoomPreviewer ] = useState<RoomPreviewer>(null);
    const { isTrading = false, stopTrading = null } = useInventoryTrade();
    const { getCount = null, resetCategory = null } = useInventoryUnseenTracker();

    const onClose = () =>
    {
        if(isTrading) stopTrading();

        setIsVisible(false);
    }

    useRoomEngineEvent<RoomEngineObjectPlacedEvent>(RoomEngineObjectEvent.PLACED, event =>
    {
        if(!isObjectMoverRequested()) return;

        setObjectMoverRequested(false);

        if(!event.placedInRoom) setIsVisible(true);
    });

    useRoomSessionManagerEvent<RoomSessionEvent>([
        RoomSessionEvent.CREATED,
        RoomSessionEvent.ENDED
    ], event =>
    {
        switch(event.type)
        {
            case RoomSessionEvent.CREATED:
                setRoomSession(event.session);
                return;
            case RoomSessionEvent.ENDED:
                setRoomSession(null);
                setIsVisible(false);
                return;
        }
    });

    useMessageEvent<BadgePointLimitsEvent>(BadgePointLimitsEvent, event =>
    {
        const parser = event.getParser();

        for(const data of parser.data) GetLocalization().setBadgePointLimit(data.badgeId, data.limit);
    });

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');

                if(parts.length < 2) return;
        
                switch(parts[1])
                {
                    case 'show':
                        setIsVisible(true);
                        return;
                    case 'hide':
                        setIsVisible(false);
                        return;
                    case 'toggle':
                        setIsVisible(prevValue => !prevValue);
                        return;
                }
            },
            eventUrlPrefix: 'inventory/'
        };

        AddEventLinkTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    useEffect(() =>
    {
        setRoomPreviewer(new RoomPreviewer(GetRoomEngine(), ++RoomPreviewer.PREVIEW_COUNTER));

        return () =>
        {
            setRoomPreviewer(prevValue =>
            {
                prevValue.dispose();

                return null;
            });
        }
    }, []);

    useEffect(() =>
    {
        if(!isVisible && isTrading) setIsVisible(true);
    }, [ isVisible, isTrading ]);

    if(!isVisible) return null;

    const TAB_LABELS: Record<string, string> = {
        [TAB_FURNITURE]: 'Furniture',
        [TAB_BOTS]: 'Bots',
        [TAB_PETS]: 'Pets',
        [TAB_BADGES]: 'Badges',
    };

    return (
        <NitroCardView uniqueKey={ 'inventory' } className="nitro-inventory" theme={ isTrading ? 'primary-slim' : '' } >
            { isTrading &&
                <>
                    <NitroCardHeaderView headerText={ LocalizeText('inventory.title') } onCloseClick={ onClose } />
                    <NitroCardContentView>
                        <InventoryTradeView cancelTrade={ onClose } />
                    </NitroCardContentView>
                </> }
            { !isTrading &&
                <div className="inv-layout">
                    <div className="inv-sidebar drag-handler">
                        <div className="inv-sidebar-title">Inventory</div>
                        { TABS.map((name, index) =>
                        {
                            const unseenCount = getCount(UNSEEN_CATEGORIES[index]);
                            return (
                                <div key={ index } className={ 'inv-sidebar-item' + (currentTab === name ? ' active' : '') } onClick={ () => setCurrentTab(name) }>
                                    <span>{ TAB_LABELS[name] || LocalizeText(name) }</span>
                                    { unseenCount > 0 && <span className="inv-sidebar-badge">{ unseenCount }</span> }
                                </div>
                            );
                        }) }
                    </div>
                    <div className="inv-content">
                        <div className="inv-content-header">
                            <FaTimes className="inv-close" onClick={ onClose } />
                        </div>
                        <div className="inv-content-body">
                            { (currentTab === TAB_FURNITURE) &&
                                <InventoryFurnitureView roomSession={ roomSession } roomPreviewer={ roomPreviewer } /> }
                            { (currentTab === TAB_BOTS) &&
                                <InventoryBotView roomSession={ roomSession } roomPreviewer={ roomPreviewer } /> }
                            { (currentTab === TAB_PETS) &&
                                <InventoryPetView roomSession={ roomSession } roomPreviewer={ roomPreviewer } /> }
                            { (currentTab === TAB_BADGES) &&
                                <InventoryBadgeView /> }
                        </div>
                    </div>
                </div> }
        </NitroCardView>
    );
}
