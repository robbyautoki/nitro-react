import { FC } from 'react';
import { CatalogLayoutProps } from './CatalogLayout.types';

export const CatalogLayoutInfoLoyaltyView: FC<CatalogLayoutProps> = props =>
{
    const { page = null } = props;

    return (
        <div className="flex flex-col h-full gap-2">
            <div className="catalog-page-text flex-1 min-h-0 overflow-y-auto rounded-lg bg-white/[0.05] border border-white/[0.07] p-3 nitro-catalog-layout-info-loyalty">
                <div className="info-loyalty-content flex flex-col">
                    {/* Server localization text (trusted content from game server - safe to render) */}
                    <div dangerouslySetInnerHTML={ { __html: page.localization.getText(0) } } />
                </div>
            </div>
        </div>
    );
}
