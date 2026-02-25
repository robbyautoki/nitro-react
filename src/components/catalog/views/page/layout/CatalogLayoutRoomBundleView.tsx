import { FC, useMemo } from 'react';
import { Home, Layers } from 'lucide-react';
import { GetConfiguration } from '../../../../../api';
import { Separator } from '../../../../ui/separator';
import { useCatalog } from '../../../../../hooks';
import { CatalogPriceDisplay } from '../../shared/CatalogPriceDisplay';
import { CatalogPurchaseWidgetView } from '../widgets/CatalogPurchaseWidgetView';
import { CatalogItemGridWidgetView } from '../widgets/CatalogItemGridWidgetView';
import { CatalogFirstProductSelectorWidgetView } from '../widgets/CatalogFirstProductSelectorWidgetView';
import { CatalogLayoutProps } from './CatalogLayout.types';

const ROOM_BG_SVG = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="280" height="220" viewBox="0 0 280 220"><rect fill="#f0f1f3" width="280" height="220"/><polygon points="140,60 280,130 140,200 0,130" fill="#e2e4e8"/></svg>`)}`;

export const CatalogLayoutRoomBundleView: FC<CatalogLayoutProps> = props =>
{
    const { currentPage = null, currentOffer = null } = useCatalog();
    const imageLibUrl = useMemo(() => GetConfiguration<string>('image.library.url', ''), []);

    const pageText = useMemo(() => currentPage?.localization?.getText(0) || '', [ currentPage ]);
    const pageText2 = useMemo(() => currentPage?.localization?.getText(1) || '', [ currentPage ]);
    const teaser = useMemo(() =>
    {
        const img = currentPage?.localization?.getImage(1);
        return img ? `${ imageLibUrl }${ img }` : '';
    }, [ currentPage, imageLibUrl ]);

    return (
        <div className="flex h-full overflow-hidden">
            <CatalogFirstProductSelectorWidgetView />
            {/* Left: Room preview */}
            <div className="flex-[3] min-w-0 relative overflow-hidden" style={ { backgroundImage: `url('${ ROOM_BG_SVG }')`, backgroundColor: 'hsl(var(--muted) / 0.2)' } }>
                { teaser && <img src={ teaser } alt="" className="w-full h-full object-cover opacity-60" onError={ e => { (e.target as HTMLImageElement).style.display = 'none'; } } /> }
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-background/90" />
                <div className="absolute bottom-4 left-4">
                    <span className="text-[10px] font-medium text-primary bg-primary/10 border border-primary/20 rounded-md px-2 py-0.5 inline-flex items-center gap-1 mb-2">
                        <Home className="w-3 h-3" /> Raum-Bundle
                    </span>
                    { pageText && <p className="text-xs text-muted-foreground mt-1 catalog-page-text" dangerouslySetInnerHTML={ { __html: pageText } } /> }
                </div>
            </div>

            {/* Right: Bundle details */}
            <div className="w-[280px] shrink-0 border-l border-border/40 flex flex-col bg-muted/5 overflow-y-auto" style={ { scrollbarWidth: 'thin' } }>
                <div className="p-4">
                    { pageText2 && <p className="text-xs text-muted-foreground mb-3 catalog-page-text" dangerouslySetInnerHTML={ { __html: pageText2 } } /> }
                </div>
                <Separator />
                <div className="flex-1 p-4 overflow-y-auto" style={ { scrollbarWidth: 'thin' } }>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 block mb-2">
                        <Layers className="w-3.5 h-3.5 inline mr-1" />Paket-Inhalt
                    </span>
                    <CatalogItemGridWidgetView />
                </div>
                <div className="shrink-0 p-4 border-t border-border/30 space-y-3">
                    { currentOffer && <CatalogPriceDisplay credits={ currentOffer.priceInCredits } points={ currentOffer.priceInActivityPoints } pointsType={ currentOffer.activityPointType } /> }
                    <CatalogPurchaseWidgetView />
                </div>
            </div>
        </div>
    );
}
