import { FrontPageItem } from '@nitrots/nitro-renderer';
import { FC } from 'react';
import { GetConfiguration } from '../../../../../../api';

export interface CatalogLayoutFrontPageItemViewProps
{
    item: FrontPageItem;
    onClick?: (event: React.MouseEvent) => void;
}

export const CatalogLayoutFrontPageItemView: FC<CatalogLayoutFrontPageItemViewProps> = props =>
{
    const { item = null, onClick = null, children = null } = props;

    if(!item) return null;

    const imageUrl = (GetConfiguration<string>('image.library.url') + item.itemPromoImage);

    return (
        <div
            className="relative flex-1 rounded-xl overflow-hidden cursor-pointer bg-cover bg-center min-h-[120px] hover:brightness-105 transition-all duration-200"
            style={{ backgroundImage: `url(${imageUrl})` }}
            onClick={onClick}
        >
            <span className="absolute bottom-2 left-2 text-white text-xs font-medium bg-black/60 backdrop-blur-sm rounded-lg px-2.5 py-1">
                { item.itemName }
            </span>
            { children }
        </div>
    );
}
