import { FC, useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { GetConfiguration } from '../../../../api';
import { useCatalog } from '../../../../hooks';

export const CatalogPageHeaderBanner: FC<{}> = () =>
{
    const { currentPage = null } = useCatalog();

    const imageUrl = useMemo(() =>
    {
        if(!currentPage?.localization) return null;
        const img = currentPage.localization.getImage(0);
        if(!img) return null;
        const imageLibUrl = GetConfiguration<string>('image.library.url', '');
        return `${ imageLibUrl }${ img }`;
    }, [ currentPage ]);

    const isPremiumBanner = useMemo(() =>
    {
        if(!imageUrl) return false;
        const lower = imageUrl.toLowerCase();
        return lower.includes('webpromo') || lower.includes('web_promo') || lower.includes('_promo') || lower.includes('lpromo') || lower.includes('largepromo');
    }, [ imageUrl ]);

    const pageText = useMemo(() =>
    {
        if(!currentPage?.localization) return null;
        const text = currentPage.localization.getText(0);
        if(!text || text.length < 3) return null;
        return text;
    }, [ currentPage ]);

    if(!imageUrl && !pageText) return null;

    if(isPremiumBanner && imageUrl)
    {
        return (
            <div className="px-3 pt-3">
                <div className="relative overflow-hidden rounded-2xl ring-1 ring-inset ring-stroke-soft-200 shadow-regular-xs">
                    <img
                        src={ imageUrl }
                        alt=""
                        className="h-32 w-full object-cover"
                        onError={ (e) => { (e.target as HTMLImageElement).style.display = 'none'; } }
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg-strong-950/80 via-bg-strong-950/30 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
                        <div className="flex-1 min-w-0">
                            { pageText && (
                                <p
                                    className="text-paragraph-sm text-static-white line-clamp-2 catalog-page-text drop-shadow-sm"
                                    dangerouslySetInnerHTML={ { __html: pageText } }
                                />
                            ) }
                        </div>
                        <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-static-white/90 px-2.5 py-0.5 text-subheading-2xs text-text-strong-950 backdrop-blur-sm">
                            <Sparkles className="w-3 h-3 text-warning-base" /> Premium
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="px-3 pt-3">
            <div className="flex items-center gap-4 rounded-2xl bg-bg-weak-50 px-4 py-3 ring-1 ring-inset ring-stroke-soft-200">
                { imageUrl && (
                    <img
                        src={ imageUrl }
                        alt=""
                        className="h-12 object-contain shrink-0"
                        onError={ (e) => { (e.target as HTMLImageElement).style.display = 'none'; } }
                    />
                ) }
                <div className="flex-1 min-w-0">
                    { pageText && <p className="text-paragraph-sm text-text-sub-600 line-clamp-2 catalog-page-text" dangerouslySetInnerHTML={ { __html: pageText } } /> }
                </div>
                <span className="shrink-0 rounded-md bg-bg-white-0 px-2 py-0.5 text-subheading-2xs text-text-soft-400 shadow-regular-xs ring-1 ring-stroke-soft-200">
                    { currentPage?.layoutCode }
                </span>
            </div>
        </div>
    );
};
