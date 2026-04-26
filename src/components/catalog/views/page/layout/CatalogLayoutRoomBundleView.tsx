import { FC, useMemo } from 'react';
import { Home, Layers } from 'lucide-react';
import { GetConfiguration } from '../../../../../api';
import * as Divider from '@/align-ui/components/ui/divider';
import { useCatalog } from '../../../../../hooks';
import { CatalogPriceDisplay } from '../../shared/CatalogPriceDisplay';
import { CatalogPurchaseWidgetView } from '../widgets/CatalogPurchaseWidgetView';
import { CatalogItemGridWidgetView } from '../widgets/CatalogItemGridWidgetView';
import { CatalogFirstProductSelectorWidgetView } from '../widgets/CatalogFirstProductSelectorWidgetView';
import { CatalogLayoutProps } from './CatalogLayout.types';

const ROOM_BG_PATTERN = 'linear-gradient(135deg, hsl(var(--align-bg-weak-50)) 0%, hsl(var(--align-bg-soft-200)) 100%)';

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
            { /* Left: Room preview */ }
            <div className="flex-[3] min-w-0 relative overflow-hidden" style={ { backgroundImage: ROOM_BG_PATTERN } }>
                { teaser && <img src={ teaser } alt="" className="w-full h-full object-cover opacity-60" onError={ e => 
                {
                    (e.target as HTMLImageElement).style.display = 'none'; 
                } } /> }
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-bg-white-0/90" />
                <div className="absolute bottom-4 left-4">
                    <span className="mb-2 inline-flex items-center gap-1 rounded-md bg-primary-alpha-10 px-2 py-0.5 text-subheading-2xs text-primary-base ring-1 ring-primary-base/20">
                        <Home className="w-3 h-3" /> Raum-Bundle
                    </span>
                    { pageText && <p className="mt-1 text-paragraph-xs text-text-sub-600 catalog-page-text" dangerouslySetInnerHTML={ { __html: pageText } } /> }
                </div>
            </div>
            { /* Right: Bundle details */ }
            <div className="w-[300px] shrink-0 border-l border-stroke-soft-200 flex flex-col bg-bg-weak-50 overflow-y-auto" style={ { scrollbarWidth: 'thin' } }>
                <div className="p-4">
                    { pageText2 && <p className="mb-3 text-paragraph-xs text-text-sub-600 catalog-page-text" dangerouslySetInnerHTML={ { __html: pageText2 } } /> }
                </div>
                <Divider.Root />
                <div className="flex-1 p-4 overflow-y-auto" style={ { scrollbarWidth: 'thin' } }>
                    <span className="mb-2 block text-subheading-2xs uppercase text-text-soft-400">
                        <Layers className="w-3.5 h-3.5 inline mr-1" />Paket-Inhalt
                    </span>
                    <CatalogItemGridWidgetView />
                </div>
                <div className="shrink-0 border-t border-stroke-soft-200 p-4 space-y-3">
                    { currentOffer && <CatalogPriceDisplay credits={ currentOffer.priceInCredits } points={ currentOffer.priceInActivityPoints } pointsType={ currentOffer.activityPointType } /> }
                    <CatalogPurchaseWidgetView />
                </div>
            </div>
        </div>
    );
}
