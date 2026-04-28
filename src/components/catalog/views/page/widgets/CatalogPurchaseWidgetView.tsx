import { PurchaseFromCatalogComposer } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Gift } from 'lucide-react';
import { CatalogPurchaseState, CreateLinkEvent, DispatchUiEvent, GetClubMemberLevel, LocalizeText, LocalStorageKeys, Offer, SendMessageComposer } from '../../../../../api';
import { LayoutLoadingSpinnerView } from '../../../../../common';
import * as FancyButton from '@/align-ui/components/ui/fancy-button';
import * as AlignButton from '@/align-ui/components/ui/button';
import { CatalogEvent, CatalogInitGiftEvent, CatalogPurchasedEvent, CatalogPurchaseFailureEvent, CatalogPurchaseNotAllowedEvent, CatalogPurchaseSoldOutEvent } from '../../../../../events';
import { useCatalog, useCatalogPlaceMultipleItems, useLocalStorage, usePurse, useUiEvent } from '../../../../../hooks';

interface CatalogPurchaseWidgetViewProps
{
    noGiftOption?: boolean;
    purchaseCallback?: () => void;
}

export const CatalogPurchaseWidgetView: FC<CatalogPurchaseWidgetViewProps> = props =>
{
    const { noGiftOption = false, purchaseCallback = null } = props;
    const [ purchaseWillBeGift, setPurchaseWillBeGift ] = useState(false);
    const [ purchaseState, setPurchaseState ] = useState(CatalogPurchaseState.NONE);
    const [ catalogSkipPurchaseConfirmation, setCatalogSkipPurchaseConfirmation ] = useLocalStorage(LocalStorageKeys.CATALOG_SKIP_PURCHASE_CONFIRMATION, false);
    const [ batchProgress, setBatchProgress ] = useState<{ total: number; sent: number } | null>(null);
    const batchActiveRef = useRef(false);
    const { currentOffer = null, currentPage = null, purchaseOptions = null, setPurchaseOptions = null, requestOfferToMover = null } = useCatalog();
    const { getCurrencyAmount = null } = usePurse();
    const [ catalogPlaceMultipleObjects, setCatalogPlaceMultipleObjects ] = useCatalogPlaceMultipleItems();

    const onCatalogEvent = useCallback((event: CatalogEvent) =>
    {
        switch(event.type)
        {
            case CatalogPurchasedEvent.PURCHASE_SUCCESS:
                if(!batchActiveRef.current) setPurchaseState(CatalogPurchaseState.NONE);
                return;
            case CatalogPurchaseFailureEvent.PURCHASE_FAILED:
                setPurchaseState(CatalogPurchaseState.FAILED);
                return;
            case CatalogPurchaseNotAllowedEvent.NOT_ALLOWED:
                setPurchaseState(CatalogPurchaseState.FAILED);
                return;
            case CatalogPurchaseSoldOutEvent.SOLD_OUT:
                setPurchaseState(CatalogPurchaseState.SOLD_OUT);
                return;
        }
    }, []);

    useUiEvent(CatalogPurchasedEvent.PURCHASE_SUCCESS, onCatalogEvent);
    useUiEvent(CatalogPurchaseFailureEvent.PURCHASE_FAILED, onCatalogEvent);
    useUiEvent(CatalogPurchaseNotAllowedEvent.NOT_ALLOWED, onCatalogEvent);
    useUiEvent(CatalogPurchaseSoldOutEvent.SOLD_OUT, onCatalogEvent);

    const isLimitedSoldOut = useMemo(() =>
    {
        if(!currentOffer) return false;
        
        if(purchaseOptions.extraParamRequired && (!purchaseOptions.extraData || !purchaseOptions.extraData.length)) return false;

        if(currentOffer.pricingModel === Offer.PRICING_MODEL_SINGLE)
        {
            const product = currentOffer.product;

            if(product && product.isUniqueLimitedItem) return !product.uniqueLimitedItemsLeft;
        }

        return false;
    }, [ currentOffer, purchaseOptions ]);

    const purchase = (isGift: boolean = false) =>
    {
        if(!currentOffer) return;

        if(GetClubMemberLevel() < currentOffer.clubLevel)
        {
            CreateLinkEvent('habboUI/open/hccenter');

            return;
        }

        if(isGift)
        {
            DispatchUiEvent(new CatalogInitGiftEvent(currentOffer.page.pageId, currentOffer.offerId, purchaseOptions.extraData));

            return;
        }

        setPurchaseState(CatalogPurchaseState.PURCHASE);

        if(purchaseCallback)
        {
            purchaseCallback();

            return;
        }

        let pageId = currentOffer.page.pageId;

        // if(pageId === -1)
        // {
        //     const nodes = getNodesByOfferId(currentOffer.offerId);

        //     if(nodes) pageId = nodes[0].pageId;
        // }

        SendMessageComposer(new PurchaseFromCatalogComposer(pageId, currentOffer.offerId, purchaseOptions.extraData, purchaseOptions.quantity));
    }

    useEffect(() =>
    {
        if(!currentOffer) return;

        setPurchaseState(CatalogPurchaseState.NONE);
    }, [ currentOffer, setPurchaseOptions ]);

    useEffect(() =>
    {
        let timeout: ReturnType<typeof setTimeout> = null;

        if((purchaseState === CatalogPurchaseState.CONFIRM) || (purchaseState === CatalogPurchaseState.FAILED))
        {
            timeout = setTimeout(() => setPurchaseState(CatalogPurchaseState.NONE), 3000);
        }

        return () =>
        {
            if(timeout) clearTimeout(timeout);
        }
    }, [ purchaseState ]);

    const selectedOffers = purchaseOptions?.selectedOffers;
    const isMultiBuy = selectedOffers && selectedOffers.length > 1;

    const batchPurchase = () =>
    {
        if(!selectedOffers || !currentPage) return;

        setPurchaseState(CatalogPurchaseState.PURCHASE);
        batchActiveRef.current = true;
        setBatchProgress({ total: selectedOffers.length, sent: 0 });

        selectedOffers.forEach((offer, index) =>
        {
            setTimeout(() =>
            {
                SendMessageComposer(new PurchaseFromCatalogComposer(offer.page.pageId, offer.offerId, '', 1));
                setBatchProgress(prev => prev ? { ...prev, sent: prev.sent + 1 } : null);
            }, index * 500);
        });

        setTimeout(() =>
        {
            setPurchaseState(CatalogPurchaseState.NONE);
            setBatchProgress(null);
            batchActiveRef.current = false;
        }, selectedOffers.length * 500 + 500);
    };

    if(!currentOffer) return null;

    const priceCredits = (currentOffer.priceInCredits * purchaseOptions.quantity);
    const pricePoints = (currentOffer.priceInActivityPoints * purchaseOptions.quantity);

    const buyLabel = LocalizeText('catalog.purchase_confirmation.' + (currentOffer.isRentOffer ? 'rent' : 'buy'));

    const PurchaseButton = () =>
    {
        if(GetClubMemberLevel() < currentOffer.clubLevel)
            return (
                <FancyButton.Root variant="destructive" size="small" className="w-full" disabled>
                    { LocalizeText('catalog.alert.hc.required') }
                </FancyButton.Root>
            );

        if(isLimitedSoldOut)
            return (
                <FancyButton.Root variant="destructive" size="small" className="w-full" disabled>
                    { LocalizeText('catalog.alert.limited_edition_sold_out.title') }
                </FancyButton.Root>
            );

        if(priceCredits > getCurrencyAmount(-1))
            return (
                <FancyButton.Root variant="destructive" size="small" className="w-full" disabled>
                    { LocalizeText('catalog.alert.notenough.title') }
                </FancyButton.Root>
            );

        if(pricePoints > getCurrencyAmount(currentOffer.activityPointType))
            return (
                <FancyButton.Root variant="destructive" size="small" className="w-full" disabled>
                    { LocalizeText('catalog.alert.notenough.activitypoints.title.' + currentOffer.activityPointType) }
                </FancyButton.Root>
            );

        switch(purchaseState)
        {
            case CatalogPurchaseState.CONFIRM:
                return (
                    <FancyButton.Root variant="primary" size="small" className="w-full" onClick={ () => purchase() }>
                        { LocalizeText('catalog.marketplace.confirm_title') }
                    </FancyButton.Root>
                );
            case CatalogPurchaseState.PURCHASE:
                return (
                    <FancyButton.Root variant="primary" size="small" className="w-full" disabled>
                        <LayoutLoadingSpinnerView />
                    </FancyButton.Root>
                );
            case CatalogPurchaseState.FAILED:
                return (
                    <FancyButton.Root variant="destructive" size="small" className="w-full" disabled>
                        { LocalizeText('generic.failed') }
                    </FancyButton.Root>
                );
            case CatalogPurchaseState.SOLD_OUT:
                return (
                    <FancyButton.Root variant="destructive" size="small" className="w-full" disabled>
                        { LocalizeText('catalog.alert.limited_edition_sold_out.title') }
                    </FancyButton.Root>
                );
            case CatalogPurchaseState.NONE:
            default:
                return (
                    <FancyButton.Root
                        variant="primary"
                        size="small"
                        className="w-full"
                        disabled={ (purchaseOptions.extraParamRequired && (!purchaseOptions.extraData || !purchaseOptions.extraData.length)) }
                        onClick={ () => setPurchaseState(CatalogPurchaseState.CONFIRM) }
                    >
                        { buyLabel }
                    </FancyButton.Root>
                );
        }
    }

    if(isMultiBuy)
    {
        return (
            <div className="flex flex-col gap-1.5 w-full">
                <FancyButton.Root
                    variant="primary"
                    size="small"
                    className="w-full"
                    onClick={ batchPurchase }
                    disabled={ purchaseState === CatalogPurchaseState.PURCHASE }
                >
                    { (purchaseState === CatalogPurchaseState.PURCHASE && batchProgress) ? (
                        <span className="flex flex-col items-center gap-0.5 leading-none">
                            <span className="text-label-xs">{ batchProgress.sent }/{ batchProgress.total }</span>
                            <span className="text-subheading-2xs opacity-70">Kaufe...</span>
                        </span>
                    ) : (
                        <span className="text-label-xs">{ selectedOffers.length } Items kaufen</span>
                    ) }
                </FancyButton.Root>
                <div className="flex gap-1 w-full">
                    { purchaseOptions?.multiSelectMode &&
                        <AlignButton.Root
                            variant="neutral"
                            mode="lighter"
                            size="xxsmall"
                            className="flex-1 px-1 text-label-xs text-success-base bg-success-lighter"
                            onClick={ () => setPurchaseOptions(prev => ({ ...prev, multiSelectMode: false })) }
                        >
                            ✓ Auswahl
                        </AlignButton.Root> }
                    <AlignButton.Root
                        variant="neutral"
                        mode={ catalogPlaceMultipleObjects ? 'lighter' : 'ghost' }
                        size="xxsmall"
                        className={ 'flex-1 px-1 text-label-xs ' + (catalogPlaceMultipleObjects ? 'text-information-base bg-information-lighter' : 'text-text-sub-600 hover:text-text-strong-950') }
                        onClick={ () => {
                            const newVal = !catalogPlaceMultipleObjects;
                            setCatalogPlaceMultipleObjects(newVal);
                            if(newVal && selectedOffers?.length === 1) requestOfferToMover(selectedOffers[0]);
                        } }
                    >
                        Platzieren
                    </AlignButton.Root>
                </div>
            </div>
        );
    }

    const giftDisabled = ((purchaseOptions.quantity > 1) || !currentOffer.giftable || isLimitedSoldOut || (purchaseOptions.extraParamRequired && (!purchaseOptions.extraData || !purchaseOptions.extraData.length)));

    return (
        <div className="flex w-full flex-col gap-2">
            <PurchaseButton />
            <AlignButton.Root
                variant="neutral"
                mode={ catalogPlaceMultipleObjects ? 'lighter' : 'stroke' }
                size="small"
                className={ 'w-full ' + (catalogPlaceMultipleObjects ? 'text-information-base bg-information-lighter ring-information-base' : '') }
                onClick={ () => {
                    const newVal = !catalogPlaceMultipleObjects;
                    setCatalogPlaceMultipleObjects(newVal);
                    if(newVal && currentOffer) requestOfferToMover(currentOffer);
                } }
            >
                Platzieren
            </AlignButton.Root>
            { (!noGiftOption && !currentOffer.isRentOffer) && (
                <button
                    type="button"
                    className="mt-1 inline-flex items-center justify-center gap-1.5 text-paragraph-sm text-text-sub-600 transition-colors hover:text-text-strong-950 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={ giftDisabled }
                    onClick={ () => purchase(true) }
                >
                    <Gift className="w-3.5 h-3.5" />
                    <span className="underline underline-offset-4">Verschenken</span>
                </button>
            ) }
        </div>
    );
}
