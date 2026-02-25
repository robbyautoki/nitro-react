import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { ILinkEventTracker } from '@nitrots/nitro-renderer';
import { AddEventLinkTracker, GetConfiguration, GetSessionDataManager, RemoveLinkEventTracker } from '../../api';
import { DraggableWindow, DraggableWindowPosition, LayoutFurniImageView } from '../../common';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ClipboardList, Search, X, ChevronLeft, ChevronRight, Package, Hash, Loader2 } from 'lucide-react';

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
    productType: string;
}

const RARITY_TABS = [
    { id: '', label: 'Alle' },
    { id: 'og_rare', label: 'OG', color: '#FFD700' },
    { id: 'weekly_rare', label: 'Wochen', color: '#22C55E' },
    { id: 'monthly_rare', label: 'Monat', color: '#A855F7' },
    { id: 'cashshop_rare', label: 'Cash', color: '#F97316' },
    { id: 'bonzen_rare', label: 'Bonzen', color: '#FFD700' },
];

function getImageUrl() { return GetConfiguration<string>('image.library.url', 'http://localhost:8080/c_images/'); }

function CurrencyIcon({ className }: { className?: string })
{
    const url = GetConfiguration<string>('assets.url', 'http://localhost:8080');
    return <img src={ `${ url }/wallet/-1.png` } alt="credits" className={ className || 'w-4 h-4' } style={{ imageRendering: 'pixelated', objectFit: 'contain' }} draggable={ false } />;
}

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
                    case 'toggle': setIsVisible(prev => !prev); return;
                    case 'show': setIsVisible(true); return;
                    case 'hide': setIsVisible(false); return;
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

            const resolvedItems = (data.items || []).map((item: PriceListItem) =>
            {
                const floorData = GetSessionDataManager().getFloorItemData(item.itemBaseId);
                const wallData = !floorData ? GetSessionDataManager().getWallItemData(item.itemBaseId) : null;
                const displayName = floorData?.name || wallData?.name || item.name;
                const productType = floorData ? 's' : 'i';
                return { ...item, name: displayName, productType };
            });

            setItems(resolvedItems);
            setTotalPages(data.totalPages || 1);
        }
        catch { setItems([]); }
        finally { setLoading(false); }
    }, [ isVisible, search, activeTab, page ]);

    useEffect(() => { fetchItems(); }, [ fetchItems ]);
    useEffect(() => { setPage(1); }, [ search, activeTab ]);

    const filteredCount = useMemo(() => items.length, [ items ]);
    const onClose = useCallback(() => setIsVisible(false), []);

    if(!isVisible) return null;

    return (
        <DraggableWindow uniqueKey="pricelist" handleSelector=".drag-handler" windowPosition={ DraggableWindowPosition.CENTER }>
            <TooltipProvider delayDuration={ 200 }>
                <div className="w-[580px] max-h-[80vh] rounded-xl border border-border/60 bg-card shadow-2xl overflow-hidden flex flex-col">

                    {/* Title Bar */}
                    <div className="drag-handler shrink-0 flex items-center justify-between px-3 py-2 border-b border-border/40 bg-muted/20 cursor-grab active:cursor-grabbing select-none">
                        <div className="flex items-center gap-2">
                            <ClipboardList className="w-3.5 h-3.5 text-muted-foreground/50" />
                            <span className="text-[13px] font-semibold">Preisliste</span>
                            <span className="text-[10px] text-muted-foreground/40 tabular-nums">{ filteredCount } Items</span>
                        </div>
                        <button className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-accent/50 transition-colors" onClick={ onClose }>
                            <X className="w-3 h-3" />
                        </button>
                    </div>

                    {/* Search + Tabs */}
                    <div className="shrink-0 px-3 py-2 space-y-1.5 border-b border-border/30">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/50" />
                            <Input placeholder="Suchen..." value={ search } onChange={ (e) => setSearch(e.target.value) } className="pl-7 h-7 text-[11px]" />
                            { search && <button onClick={ () => setSearch('') } className="absolute right-1.5 top-1/2 -translate-y-1/2"><X className="w-2.5 h-2.5 text-muted-foreground/50" /></button> }
                        </div>
                        <div className="flex gap-1 flex-wrap">
                            { RARITY_TABS.map((tab) => (
                                <button key={ tab.id } onClick={ () => setActiveTab(tab.id) }
                                    className={ `px-2 py-0.5 rounded-md text-[10px] font-medium transition-all ${ activeTab === tab.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground' }` }
                                    style={ activeTab === tab.id && tab.color ? { color: tab.color, backgroundColor: tab.color + '10' } : undefined }>
                                    { tab.label }
                                </button>
                            )) }
                        </div>
                    </div>

                    {/* Item List */}
                    <ScrollArea className="flex-1 min-h-0" style={{ maxHeight: 'calc(80vh - 160px)' }}>
                        { loading && (
                            <div className="flex items-center justify-center py-16">
                                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/30" />
                            </div>
                        ) }
                        { !loading && items.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                <Package className="w-8 h-8 mb-2 opacity-20" />
                                <p className="text-xs font-medium">Keine Items gefunden</p>
                            </div>
                        ) }
                        { !loading && items.length > 0 && (
                            <div className="divide-y divide-border/30">
                                { items.map((item) => (
                                    <Tooltip key={ item.itemBaseId }>
                                        <TooltipTrigger asChild>
                                            <div className="flex items-center gap-2.5 px-3 py-2 hover:bg-accent/30 transition-colors cursor-default">
                                                <div className="w-9 h-9 shrink-0 rounded-md border border-border/40 bg-muted/10 flex items-center justify-center overflow-hidden">
                                                    <LayoutFurniImageView productType={ item.productType } productClassId={ item.spriteId } scale={ 0.5 } />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[12px] font-medium truncate">{ item.name }</div>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        { item.rarityDisplayName && (
                                                            <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: RARITY_TABS.find((t) => t.id === item.rarityType)?.color }}>
                                                                { item.rarityDisplayName }
                                                            </span>
                                                        ) }
                                                        { item.setName && <span className="text-[9px] text-muted-foreground/50">{ item.setName }</span> }
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <div className="flex items-center gap-1 justify-end">
                                                        <CurrencyIcon className="w-3.5 h-3.5" />
                                                        <span className="text-[12px] font-bold text-amber-500 tabular-nums">{ item.tradeValue.toLocaleString('de-DE') }</span>
                                                    </div>
                                                </div>
                                                { item.circulation > 0 && (
                                                    <div className="text-right shrink-0 pl-2 border-l border-border/30">
                                                        <div className="text-[11px] text-muted-foreground tabular-nums flex items-center gap-0.5 justify-end">
                                                            <Hash className="w-2.5 h-2.5 opacity-40" />{ item.circulation.toLocaleString('de-DE') }
                                                        </div>
                                                        <div className="text-[9px] text-muted-foreground/30">Stk.</div>
                                                    </div>
                                                ) }
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="left" sideOffset={ 8 }>
                                            <div className="space-y-0.5 max-w-[180px]">
                                                <p className="font-semibold text-xs">{ item.name }</p>
                                                <p className="text-[9px] opacity-40 font-mono">{ item.itemName }</p>
                                                { item.rarityDisplayName && <p className="text-[10px]">Seltenheit: { item.rarityDisplayName }</p> }
                                                { item.setName && <p className="text-[10px]">Set: { item.setName }</p> }
                                                <p className="text-[10px] font-bold text-amber-500 flex items-center gap-1">
                                                    <CurrencyIcon className="w-3 h-3" />{ item.tradeValue.toLocaleString('de-DE') } Credits
                                                </p>
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                )) }
                            </div>
                        ) }
                    </ScrollArea>

                    {/* Pagination */}
                    { totalPages > 1 && (
                        <div className="shrink-0 flex items-center justify-center gap-2 px-3 py-1.5 border-t border-border/30 bg-muted/10">
                            <Button variant="ghost" size="icon" className="h-6 w-6" disabled={ page <= 1 } onClick={ () => setPage((p) => p - 1) }>
                                <ChevronLeft className="w-3 h-3" />
                            </Button>
                            <span className="text-[10px] text-muted-foreground tabular-nums">{ page } / { totalPages }</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" disabled={ page >= totalPages } onClick={ () => setPage((p) => p + 1) }>
                                <ChevronRight className="w-3 h-3" />
                            </Button>
                        </div>
                    ) }
                </div>
            </TooltipProvider>
        </DraggableWindow>
    );
};
