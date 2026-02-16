import { FC } from 'react';
import { CatalogLayoutProps } from './CatalogLayout.types';

export const CatalogLayoutInfoLoyaltyView: FC<CatalogLayoutProps> = props =>
{
    const { page = null } = props;

    return (
        <div className="catalog-page-text h-full overflow-auto nitro-catalog-layout-info-loyalty">
            <div className="info-loyalty-content h-full overflow-auto flex flex-col">
                { /* Server localization text (trusted content from game server) */ }
                <div dangerouslySetInnerHTML={ { __html: page.localization.getText(0) } } />
            </div>
        </div>
    );
}
