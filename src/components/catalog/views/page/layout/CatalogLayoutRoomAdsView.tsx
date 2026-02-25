import { GetRoomAdPurchaseInfoComposer, GetUserEventCatsMessageComposer, PurchaseRoomAdMessageComposer, RoomAdPurchaseInfoEvent, RoomEntryData } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { Megaphone } from 'lucide-react';
import { LocalizeText, SendMessageComposer } from '../../../../../api';
import { useCatalog, useMessageEvent, useNavigator, useRoomPromote } from '../../../../../hooks';
import { Button } from '../../../../ui/button';
import { Input } from '../../../../ui/input';
import { Textarea } from '../../../../ui/textarea';
import { CatalogNativeSelect } from '../../CatalogNativeSelect';
import { CatalogLayoutProps } from './CatalogLayout.types';

export const CatalogLayoutRoomAdsView: FC<CatalogLayoutProps> = props =>
{
    const { page = null } = props;
    const [ eventName, setEventName ] = useState<string>('');
    const [ eventDesc, setEventDesc ] = useState<string>('');
    const [ roomId, setRoomId ] = useState<number>(-1);
    const [ availableRooms, setAvailableRooms ] = useState<RoomEntryData[]>([]);
    const [ extended, setExtended ] = useState<boolean>(false);
    const [ categoryId, setCategoryId ] = useState<number>(1);
    const { categories = null } = useNavigator();
    const { setIsVisible = null } = useCatalog();
    const { promoteInformation, isExtended, setIsExtended } = useRoomPromote();

    useEffect(() =>
    {
        if(isExtended)
        {
            setRoomId(promoteInformation.data.flatId);
            setEventName(promoteInformation.data.eventName);
            setEventDesc(promoteInformation.data.eventDescription);
            setCategoryId(promoteInformation.data.categoryId);
            setExtended(isExtended);
            setIsExtended(false);
        }
    }, [ isExtended, eventName, eventDesc, categoryId ]);

    const resetData = () =>
    {
        setRoomId(-1); setEventName(''); setEventDesc(''); setCategoryId(1); setIsExtended(false); setIsVisible(false);
    }

    const purchaseAd = () =>
    {
        const pageId = page.pageId;
        const offerId = page.offers.length >= 1 ? page.offers[0].offerId : -1;
        SendMessageComposer(new PurchaseRoomAdMessageComposer(pageId, offerId, roomId, eventName, extended, eventDesc, categoryId));
        resetData();
    }

    useMessageEvent<RoomAdPurchaseInfoEvent>(RoomAdPurchaseInfoEvent, event =>
    {
        const parser = event.getParser();
        if(!parser) return;
        setAvailableRooms(parser.rooms);
    });

    useEffect(() =>
    {
        SendMessageComposer(new GetRoomAdPurchaseInfoComposer());
        SendMessageComposer(new GetUserEventCatsMessageComposer());
    }, []);

    return (
        <div className="flex flex-col h-full overflow-y-auto p-4 gap-3" style={ { scrollbarWidth: 'thin' } }>
            <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-primary/60" />
                <span className="text-sm font-bold">{ LocalizeText('roomad.catalog_header') }</span>
            </div>
            <p className="text-xs text-muted-foreground">{ LocalizeText('roomad.catalog_text', [ 'duration' ], [ '120' ]) }</p>

            <div className="rounded-lg border border-border/40 bg-card p-4 space-y-3">
                <div>
                    <span className="text-xs font-semibold mb-1 block">{ LocalizeText('navigator.category') }</span>
                    <CatalogNativeSelect value={ categoryId } onChange={ event => setCategoryId(parseInt(event.target.value)) } disabled={ extended }>
                        { categories && categories.map((cat, index) => <option key={ index } value={ cat.id }>{ LocalizeText(cat.name) }</option>) }
                    </CatalogNativeSelect>
                </div>
                <div>
                    <span className="text-xs font-semibold mb-1 block">{ LocalizeText('roomad.catalog_name') }</span>
                    <Input type="text" className="h-8 text-xs" maxLength={ 64 } value={ eventName } onChange={ e => setEventName(e.target.value) } readOnly={ extended } />
                </div>
                <div>
                    <span className="text-xs font-semibold mb-1 block">{ LocalizeText('roomad.catalog_description') }</span>
                    <Textarea className="min-h-[60px] text-xs resize-none" maxLength={ 64 } value={ eventDesc } onChange={ e => setEventDesc(e.target.value) } readOnly={ extended } />
                </div>
                <div>
                    <span className="text-xs font-semibold mb-1 block">{ LocalizeText('roomad.catalog_roomname') }</span>
                    <CatalogNativeSelect value={ roomId } onChange={ event => setRoomId(parseInt(event.target.value)) } disabled={ extended }>
                        <option value={ -1 } disabled>{ LocalizeText('roomad.catalog_roomname') }</option>
                        { availableRooms && availableRooms.map((room, index) => <option key={ index } value={ room.roomId }>{ room.roomName }</option>) }
                    </CatalogNativeSelect>
                </div>
                <Button
                    variant={ (!eventName || !eventDesc || roomId === -1) ? 'destructive' : 'success' }
                    size="sm"
                    className="w-full h-9 gap-2 rounded-xl text-xs font-bold"
                    onClick={ purchaseAd }
                    disabled={ (!eventName || !eventDesc || roomId === -1) }
                >
                    <Megaphone className="w-3.5 h-3.5" />
                    { extended ? LocalizeText('roomad.extend.event') : LocalizeText('buy') }
                </Button>
            </div>
        </div>
    );
}
