import { ClubOfferData, GetClubOffersMessageComposer, PurchaseFromCatalogComposer } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { CatalogPurchaseState, LocalizeText, SendMessageComposer } from '../../../../../api';
import { LayoutCurrencyIcon, LayoutLoadingSpinnerView } from '../../../../../common';
import { CatalogEvent, CatalogPurchasedEvent, CatalogPurchaseFailureEvent } from '../../../../../events';
import { useCatalog, usePurse, useUiEvent } from '../../../../../hooks';
import { CatalogLayoutProps } from './CatalogLayout.types';

export const CatalogLayoutVipBuyView: FC<CatalogLayoutProps> = props =>
{
    const [ pendingOffer, setPendingOffer ] = useState<ClubOfferData>(null);
    const [ purchaseState, setPurchaseState ] = useState(CatalogPurchaseState.NONE);
    const { currentPage = null, catalogOptions = null } = useCatalog();
    const { purse = null, getCurrencyAmount = null } = usePurse();
    const { clubOffers = null } = catalogOptions;

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
        }
    }, []);

    useUiEvent(CatalogPurchasedEvent.PURCHASE_SUCCESS, onCatalogEvent);
    useUiEvent(CatalogPurchaseFailureEvent.PURCHASE_FAILED, onCatalogEvent);

    const getOfferText = useCallback((offer: ClubOfferData) =>
    {
        let offerText = '';

        if(offer.months > 0)
        {
            offerText = LocalizeText('catalog.vip.item.header.months', [ 'num_months' ], [ offer.months.toString() ]);
        }

        if(offer.extraDays > 0)
        {
            if(offerText !== '') offerText += ' ';

            offerText += (' ' + LocalizeText('catalog.vip.item.header.days', [ 'num_days' ], [ offer.extraDays.toString() ]));
        }

        return offerText;
    }, []);

    const getPurchaseHeader = useCallback(() =>
    {
        if(!purse) return '';

        const extensionOrSubscription = (purse.clubDays > 0 || purse.clubPeriods > 0) ? 'extension.' : 'subscription.';
        const daysOrMonths = ((pendingOffer.months === 0) ? 'days' : 'months');
        const daysOrMonthsText = ((pendingOffer.months === 0) ? pendingOffer.extraDays : pendingOffer.months);
        const locale = LocalizeText('catalog.vip.buy.confirm.' + extensionOrSubscription + daysOrMonths);

        return locale.replace('%NUM_' + daysOrMonths.toUpperCase() + '%', daysOrMonthsText.toString());
    }, [ pendingOffer, purse ]);

    const getPurchaseValidUntil = useCallback(() =>
    {
        let locale = LocalizeText('catalog.vip.buy.confirm.end_date');

        locale = locale.replace('%month%', pendingOffer.month.toString());
        locale = locale.replace('%day%', pendingOffer.day.toString());
        locale = locale.replace('%year%', pendingOffer.year.toString());

        return locale;
    }, [ pendingOffer ]);

    const getSubscriptionDetails = useMemo(() =>
    {
        const clubDays = purse.clubDays;
        const clubPeriods = purse.clubPeriods;
        const totalDays = (clubPeriods * 31) + clubDays;

        return LocalizeText('catalog.vip.extend.info', [ 'days' ], [ totalDays.toString() ]);
    }, [ purse ]);

    const purchaseSubscription = useCallback(() =>
    {
        if(!pendingOffer) return;

        setPurchaseState(CatalogPurchaseState.PURCHASE);
        SendMessageComposer(new PurchaseFromCatalogComposer(currentPage.pageId, pendingOffer.offerId, null, 1));
    }, [ pendingOffer, currentPage ]);

    const setOffer = useCallback((offer: ClubOfferData) =>
    {
        setPurchaseState(CatalogPurchaseState.NONE);
        setPendingOffer(offer);
    }, []);

    const getPurchaseButton = useCallback(() =>
    {
        if(!pendingOffer) return null;

        if(pendingOffer.priceCredits > getCurrencyAmount(-1))
        {
            return <button className="appearance-none border-0 w-full h-8 rounded-lg bg-red-500 text-white text-xs font-medium cursor-not-allowed opacity-70">{ LocalizeText('catalog.alert.notenough.title') }</button>;
        }

        if(pendingOffer.priceActivityPoints > getCurrencyAmount(pendingOffer.priceActivityPointsType))
        {
            return <button className="appearance-none border-0 w-full h-8 rounded-lg bg-red-500 text-white text-xs font-medium cursor-not-allowed opacity-70">{ LocalizeText('catalog.alert.notenough.activitypoints.title.' + pendingOffer.priceActivityPointsType) }</button>;
        }

        switch(purchaseState)
        {
            case CatalogPurchaseState.CONFIRM:
                return <button className="appearance-none border-0 w-full h-8 rounded-lg bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 transition-colors" onClick={ purchaseSubscription }>{ LocalizeText('catalog.marketplace.confirm_title') }</button>;
            case CatalogPurchaseState.PURCHASE:
                return <button className="appearance-none border-0 w-full h-8 rounded-lg bg-white/20 text-white/40 text-xs font-medium" disabled><LayoutLoadingSpinnerView /></button>;
            case CatalogPurchaseState.FAILED:
                return <button className="appearance-none border-0 w-full h-8 rounded-lg bg-red-500 text-white text-xs font-medium cursor-not-allowed opacity-70" disabled>{ LocalizeText('generic.failed') }</button>;
            case CatalogPurchaseState.NONE:
            default:
                return <button className="appearance-none border-0 w-full h-8 rounded-lg bg-white/[0.15] text-white text-xs font-medium hover:bg-white/20 transition-colors" onClick={ () => setPurchaseState(CatalogPurchaseState.CONFIRM) }>{ LocalizeText('buy') }</button>;
        }
    }, [ pendingOffer, purchaseState, purchaseSubscription, getCurrencyAmount ]);

    useEffect(() =>
    {
        if(!clubOffers) SendMessageComposer(new GetClubOffersMessageComposer(1));
    }, [ clubOffers ]);

    return (
        <div className="flex flex-col h-full gap-2">
            <div className="flex flex-col gap-1.5 flex-1 min-h-0 overflow-auto">
                { clubOffers && (clubOffers.length > 0) && clubOffers.map((offer, index) =>
                {
                    return (
                        <div key={ index } className={ `flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${ pendingOffer === offer ? 'border-white/30 bg-white/[0.06]' : 'border-white/[0.07] bg-white/[0.04] hover:border-white/[0.12]' }` } onClick={ () => setOffer(offer) }>
                            <i className="icon-hc-banner" />
                            <div className="flex flex-col items-end ml-auto">
                                <span className="text-sm text-white/90">{ getOfferText(offer) }</span>
                                <div className="flex items-center justify-end gap-1">
                                    { (offer.priceCredits > 0) &&
                                    <div className="flex items-center justify-end gap-1">
                                        <span className="text-xs text-white/60">{ offer.priceCredits }</span>
                                        <LayoutCurrencyIcon type={ -1 } />
                                    </div> }
                                    { (offer.priceActivityPoints > 0) &&
                                    <div className="flex items-center justify-end gap-1">
                                        <span className="text-xs text-white/60">{ offer.priceActivityPoints }</span>
                                        <LayoutCurrencyIcon type={ offer.priceActivityPointsType } />
                                    </div> }
                                </div>
                            </div>
                        </div>
                    );
                }) }
            </div>
            { /* Server localization text (trusted content from game server) */ }
            <div className="catalog-page-text text-center" dangerouslySetInnerHTML={ { __html: LocalizeText('catalog.vip.buy.hccenter') } } />
            <div className="flex flex-col items-center overflow-hidden">
                { currentPage.localization.getImage(1) && <img alt="" src={ currentPage.localization.getImage(1) } /> }
                { /* Server localization text (trusted content from game server) */ }
                <div className="catalog-page-text text-center" dangerouslySetInnerHTML={ { __html: getSubscriptionDetails } } />
            </div>
            { pendingOffer &&
                <div className="flex flex-col gap-2 p-2.5 bg-white/[0.05] rounded-lg border border-white/[0.07] shrink-0">
                    <div className="flex items-end">
                        <div className="flex flex-col flex-1">
                            <span className="text-sm font-medium text-white/90">{ getPurchaseHeader() }</span>
                            <span className="text-xs text-white/50">{ getPurchaseValidUntil() }</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            { (pendingOffer.priceCredits > 0) &&
                                <div className="flex items-center justify-end gap-1">
                                    <span className="text-xs text-white/60">{ pendingOffer.priceCredits }</span>
                                    <LayoutCurrencyIcon type={ -1 } />
                                </div> }
                            { (pendingOffer.priceActivityPoints > 0) &&
                                <div className="flex items-center justify-end gap-1">
                                    <span className="text-xs text-white/60">{ pendingOffer.priceActivityPoints }</span>
                                    <LayoutCurrencyIcon type={ pendingOffer.priceActivityPointsType } />
                                </div> }
                        </div>
                    </div>
                    { getPurchaseButton() }
                </div> }
        </div>
    );
}
