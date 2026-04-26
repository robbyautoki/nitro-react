import { FC, useMemo } from 'react';
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

    const pageText = useMemo(() =>
    {
        if(!currentPage?.localization) return null;
        const text = currentPage.localization.getText(0);
        if(!text || text.length < 3) return null;
        return text;
    }, [ currentPage ]);

    if(!imageUrl && !pageText) return null;

    return (
        <div className="border-b border-stroke-soft-200 bg-bg-weak-50">
            <div className="flex items-center gap-4 px-4 py-3">
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
