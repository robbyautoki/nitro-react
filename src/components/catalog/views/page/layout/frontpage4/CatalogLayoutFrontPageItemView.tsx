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
            className="relative flex-1 rounded-lg overflow-hidden cursor-pointer bg-cover bg-center min-h-[80px]"
            style={{ backgroundImage: `url(${imageUrl})` }}
            onClick={onClick}
        >
            <span className="absolute bottom-2 left-2 text-white text-xs font-medium bg-zinc-900/80 rounded px-2 py-1">
                { item.itemName }
            </span>
            { children }
        </div>
    );
}
