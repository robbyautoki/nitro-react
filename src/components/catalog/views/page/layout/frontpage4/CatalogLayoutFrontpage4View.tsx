import { FrontPageItem } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { FaChevronLeft, FaChevronRight, FaShoppingBag } from 'react-icons/fa';
import { CreateLinkEvent, GetConfiguration } from '../../../../../../api';
import { CatalogPurchasedEvent } from '../../../../../../events';
import { useCatalog, useUiEvent } from '../../../../../../hooks';
import { CatalogRedeemVoucherView } from '../../common/CatalogRedeemVoucherView';
import { CatalogLayoutProps } from '../CatalogLayout.types';

const STORAGE_KEY = 'catalog_recent_purchases';
const MAX_RECENT = 8;
const SLIDE_INTERVAL = 4500;

interface RecentPurchase
{
    name: string;
    iconUrl: string;
    offerId: number;
    priceCredits: number;
}

const loadRecent = (): RecentPurchase[] =>
{
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
};

const saveRecent = (items: RecentPurchase[]) =>
{
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_RECENT))); }
    catch {}
};

export const CatalogLayoutFrontpage4View: FC<CatalogLayoutProps> = props =>
{
    const { page = null, hideNavigation = null } = props;
    const { frontPageItems = [], currentOffer = null, openPageByOfferId = null } = useCatalog();

    const [ activeSlide, setActiveSlide ] = useState(0);
    const [ recentPurchases, setRecentPurchases ] = useState<RecentPurchase[]>(loadRecent);
    const [ isHovered, setIsHovered ] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval>>(null);

    const slides = frontPageItems.filter(Boolean);
    const total = slides.length;

    const goTo = (index: number) => setActiveSlide((index + total) % total);

    useEffect(() =>
    {
        hideNavigation();
    }, [ page, hideNavigation ]);

    useEffect(() =>
    {
        if(total <= 1 || isHovered) return;

        timerRef.current = setInterval(() => setActiveSlide(prev => (prev + 1) % total), SLIDE_INTERVAL);

        return () => clearInterval(timerRef.current);
    }, [ total, isHovered ]);

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

    useUiEvent<CatalogPurchasedEvent>(CatalogPurchasedEvent.PURCHASE_SUCCESS, event =>
    {
        if(!currentOffer) return;

        const iconUrl = (currentOffer.pricingModel !== 4 && currentOffer.product)
            ? currentOffer.product.getIconUrl(currentOffer)
            : '';

        const entry: RecentPurchase = {
            name: currentOffer.localizationName,
            iconUrl,
            offerId: currentOffer.offerId,
            priceCredits: currentOffer.priceInCredits,
        };

        setRecentPurchases(prev =>
        {
            const filtered = prev.filter(p => p.offerId !== entry.offerId);
            const updated = [ entry, ...filtered ].slice(0, MAX_RECENT);
            saveRecent(updated);
            return updated;
        });
    });

    const imageBase = GetConfiguration<string>('image.library.url');

    return (
        <div className="flex flex-col h-full overflow-hidden">

            {/* ── Hero Slider ─────────────────────────────────── */}
            <div
                className="relative flex-1 min-h-0 overflow-hidden"
                onMouseEnter={ () => setIsHovered(true) }
                onMouseLeave={ () => setIsHovered(false) }
            >
                { slides.map((item, i) =>
                {
                    const imageUrl = `${ imageBase }${ item.itemPromoImage }`;

                    return (
                        <div
                            key={ i }
                            className="absolute inset-0 bg-cover bg-center transition-opacity duration-500"
                            style={ {
                                backgroundImage: `url(${ imageUrl })`,
                                opacity: i === activeSlide ? 1 : 0,
                                pointerEvents: i === activeSlide ? 'auto' : 'none',
                            } }
                        >
                            {/* Dark gradient bottom */}
                            <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/80 to-transparent" />

                            {/* Content overlay */}
                            <div className="absolute bottom-0 inset-x-0 p-5 flex items-end justify-between">
                                <div className="flex flex-col gap-2 max-w-[60%]">
                                    <h3 className="text-white font-bold text-lg leading-tight drop-shadow-lg">
                                        { item.itemName }
                                    </h3>
                                    <button
                                        className="self-start px-4 py-2 rounded-xl text-xs font-semibold bg-white/15 border border-white/25 text-white hover:bg-white/25 transition-colors backdrop-blur-sm"
                                        onClick={ () => selectSlide(item) }
                                    >
                                        Jetzt öffnen →
                                    </button>
                                </div>

                                {/* Dot navigation */}
                                { total > 1 &&
                                    <div className="flex items-center gap-1.5 pb-1">
                                        { slides.map((_, di) => (
                                            <button
                                                key={ di }
                                                className={ `rounded-full transition-all ${ di === activeSlide ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70' }` }
                                                onClick={ () => goTo(di) }
                                            />
                                        )) }
                                    </div> }
                            </div>
                        </div>
                    );
                }) }

                { !slides.length &&
                    <div className="flex items-center justify-center h-full text-white/20 text-sm">
                        No featured items
                    </div> }

                {/* Prev / Next arrows */}
                { total > 1 && (
                    <>
                        <button
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 border border-white/10 text-white/70 hover:bg-black/60 hover:text-white transition-all flex items-center justify-center"
                            onClick={ () => goTo(activeSlide - 1) }
                        >
                            <FaChevronLeft className="text-[11px]" />
                        </button>
                        <button
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 border border-white/10 text-white/70 hover:bg-black/60 hover:text-white transition-all flex items-center justify-center"
                            onClick={ () => goTo(activeSlide + 1) }
                        >
                            <FaChevronRight className="text-[11px]" />
                        </button>
                    </>
                ) }
            </div>

            {/* ── Recently Purchased ──────────────────────────── */}
            { recentPurchases.length > 0 && (
                <div className="shrink-0 border-t border-white/[0.06] px-4 py-2.5">
                    <div className="flex items-center gap-2 mb-2">
                        <FaShoppingBag className="text-[9px] text-white/25" />
                        <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/25">
                            Zuletzt gekauft
                        </span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto catalog-chip-scroll pb-0.5">
                        { recentPurchases.map((item, i) => (
                            <button
                                key={ i }
                                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.07] hover:bg-white/[0.09] hover:border-white/[0.12] transition-colors shrink-0"
                                onClick={ () => item.offerId > 0 && openPageByOfferId(item.offerId) }
                            >
                                { item.iconUrl &&
                                    <div
                                        className="w-7 h-7 bg-center bg-no-repeat shrink-0"
                                        style={ { backgroundImage: `url(${ item.iconUrl })` } }
                                    /> }
                                <div className="flex flex-col items-start min-w-0">
                                    <span className="text-[10px] text-white/70 truncate max-w-[90px]">{ item.name }</span>
                                    { item.priceCredits > 0 &&
                                        <span className="text-[9px] text-amber-400/70">{ item.priceCredits } Credits</span> }
                                </div>
                            </button>
                        )) }
                    </div>
                </div>
            ) }

            {/* ── Voucher ─────────────────────────────────────── */}
            <div className="shrink-0 border-t border-white/[0.06] px-4 py-2.5">
                <CatalogRedeemVoucherView text={ page.localization.getText(1) } />
            </div>
        </div>
    );
}
