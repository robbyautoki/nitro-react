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
                    <div className="flex justify-center p-3 rounded-xl bg-black/[0.03] border border-black/[0.06]">
                        <img src={ teaserImage } alt="" className="max-h-24 object-contain rounded-lg" />
                    </div> }

                <div className="catalog-page-text rounded-lg bg-black/[0.02] border border-black/[0.06] p-3.5 text-[11px] text-black/50 leading-relaxed">
                    <div dangerouslySetInnerHTML={ { __html: page.localization.getText(0) } } />
                </div>
            </div>
        </div>
    );
}
