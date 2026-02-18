import { GetRoomAdPurchaseInfoComposer, GetUserEventCatsMessageComposer, PurchaseRoomAdMessageComposer, RoomAdPurchaseInfoEvent, RoomEntryData } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
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
        setRoomId(-1);
        setEventName('');
        setEventDesc('');
        setCategoryId(1);
        setIsExtended(false);
        setIsVisible(false);
    }

    const purchaseAd = () =>
    {
        const pageId = page.pageId;
        const offerId = page.offers.length >= 1 ? page.offers[0].offerId : -1;
        const flatId = roomId;
        const name = eventName;
        const desc = eventDesc;
        const catId = categoryId;

        SendMessageComposer(new PurchaseRoomAdMessageComposer(pageId, offerId, flatId, name, extended, desc, catId));
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
        <div className="flex flex-col h-full gap-2 overflow-auto">
            <span className="text-sm font-semibold text-zinc-900 text-center">{ LocalizeText('roomad.catalog_header') }</span>
            <span className="text-xs text-zinc-600">{ LocalizeText('roomad.catalog_text', [ 'duration' ], [ '120' ]) }</span>
            <div className="flex flex-col gap-2 rounded-lg bg-zinc-50 border border-zinc-100 p-3">
                <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-zinc-900">{ LocalizeText('navigator.category') }</span>
                    <CatalogNativeSelect value={ categoryId } onChange={ event => setCategoryId(parseInt(event.target.value)) } disabled={ extended }>
                        { categories && categories.map((cat, index) => <option key={ index } value={ cat.id }>{ LocalizeText(cat.name) }</option>) }
                    </CatalogNativeSelect>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-zinc-900">{ LocalizeText('roomad.catalog_name') }</span>
                    <Input type="text" className="h-8 text-xs" maxLength={ 64 } value={ eventName } onChange={ event => setEventName(event.target.value) } readOnly={ extended } />
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-zinc-900">{ LocalizeText('roomad.catalog_description') }</span>
                    <Textarea className="min-h-[60px] text-xs resize-none" maxLength={ 64 } value={ eventDesc } onChange={ event => setEventDesc(event.target.value) } readOnly={ extended } />
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-zinc-900">{ LocalizeText('roomad.catalog_roomname') }</span>
                    <CatalogNativeSelect value={ roomId } onChange={ event => setRoomId(parseInt(event.target.value)) } disabled={ extended }>
                        <option value={ -1 } disabled>{ LocalizeText('roomad.catalog_roomname') }</option>
                        { availableRooms && availableRooms.map((room, index) => <option key={ index } value={ room.roomId }>{ room.roomName }</option>) }
                    </CatalogNativeSelect>
                </div>
                <Button
                    variant={ (!eventName || !eventDesc || roomId === -1) ? 'destructive' : 'default' }
                    size="sm"
                    className="w-full h-8 text-xs"
                    onClick={ purchaseAd }
                    disabled={ (!eventName || !eventDesc || roomId === -1) }
                >
                    { extended ? LocalizeText('roomad.extend.event') : LocalizeText('buy') }
                </Button>
            </div>
        </div>
    );
}

interface INavigatorCategory {
    id: number;
    name: string;
    visible: boolean;
}
