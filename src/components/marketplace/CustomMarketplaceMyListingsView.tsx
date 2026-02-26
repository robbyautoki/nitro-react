import { FurnitureListComposer } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useState } from 'react';
import { SendMessageComposer } from '../../api';
import { CustomMarketplaceApi } from './CustomMarketplaceApi';
import { CustomListingCard } from './CustomListingCard';
import { CurrencyIcon, ItemIcon } from './marketplace-components';
import { fmtC } from './marketplace-utils';
import { CustomListing } from './CustomMarketplaceTypes';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Package, Loader2, AlertTriangle } from 'lucide-react';

export const CustomMarketplaceMyListingsView: FC<{}> = () =>
{
    const [ listings, setListings ] = useState<CustomListing[]>([]);
    const [ loading, setLoading ] = useState(true);
    const [ error, setError ] = useState('');

    const [ editListing, setEditListing ] = useState<CustomListing | null>(null);
    const [ editPrice, setEditPrice ] = useState('');
    const [ editSubmitting, setEditSubmitting ] = useState(false);
    const [ editError, setEditError ] = useState('');

    const [ removeListing, setRemoveListing ] = useState<CustomListing | null>(null);
    const [ removeSubmitting, setRemoveSubmitting ] = useState(false);

    const loadListings = useCallback(() =>
    {
        setLoading(true);
        setError('');
        CustomMarketplaceApi.myListings()
            .then(data => setListings(Array.isArray(data) ? data : []))
            .catch(() => setError('Angebote konnten nicht geladen werden'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { loadListings(); }, [ loadListings ]);

    const handleEditPrice = async () =>
    {
        if(!editListing) return;
        const price = Number(editPrice);
        if(!price || price <= 0) return;

        setEditSubmitting(true);
        setEditError('');
        try
        {
            const res = await CustomMarketplaceApi.updatePrice(editListing.id, price);
            if(res.ok)
            {
                setListings(prev => prev.map(l => l.id === editListing.id ? { ...l, price } : l));
                setEditListing(null);
            }
            else
            {
                setEditError(res.error || 'Preis konnte nicht geändert werden');
            }
        }
        catch
        {
            setEditError('Netzwerkfehler — bitte erneut versuchen');
        }
        finally
        {
            setEditSubmitting(false);
        }
    };

    const handleCancel = async (listing: CustomListing) =>
    {
        setRemoveSubmitting(true);
        setError('');
        try
        {
            const res = await CustomMarketplaceApi.cancelListing(listing.id);
            if(res.ok)
            {
                setListings(prev => prev.filter(l => l.id !== listing.id));
                setRemoveListing(null);
                SendMessageComposer(new FurnitureListComposer());
            }
            else
            {
                setError(res.error || 'Angebot konnte nicht zurückgezogen werden');
                setRemoveListing(null);
            }
        }
        catch
        {
            setError('Netzwerkfehler — bitte erneut versuchen');
            setRemoveListing(null);
        }
        finally
        {
            setRemoveSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Error Banner */}
            { error && (
                <div className="flex items-center gap-2 px-3 py-2 border-b border-destructive/20 bg-destructive/10">
                    <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />
                    <span className="text-[11px] text-destructive">{ error }</span>
                </div>
            ) }

            <ScrollArea className="flex-1 min-h-0">
                { loading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Loader2 className="w-6 h-6 animate-spin opacity-30 mb-2" />
                        <p className="text-xs">Laden...</p>
                    </div>
                ) : listings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Package className="w-8 h-8 opacity-20 mb-2" />
                        <p className="text-xs">Keine aktiven Angebote</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border/30">
                        { listings.map(listing => (
                            <CustomListingCard
                                key={ listing.id }
                                listing={ listing }
                                mode="own"
                                onEdit={ () => { setEditListing(listing); setEditPrice(String(listing.price)); setEditError(''); } }
                                onCancel={ () => setRemoveListing(listing) }
                            />
                        )) }
                    </div>
                ) }
            </ScrollArea>

            {/* Edit Price Dialog */}
            <Dialog open={ !!editListing } onOpenChange={ o => { if(!o && !editSubmitting) setEditListing(null); } }>
                <DialogContent className="sm:max-w-[360px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-sm">Preis bearbeiten</DialogTitle>
                        <DialogDescription>
                            Neuen Preis für <span className="font-semibold text-foreground">{ editListing?.items[0]?.public_name }</span> festlegen.
                        </DialogDescription>
                    </DialogHeader>
                    { editListing && (
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3 py-1">
                                <div className="w-10 h-10 rounded-md border border-border/40 bg-muted/10 flex items-center justify-center">
                                    <ItemIcon itemName={ editListing.items[0]?.item_name ?? '' } className="w-8 h-8" />
                                </div>
                                <div className="relative flex-1">
                                    <CurrencyIcon type={ editListing.currency } className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
                                    <Input
                                        type="number"
                                        value={ editPrice }
                                        onChange={ e => setEditPrice(e.target.value) }
                                        onKeyDown={ e => e.key === 'Enter' && !editSubmitting && editPrice && Number(editPrice) > 0 && handleEditPrice() }
                                        className="pl-9 h-10 text-base font-bold"
                                        disabled={ editSubmitting }
                                    />
                                </div>
                            </div>
                            { editError && (
                                <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-destructive/10 border border-destructive/20">
                                    <AlertTriangle className="w-3 h-3 text-destructive shrink-0" />
                                    <span className="text-[10px] text-destructive">{ editError }</span>
                                </div>
                            ) }
                        </div>
                    ) }
                    <DialogFooter>
                        <Button variant="outline" onClick={ () => setEditListing(null) } disabled={ editSubmitting }>Abbrechen</Button>
                        <Button className="bg-primary" disabled={ editSubmitting || !editPrice || Number(editPrice) <= 0 } onClick={ handleEditPrice }>
                            { editSubmitting ? <><Loader2 className="w-3 h-3 animate-spin mr-1.5" />Speichern...</> : 'Speichern' }
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Remove Confirmation */}
            <AlertDialog open={ !!removeListing } onOpenChange={ o => { if(!o && !removeSubmitting) setRemoveListing(null); } }>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Angebot zurückziehen?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Möchtest du dein Angebot für <span className="font-semibold text-foreground">{ removeListing?.items[0]?.public_name }</span> über <span className="font-bold text-amber-500">{ removeListing ? fmtC(removeListing.price) : 0 } Credits</span> zurückziehen?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={ removeSubmitting }>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700" disabled={ removeSubmitting } onClick={ () => removeListing && handleCancel(removeListing) }>
                            { removeSubmitting ? 'Wird zurückgezogen...' : 'Zurückziehen' }
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
