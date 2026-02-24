import { FC } from 'react';
import { CreateLinkEvent, LocalizeText } from '../../../../../api';
import { Button } from '../../../../ui/button';
import { CatalogLayoutProps } from './CatalogLayout.types';

export const CatalogLayoutGuildFrontpageView: FC<CatalogLayoutProps> = props =>
{
    const { page = null } = props;

    const teaserImage = page.localization.getImage(1);

    return (
        <div className="flex flex-col h-full overflow-y-auto" style={ { scrollbarWidth: 'none' } }>
            <div className="flex flex-col gap-3 p-3">

                {/* Hero with teaser image */}
                { teaserImage &&
                    <div className="flex justify-center p-3 rounded-xl bg-white/[0.04] border border-white/[0.07]">
                        <img src={ teaserImage } alt="" className="max-h-20 object-contain rounded-lg" />
                    </div> }

                {/* Content */}
                <div className="catalog-page-text flex flex-col gap-2 rounded-lg bg-white/[0.03] border border-white/[0.06] p-3.5 text-[11px] text-white/60 leading-relaxed">
                    <div dangerouslySetInnerHTML={ { __html: page.localization.getText(2) } } />
                    <div dangerouslySetInnerHTML={ { __html: page.localization.getText(0) } } />
                    <div dangerouslySetInnerHTML={ { __html: page.localization.getText(1) } } />
                </div>

                {/* Action button */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.04] border border-white/[0.07] shrink-0">
                    <Button onClick={ () => CreateLinkEvent('groups/create') } className="h-8 text-xs px-4 w-full">
                        { LocalizeText('catalog.start.guild.purchase.button') }
                    </Button>
                </div>
            </div>
        </div>
    );
}
