import { FC, useEffect, useState } from 'react';
import { GetConfiguration } from '../../../../api';

export interface CatalogHeaderViewProps
{
    imageUrl?: string;
}

export const CatalogHeaderView: FC<CatalogHeaderViewProps> = props =>
{
    const { imageUrl = null } = props;
    const [ displayImageUrl, setDisplayImageUrl ] = useState('');

    useEffect(() =>
    {
        setDisplayImageUrl(imageUrl ?? GetConfiguration<string>('catalog.asset.image.url').replace('%name%', 'catalog_header_roombuilder'));
    }, [ imageUrl ]);

    return <div className="flex items-center justify-center w-full nitro-catalog-header">
        <img src={ displayImageUrl } onError={ ({ currentTarget }) =>
        {
            currentTarget.src = GetConfiguration<string>('catalog.asset.image.url').replace('%name%', 'catalog_header_roombuilder');
        } } />
    </div>;
}
