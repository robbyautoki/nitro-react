import { FrontPageItem } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Clock, Flame, Keyboard, Sparkles, X } from 'lucide-react';
import { CreateLinkEvent, GetConfiguration, LocalizeText } from '../../../../../../api';
import { useCatalog } from '../../../../../../hooks';
import { CatalogRedeemVoucherView } from '../../common/CatalogRedeemVoucherView';
import { CatalogLayoutProps } from '../CatalogLayout.types';
import { loadTracked, TrackedPurchase } from '../../../../CatalogView';
import { CatalogCurrencyIcon } from '../../../shared/CatalogCurrencyIcon';

export const CatalogLayoutFrontpage4View: FC<CatalogLayoutProps> = props =>
{
    const { page = null } = props;
    const { frontPageItems = [], openPageByOfferId = null } = useCatalog();

    const [ recentPurchases, setRecentPurchases ] = useState<TrackedPurchase[]>(() => loadTracked('catalog_recent_purchases'));
    const [ frequentPurchases, setFrequentPurchases ] = useState<TrackedPurchase[]>(() => loadTracked('catalog_most_purchased'));
    const [ currentSlide, setCurrentSlide ] = useState(0);
    const [ bannerDismissed, setBannerDismissed ] = useState(false);
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

    return (
        <div className="flex flex-col h-full overflow-y-auto" style={ { scrollbarWidth: 'thin' } }>
            <style>{ `@keyframes rainbow-border { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }` }</style>

            {/* Promo Banner */}
            { !bannerDismissed && (
                <div
                    className="shrink-0 mx-3 mt-3 relative rounded-lg overflow-hidden cursor-pointer group"
                    onClick={ () => CreateLinkEvent('catalog/open/83') }
                >
                    <div
                        className="absolute inset-0 rounded-lg"
                        style={ {
                            padding: '1px',
                            background: 'linear-gradient(90deg, #a855f7, #ec4899, #f59e0b, #06b6d4, #a855f7)',
                            backgroundSize: '300% 100%',
                            animation: 'rainbow-border 4s linear infinite',
                            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                            WebkitMaskComposite: 'xor',
                            maskComposite: 'exclude',
                        } as React.CSSProperties }
                    />
                    <div className="relative flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-amber-500/10">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-fuchsia-400" />
                            <span className="text-sm font-bold">Neue Rares sind da!</span>
                            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">Jetzt ansehen →</span>
                        </div>
                        <button
                            onClick={ (e) => { e.stopPropagation(); setBannerDismissed(true); } }
                            className="p-1 rounded-md hover:bg-black/5 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            ) }

            {/* Auto-Carousel */}
            { slides.length > 0 && (
                <div className="shrink-0 relative">
                    <div ref={ scrollRef } className="flex overflow-hidden scroll-smooth">
                        { slides.map((item, i) => (
                            <div
                                key={ i }
                                className="min-w-full relative cursor-pointer"
                                onClick={ () => selectSlide(item) }
                            >
                                <div className="aspect-[21/9] bg-gradient-to-br from-muted/50 to-muted/20 overflow-hidden">
                                    <img
                                        src={ `${ imageBase }${ item.itemPromoImage }` }
                                        alt={ item.itemName }
                                        className="w-full h-full object-cover"
                                        onError={ e => { (e.target as HTMLImageElement).style.display = 'none'; } }
                                    />
                                </div>
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5 pt-14">
                                    <p className="text-base font-bold text-white drop-shadow-lg">{ item.itemName }</p>
                                    <p className="text-xs text-white/50 mt-0.5">{ item.catalogPageLocation }</p>
                                </div>
                            </div>
                        )) }
                    </div>
                    { slides.length > 1 && (
                        <div className="absolute bottom-3 right-4 flex gap-1.5">
                            { slides.map((_, i) => (
                                <button
                                    key={ i }
                                    onClick={ () => setCurrentSlide(i) }
                                    className={ `w-2 h-2 rounded-full transition-all duration-300 ${ i === currentSlide ? 'bg-white w-5' : 'bg-white/40 hover:bg-white/60' }` }
                                />
                            )) }
                        </div>
                    ) }
                </div>
            ) }

            <div className="flex-1 p-5 space-y-5">
                {/* Meist gekauft */}
                { frequentPurchases.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Flame className="w-4 h-4 text-orange-400" />
                            <span className="text-sm font-bold">Meist gekauft</span>
                            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-medium text-muted-foreground">{ frequentPurchases.length }</span>
                        </div>
                        <div className="flex gap-2.5 overflow-x-auto pb-2" style={ { scrollbarWidth: 'thin' } }>
                            { frequentPurchases.map((item, i) => (
                                <button
                                    key={ i }
                                    className="shrink-0 w-[120px] flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/40 bg-card hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer"
                                    onClick={ () => item.offerId > 0 && openPageByOfferId(item.offerId) }
                                >
                                    <div className="w-12 h-12 rounded-lg bg-muted/20 flex items-center justify-center overflow-hidden">
                                        { item.iconUrl && (
                                            <div
                                                className="w-full h-full bg-center bg-no-repeat bg-contain"
                                                style={ { backgroundImage: `url(${ item.iconUrl })`, imageRendering: 'pixelated' } }
                                            />
                                        ) }
                                    </div>
                                    <span className="text-[11px] font-medium text-center leading-tight line-clamp-2">{ item.name }</span>
                                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
                                        <Flame className="w-2.5 h-2.5 text-orange-400" />{ item.count || 1 }×
                                    </span>
                                </button>
                            )) }
                        </div>
                    </div>
                ) }

                {/* Letzte Käufe */}
                { recentPurchases.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-bold">Letzte Käufe</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            { recentPurchases.slice(0, 8).map((item, i) => (
                                <button
                                    key={ i }
                                    className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-accent/30 transition-colors cursor-pointer text-left"
                                    onClick={ () => item.offerId > 0 && openPageByOfferId(item.offerId) }
                                >
                                    <div className="w-9 h-9 shrink-0 rounded-lg bg-muted/20 flex items-center justify-center overflow-hidden">
                                        { item.iconUrl && (
                                            <div
                                                className="w-full h-full bg-center bg-no-repeat bg-contain"
                                                style={ { backgroundImage: `url(${ item.iconUrl })`, imageRendering: 'pixelated' } }
                                            />
                                        ) }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-xs font-medium block truncate">{ item.name }</span>
                                    </div>
                                    <div className="shrink-0 flex items-center gap-1">
                                        { item.priceCredits > 0 && (
                                            <span className="flex items-center gap-0.5 text-sm font-bold text-amber-500">
                                                <CatalogCurrencyIcon type={ -1 } className="w-4 h-4" />
                                                { item.priceCredits }
                                            </span>
                                        ) }
                                    </div>
                                </button>
                            )) }
                        </div>
                    </div>
                ) }

                {/* CTA */}
                <div className="text-center pt-2 space-y-2">
                    <p className="text-xs text-muted-foreground">Wähle eine Kategorie oder nutze die Suche</p>
                    <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground/40">
                        <Keyboard className="w-3 h-3" />
                        <kbd className="font-mono bg-muted rounded px-1.5 py-0.5 border border-border/50 text-[9px]">⌘K</kbd>
                        zum Suchen
                    </div>
                </div>
            </div>

            {/* Voucher */}
            <div className="shrink-0 border-t border-border/30 px-4 py-2.5">
                <CatalogRedeemVoucherView text={ page.localization.getText(1) } />
            </div>
        </div>
    );
}
