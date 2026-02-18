import { PurchaseFromCatalogComposer } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { CatalogPurchaseState, CreateLinkEvent, DispatchUiEvent, GetClubMemberLevel, LocalizeText, LocalStorageKeys, Offer, SendMessageComposer } from '../../../../../api';
import { LayoutLoadingSpinnerView } from '../../../../../common';
import { Button } from '../../../../ui/button';
import { CatalogEvent, CatalogInitGiftEvent, CatalogPurchasedEvent, CatalogPurchaseFailureEvent, CatalogPurchaseNotAllowedEvent, CatalogPurchaseSoldOutEvent } from '../../../../../events';
import { useCatalog, useLocalStorage, usePurse, useUiEvent } from '../../../../../hooks';

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
    const { currentOffer = null, currentPage = null, purchaseOptions = null, setPurchaseOptions = null } = useCatalog();
    const { getCurrencyAmount = null } = usePurse();

    const onCatalogEvent = useCallback((event: CatalogEvent) =>
    {
        switch(event.type)
        {
            case CatalogPurchasedEvent.PURCHASE_SUCCESS:
                setPurchaseState(CatalogPurchaseState.NONE);
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

    if(!currentOffer) return null;

    const priceCredits = (currentOffer.priceInCredits * purchaseOptions.quantity);
    const pricePoints = (currentOffer.priceInActivityPoints * purchaseOptions.quantity);

    const getPriceLabel = () =>
    {
        const parts: string[] = [];
        if(priceCredits > 0) parts.push(`${ priceCredits } Credits`);
        if(pricePoints > 0) parts.push(`${ pricePoints } Diamonds`);
        return parts.join(' + ');
    };

    const buyLabel = LocalizeText('catalog.purchase_confirmation.' + (currentOffer.isRentOffer ? 'rent' : 'buy'));
    const priceLabel = getPriceLabel();

    const PurchaseButton = () =>
    {
        if(GetClubMemberLevel() < currentOffer.clubLevel)
            return (
                <Button variant="destructive" className="w-full" size="sm" disabled>
                    { LocalizeText('catalog.alert.hc.required') }
                </Button>
            );

        if(isLimitedSoldOut)
            return (
                <Button variant="destructive" className="w-full" size="sm" disabled>
                    { LocalizeText('catalog.alert.limited_edition_sold_out.title') }
                </Button>
            );

        if(priceCredits > getCurrencyAmount(-1))
            return (
                <Button variant="destructive" className="w-full" size="sm" disabled>
                    { LocalizeText('catalog.alert.notenough.title') }
                </Button>
            );

        if(pricePoints > getCurrencyAmount(currentOffer.activityPointType))
            return (
                <Button variant="destructive" className="w-full" size="sm" disabled>
                    { LocalizeText('catalog.alert.notenough.activitypoints.title.' + currentOffer.activityPointType) }
                </Button>
            );

        switch(purchaseState)
        {
            case CatalogPurchaseState.CONFIRM:
                return (
                    <Button variant="warning" className="w-full" size="sm" onClick={ () => purchase() }>
                        <span className="flex flex-col items-center leading-none gap-0.5">
                            <span className="text-xs font-semibold">{ LocalizeText('catalog.marketplace.confirm_title') }</span>
                            { priceLabel && <span className="text-[10px] opacity-70">{ priceLabel }</span> }
                        </span>
                    </Button>
                );
            case CatalogPurchaseState.PURCHASE:
                return (
                    <Button variant="success" className="w-full" size="sm" disabled>
                        <LayoutLoadingSpinnerView />
                    </Button>
                );
            case CatalogPurchaseState.FAILED:
                return (
                    <Button variant="destructive" className="w-full" size="sm" disabled>
                        { LocalizeText('generic.failed') }
                    </Button>
                );
            case CatalogPurchaseState.SOLD_OUT:
                return (
                    <Button variant="destructive" className="w-full" size="sm" disabled>
                        { LocalizeText('catalog.alert.limited_edition_sold_out.title') }
                    </Button>
                );
            case CatalogPurchaseState.NONE:
            default:
                return (
                    <Button
                        variant="success"
                        className="w-full"
                        size="sm"
                        disabled={ (purchaseOptions.extraParamRequired && (!purchaseOptions.extraData || !purchaseOptions.extraData.length)) }
                        onClick={ () => setPurchaseState(CatalogPurchaseState.CONFIRM) }
                    >
                        <span className="flex flex-col items-center leading-none gap-0.5">
                            <span className="text-xs font-semibold">{ buyLabel }</span>
                            { priceLabel && <span className="text-[10px] opacity-70">{ priceLabel }</span> }
                        </span>
                    </Button>
                );
        }
    }

    return (
        <div className="flex flex-col gap-1.5 w-full">
            <PurchaseButton />
            { (!noGiftOption && !currentOffer.isRentOffer) &&
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-white/50 hover:text-white/80"
                    disabled={ ((purchaseOptions.quantity > 1) || !currentOffer.giftable || isLimitedSoldOut || (purchaseOptions.extraParamRequired && (!purchaseOptions.extraData || !purchaseOptions.extraData.length))) }
                    onClick={ () => purchase(true) }
                >
                    { LocalizeText('catalog.purchase_confirmation.gift') } →
                </Button> }
        </div>
    );
}
