import { FrontPageItem } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, Clock, Flame, Sparkles, Tag, TrendingUp, Trophy } from 'lucide-react';
import { CreateLinkEvent, GetConfiguration } from '../../../../../../api';
import { useCatalog, usePurse } from '../../../../../../hooks';
import { CatalogRedeemVoucherView } from '../../common/CatalogRedeemVoucherView';
import { CatalogLayoutProps } from '../CatalogLayout.types';
import { loadTracked, TrackedPurchase } from '../../../../CatalogView';
import { CatalogCurrencyIcon } from '../../../shared/CatalogCurrencyIcon';

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface KpiCardProps
{
    icon: React.ReactNode;
    label: string;
    value: string | number;
    sub?: string;
    onClick?: () => void;
}

const KpiCard: FC<KpiCardProps> = ({ icon, label, value, sub, onClick }) =>
{
    const Wrapper: any = onClick ? 'button' : 'div';
    return (
        <Wrapper
            onClick={ onClick }
            className={ `flex items-center gap-3 rounded-xl bg-bg-white-0 px-4 py-3 ring-1 ring-inset ring-stroke-soft-200 ${ onClick ? 'cursor-pointer transition hover:ring-stroke-strong-950 hover:shadow-regular-xs text-left' : '' }` }
        >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-bg-weak-50 ring-1 ring-inset ring-stroke-soft-200 text-text-sub-600">
                { icon }
            </div>
            <div className="min-w-0 flex-1">
                <div className="text-subheading-2xs uppercase tracking-wider text-text-soft-400">{ label }</div>
                <div className="text-label-md tabular-nums text-text-strong-950 truncate">{ value }</div>
                { sub && <div className="text-paragraph-xs text-text-sub-600 truncate">{ sub }</div> }
            </div>
        </Wrapper>
    );
};

interface SectionHeaderProps
{
    icon: React.ReactNode;
    title: string;
    count?: number;
    action?: React.ReactNode;
}

const SectionHeader: FC<SectionHeaderProps> = ({ icon, title, count, action }) => (
    <div className="mb-3 flex items-center gap-2">
        <span className="flex size-5 items-center justify-center text-text-sub-600">{ icon }</span>
        <span className="text-label-md text-text-strong-950">{ title }</span>
        { typeof count === 'number' && count > 0 && (
            <span className="rounded-full bg-bg-weak-50 px-2 py-0.5 text-subheading-2xs text-text-sub-600 ring-1 ring-inset ring-stroke-soft-200 tabular-nums">
                { count }
            </span>
        ) }
        { action && <div className="ml-auto">{ action }</div> }
    </div>
);

// ─── Main View ────────────────────────────────────────────────────────────────

export const CatalogLayoutFrontpage4View: FC<CatalogLayoutProps> = props =>
{
    const { page = null } = props;
    const { frontPageItems = [], openPageByOfferId = null } = useCatalog();
    const { getCurrencyAmount } = usePurse();

    const [ recentPurchases, setRecentPurchases ] = useState<TrackedPurchase[]>(() => loadTracked('catalog_recent_purchases'));
    const [ frequentPurchases, setFrequentPurchases ] = useState<TrackedPurchase[]>(() => loadTracked('catalog_most_purchased'));
    const [ currentSlide, setCurrentSlide ] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    const slides = frontPageItems.filter(Boolean);
    const imageBase = GetConfiguration<string>('image.library.url');

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

    // Auto-carousel
    useEffect(() =>
    {
        if(slides.length <= 1) return;
        const timer = setInterval(() => setCurrentSlide(prev => (prev + 1) % slides.length), 5000);
        return () => clearInterval(timer);
    }, [ slides.length ]);

    useEffect(() =>
    {
        if(!scrollRef.current) return;
        const slide = scrollRef.current.children[currentSlide] as HTMLElement;
        if(slide) slide.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    }, [ currentSlide ]);

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

    // ─── Derived KPIs ─────────────────────────────────────────────────────────
    const todayCount = useMemo(() =>
    {
        // Sum of frequent counts captured today (heuristic: just total frequent count)
        return frequentPurchases.reduce((sum, p) => sum + (p.count || 0), 0);
    }, [ frequentPurchases ]);

    const credits = useMemo(() => Math.round(getCurrencyAmount(-1) || 0), [ getCurrencyAmount ]);

    const featuredSlide = slides[0];

    // ─── Beliebt: Top 6 grid ──────────────────────────────────────────────────
    const top6 = frequentPurchases.slice(0, 6);

    // ─── Recommendations: Top 4 from frequent for right column ────────────────
    const recommendations = frequentPurchases.slice(0, 4);

    return (
        <div className="flex flex-col h-full overflow-y-auto" style={ { scrollbarWidth: 'thin' } }>
            <div className="flex flex-col gap-4 p-3">

                { /* ── 1. Hero Carousel ────────────────────────────────────── */ }
                { slides.length > 0 && (
                    <div className="relative overflow-hidden rounded-2xl ring-1 ring-inset ring-stroke-soft-200 shadow-regular-xs">
                        <div ref={ scrollRef } className="flex overflow-hidden scroll-smooth">
                            { slides.map((item, i) => (
                                <button
                                    key={ i }
                                    type="button"
                                    className="relative min-w-full cursor-pointer"
                                    onClick={ () => selectSlide(item) }
                                >
                                    <div className="aspect-[21/8] overflow-hidden bg-bg-weak-50">
                                        <img
                                            src={ `${ imageBase }${ item.itemPromoImage }` }
                                            alt={ item.itemName }
                                            className="h-full w-full object-cover"
                                            onError={ e => 
                                            {
                                                (e.target as HTMLImageElement).style.display = 'none'; 
                                            } }
                                        />
                                    </div>
                                    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-start gap-1 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-5 pt-16 text-left">
                                        <span className="inline-flex items-center gap-1 rounded-full bg-static-white/95 px-2 py-0.5 text-subheading-2xs text-static-black backdrop-blur-sm">
                                            <Sparkles className="h-3 w-3 text-warning-base" /> Featured
                                        </span>
                                        <span className="text-title-h6 text-static-white drop-shadow-sm">{ item.itemName }</span>
                                        { item.catalogPageLocation && (
                                            <span className="text-paragraph-xs text-static-white/70">{ item.catalogPageLocation }</span>
                                        ) }
                                    </div>
                                </button>
                            )) }
                        </div>
                        { slides.length > 1 && (
                            <div className="absolute bottom-3 right-4 flex gap-1.5">
                                { slides.map((_, i) => (
                                    <button
                                        key={ i }
                                        onClick={ () => setCurrentSlide(i) }
                                        className={ `h-1.5 rounded-full transition-all duration-300 ${ i === currentSlide ? 'w-6 bg-static-white' : 'w-1.5 bg-static-white/40 hover:bg-static-white/70' }` }
                                    />
                                )) }
                            </div>
                        ) }
                    </div>
                ) }

                { /* ── 2. KPI Strip ────────────────────────────────────────── */ }
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <KpiCard
                        icon={ <TrendingUp className="h-4 w-4" /> }
                        label="Käufe gesamt"
                        value={ todayCount.toLocaleString('de-DE') }
                        sub={ todayCount > 0 ? 'Erfasste Aktivität' : 'Noch keine Käufe' }
                    />
                    { featuredSlide ? (
                        <KpiCard
                            icon={ <Tag className="h-4 w-4 text-warning-base" /> }
                            label="Aktion"
                            value={ featuredSlide.itemName || 'Featured' }
                            sub={ featuredSlide.catalogPageLocation || 'Jetzt entdecken' }
                            onClick={ () => selectSlide(featuredSlide) }
                        />
                    ) : (
                        <KpiCard
                            icon={ <Tag className="h-4 w-4" /> }
                            label="Aktion"
                            value="Demnächst"
                            sub="Keine aktive Aktion"
                        />
                    ) }
                    <KpiCard
                        icon={ <CatalogCurrencyIcon type={ -1 } className="h-4 w-4" /> }
                        label="Guthaben"
                        value={ credits.toLocaleString('de-DE') }
                        sub="Credits verfügbar"
                    />
                </div>

                { /* ── 3. Beliebt — Top-Picks Grid ─────────────────────────── */ }
                { top6.length > 0 && (
                    <div>
                        <SectionHeader
                            icon={ <Flame className="h-3.5 w-3.5 text-warning-base" /> }
                            title="Beliebt"
                            count={ top6.length }
                        />
                        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-6">
                            { top6.map((item, i) => (
                                <button
                                    key={ i }
                                    onClick={ () => item.offerId > 0 && openPageByOfferId(item.offerId) }
                                    className="group relative flex flex-col items-center gap-1.5 rounded-lg p-2 transition hover:bg-bg-weak-50"
                                >
                                    { i === 0 && (
                                        <span className="absolute left-1 top-1 inline-flex items-center gap-0.5 rounded-full bg-warning-base px-1.5 py-0.5 text-subheading-2xs text-static-white">
                                            <Trophy className="h-2.5 w-2.5" /> Top
                                        </span>
                                    ) }
                                    <div className="flex size-12 items-center justify-center overflow-hidden rounded-lg bg-bg-weak-50 ring-1 ring-inset ring-stroke-soft-200">
                                        { item.iconUrl && (
                                            <div
                                                className="h-full w-full bg-center bg-no-repeat bg-contain"
                                                style={ { backgroundImage: `url(${ item.iconUrl })`, imageRendering: 'pixelated' } }
                                            />
                                        ) }
                                    </div>
                                    <span className="line-clamp-2 text-center text-label-xs text-text-strong-950 leading-tight">{ item.name }</span>
                                    <span className="text-subheading-2xs text-text-soft-400 tabular-nums">
                                        { (item.count || 1) }× gekauft
                                    </span>
                                </button>
                            )) }
                        </div>
                    </div>
                ) }

                { /* ── 4. Aktivität — Letzte Käufe + Empfehlungen ──────────── */ }
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
                    { /* Letzte Käufe (3 Spalten) */ }
                    <div className="rounded-xl bg-bg-white-0 ring-1 ring-inset ring-stroke-soft-200 lg:col-span-3">
                        <div className="border-b border-stroke-soft-200 px-4 py-3">
                            <SectionHeader
                                icon={ <Clock className="h-3.5 w-3.5" /> }
                                title="Letzte Käufe"
                                count={ recentPurchases.length }
                            />
                        </div>
                        { recentPurchases.length > 0 ? (
                            <div className="divide-y divide-stroke-soft-200">
                                { recentPurchases.slice(0, 6).map((item, i) => (
                                    <button
                                        key={ i }
                                        onClick={ () => item.offerId > 0 && openPageByOfferId(item.offerId) }
                                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-bg-weak-50"
                                    >
                                        <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-bg-weak-50 ring-1 ring-inset ring-stroke-soft-200">
                                            { item.iconUrl && (
                                                <div
                                                    className="h-full w-full bg-center bg-no-repeat bg-contain"
                                                    style={ { backgroundImage: `url(${ item.iconUrl })`, imageRendering: 'pixelated' } }
                                                />
                                            ) }
                                        </div>
                                        <span className="flex-1 truncate text-label-xs text-text-strong-950">{ item.name }</span>
                                        { item.priceCredits > 0 && (
                                            <span className="inline-flex shrink-0 items-center gap-1 text-label-xs text-text-strong-950 tabular-nums">
                                                <CatalogCurrencyIcon type={ -1 } className="h-3.5 w-3.5" />
                                                { item.priceCredits.toLocaleString('de-DE') }
                                            </span>
                                        ) }
                                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-text-soft-400" />
                                    </button>
                                )) }
                            </div>
                        ) : (
                            <div className="px-4 py-8 text-center">
                                <div className="text-paragraph-sm text-text-sub-600">Noch keine Käufe</div>
                                <div className="mt-1 text-paragraph-xs text-text-soft-400">Entdecke den Katalog und finde dein erstes Möbel</div>
                            </div>
                        ) }
                    </div>

                    { /* Empfehlungen (2 Spalten) */ }
                    <div className="rounded-xl bg-bg-white-0 ring-1 ring-inset ring-stroke-soft-200 lg:col-span-2">
                        <div className="border-b border-stroke-soft-200 px-4 py-3">
                            <SectionHeader
                                icon={ <Sparkles className="h-3.5 w-3.5 text-warning-base" /> }
                                title="Empfehlungen"
                            />
                        </div>
                        { recommendations.length > 0 ? (
                            <div className="flex flex-col p-2">
                                { recommendations.map((item, i) => (
                                    <button
                                        key={ i }
                                        onClick={ () => item.offerId > 0 && openPageByOfferId(item.offerId) }
                                        className="flex items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-bg-weak-50"
                                    >
                                        <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-bg-weak-50 ring-1 ring-inset ring-stroke-soft-200">
                                            { item.iconUrl && (
                                                <div
                                                    className="h-full w-full bg-center bg-no-repeat bg-contain"
                                                    style={ { backgroundImage: `url(${ item.iconUrl })`, imageRendering: 'pixelated' } }
                                                />
                                            ) }
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-label-xs text-text-strong-950">{ item.name }</div>
                                            <div className="text-paragraph-xs text-text-soft-400 tabular-nums">{ (item.count || 1) }× gekauft</div>
                                        </div>
                                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-text-soft-400" />
                                    </button>
                                )) }
                            </div>
                        ) : (
                            <div className="px-4 py-8 text-center">
                                <div className="text-paragraph-sm text-text-sub-600">Bald verfügbar</div>
                                <div className="mt-1 text-paragraph-xs text-text-soft-400">Wir lernen deine Vorlieben kennen</div>
                            </div>
                        ) }
                    </div>
                </div>
            </div>

            { /* ── Voucher Footer ──────────────────────────────────────────── */ }
            <div className="mt-auto shrink-0 border-t border-stroke-soft-200 bg-bg-weak-50 px-4 py-2.5">
                <CatalogRedeemVoucherView text={ page.localization.getText(1) } />
            </div>
        </div>
    );
};
