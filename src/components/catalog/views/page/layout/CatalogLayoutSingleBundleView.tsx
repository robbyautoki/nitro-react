import { FC, useMemo } from 'react';
import { Box, Layers } from 'lucide-react';
import { GetConfiguration, Offer } from '../../../../../api';
import { Separator } from '../../../../ui/separator';
import { useCatalog } from '../../../../../hooks';
import { CatalogPriceDisplay } from '../../shared/CatalogPriceDisplay';
import { CatalogPurchaseWidgetView } from '../widgets/CatalogPurchaseWidgetView';
import { CatalogBundleGridWidgetView } from '../widgets/CatalogBundleGridWidgetView';
import { CatalogFirstProductSelectorWidgetView } from '../widgets/CatalogFirstProductSelectorWidgetView';
import { CatalogLayoutProps } from './CatalogLayout.types';

export const CatalogLayoutSingleBundleView: FC<CatalogLayoutProps> = props =>
{
    const { page = null } = props;
    const { currentOffer = null, currentPage = null } = useCatalog();
    const imageLibUrl = useMemo(() => GetConfiguration<string>('image.library.url', ''), []);

    const teaser = useMemo(() =>
    {
        const img = currentPage?.localization?.getImage(1);
        return img ? `${ imageLibUrl }${ img }` : '';
    }, [ currentPage, imageLibUrl ]);

    const pageText1 = currentPage?.localization?.getText(0) || '';
    const pageText2 = currentPage?.localization?.getText(2) || '';

    return (
        <div className="flex flex-col h-full overflow-y-auto" style={ { scrollbarWidth: 'thin' } }>
            <CatalogFirstProductSelectorWidgetView />

            {/* Hero Banner */}
            { teaser ? (
                <div className="shrink-0 relative h-[200px] overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background">
                    <img src={ teaser } alt="" className="w-full h-full object-cover opacity-80" onError={ e => { (e.target as HTMLImageElement).style.display = 'none'; } } />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                        <span className="text-[10px] font-medium text-primary bg-primary/10 border border-primary/20 rounded-md px-2 py-0.5 inline-flex items-center gap-1 mb-2">
                            <Box className="w-3 h-3" /> Bundle
                        </span>
                        <h2 className="text-xl font-black tracking-tight">{ currentPage?.localization?.getText(1) || currentOffer?.localizationName }</h2>
                    </div>
                </div>
            ) : (
                <div className="shrink-0 p-4 border-b border-border/30">
                    <span className="text-[10px] font-medium text-primary bg-primary/10 border border-primary/20 rounded-md px-2 py-0.5 inline-flex items-center gap-1 mb-2">
                        <Box className="w-3 h-3" /> Bundle
                    </span>
                    <h2 className="text-xl font-black tracking-tight">{ currentOffer?.localizationName }</h2>
                </div>
            ) }

            {/* Description */}
            { (pageText1 || pageText2) && (
                <div className="shrink-0 px-4 py-3 border-b border-border/20">
                    { pageText2 && <p className="text-sm font-semibold mb-1">{ pageText2 }</p> }
                    { pageText1 && <p className="text-xs text-muted-foreground catalog-page-text" dangerouslySetInnerHTML={ { __html: pageText1 } } /> }
                </div>
            ) }

            {/* Bundle contents */}
            <div className="shrink-0 px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                    <Layers className="w-3.5 h-3.5 text-muted-foreground/50" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Paket-Inhalt</span>
                </div>
                <div className="overflow-x-auto pb-2" style={ { scrollbarWidth: 'thin' } }>
                    <CatalogBundleGridWidgetView fullWidth className="nitro-catalog-layout-bundle-grid" />
                </div>
            </div>

            {/* Purchase area */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
                { currentOffer && (
                    <CatalogPriceDisplay
                        credits={ currentOffer.priceInCredits }
                        points={ currentOffer.priceInActivityPoints }
                        pointsType={ currentOffer.activityPointType }
                    />
                ) }
                <div className="w-full max-w-xs">
                    <CatalogPurchaseWidgetView />
                </div>
            </div>
        </div>
    );
}
