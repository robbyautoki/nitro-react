import { FC, useCallback, useEffect, useState } from 'react';
import { Home, ShoppingCart, AlertTriangle, X } from 'lucide-react';
import { RoomSessionEvent } from '@nitrots/nitro-renderer';
import { GetConfiguration, GetRoomSession, GetSessionDataManager } from '../../api';
import { useRoom, useRoomSessionManagerEvent } from '../../hooks';
import { DraggableWindow, DraggableWindowPosition } from '../../common/draggable-window';
import { Frame, FramePanel } from '../ui/frame';
import { Button } from '../ui/button';

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
        if(!roomSession) { setSaleData(null); setShowBanner(false); return; }

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
            .catch(() => {});
    }, [ roomSession ]);

    const onBuyConfirm = useCallback(() =>
    {
        try
        {
            const session = GetRoomSession();
            if(session) session.sendChatMessage(':buyroom confirm', 0);
        }
        catch {}

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
                <div className="w-[420px]">
                    <Frame className="relative">
                        <div className="drag-handler absolute inset-0 cursor-move" />
                        <FramePanel className="overflow-hidden p-0! relative z-10">
                            <div className="flex items-center justify-between px-4 py-2.5 border-b">
                                <div className="flex items-center gap-2">
                                    <Home className="size-4 text-emerald-500" />
                                    <span className="text-sm font-semibold">Raum kaufen</span>
                                </div>
                                <button className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" onClick={ onClose }>
                                    <X className="size-3.5" />
                                </button>
                            </div>

                            <div className="px-4 py-3 space-y-3">
                                <div>
                                    <div className="text-base font-bold text-foreground">{ saleData.room }</div>
                                    <div className="text-xs text-muted-foreground mt-0.5">Verkäufer: { saleData.owner }</div>
                                </div>

                                <div className="rounded-lg border p-3 space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">Preis</span>
                                        <span className="font-bold text-amber-500">{ saleData.price.toLocaleString() } { saleData.currency }</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">Möbel</span>
                                        <span className="text-foreground">{ saleData.items }</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">Bots</span>
                                        <span className="text-foreground">{ saleData.bots }</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">Haustiere</span>
                                        <span className="text-foreground">{ saleData.pets }</span>
                                    </div>
                                    { saleData.limiteds > 0 && (
                                        <div className="flex justify-between text-xs">
                                            <span className="text-orange-500 font-semibold">Limitierte Items</span>
                                            <span className="text-orange-500 font-bold">{ saleData.limiteds }</span>
                                        </div>
                                    )}
                                </div>

                                { saleData.limiteds > 0 && (
                                    <div className="flex items-start gap-2 rounded-lg border border-orange-500/20 bg-orange-500/5 p-2.5">
                                        <AlertTriangle className="size-4 text-orange-500 shrink-0 mt-0.5" />
                                        <div className="text-[11px] text-orange-500/80 leading-relaxed">
                                            Dieser Raum enthält { saleData.limiteds } limitierte Items. Diese werden mit dem Kauf übertragen.
                                        </div>
                                    </div>
                                )}

                                { !confirming ? (
                                    <Button className="w-full" size="sm" onClick={ () => setConfirming(true) }>
                                        <ShoppingCart className="size-4" />
                                        Raum kaufen
                                    </Button>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="text-xs text-center text-red-500 font-semibold">
                                            Bist du sicher? { saleData.price.toLocaleString() } { saleData.currency } werden abgezogen!
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" className="flex-1" onClick={ () => setConfirming(false) }>
                                                Abbrechen
                                            </Button>
                                            <Button variant="destructive" size="sm" className="flex-1" onClick={ onBuyConfirm }>
                                                Ja, kaufen!
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </FramePanel>
                    </Frame>
                </div>
            </DraggableWindow>
        );
    }

    if(showBanner)
    {
        return (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[90] pointer-events-auto">
                <Frame>
                    <FramePanel className="!p-0">
                        <div className="flex items-center gap-3 px-4 py-3">
                            <Home className="size-5 text-emerald-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-foreground">Raum zu verkaufen!</div>
                                <div className="text-xs text-muted-foreground">
                                    { saleData.price.toLocaleString() } { saleData.currency }
                                    { ' · ' }{ saleData.items } Möbel
                                </div>
                            </div>
                            <Button size="sm" onClick={ () => { setShowPanel(true); setShowBanner(false); } }>
                                Details
                            </Button>
                            <button className="p-1 rounded text-muted-foreground hover:text-foreground" onClick={ onDismissBanner }>
                                <X className="size-3" />
                            </button>
                        </div>
                    </FramePanel>
                </Frame>
            </div>
        );
    }

    return null;
};
