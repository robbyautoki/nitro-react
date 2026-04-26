import { FC, useCallback, useEffect, useState } from 'react';
import { Home, ShoppingCart, AlertTriangle, X } from 'lucide-react';
import { RoomSessionEvent } from '@nitrots/nitro-renderer';
import { GetConfiguration, GetRoomSession, GetSessionDataManager } from '../../api';
import { useRoom, useRoomSessionManagerEvent } from '../../hooks';
import { DraggableWindow, DraggableWindowPosition } from '../../common/draggable-window';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignDivider from '@/align-ui/components/ui/divider';
import * as AlignSurface from '@/align-ui/components/ui/surface';
import * as FancyButton from '@/align-ui/components/ui/fancy-button';

interface RoomSaleData {
    room: string;
    owner: string;
    price: number;
    currency: string;
    currencyType: number;
    items: number;
    bots: number;
    pets: number;
    limiteds: number;
}

export const RoomSaleView: FC<{}> = () =>
{
    const [ saleData, setSaleData ] = useState<RoomSaleData | null>(null);
    const [ showPanel, setShowPanel ] = useState(false);
    const [ showBanner, setShowBanner ] = useState(false);
    const [ confirming, setConfirming ] = useState(false);
    const { roomSession = null } = useRoom();

    useRoomSessionManagerEvent<RoomSessionEvent>(RoomSessionEvent.ENDED, () =>
    {
        setSaleData(null);
        setShowPanel(false);
        setShowBanner(false);
        setConfirming(false);
    });

    useEffect(() =>
    {
        if(!roomSession)
        {
            setSaleData(null); setShowBanner(false); return;
        }

        const roomId = roomSession.roomId;
        const cmsUrl = GetConfiguration<string>('url.prefix', '');
        if(!cmsUrl) return;

        const userId = GetSessionDataManager().userId;

        fetch(`${ cmsUrl }/api/room-sale?roomId=${ roomId }`)
            .then(r => r.ok ? r.json() : null)
            .then(data =>
            {
                if(data && data.active)
                {
                    setSaleData({
                        room: data.roomName || 'Raum',
                        owner: data.sellerName || 'Unbekannt',
                        price: data.price || 0,
                        currency: data.currencyType === 5 ? 'Diamanten' : 'Credits',
                        currencyType: data.currencyType || 0,
                        items: data.itemCount || 0,
                        bots: data.botCount || 0,
                        pets: data.petCount || 0,
                        limiteds: data.limitedCount || 0,
                    });

                    if(data.sellerId !== userId)
                    {
                        setShowBanner(true);
                    }
                }
                else
                {
                    setSaleData(null);
                    setShowBanner(false);
                }
            })
            .catch(() =>
            {});
    }, [ roomSession ]);

    const onBuyConfirm = useCallback(() =>
    {
        try
        {
            const session = GetRoomSession();
            if(session) session.sendChatMessage(':buyroom confirm', 0);
        }
        catch
        {}

        setShowPanel(false);
        setShowBanner(false);
        setSaleData(null);
        setConfirming(false);
    }, []);

    const onClose = useCallback(() =>
    {
        setShowPanel(false);
        setConfirming(false);
    }, []);

    const onDismissBanner = useCallback(() =>
    {
        setShowBanner(false);
    }, []);

    if(!saleData) return null;

    if(showPanel)
    {
        return (
            <DraggableWindow handleSelector=".drag-handler" windowPosition={ DraggableWindowPosition.CENTER }>
                <div className="w-[420px] max-w-[calc(100vw-32px)]">
                    <AlignSurface.Panel className="overflow-hidden">
                        <AlignSurface.Header
                            className="drag-handler cursor-grab select-none active:cursor-grabbing"
                            title={
                                <div className="flex min-w-0 items-center gap-2">
                                    <span className="flex size-8 items-center justify-center rounded-lg bg-success-lighter text-success-base ring-1 ring-inset ring-success-light">
                                        <Home className="size-4" />
                                    </span>
                                    <span className="truncate">Raum kaufen</span>
                                </div>
                            }
                            description={ `Verkäufer: ${ saleData.owner }` }
                            onClose={ onClose }
                        />
                        <div className="space-y-4 p-4">
                            <div className="space-y-2">
                                <div className="truncate text-title-h6 text-text-strong-950">{ saleData.room }</div>
                                <div className="flex flex-wrap gap-2">
                                    <AlignBadge.Root color="orange" variant="light" size="small">
                                        { saleData.price.toLocaleString() } { saleData.currency }
                                    </AlignBadge.Root>
                                    <AlignBadge.Root color="gray" variant="lighter" size="small">
                                        { saleData.items } Möbel
                                    </AlignBadge.Root>
                                </div>
                            </div>
                            <div className="space-y-2 rounded-xl bg-bg-weak-50 p-3 ring-1 ring-inset ring-stroke-soft-200">
                                <div className="flex justify-between gap-3 text-paragraph-xs">
                                    <span className="text-text-sub-600">Preis</span>
                                    <span className="font-semibold text-warning-base">{ saleData.price.toLocaleString() } { saleData.currency }</span>
                                </div>
                                <AlignDivider.Root />
                                <div className="flex justify-between gap-3 text-paragraph-xs">
                                    <span className="text-text-sub-600">Möbel</span>
                                    <span className="font-medium text-text-strong-950">{ saleData.items }</span>
                                </div>
                                <div className="flex justify-between gap-3 text-paragraph-xs">
                                    <span className="text-text-sub-600">Bots</span>
                                    <span className="font-medium text-text-strong-950">{ saleData.bots }</span>
                                </div>
                                <div className="flex justify-between gap-3 text-paragraph-xs">
                                    <span className="text-text-sub-600">Haustiere</span>
                                    <span className="font-medium text-text-strong-950">{ saleData.pets }</span>
                                </div>
                                { saleData.limiteds > 0 && (
                                    <div className="flex justify-between gap-3 text-paragraph-xs">
                                        <span className="font-medium text-warning-base">Limitierte Items</span>
                                        <span className="font-semibold text-warning-base">{ saleData.limiteds }</span>
                                    </div>
                                ) }
                            </div>
                            { saleData.limiteds > 0 && (
                                <div className="flex items-start gap-2 rounded-xl bg-warning-lighter p-3 text-warning-base ring-1 ring-inset ring-warning-light">
                                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                                    <div className="text-paragraph-xs leading-relaxed">
                                        Dieser Raum enthält { saleData.limiteds } limitierte Items. Diese werden mit dem Kauf übertragen.
                                    </div>
                                </div>
                            ) }
                            { !confirming ? (
                                <FancyButton.Root className="w-full" size="small" variant="primary" onClick={ () => setConfirming(true) }>
                                    <FancyButton.Icon as={ ShoppingCart } className="size-4" />
                                    Raum kaufen
                                </FancyButton.Root>
                            ) : (
                                <div className="space-y-3">
                                    <div className="rounded-xl bg-error-lighter px-3 py-2 text-center text-paragraph-xs font-medium text-error-base">
                                        Bist du sicher? { saleData.price.toLocaleString() } { saleData.currency } werden abgezogen!
                                    </div>
                                    <div className="flex gap-2">
                                        <AlignButton.Root variant="neutral" mode="stroke" size="small" className="flex-1" onClick={ () => setConfirming(false) }>
                                            Abbrechen
                                        </AlignButton.Root>
                                        <FancyButton.Root variant="destructive" size="small" className="flex-1" onClick={ onBuyConfirm }>
                                            Ja, kaufen!
                                        </FancyButton.Root>
                                    </div>
                                </div>
                            ) }
                        </div>
                    </AlignSurface.Panel>
                </div>
            </DraggableWindow>
        );
    }

    if(showBanner)
    {
        return (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[90] pointer-events-auto">
                <AlignSurface.Panel className="min-w-[320px] overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-success-lighter text-success-base ring-1 ring-inset ring-success-light">
                            <Home className="size-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-label-sm text-text-strong-950">Raum zu verkaufen!</div>
                            <div className="text-paragraph-xs text-text-sub-600">
                                { saleData.price.toLocaleString() } { saleData.currency }
                                { ' · ' }{ saleData.items } Möbel
                            </div>
                        </div>
                        <AlignButton.Root size="xsmall" variant="primary" mode="filled" onClick={ () =>
                        {
                            setShowPanel(true); setShowBanner(false);
                        } }>
                            Details
                        </AlignButton.Root>
                        <AlignButton.Root variant="neutral" mode="ghost" size="xxsmall" className="size-7 p-0" onClick={ onDismissBanner }>
                            <AlignButton.Icon as={ X } className="size-4" />
                        </AlignButton.Root>
                    </div>
                </AlignSurface.Panel>
            </div>
        );
    }

    return null;
};
