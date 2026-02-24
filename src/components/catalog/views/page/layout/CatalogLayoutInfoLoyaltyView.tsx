import { FC } from 'react';
import { CatalogLayoutProps } from './CatalogLayout.types';

export const CatalogLayoutInfoLoyaltyView: FC<CatalogLayoutProps> = props =>
{
    const { page = null } = props;

    const teaserImage = page.localization.getImage(1);

    return (
        <div className="flex flex-col h-full overflow-y-auto" style={ { scrollbarWidth: 'none' } }>
            <div className="flex flex-col gap-3 p-3">

                { teaserImage &&
                    <div className="flex justify-center p-3 rounded-xl bg-white/[0.04] border border-white/[0.07]">
                        <img src={ teaserImage } alt="" className="max-h-24 object-contain rounded-lg" />
                    </div> }

                <div className="catalog-page-text rounded-lg bg-white/[0.03] border border-white/[0.06] p-3.5 text-[11px] text-white/60 leading-relaxed">
                    <div dangerouslySetInnerHTML={ { __html: page.localization.getText(0) } } />
                </div>
            </div>
        </div>
    );
}
