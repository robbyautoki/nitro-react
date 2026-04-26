import { FurnitureListComposer } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { SendMessageComposer } from '../../api';
import { CustomMarketplaceApi } from './CustomMarketplaceApi';
import { InventoryGroup } from './CustomMarketplaceTypes';
import { useMarketplace } from '../../hooks/marketplace/useMarketplace';
import { ItemIcon } from './marketplace-components';
import { fmtC } from './marketplace-utils';
import * as AlignInput from '@/align-ui/components/ui/input';
import * as FancyButton from '@/align-ui/components/ui/fancy-button';
import * as AlignSelect from '@/align-ui/components/ui/select';
import * as AlignTooltip from '@/align-ui/components/ui/tooltip';
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

const Select = AlignSelect.Root;
const SelectContent = AlignSelect.Content;
const SelectItem = AlignSelect.Item;
const SelectTrigger = AlignSelect.Trigger;
const SelectValue = AlignSelect.Value;

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

    useEffect(() =>
    {
        loadInventory();
    }, [ loadInventory ]);

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
        if(!p || p < 1)
        {
            setError('Bitte gib einen gültigen Preis ein'); return;
        }
        if(selected.length === 0)
        {
            setError('Bitte wähle mindestens ein Item aus'); return;
        }

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
                <div className="shrink-0 px-2.5 py-1.5 border-b border-stroke-soft-200 bg-bg-weak-50 flex items-center gap-2">
                    <button onClick={ () => setShowInventory(false) } className="text-paragraph-xs text-text-sub-600 transition-colors hover:text-text-strong-950">&larr; Zurück</button>
                    <div className="w-px h-3 bg-stroke-soft-200" />
                    <AlignInput.Root size="xsmall" className="flex-1">
                        <AlignInput.Wrapper className="h-8">
                            <AlignInput.Icon as={ Search } className="size-4" />
                            <AlignInput.Input placeholder="Inventar durchsuchen..." value={ searchQuery } onChange={ e => setSearchQuery(e.target.value) } className="h-8 text-paragraph-xs" />
                        </AlignInput.Wrapper>
                    </AlignInput.Root>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto" style={ { scrollbarWidth: 'thin' } }>
                    { loading ? (
                        <div className="flex flex-col items-center justify-center py-8 text-text-sub-600">
                            <Loader2 className="w-6 h-6 animate-spin opacity-30 mb-1" /><p className="text-paragraph-xs">Laden...</p>
                        </div>
                    ) : filteredInventory.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-text-sub-600 px-6 text-center">
                            <Package className="w-6 h-6 opacity-20 mb-1" />
                            <p className="text-label-xs">{ searchQuery ? 'Keine Rares gefunden' : 'Keine Rares verfügbar' }</p>
                            { !searchQuery && <p className="mt-1 text-paragraph-xs text-text-soft-400">Items müssen im Inventar (nicht platziert) und für den Marktplatz freigegeben sein.</p> }
                        </div>
                    ) : (
                        <div className="p-2 grid grid-cols-6 gap-1.5">
                            { filteredInventory.map(item => (
                                <AlignTooltip.Root key={ item.item_base_id }>
                                    <AlignTooltip.Trigger asChild>
                                        <button
                                            onClick={ () =>
                                            {
                                                addItem(item); setShowInventory(false); setSearchQuery('');
                                            } }
                                            className="relative flex aspect-square w-full items-center justify-center rounded-xl bg-bg-weak-50 transition-all hover:bg-bg-white-0 hover:shadow-regular-xs hover:ring-1 hover:ring-inset hover:ring-stroke-soft-200"
                                        >
                                            <ItemIcon itemName={ item.item_name } className="w-20 h-20" />
                                            { item.count > 1 && (
                                                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-bg-strong-950 px-1 text-subheading-2xs text-static-white">
                                                    x{ item.count }
                                                </span>
                                            ) }
                                        </button>
                                    </AlignTooltip.Trigger>
                                    <AlignTooltip.Content side="top" sideOffset={ 4 } variant="light">
                                        <p className="font-semibold text-xs">{ item.public_name }</p>
                                        <p className="text-paragraph-xs text-text-sub-600">x{ item.count } verfügbar</p>
                                    </AlignTooltip.Content>
                                </AlignTooltip.Root>
                            )) }
                        </div>
                    ) }
                </div>
            </div>
        );
    }

    // Main Sell View
    return (
        <div className="flex flex-col items-center justify-center h-full px-6 gap-3">
            { /* Success Banner */ }
            { success && (
                <div className="flex items-center gap-2 rounded-lg bg-success-lighter px-3 py-2 ring-1 ring-success-base/20">
                    <Check className="w-4 h-4 text-success-base" />
                    <span className="text-paragraph-xs text-success-base">Angebot erfolgreich erstellt!</span>
                </div>
            ) }
            { /* Error Banner */ }
            { error && (
                <div className="flex items-center gap-2 rounded-lg bg-error-lighter px-3 py-2 ring-1 ring-error-base/20">
                    <AlertTriangle className="w-4 h-4 text-error-base" />
                    <span className="text-paragraph-xs text-error-base">{ error }</span>
                </div>
            ) }
            <div className="flex size-10 items-center justify-center rounded-xl bg-warning-lighter">
                <ShoppingBag className="w-5 h-5 text-warning-base" />
            </div>
            <div className="text-center">
                <p className="text-label-sm">Möbel verkaufen</p>
                <p className="mt-0.5 text-paragraph-xs text-text-sub-600">Wähle Möbelstücke aus deinem Inventar</p>
            </div>
            <div className="w-full max-w-[320px] space-y-2">
                { /* Selected Items */ }
                { selected.length > 0 ? (
                    <div className="flex flex-col gap-1.5">
                        { selected.map(sel => (
                            <div key={ sel.item_base_id } className="flex items-center gap-2 rounded-xl bg-primary-alpha-10 p-2.5">
                                <div className="flex size-10 items-center justify-center rounded-lg bg-bg-white-0">
                                    <ItemIcon itemName={ sel.item_name } className="w-8 h-8" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-label-xs">{ sel.public_name }</p>
                                    { sel.available > 1 && (
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <button className="size-4 rounded bg-bg-white-0 text-subheading-2xs text-text-sub-600 hover:bg-bg-weak-50" onClick={ () => updateQuantity(sel.item_base_id, sel.quantity - 1) }>-</button>
                                            <span className="w-4 text-center text-paragraph-xs text-text-sub-600">{ sel.quantity }</span>
                                            <button className="size-4 rounded bg-bg-white-0 text-subheading-2xs text-text-sub-600 hover:bg-bg-weak-50" onClick={ () => updateQuantity(sel.item_base_id, sel.quantity + 1) }>+</button>
                                            <span className="ml-1 text-subheading-2xs text-text-soft-400">von { sel.available }</span>
                                        </div>
                                    ) }
                                </div>
                                <button onClick={ () => removeItem(sel.item_base_id) }><X className="w-3.5 h-3.5 text-text-soft-400 hover:text-text-strong-950" /></button>
                            </div>
                        )) }
                        <button
                            className="flex items-center justify-center gap-1 rounded-lg bg-bg-weak-50 p-1.5 text-paragraph-xs text-text-sub-600 transition-colors hover:text-text-strong-950"
                            onClick={ () => setShowInventory(true) }
                        >
                            <Plus className="w-3 h-3" />Weiteres Item hinzufügen
                        </button>
                    </div>
                ) : (
                    <div
                        className="flex cursor-pointer items-center gap-2 rounded-xl bg-bg-weak-50 p-2.5 transition-colors hover:bg-bg-white-0 hover:shadow-regular-xs"
                        onClick={ () => setShowInventory(true) }
                    >
                        <div className="w-10 h-10 rounded-lg bg-bg-white-0 shadow-regular-xs flex items-center justify-center">
                            <Plus className="w-4 h-4 text-text-soft-400" />
                        </div>
                        <div>
                            <p className="text-label-xs">Aus Inventar wählen</p>
                            <p className="text-paragraph-xs text-text-soft-400">Klicke zum Auswählen</p>
                        </div>
                    </div>
                ) }
                { /* Listing Settings */ }
                { selected.length > 0 && (
                    <div className="flex flex-col gap-2 rounded-xl bg-bg-weak-50 p-3">
                        <div className="grid grid-cols-3 gap-2">
                            <div className="flex flex-col gap-1">
                                <span className="text-paragraph-xs text-text-sub-600">Preis</span>
                                <AlignInput.Root size="xsmall">
                                    <AlignInput.Wrapper className="h-8">
                                        <AlignInput.Input type="number" min={ 1 } placeholder="0" value={ price } onChange={ e => setPrice(e.target.value) } className="h-8 text-paragraph-xs" />
                                    </AlignInput.Wrapper>
                                </AlignInput.Root>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-paragraph-xs text-text-sub-600">Währung</span>
                                <Select value={ currency } onValueChange={ setCurrency }>
                                    <SelectTrigger className="h-8 text-paragraph-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        { CURRENCIES.map(c => <SelectItem key={ c.value } value={ c.value }>{ c.label }</SelectItem>) }
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-paragraph-xs text-text-sub-600">Dauer</span>
                                <Select value={ duration } onValueChange={ setDuration }>
                                    <SelectTrigger className="h-8 text-paragraph-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        { DURATIONS.map(d => <SelectItem key={ d.value } value={ d.value }>{ d.label }</SelectItem>) }
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-paragraph-xs text-text-sub-600">Notiz (optional)</span>
                            <AlignInput.Root size="xsmall">
                                <AlignInput.Wrapper className="h-8">
                                    <AlignInput.Input type="text" maxLength={ 255 } placeholder="z.B. Preisverhandlung möglich..." value={ note } onChange={ e => setNote(e.target.value) } className="h-8 text-paragraph-xs" />
                                </AlignInput.Wrapper>
                            </AlignInput.Root>
                        </div>
                        { price && parseInt(price) > 0 && (
                            <div className="text-center text-paragraph-xs text-text-soft-400">
                                2% Marktplatz-Gebühr · Du erhältst: { fmtC(Math.floor(parseInt(price) * 0.98)) } { CURRENCIES.find(c => c.value === currency)?.label ?? currency }
                            </div>
                        ) }
                        <FancyButton.Root
                            className="w-full"
                            size="xsmall"
                            variant="primary"
                            disabled={ submitting || !price || selected.length === 0 }
                            onClick={ handleSubmit }
                        >
                            <FancyButton.Icon as={ Tag } className="size-3" />
                            { submitting ? 'Wird erstellt...' : `Angebot erstellen (${ totalItemCount } Item${ totalItemCount !== 1 ? 's' : '' })` }
                        </FancyButton.Root>
                    </div>
                ) }
            </div>
        </div>
    );
};
