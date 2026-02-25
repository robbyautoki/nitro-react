import { FrontPageItem } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { FaShoppingBag, FaFire } from 'react-icons/fa';
import { CreateLinkEvent, GetConfiguration, LocalizeText } from '../../../../../../api';
import { useCatalog } from '../../../../../../hooks';
import { CatalogRedeemVoucherView } from '../../common/CatalogRedeemVoucherView';
import { CatalogLayoutProps } from '../CatalogLayout.types';
import { loadTracked, TrackedPurchase } from '../../../../CatalogView';
import { LoadingCarousel } from '../../../../../ui/loading-carousel';

export const CatalogLayoutFrontpage4View: FC<CatalogLayoutProps> = props =>
{
    const { page = null, hideNavigation = null } = props;
    const { frontPageItems = [], openPageByOfferId = null } = useCatalog();

    const [ recentPurchases, setRecentPurchases ] = useState<TrackedPurchase[]>(() => loadTracked('catalog_recent_purchases'));
    const [ frequentPurchases, setFrequentPurchases ] = useState<TrackedPurchase[]>(() => loadTracked('catalog_most_purchased'));

    const slides = frontPageItems.filter(Boolean);

    useEffect(() =>
    {
        hideNavigation();
    }, [ page, hideNavigation ]);

    // Refresh purchases when tracking event fires
    useEffect(() =>
    {
        const refresh = () =>
        {
            setRecentPurchases(loadTracked('catalog_recent_purchases'));
            setFrequentPurchases(loadTracked('catalog_most_purchased'));
        };

        window.addEventListener('catalog_purchase_tracked', refresh);
        return () => window.removeEventListener('catalog_purchase_tracked', refresh);
    }, []);

    const selectSlide = useCallback((item: FrontPageItem) =>
    {
        switch(item.type)
        {
            case FrontPageItem.ITEM_CATALOGUE_PAGE:
                CreateLinkEvent(`catalog/open/${ item.catalogPageLocation }`);
                return;
            case FrontPageItem.ITEM_PRODUCT_OFFER:
                CreateLinkEvent(`catalog/open/${ item.productOfferId }`);
                return;
        }
    }, []);

    const imageBase = GetConfiguration<string>('image.library.url');

    const tips = useMemo(() =>
        slides.map(item => ({
            text: item.itemName,
            image: `${ imageBase }${ item.itemPromoImage }`,
        })),
    [ slides, imageBase ]);

    return (
        <div className="flex flex-col h-full overflow-hidden">

            {/* ── Hero Carousel ────────────────────────────────── */}
            <div className="relative flex-1 min-h-0 overflow-hidden">
                { tips.length > 0 ? (
                    <LoadingCarousel
                        tips={ tips }
                        autoplayInterval={ 4500 }
                        showNavigation={ false }
                        showIndicators={ true }
                        showProgress={ true }
                        aspectRatio="video"
                        textPosition="bottom"
                        backgroundGradient={ true }
                        backgroundTips={ true }
                        animateText={ true }
                        onSlideClick={ (index) => selectSlide(slides[index]) }
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-black/15 text-sm">
                        { LocalizeText('catalog.frontpage.no_items') }
                    </div>
                ) }
            </div>

            {/* ── Recently Purchased ──────────────────────────── */}
            { recentPurchases.length > 0 && (
                <div className="shrink-0 border-t border-black/[0.06] px-4 py-2.5">
                    <div className="flex items-center gap-2 mb-2">
                        <FaShoppingBag className="text-[9px] text-black/20" />
                        <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-black/20">
                            { LocalizeText('catalog.frontpage.recent_purchases') }
                        </span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto catalog-chip-scroll pb-0.5">
                        { recentPurchases.map((item, i) => (
                            <button
                                key={ i }
                                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-black/[0.03] border border-black/[0.06] hover:bg-black/[0.05] hover:border-black/[0.08] transition-colors shrink-0"
                                onClick={ () => item.offerId > 0 && openPageByOfferId(item.offerId) }
                            >
                                { item.iconUrl &&
                                    <div
                                        className="w-7 h-7 bg-center bg-no-repeat shrink-0"
                                        style={ { backgroundImage: `url(${ item.iconUrl })` } }
                                    /> }
                                <div className="flex flex-col items-start min-w-0">
                                    <span className="text-[10px] text-black/60 truncate max-w-[90px]">{ item.name }</span>
                                    { item.priceCredits > 0 &&
                                        <span className="text-[9px] text-amber-600/70">{ item.priceCredits } Credits</span> }
                                </div>
                            </button>
                        )) }
                    </div>
                </div>
            ) }

            {/* ── Most Purchased ───────────────────────────── */}
            { frequentPurchases.length > 0 && (
                <div className="shrink-0 border-t border-black/[0.06] px-4 py-2.5">
                    <div className="flex items-center gap-2 mb-2">
                        <FaFire className="text-[9px] text-orange-400/60" />
                        <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-black/20">
                            Meist gekauft
                        </span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto catalog-chip-scroll pb-0.5">
                        { frequentPurchases.map((item, i) => (
                            <button
                                key={ i }
                                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-black/[0.03] border border-black/[0.06] hover:bg-black/[0.05] hover:border-black/[0.08] transition-colors shrink-0"
                                onClick={ () => item.offerId > 0 && openPageByOfferId(item.offerId) }
                            >
                                { item.iconUrl &&
                                    <div
                                        className="w-7 h-7 bg-center bg-no-repeat shrink-0"
                                        style={ { backgroundImage: `url(${ item.iconUrl })`, imageRendering: 'pixelated' } }
                                    /> }
                                <div className="flex flex-col items-start min-w-0">
                                    <span className="text-[10px] text-black/60 truncate max-w-[90px]">{ item.name }</span>
                                    <span className="text-[9px] text-orange-400/70">×{ item.count || 1 }</span>
                                </div>
                            </button>
                        )) }
                    </div>
                </div>
            ) }

            {/* ── Voucher ─────────────────────────────────────── */}
            <div className="shrink-0 border-t border-black/[0.06] px-4 py-2.5">
                <CatalogRedeemVoucherView text={ page.localization.getText(1) } />
            </div>
        </div>
    );
}
