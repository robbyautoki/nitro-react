import { FurnitureListComposer } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useState } from 'react';
import { SendMessageComposer } from '../../api';
import { CustomMarketplaceApi } from './CustomMarketplaceApi';
import { CustomListingCard } from './CustomListingCard';
import { CurrencyIcon, ItemIcon } from './marketplace-components';
import { fmtC } from './marketplace-utils';
import { CustomListing } from './CustomMarketplaceTypes';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignInput from '@/align-ui/components/ui/input';
import * as AlignModal from '@/align-ui/components/ui/modal';
import * as FancyButton from '@/align-ui/components/ui/fancy-button';
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

    useEffect(() =>
    {
        loadListings();
    }, [ loadListings ]);

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
            { /* Error Banner */ }
            { error && (
                <div className="flex items-center gap-2 border-b border-error-base/20 bg-error-lighter px-3 py-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-error-base shrink-0" />
                    <span className="text-paragraph-xs text-error-base">{ error }</span>
                </div>
            ) }
            <div className="min-h-0 flex-1 overflow-y-auto" style={ { scrollbarWidth: 'thin' } }>
                { loading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-text-sub-600">
                        <Loader2 className="w-6 h-6 animate-spin opacity-30 mb-2" />
                        <p className="text-paragraph-xs">Laden...</p>
                    </div>
                ) : listings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-text-sub-600">
                        <Package className="w-8 h-8 opacity-20 mb-2" />
                        <p className="text-paragraph-xs">Keine aktiven Angebote</p>
                    </div>
                ) : (
                    <div className="space-y-1 p-2">
                        { listings.map(listing => (
                            <CustomListingCard
                                key={ listing.id }
                                listing={ listing }
                                mode="own"
                                onEdit={ () =>
                                {
                                    setEditListing(listing); setEditPrice(String(listing.price)); setEditError('');
                                } }
                                onCancel={ () => setRemoveListing(listing) }
                            />
                        )) }
                    </div>
                ) }
            </div>
            { /* Edit Price Dialog */ }
            <AlignModal.Root open={ !!editListing } onOpenChange={ o =>
            {
                if(!o && !editSubmitting) setEditListing(null);
            } }>
                <AlignModal.Content className="max-w-[360px]" overlayClassName="z-[1000]" showClose={ false }>
                    <AlignModal.Header className="pr-5">
                        <div className="space-y-1">
                            <AlignModal.Title>Preis bearbeiten</AlignModal.Title>
                            <AlignModal.Description>
                                Neuen Preis für <span className="font-semibold text-text-strong-950">{ editListing?.items[0]?.public_name }</span> festlegen.
                            </AlignModal.Description>
                        </div>
                    </AlignModal.Header>
                    { editListing && (
                        <AlignModal.Body className="flex flex-col gap-3">
                            <div className="flex items-center gap-3 py-1">
                                <div className="flex h-10 w-10 items-center justify-center rounded-10 bg-bg-weak-50 shadow-regular-xs ring-1 ring-stroke-soft-200">
                                    <ItemIcon itemName={ editListing.items[0]?.item_name ?? '' } className="w-8 h-8" />
                                </div>
                                <AlignInput.Root size="small" className="flex-1">
                                    <AlignInput.Wrapper className="h-10">
                                        <CurrencyIcon type={ editListing.currency } className="w-4 h-4" />
                                        <AlignInput.Input
                                            type="number"
                                            value={ editPrice }
                                            onChange={ e => setEditPrice(e.target.value) }
                                            onKeyDown={ e => e.key === 'Enter' && !editSubmitting && editPrice && Number(editPrice) > 0 && handleEditPrice() }
                                            className="h-10 text-label-sm"
                                            disabled={ editSubmitting }
                                        />
                                    </AlignInput.Wrapper>
                                </AlignInput.Root>
                            </div>
                            { editError && (
                                <div className="flex items-center gap-2 rounded-10 bg-error-lighter px-2 py-1.5 ring-1 ring-error-base/20">
                                    <AlertTriangle className="w-3 h-3 text-error-base shrink-0" />
                                    <span className="text-paragraph-xs text-error-base">{ editError }</span>
                                </div>
                            ) }
                        </AlignModal.Body>
                    ) }
                    <AlignModal.Footer className="justify-end">
                        <AlignButton.Root variant="neutral" mode="stroke" size="small" onClick={ () => setEditListing(null) } disabled={ editSubmitting }>Abbrechen</AlignButton.Root>
                        <FancyButton.Root type="button" variant="primary" size="small" disabled={ editSubmitting || !editPrice || Number(editPrice) <= 0 } onClick={ handleEditPrice }>
                            { editSubmitting ? <><Loader2 className="w-3 h-3 animate-spin mr-1.5" />Speichern...</> : 'Speichern' }
                        </FancyButton.Root>
                    </AlignModal.Footer>
                </AlignModal.Content>
            </AlignModal.Root>
            { /* Remove Confirmation */ }
            <AlignModal.Root open={ !!removeListing } onOpenChange={ o =>
            {
                if(!o && !removeSubmitting) setRemoveListing(null);
            } }>
                <AlignModal.Content className="max-w-[380px]" overlayClassName="z-[1000]" showClose={ false }>
                    <AlignModal.Header
                        title="Angebot zurückziehen?"
                        description="Das Angebot wird geschlossen und die Möbel werden wieder deinem Inventar zugeordnet."
                    />
                    <AlignModal.Body>
                        <p className="text-paragraph-sm text-text-sub-600">
                            Möchtest du dein Angebot für <span className="font-semibold text-text-strong-950">{ removeListing?.items[0]?.public_name }</span> über <span className="font-bold text-warning-base">{ removeListing ? fmtC(removeListing.price) : 0 } Credits</span> zurückziehen?
                        </p>
                    </AlignModal.Body>
                    <AlignModal.Footer className="justify-end">
                        <AlignButton.Root variant="neutral" mode="stroke" size="small" disabled={ removeSubmitting } onClick={ () => setRemoveListing(null) }>Abbrechen</AlignButton.Root>
                        <AlignButton.Root variant="error" mode="filled" size="small" disabled={ removeSubmitting } onClick={ () => removeListing && handleCancel(removeListing) }>
                            { removeSubmitting ? 'Wird zurückgezogen...' : 'Zurückziehen' }
                        </AlignButton.Root>
                    </AlignModal.Footer>
                </AlignModal.Content>
            </AlignModal.Root>
        </div>
    );
};
