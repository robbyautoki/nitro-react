import { FC } from 'react';
import { CreateLinkEvent, LocalizeText } from '../../../../../api';
import { LayoutImage } from '../../../../../common/layout/LayoutImage';
import { Button } from '../../../../ui/button';
import { CatalogLayoutProps } from './CatalogLayout.types';

export const CatalogLayoutGuildFrontpageView: FC<CatalogLayoutProps> = props =>
{
    const { page = null } = props;

    return (
        <div className="flex flex-col h-full gap-3">
            <div className="catalog-page-text flex-1 min-h-0 overflow-auto rounded-lg bg-white/[0.05] border border-white/[0.07] p-3">
                { /* Server localization text (trusted content from game server) */ }
                <div dangerouslySetInnerHTML={ { __html: page.localization.getText(2) } } />
                <div dangerouslySetInnerHTML={ { __html: page.localization.getText(0) } } />
                <div dangerouslySetInnerHTML={ { __html: page.localization.getText(1) } } />
            </div>
            <div className="flex items-center gap-3 p-2.5 bg-white/[0.05] rounded-lg border border-white/[0.07] shrink-0">
                { !!page.localization.getImage(1) && <LayoutImage imageUrl={ page.localization.getImage(1) } /> }
                <Button onClick={ () => CreateLinkEvent('groups/create') } className="h-8 text-xs px-4">
                    { LocalizeText('catalog.start.guild.purchase.button') }
                </Button>
            </div>
        </div>
    );
}
