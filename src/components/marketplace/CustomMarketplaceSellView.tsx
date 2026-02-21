import { FC, useCallback, useEffect, useState } from 'react';
import { GetConfiguration } from '../../api';
import { CustomMarketplaceApi } from './CustomMarketplaceApi';
import { InventoryGroup } from './CustomMarketplaceTypes';
import { ShoppingBag, Search, X, Plus, Coins, Package, Check, AlertTriangle } from 'lucide-react';

function getFurniIcon(itemName: string)
{
    const baseUrl = GetConfiguration<string>('image.library.url', 'http://localhost:8080/c_images/');
    return `${ baseUrl }${ itemName.split('*')[0] }_icon.png`;
}

const DURATIONS = [
    { value: 1, label: '1 Tag' },
    { value: 3, label: '3 Tage' },
    { value: 7, label: '7 Tage' },
    { value: 14, label: '14 Tage' },
    { value: 30, label: '30 Tage' },
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
    const [ inventory, setInventory ] = useState<InventoryGroup[]>([]);
    const [ searchQuery, setSearchQuery ] = useState('');
    const [ loading, setLoading ] = useState(true);

    // Selected items for listing
    const [ selected, setSelected ] = useState<SelectedItem[]>([]);

    // Listing settings
    const [ price, setPrice ] = useState('');
    const [ currency, setCurrency ] = useState('credits');
    const [ duration, setDuration ] = useState(7);
    const [ note, setNote ] = useState('');

    // State
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

    const filteredInventory = searchQuery.length >= 1
        ? inventory.filter(g => g.public_name.toLowerCase().includes(searchQuery.toLowerCase()))
        : inventory;

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

    const removeItem = (baseId: number) =>
    {
        setSelected(prev => prev.filter(s => s.item_base_id !== baseId));
    };

    const updateQuantity = (baseId: number, qty: number) =>
    {
        setSelected(prev =>
            prev.map(s =>
            {
                if(s.item_base_id !== baseId) return s;
                const clamped = Math.max(1, Math.min(qty, s.available));
                return { ...s, quantity: clamped };
            })
        );
    };

    const totalItemCount = selected.reduce((sum, s) => sum + s.quantity, 0);
    const isBundle = selected.length > 1;

    const handleSubmit = async () =>
    {
        const p = parseInt(price);
        if(!p || p < 1) { setError('Bitte gib einen gültigen Preis ein'); return; }
        if(selected.length === 0) { setError('Bitte wähle mindestens ein Item aus'); return; }

        setSubmitting(true);
        setError('');

        // Collect item_ids: for each selected group, take quantity instance_ids
        const allItemIds: number[] = [];
        for(const sel of selected)
        {
            allItemIds.push(...sel.instance_ids.slice(0, sel.quantity));
        }

        const res = await CustomMarketplaceApi.createListing({
            item_ids: allItemIds,
            price: p,
            currency,
            duration_days: duration,
            note: note.trim() || undefined,
        });

        setSubmitting(false);

        if(res.ok)
        {
            setSuccess(true);
            setSelected([]);
            setPrice('');
            setNote('');
            loadInventory();
            setTimeout(() => setSuccess(false), 3000);
        }
        else
        {
            setError(res.error || 'Fehler beim Erstellen');
        }
    };

    return (
        <div className="flex flex-col gap-3">
            {/* Success Banner */}
            { success && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/20">
                    <Check className="size-4 text-emerald-400" />
                    <span className="text-xs text-emerald-300">Angebot erfolgreich erstellt!</span>
                </div>
            ) }

            {/* Error Banner */}
            { error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/[0.08] border border-red-500/20">
                    <AlertTriangle className="size-4 text-red-400" />
                    <span className="text-xs text-red-300">{ error }</span>
                </div>
            ) }

            {/* Selected Items */}
            { selected.length > 0 && (
                <div className="flex flex-col gap-2">
                    <span className="text-[11px] font-medium text-white/50">
                        { isBundle ? 'Bundle' : 'Ausgewählt' } — { totalItemCount } Item{ totalItemCount !== 1 ? 's' : '' }
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                        { selected.map(sel => (
                            <div key={ sel.item_base_id } className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08]">
                                <img
                                    src={ getFurniIcon(sel.item_name) }
                                    alt={ sel.public_name }
                                    className="w-6 h-6 object-contain"
                                    onError={ (e) => { (e.target as HTMLImageElement).style.display = 'none'; } }
                                />
                                <span className="text-[11px] text-white/70">{ sel.public_name }</span>
                                { sel.available > 1 && (
                                    <div className="flex items-center gap-1">
                                        <button
                                            className="size-4 rounded text-[10px] bg-white/[0.06] text-white/40 hover:bg-white/10"
                                            onClick={ () => updateQuantity(sel.item_base_id, sel.quantity - 1) }
                                        >-</button>
                                        <span className="text-[10px] text-white/60 w-4 text-center">{ sel.quantity }</span>
                                        <button
                                            className="size-4 rounded text-[10px] bg-white/[0.06] text-white/40 hover:bg-white/10"
                                            onClick={ () => updateQuantity(sel.item_base_id, sel.quantity + 1) }
                                        >+</button>
                                    </div>
                                ) }
                                <button
                                    className="ml-1 p-0.5 rounded text-white/30 hover:text-red-400 transition-colors"
                                    onClick={ () => removeItem(sel.item_base_id) }
                                >
                                    <X className="size-3" />
                                </button>
                            </div>
                        )) }
                    </div>
                </div>
            ) }

            {/* Listing Settings */}
            { selected.length > 0 && (
                <div className="flex flex-col gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="grid grid-cols-3 gap-2">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-white/40">Preis</span>
                            <div className="flex items-center gap-1">
                                <Coins className="size-3 text-white/30" />
                                <input
                                    className="flex-1 h-7 px-2 text-[11px] rounded-lg bg-white/[0.06] border border-white/[0.08] text-white/80 outline-none focus:border-white/20"
                                    type="number"
                                    min={ 1 }
                                    placeholder="0"
                                    value={ price }
                                    onChange={ e => setPrice(e.target.value) }
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-white/40">Währung</span>
                            <select
                                className="h-7 px-2 text-[11px] rounded-lg bg-white/[0.06] border border-white/[0.08] text-white/80 outline-none"
                                value={ currency }
                                onChange={ e => setCurrency(e.target.value) }
                            >
                                { CURRENCIES.map(c => (
                                    <option key={ c.value } value={ c.value } className="bg-zinc-900">{ c.label }</option>
                                )) }
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-white/40">Dauer</span>
                            <select
                                className="h-7 px-2 text-[11px] rounded-lg bg-white/[0.06] border border-white/[0.08] text-white/80 outline-none"
                                value={ duration }
                                onChange={ e => setDuration(parseInt(e.target.value)) }
                            >
                                { DURATIONS.map(d => (
                                    <option key={ d.value } value={ d.value } className="bg-zinc-900">{ d.label }</option>
                                )) }
                            </select>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-white/40">Notiz (optional)</span>
                        <input
                            className="h-7 px-2.5 text-[11px] rounded-lg bg-white/[0.06] border border-white/[0.08] text-white/80 placeholder-white/30 outline-none focus:border-white/20"
                            type="text"
                            maxLength={ 255 }
                            placeholder="z.B. Preisverhandlung möglich..."
                            value={ note }
                            onChange={ e => setNote(e.target.value) }
                        />
                    </div>
                    <button
                        className="mt-1 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 text-[11px] font-semibold hover:bg-emerald-500/30 transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
                        onClick={ handleSubmit }
                        disabled={ submitting || !price || selected.length === 0 }
                    >
                        <ShoppingBag className="size-3.5" />
                        { submitting ? 'Wird erstellt...' : `Angebot erstellen (${ totalItemCount } Item${ totalItemCount !== 1 ? 's' : '' })` }
                    </button>
                </div>
            ) }

            {/* Inventory Browser */}
            <div className="flex flex-col gap-2">
                <span className="text-[11px] font-medium text-white/50">Inventar</span>
                <div className="flex items-center gap-2">
                    <Search className="size-3 text-white/30" />
                    <input
                        className="flex-1 h-7 px-2.5 text-[11px] rounded-lg bg-white/[0.06] border border-white/[0.08] text-white/80 placeholder-white/30 outline-none focus:border-white/20"
                        type="text"
                        placeholder="Item suchen..."
                        value={ searchQuery }
                        onChange={ e => setSearchQuery(e.target.value) }
                    />
                </div>
            </div>

            { loading && <div className="text-center py-8 text-white/30 text-xs">Inventar wird geladen...</div> }

            { !loading && filteredInventory.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-white/20">
                    <Package className="size-8 mb-2" />
                    <span className="text-xs">{ searchQuery ? 'Keine Items gefunden' : 'Inventar ist leer' }</span>
                </div>
            ) }

            { !loading && (
                <div className="grid grid-cols-2 gap-1.5 max-h-[300px] overflow-y-auto">
                    { filteredInventory.map(group =>
                    {
                        const isSelected = selected.some(s => s.item_base_id === group.item_base_id);
                        return (
                            <button
                                key={ group.item_base_id }
                                className={ `flex items-center gap-2 p-2 rounded-lg border transition-all text-left ${
                                    isSelected
                                        ? 'bg-emerald-500/[0.08] border-emerald-500/20'
                                        : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]'
                                }` }
                                onClick={ () => isSelected ? removeItem(group.item_base_id) : addItem(group) }
                            >
                                <div className="w-8 h-8 rounded bg-white/[0.05] flex items-center justify-center shrink-0 overflow-hidden">
                                    <img
                                        src={ getFurniIcon(group.item_name) }
                                        alt={ group.public_name }
                                        className="max-w-full max-h-full object-contain"
                                        onError={ (e) => { (e.target as HTMLImageElement).style.display = 'none'; } }
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[11px] text-white/70 truncate">{ group.public_name }</div>
                                    <div className="text-[10px] text-white/30">x{ group.count }</div>
                                </div>
                                { isSelected && <Check className="size-3 text-emerald-400 shrink-0" /> }
                                { !isSelected && <Plus className="size-3 text-white/20 shrink-0" /> }
                            </button>
                        );
                    }) }
                </div>
            ) }
        </div>
    );
};
