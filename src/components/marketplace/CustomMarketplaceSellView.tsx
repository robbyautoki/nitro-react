import { FurnitureListComposer } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { SendMessageComposer } from '../../api';
import { CustomMarketplaceApi } from './CustomMarketplaceApi';
import { InventoryGroup } from './CustomMarketplaceTypes';
import { useMarketplace } from '../../hooks/marketplace/useMarketplace';
import { ItemIcon } from './marketplace-components';
import { fmtC } from './marketplace-utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    ShoppingBag, Search, X, Plus, Package, Check, AlertTriangle, Tag, Loader2,
} from 'lucide-react';

const DURATIONS = [
    { value: '1', label: '1 Tag' },
    { value: '3', label: '3 Tage' },
    { value: '7', label: '7 Tage' },
    { value: '14', label: '14 Tage' },
    { value: '21', label: '21 Tage' },
    { value: '30', label: '30 Tage' },
];

const CURRENCIES = [
    { value: 'credits', label: 'Credits' },
    { value: 'pixels', label: 'Pixel' },
    { value: 'points', label: 'Punkte' },
];

interface SelectedItem
{
    item_base_id: number;
    public_name: string;
    item_name: string;
    instance_ids: number[];
    quantity: number;
    available: number;
}

export const CustomMarketplaceSellView: FC<{}> = () =>
{
    const { preselectedItemBaseId, setPreselectedItemBaseId } = useMarketplace();
    const [ inventory, setInventory ] = useState<InventoryGroup[]>([]);
    const [ searchQuery, setSearchQuery ] = useState('');
    const [ loading, setLoading ] = useState(true);

    const [ showInventory, setShowInventory ] = useState(false);
    const [ selected, setSelected ] = useState<SelectedItem[]>([]);

    const [ price, setPrice ] = useState('');
    const [ currency, setCurrency ] = useState('credits');
    const [ duration, setDuration ] = useState('7');
    const [ note, setNote ] = useState('');

    const [ submitting, setSubmitting ] = useState(false);
    const [ success, setSuccess ] = useState(false);
    const [ error, setError ] = useState('');

    const loadInventory = useCallback(() =>
    {
        setLoading(true);
        CustomMarketplaceApi.inventory()
            .then(data => setInventory(Array.isArray(data) ? data : []))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { loadInventory(); }, [ loadInventory ]);

    useEffect(() =>
    {
        if(!preselectedItemBaseId || loading || inventory.length === 0) return;
        const group = inventory.find(g => g.item_base_id === preselectedItemBaseId);
        if(group)
        {
            setSelected([ {
                item_base_id: group.item_base_id,
                public_name: group.public_name,
                item_name: group.item_name,
                instance_ids: group.instance_ids,
                quantity: 1,
                available: group.count,
            } ]);
        }
        setPreselectedItemBaseId(null);
    }, [ preselectedItemBaseId, loading, inventory, setPreselectedItemBaseId ]);

    const filteredInventory = useMemo(() =>
    {
        if(!searchQuery) return inventory;
        const q = searchQuery.toLowerCase();
        return inventory.filter(g => g.public_name.toLowerCase().includes(q));
    }, [ inventory, searchQuery ]);

    const addItem = (group: InventoryGroup) =>
    {
        setSelected(prev =>
        {
            const existing = prev.find(s => s.item_base_id === group.item_base_id);
            if(existing)
            {
                if(existing.quantity >= existing.available) return prev;
                return prev.map(s => s.item_base_id === group.item_base_id ? { ...s, quantity: s.quantity + 1 } : s);
            }
            return [ ...prev, {
                item_base_id: group.item_base_id,
                public_name: group.public_name,
                item_name: group.item_name,
                instance_ids: group.instance_ids,
                quantity: 1,
                available: group.count,
            } ];
        });
    };

    const removeItem = (baseId: number) => setSelected(prev => prev.filter(s => s.item_base_id !== baseId));

    const updateQuantity = (baseId: number, qty: number) =>
    {
        setSelected(prev => prev.map(s =>
        {
            if(s.item_base_id !== baseId) return s;
            return { ...s, quantity: Math.max(1, Math.min(qty, s.available)) };
        }));
    };

    const totalItemCount = selected.reduce((sum, s) => sum + s.quantity, 0);

    const handleSubmit = async () =>
    {
        const p = parseInt(price);
        if(!p || p < 1) { setError('Bitte gib einen gültigen Preis ein'); return; }
        if(selected.length === 0) { setError('Bitte wähle mindestens ein Item aus'); return; }

        setSubmitting(true);
        setError('');

        const allItemIds: number[] = [];
        for(const sel of selected) allItemIds.push(...sel.instance_ids.slice(0, sel.quantity));

        try
        {
            const res = await CustomMarketplaceApi.createListing({
                item_ids: allItemIds,
                price: p,
                currency,
                duration_days: parseInt(duration),
                note: note.trim() || undefined,
            });

            if(res.ok)
            {
                setSuccess(true);
                setSelected([]);
                setPrice('');
                setNote('');
                loadInventory();
                SendMessageComposer(new FurnitureListComposer());
                setTimeout(() => setSuccess(false), 3000);
            }
            else
            {
                setError(res.error || 'Fehler beim Erstellen');
            }
        }
        catch
        {
            setError('Netzwerkfehler — bitte erneut versuchen');
        }
        finally
        {
            setSubmitting(false);
        }
    };

    // Inventory Grid View
    if(showInventory)
    {
        return (
            <div className="flex flex-col h-full">
                <div className="shrink-0 px-2.5 py-1.5 border-b border-border/30 flex items-center gap-2">
                    <button onClick={ () => setShowInventory(false) } className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">&larr; Zurück</button>
                    <div className="w-px h-3 bg-border/40" />
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/50" />
                        <Input placeholder="Inventar durchsuchen..." value={ searchQuery } onChange={ e => setSearchQuery(e.target.value) } className="pl-7 h-6 text-[11px]" />
                    </div>
                </div>
                <ScrollArea className="flex-1 min-h-0">
                    { loading ? (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                            <Loader2 className="w-6 h-6 animate-spin opacity-30 mb-1" /><p className="text-[10px]">Laden...</p>
                        </div>
                    ) : filteredInventory.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground px-6 text-center">
                            <Package className="w-6 h-6 opacity-20 mb-1" />
                            <p className="text-[10px] font-medium">{ searchQuery ? 'Keine Items gefunden' : 'Keine Möbel verfügbar' }</p>
                            { !searchQuery && <p className="text-[9px] text-muted-foreground/50 mt-1">Items müssen im Inventar (nicht platziert) und für den Marktplatz freigegeben sein.</p> }
                        </div>
                    ) : (
                        <div className="p-2 grid grid-cols-6 gap-1.5">
                            { filteredInventory.map(item => (
                                <Tooltip key={ item.item_base_id }>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={ () => { addItem(item); setShowInventory(false); setSearchQuery(''); } }
                                            className="relative w-full aspect-square rounded-md border border-border/40 bg-muted/10 hover:border-primary/40 hover:bg-primary/5 flex items-center justify-center transition-all"
                                        >
                                            <ItemIcon itemName={ item.item_name } className="w-20 h-20" />
                                            { item.count > 1 && (
                                                <span className="absolute top-0.5 right-0.5 min-w-[14px] h-[14px] rounded-full bg-foreground/80 text-background text-[8px] font-bold flex items-center justify-center px-0.5">
                                                    x{ item.count }
                                                </span>
                                            ) }
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" sideOffset={ 4 }>
                                        <p className="font-semibold text-xs">{ item.public_name }</p>
                                        <p className="text-[9px] text-muted-foreground">x{ item.count } verfügbar</p>
                                    </TooltipContent>
                                </Tooltip>
                            )) }
                        </div>
                    ) }
                </ScrollArea>
            </div>
        );
    }

    // Main Sell View
    return (
        <div className="flex flex-col items-center justify-center h-full px-6 gap-3">
            {/* Success Banner */}
            { success && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs text-emerald-600">Angebot erfolgreich erstellt!</span>
                </div>
            ) }

            {/* Error Banner */}
            { error && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    <span className="text-xs text-destructive">{ error }</span>
                </div>
            ) }

            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-center">
                <p className="text-[12px] font-semibold">Möbel verkaufen</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Wähle Möbelstücke aus deinem Inventar</p>
            </div>

            <div className="w-full max-w-[320px] space-y-2">
                {/* Selected Items */}
                { selected.length > 0 ? (
                    <div className="flex flex-col gap-1.5">
                        { selected.map(sel => (
                            <div key={ sel.item_base_id } className="flex items-center gap-2 p-2.5 rounded-lg border border-primary/20 bg-primary/5">
                                <div className="w-10 h-10 rounded-md border border-border/40 bg-card flex items-center justify-center">
                                    <ItemIcon itemName={ sel.item_name } className="w-8 h-8" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[11px] font-medium">{ sel.public_name }</p>
                                    { sel.available > 1 && (
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <button className="w-4 h-4 rounded text-[10px] bg-accent/50 text-muted-foreground hover:bg-accent" onClick={ () => updateQuantity(sel.item_base_id, sel.quantity - 1) }>-</button>
                                            <span className="text-[10px] text-muted-foreground w-4 text-center">{ sel.quantity }</span>
                                            <button className="w-4 h-4 rounded text-[10px] bg-accent/50 text-muted-foreground hover:bg-accent" onClick={ () => updateQuantity(sel.item_base_id, sel.quantity + 1) }>+</button>
                                            <span className="text-[9px] text-muted-foreground/50 ml-1">von { sel.available }</span>
                                        </div>
                                    ) }
                                </div>
                                <button onClick={ () => removeItem(sel.item_base_id) }><X className="w-3.5 h-3.5 text-muted-foreground/40 hover:text-foreground" /></button>
                            </div>
                        )) }
                        <button
                            className="flex items-center justify-center gap-1 p-1.5 rounded-lg border border-dashed border-border/50 bg-muted/10 text-[10px] text-muted-foreground hover:border-primary/30 transition-colors"
                            onClick={ () => setShowInventory(true) }
                        >
                            <Plus className="w-3 h-3" />Weiteres Item hinzufügen
                        </button>
                    </div>
                ) : (
                    <div
                        className="flex items-center gap-2 p-2.5 rounded-lg border border-dashed border-border/50 bg-muted/10 cursor-pointer hover:border-primary/30 transition-colors"
                        onClick={ () => setShowInventory(true) }
                    >
                        <div className="w-10 h-10 rounded-md bg-muted/30 flex items-center justify-center">
                            <Plus className="w-4 h-4 text-muted-foreground/40" />
                        </div>
                        <div>
                            <p className="text-[11px] font-medium">Aus Inventar wählen</p>
                            <p className="text-[9px] text-muted-foreground/50">Klicke zum Auswählen</p>
                        </div>
                    </div>
                ) }

                {/* Listing Settings */}
                { selected.length > 0 && (
                    <div className="flex flex-col gap-2 p-3 rounded-lg border border-border/40 bg-card">
                        <div className="grid grid-cols-3 gap-2">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-muted-foreground">Preis</span>
                                <Input type="number" min={ 1 } placeholder="0" value={ price } onChange={ e => setPrice(e.target.value) } className="h-7 text-[11px]" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-muted-foreground">Währung</span>
                                <Select value={ currency } onValueChange={ setCurrency }>
                                    <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        { CURRENCIES.map(c => <SelectItem key={ c.value } value={ c.value }>{ c.label }</SelectItem>) }
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-muted-foreground">Dauer</span>
                                <Select value={ duration } onValueChange={ setDuration }>
                                    <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        { DURATIONS.map(d => <SelectItem key={ d.value } value={ d.value }>{ d.label }</SelectItem>) }
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-muted-foreground">Notiz (optional)</span>
                            <Input type="text" maxLength={ 255 } placeholder="z.B. Preisverhandlung möglich..." value={ note } onChange={ e => setNote(e.target.value) } className="h-7 text-[11px]" />
                        </div>
                        { price && parseInt(price) > 0 && (
                            <div className="text-[10px] text-muted-foreground/50 text-center">
                                2% Marktplatz-Gebühr · Du erhältst: { fmtC(Math.floor(parseInt(price) * 0.98)) } { CURRENCIES.find(c => c.value === currency)?.label ?? currency }
                            </div>
                        ) }
                        <Button
                            className="w-full h-7 text-[11px] bg-amber-600 hover:bg-amber-700 text-white"
                            disabled={ submitting || !price || selected.length === 0 }
                            onClick={ handleSubmit }
                        >
                            <Tag className="w-3 h-3 mr-1" />
                            { submitting ? 'Wird erstellt...' : `Angebot erstellen (${ totalItemCount } Item${ totalItemCount !== 1 ? 's' : '' })` }
                        </Button>
                    </div>
                ) }
            </div>
        </div>
    );
};
