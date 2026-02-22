import { FC, useCallback, useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { Home, ShoppingCart, AlertTriangle } from 'lucide-react';
import { RoomSessionEvent } from '@nitrots/nitro-renderer';
import { GetConfiguration, GetRoomSession, GetSessionDataManager } from '../../api';
import { useRoom, useRoomSessionManagerEvent } from '../../hooks';

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

        fetch(`${ cmsUrl }/api/room-sale?roomId=${ roomId }`, {
            headers: { 'X-Habbo-User-Id': String(userId) },
        })
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
            <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-auto">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={ onClose } />

                <div className="relative w-[420px] rounded-2xl border border-white/[0.08] bg-white/[0.04] p-0.5 shadow-2xl">
                    <div className="relative flex flex-col overflow-hidden rounded-[14px] border border-white/[0.06] bg-[rgba(12,12,16,0.97)]">

                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-gradient-to-b from-white/[0.06] to-transparent">
                            <div className="flex items-center gap-2.5">
                                <Home className="size-4 text-emerald-400/80" />
                                <span className="text-sm font-semibold text-white/90 tracking-tight">Raum kaufen</span>
                            </div>
                            <button className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.08] transition-all" onClick={ onClose }>
                                <FaTimes className="size-3" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-5 space-y-4">
                            <div>
                                <div className="text-base font-bold text-white/90">{ saleData.room }</div>
                                <div className="text-xs text-white/40 mt-0.5">Verkäufer: { saleData.owner }</div>
                            </div>

                            <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-3 space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-white/50">Preis</span>
                                    <span className="font-bold text-yellow-400">{ saleData.price.toLocaleString() } { saleData.currency }</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-white/50">Möbel</span>
                                    <span className="text-white/80">{ saleData.items }</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-white/50">Bots</span>
                                    <span className="text-white/80">{ saleData.bots }</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-white/50">Haustiere</span>
                                    <span className="text-white/80">{ saleData.pets }</span>
                                </div>
                                { saleData.limiteds > 0 && (
                                    <div className="flex justify-between text-xs">
                                        <span className="text-orange-400 font-semibold">Limitierte Items</span>
                                        <span className="text-orange-400 font-bold">{ saleData.limiteds }</span>
                                    </div>
                                )}
                            </div>

                            { saleData.limiteds > 0 && (
                                <div className="flex items-start gap-2 rounded-lg bg-orange-500/10 border border-orange-500/20 p-2.5">
                                    <AlertTriangle className="size-4 text-orange-400 shrink-0 mt-0.5" />
                                    <div className="text-[11px] text-orange-300/80 leading-relaxed">
                                        Dieser Raum enthält { saleData.limiteds } limitierte Items. Diese werden mit dem Kauf übertragen.
                                    </div>
                                </div>
                            )}

                            { !confirming ? (
                                <button
                                    className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                                    onClick={ () => setConfirming(true) }
                                >
                                    <ShoppingCart className="size-4" />
                                    Raum kaufen
                                </button>
                            ) : (
                                <div className="space-y-2">
                                    <div className="text-xs text-center text-red-400 font-semibold">
                                        Bist du sicher? { saleData.price.toLocaleString() } { saleData.currency } werden abgezogen!
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            className="flex-1 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white/70 text-xs font-medium transition-colors"
                                            onClick={ () => setConfirming(false) }
                                        >
                                            Abbrechen
                                        </button>
                                        <button
                                            className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors"
                                            onClick={ onBuyConfirm }
                                        >
                                            Ja, kaufen!
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if(showBanner)
    {
        return (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[90] pointer-events-auto">
                <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-emerald-500/20 bg-[rgba(12,12,16,0.95)] backdrop-blur-xl shadow-lg">
                    <Home className="size-4 text-emerald-400" />
                    <div className="text-xs text-white/80">
                        <span className="font-semibold text-emerald-400">Raum zu verkaufen!</span>
                        { ' ' }{ saleData.price.toLocaleString() } { saleData.currency }
                        { ' · ' }{ saleData.items } Möbel
                    </div>
                    <button
                        className="px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition-colors"
                        onClick={ () => { setShowPanel(true); setShowBanner(false); } }
                    >
                        Details
                    </button>
                    <button
                        className="p-1 rounded text-white/30 hover:text-white/70 transition-colors"
                        onClick={ onDismissBanner }
                    >
                        <FaTimes className="size-2.5" />
                    </button>
                </div>
            </div>
        );
    }

    return null;
};
