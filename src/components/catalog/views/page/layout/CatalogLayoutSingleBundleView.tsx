import { FC, useMemo } from 'react';
import { Box, Layers } from 'lucide-react';
import { GetConfiguration, Offer } from '../../../../../api';
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
                <div className="shrink-0 relative h-[200px] overflow-hidden bg-gradient-to-br from-primary-alpha-10 via-bg-white-0 to-bg-white-0">
                    <img src={ teaser } alt="" className="w-full h-full object-cover opacity-80" onError={ e => { (e.target as HTMLImageElement).style.display = 'none'; } } />
                    <div className="absolute inset-0 bg-gradient-to-t from-bg-white-0 via-bg-white-0/50 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                        <span className="mb-2 inline-flex items-center gap-1 rounded-md bg-primary-alpha-10 px-2 py-0.5 text-subheading-2xs text-primary-base ring-1 ring-primary-base/20">
                            <Box className="w-3 h-3" /> Bundle
                        </span>
                        <h2 className="text-title-h5 text-text-strong-950">{ currentPage?.localization?.getText(1) || currentOffer?.localizationName }</h2>
                    </div>
                </div>
            ) : (
                <div className="shrink-0 border-b border-stroke-soft-200 p-4">
                    <span className="mb-2 inline-flex items-center gap-1 rounded-md bg-primary-alpha-10 px-2 py-0.5 text-subheading-2xs text-primary-base ring-1 ring-primary-base/20">
                        <Box className="w-3 h-3" /> Bundle
                    </span>
                    <h2 className="text-title-h5 text-text-strong-950">{ currentOffer?.localizationName }</h2>
                </div>
            ) }

            {/* Description */}
            { (pageText1 || pageText2) && (
                <div className="shrink-0 border-b border-stroke-soft-200 px-4 py-3">
                    { pageText2 && <p className="mb-1 text-label-sm text-text-strong-950">{ pageText2 }</p> }
                    { pageText1 && <p className="text-paragraph-xs text-text-sub-600 catalog-page-text" dangerouslySetInnerHTML={ { __html: pageText1 } } /> }
                </div>
            ) }

            {/* Bundle contents */}
            <div className="shrink-0 px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                    <Layers className="w-3.5 h-3.5 text-text-soft-400" />
                    <span className="text-subheading-2xs uppercase text-text-soft-400">Paket-Inhalt</span>
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
