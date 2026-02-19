import { FC, useCallback, useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { ClipboardList, Search, Loader2 } from 'lucide-react';
import { ILinkEventTracker } from '@nitrots/nitro-renderer';
import { AddEventLinkTracker, GetConfiguration, RemoveLinkEventTracker } from '../../api';

interface PriceListItem
{
    itemBaseId: number;
    name: string;
    itemName: string;
    spriteId: number;
    tradeValue: number;
    rarityType: string | null;
    rarityDisplayName: string | null;
    circulation: number;
    setName: string | null;
}

const RARITY_TABS = [
    { id: '', label: 'Alle' },
    { id: 'og_rare', label: 'OG', color: '#FFD700' },
    { id: 'weekly_rare', label: 'Wochen', color: '#22C55E' },
    { id: 'monthly_rare', label: 'Monat', color: '#A855F7' },
    { id: 'cashshop_rare', label: 'Cash', color: '#F97316' },
    { id: 'bonzen_rare', label: 'Bonzen', color: '#FFD700' },
];

export const PriceListView: FC<{}> = () =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ items, setItems ] = useState<PriceListItem[]>([]);
    const [ loading, setLoading ] = useState(false);
    const [ search, setSearch ] = useState('');
    const [ activeTab, setActiveTab ] = useState('');
    const [ page, setPage ] = useState(1);
    const [ totalPages, setTotalPages ] = useState(1);

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');

                if(parts.length < 2) return;

                switch(parts[1])
                {
                    case 'toggle':
                        setIsVisible(prev => !prev);
                        return;
                    case 'show':
                        setIsVisible(true);
                        return;
                    case 'hide':
                        setIsVisible(false);
                        return;
                }
            },
            eventUrlPrefix: 'pricelist/'
        };

        AddEventLinkTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    const fetchItems = useCallback(async () =>
    {
        if(!isVisible) return;

        setLoading(true);

        try
        {
            const cmsUrl = GetConfiguration<string>('url.prefix', '');
            const params = new URLSearchParams();

            if(search) params.set('search', search);
            if(activeTab) params.set('rarityType', activeTab);
            params.set('page', page.toString());
            params.set('limit', '30');

            const response = await fetch(`${ cmsUrl }/api/pricelist?${ params.toString() }`);
            const data = await response.json();

            setItems(data.items || []);
            setTotalPages(data.totalPages || 1);
        }
        catch
        {
            setItems([]);
        }
        finally
        {
            setLoading(false);
        }
    }, [ isVisible, search, activeTab, page ]);

    useEffect(() =>
    {
        fetchItems();
    }, [ fetchItems ]);

    useEffect(() =>
    {
        setPage(1);
    }, [ search, activeTab ]);

    const onClose = useCallback(() => setIsVisible(false), []);

    if(!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-auto">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={ onClose } />

            <div className="relative w-[580px] max-h-[80vh] rounded-2xl border border-white/[0.08] bg-white/[0.04] p-0.5 shadow-2xl">
                <div className="relative flex flex-col overflow-hidden rounded-[14px] border border-white/[0.06] bg-[rgba(12,12,16,0.97)] max-h-[calc(80vh-4px)]">

                    { /* Header */ }
                    <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-gradient-to-b from-white/[0.06] to-transparent shrink-0">
                        <div className="flex items-center gap-2.5">
                            <ClipboardList className="size-4 text-white/70" />
                            <span className="text-sm font-semibold text-white/90 tracking-tight">Preisliste</span>
                        </div>
                        <button className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.08] transition-all" onClick={ onClose }>
                            <FaTimes className="size-3" />
                        </button>
                    </div>

                    { /* Search + Tabs */ }
                    <div className="px-4 pt-3 pb-2 shrink-0 space-y-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-white/30" />
                            <input
                                type="text"
                                placeholder="Suchen..."
                                value={ search }
                                onChange={ e => setSearch(e.target.value) }
                                className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.08] text-sm text-white/90 placeholder-white/30 outline-none focus:border-white/20 transition-colors"
                            />
                        </div>
                        <div className="flex gap-1 flex-wrap">
                            { RARITY_TABS.map(tab => (
                                <button
                                    key={ tab.id }
                                    className={ `px-3 py-1 rounded-md text-xs font-medium transition-all ${ activeTab === tab.id
                                        ? 'bg-white/[0.12] text-white'
                                        : 'text-white/40 hover:text-white/70 hover:bg-white/[0.05]'
                                    }` }
                                    style={ activeTab === tab.id && tab.color ? { color: tab.color } : undefined }
                                    onClick={ () => setActiveTab(tab.id) }
                                >
                                    { tab.label }
                                </button>
                            )) }
                        </div>
                    </div>

                    { /* Item list */ }
                    <div className="flex-1 overflow-y-auto px-4 pb-3 min-h-0">
                        { loading &&
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="size-5 animate-spin text-white/30" />
                            </div> }
                        { !loading && items.length === 0 &&
                            <div className="flex items-center justify-center py-12 text-white/30 text-sm">
                                Keine Items gefunden
                            </div> }
                        { !loading && items.length > 0 &&
                            <div className="space-y-1">
                                { items.map(item => (
                                    <div key={ item.itemBaseId } className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-colors">
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-white/90 truncate">{ item.name }</div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                { item.rarityDisplayName &&
                                                    <span className="text-[10px] font-bold uppercase tracking-wider" style={ { color: RARITY_TABS.find(t => t.id === item.rarityType)?.color || 'rgba(255,255,255,0.4)' } }>
                                                        { item.rarityDisplayName }
                                                    </span> }
                                                { item.setName &&
                                                    <span className="text-[10px] text-white/30">{ item.setName }</span> }
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="text-sm font-bold text-yellow-400">{ item.tradeValue.toLocaleString() }</div>
                                            <div className="text-[10px] text-white/30">Credits</div>
                                        </div>
                                        { item.circulation > 0 &&
                                            <div className="text-right shrink-0 pl-2 border-l border-white/[0.06]">
                                                <div className="text-xs text-white/50">{ item.circulation }</div>
                                                <div className="text-[10px] text-white/25">Stk.</div>
                                            </div> }
                                    </div>
                                )) }
                            </div> }
                    </div>

                    { /* Pagination */ }
                    { totalPages > 1 &&
                        <div className="flex items-center justify-center gap-2 px-4 py-2 border-t border-white/[0.06] shrink-0">
                            <button
                                className="px-2 py-1 rounded text-xs text-white/40 hover:text-white/80 hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-default transition-all"
                                disabled={ page <= 1 }
                                onClick={ () => setPage(p => Math.max(1, p - 1)) }
                            >
                                Zurück
                            </button>
                            <span className="text-xs text-white/40">{ page } / { totalPages }</span>
                            <button
                                className="px-2 py-1 rounded text-xs text-white/40 hover:text-white/80 hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-default transition-all"
                                disabled={ page >= totalPages }
                                onClick={ () => setPage(p => Math.min(totalPages, p + 1)) }
                            >
                                Weiter
                            </button>
                        </div> }
                </div>
            </div>
        </div>
    );
};
