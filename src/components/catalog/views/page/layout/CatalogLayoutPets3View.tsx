import { FC } from 'react';
import { CatalogLayoutProps } from './CatalogLayout.types';

export const CatalogLayoutPets3View: FC<CatalogLayoutProps> = props =>
{
    const { page = null } = props;

    const imageUrl = page.localization.getImage(1);

    return (
        <div className="catalog-page-text flex flex-col h-full gap-2 overflow-hidden">
            <div className="flex items-center gap-2 shrink-0">
                { imageUrl && <img alt="" src={ imageUrl } /> }
                { /* Server localization text (trusted content from game server) */ }
                <div className="text-base font-semibold" dangerouslySetInnerHTML={ { __html: page.localization.getText(1) } } />
            </div>
            <div className="flex-1 overflow-auto">
                <div dangerouslySetInnerHTML={ { __html: page.localization.getText(2) } } />
            </div>
            <div className="shrink-0 font-semibold" dangerouslySetInnerHTML={ { __html: page.localization.getText(3) } } />
        </div>
    );
}
