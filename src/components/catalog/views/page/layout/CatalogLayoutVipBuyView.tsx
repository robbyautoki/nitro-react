import { ClubOfferData, GetClubOffersMessageComposer, PurchaseFromCatalogComposer } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Crown, Sparkles } from 'lucide-react';
import { CatalogPurchaseState, GetConfiguration, LocalizeText, SendMessageComposer } from '../../../../../api';
import { LayoutCurrencyIcon, LayoutLoadingSpinnerView } from '../../../../../common';
import { CatalogEvent, CatalogPurchasedEvent, CatalogPurchaseFailureEvent } from '../../../../../events';
import { useCatalog, usePurse, useUiEvent } from '../../../../../hooks';
import { Button } from '../../../../ui/button';
import { Separator } from '../../../../ui/separator';
import { CatalogPriceDisplay } from '../../shared/CatalogPriceDisplay';
import { CatalogLayoutProps } from './CatalogLayout.types';

const HABBO_IMAGER = 'https://www.habbo.de/habbo-imaging/avatarimage';
const HC_FIGURES = [
    'hr-3163-42.hd-180-1.ch-3030-64.lg-275-64.sh-3068-64.ha-3129-64',
    'hr-3322-45.hd-600-10.ch-3185-92.lg-3116-92.sh-3115-92.he-3082-92',
    'hr-3012-42.hd-180-2.ch-3324-110.lg-3058-110.sh-3068-64.ha-3129-110',
];

const HC_BENEFITS = [
    'Exklusive Kleidung & Frisuren',
    'Monatliche Credits-Auszahlung',
    'HC-Geschenke freischalten',
    'Doppelte Duckets-Einnahmen',
    'Garderobe zum Outfits speichern',
    'Exklusive Raumdesigns',
];

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
        let text = '';
        if(offer.months > 0) text = LocalizeText('catalog.vip.item.header.months', [ 'num_months' ], [ offer.months.toString() ]);
        if(offer.extraDays > 0)
        {
            if(text !== '') text += ' ';
            text += LocalizeText('catalog.vip.item.header.days', [ 'num_days' ], [ offer.extraDays.toString() ]);
        }
        return text;
    }, []);

    const purchaseSubscription = useCallback(() =>
    {
        if(!pendingOffer) return;
        setPurchaseState(CatalogPurchaseState.PURCHASE);
        SendMessageComposer(new PurchaseFromCatalogComposer(currentPage.pageId, pendingOffer.offerId, null, 1));
    }, [ pendingOffer, currentPage ]);

    useEffect(() =>
    {
        if(!clubOffers) SendMessageComposer(new GetClubOffersMessageComposer(1));
    }, [ clubOffers ]);

    const getSubscriptionDetails = useMemo(() =>
    {
        if(!purse) return '';
        const totalDays = (purse.clubPeriods * 31) + purse.clubDays;
        return LocalizeText('catalog.vip.extend.info', [ 'days' ], [ totalDays.toString() ]);
    }, [ purse ]);

    return (
        <div className="flex flex-col h-full overflow-y-auto" style={ { scrollbarWidth: 'thin' } }>
            {/* Hero Header */}
            <div className="shrink-0 relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-transparent border-b border-amber-400/20 p-6">
                <div className="absolute inset-0 opacity-[0.03]" style={ { backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '20px 20px' } } />
                <div className="relative flex items-center gap-4">
                    <LayoutCurrencyIcon type={ -1 } className="w-10 h-10" />
                    <div>
                        <h2 className="text-xl font-black tracking-tight flex items-center gap-2">Habbo Club</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Werde HC-Mitglied und schalte exklusive Vorteile frei</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto" style={ { scrollbarWidth: 'thin' } }>
                {/* Benefits */}
                <div className="mb-6 rounded-xl border border-amber-400/20 bg-gradient-to-br from-amber-500/[0.03] to-transparent p-4">
                    <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
                        <Crown className="w-4 h-4 text-amber-500" />HC-Vorteile
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                        { HC_BENEFITS.map((b, i) => (
                            <div key={ i } className="flex items-start gap-2 text-xs text-muted-foreground">
                                <Sparkles className="w-3 h-3 text-amber-400/60 mt-0.5 shrink-0" />
                                <span>{ b }</span>
                            </div>
                        )) }
                    </div>
                </div>

                {/* Offer cards */}
                { clubOffers && clubOffers.length > 0 ? (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
                        { clubOffers.map((offer, i) =>
                        {
                            const isActive = pendingOffer === offer;
                            const isBest = clubOffers.length > 1 && i === clubOffers.length - 1;
                            const figureUrl = `${ HABBO_IMAGER }?figure=${ HC_FIGURES[i % HC_FIGURES.length] }&direction=2&head_direction=2&size=l&gesture=sml`;

                            return (
                                <button
                                    key={ i }
                                    onClick={ () => { setPendingOffer(isActive ? null : offer); setPurchaseState(CatalogPurchaseState.NONE); } }
                                    className={ `group relative flex flex-col items-center rounded-2xl border-2 transition-all duration-300 overflow-hidden ${ isActive
                                        ? 'border-amber-400 bg-amber-500/10 shadow-xl shadow-amber-500/10 scale-[1.02]'
                                        : isBest
                                            ? 'border-amber-400/40 bg-gradient-to-b from-amber-500/5 to-transparent hover:border-amber-400/70 hover:shadow-lg'
                                            : 'border-border/40 bg-card hover:border-amber-400/30 hover:shadow-md' }` }
                                >
                                    { isBest && (
                                        <span className="absolute top-2.5 right-2.5 z-10 text-[9px] font-bold text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded px-1.5 py-0.5">Beliebt</span>
                                    ) }
                                    <div className="relative w-full h-[140px] bg-gradient-to-b from-amber-400/10 to-transparent flex items-end justify-center overflow-hidden">
                                        <div className="absolute inset-0 opacity-5" style={ { backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '16px 16px' } } />
                                        <img
                                            src={ figureUrl }
                                            alt={ getOfferText(offer) }
                                            className="relative h-[120px] object-contain drop-shadow-lg transition-transform duration-300 group-hover:scale-105"
                                            style={ { imageRendering: 'pixelated' } }
                                            onError={ e => { (e.target as HTMLImageElement).style.display = 'none'; } }
                                        />
                                    </div>
                                    <div className="flex flex-col items-center gap-2 p-4 w-full">
                                        <span className="text-base font-black tracking-tight">{ getOfferText(offer) }</span>
                                        <span className="text-[11px] text-muted-foreground">{ offer.months * 31 + offer.extraDays } Tage</span>
                                        <Separator className="w-full" />
                                        <CatalogPriceDisplay credits={ offer.priceCredits } points={ offer.priceActivityPoints } size="sm" />
                                        { isActive && (
                                            <div className="w-full mt-2">
                                                { purchaseState === CatalogPurchaseState.NONE && (
                                                    <Button className="w-full" size="sm" onClick={ (e) => { e.stopPropagation(); setPurchaseState(CatalogPurchaseState.CONFIRM); } }>
                                                        { LocalizeText('buy') }
                                                    </Button>
                                                ) }
                                                { purchaseState === CatalogPurchaseState.CONFIRM && (
                                                    <Button variant="warning" className="w-full" size="sm" onClick={ (e) => { e.stopPropagation(); purchaseSubscription(); } }>
                                                        { LocalizeText('catalog.marketplace.confirm_title') }
                                                    </Button>
                                                ) }
                                                { purchaseState === CatalogPurchaseState.PURCHASE && (
                                                    <Button className="w-full" size="sm" disabled><LayoutLoadingSpinnerView /></Button>
                                                ) }
                                                { purchaseState === CatalogPurchaseState.FAILED && (
                                                    <Button variant="destructive" className="w-full" size="sm" disabled>{ LocalizeText('generic.failed') }</Button>
                                                ) }
                                            </div>
                                        ) }
                                    </div>
                                </button>
                            );
                        }) }
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Crown className="w-12 h-12 mb-3 opacity-20" />
                        <p className="font-medium">Keine Club-Angebote verfügbar</p>
                    </div>
                ) }

                {/* Subscription info */}
                { purse && (purse.clubDays > 0 || purse.clubPeriods > 0) && (
                    <div className="mt-6 rounded-xl border border-border/40 bg-card p-4">
                        <div className="text-xs text-muted-foreground leading-relaxed catalog-page-text" dangerouslySetInnerHTML={ { __html: getSubscriptionDetails } } />
                    </div>
                ) }
            </div>
        </div>
    );
}
