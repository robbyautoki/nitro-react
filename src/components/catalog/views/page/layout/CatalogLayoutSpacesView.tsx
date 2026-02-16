import { NitroPoint } from '@nitrots/nitro-renderer';
import { FC, useEffect } from 'react';
import { useCatalog } from '../../../../../hooks';
import { CatalogSpacesWidgetView } from '../widgets/CatalogSpacesWidgetView';
import { CatalogLayoutProps } from './CatalogLayout.types';

export const CatalogLayoutSpacesView: FC<CatalogLayoutProps> = props =>
{
    const { page = null } = props;
    const { roomPreviewer = null } = useCatalog();

    useEffect(() =>
    {
        roomPreviewer.updatePreviewObjectBoundingRectangle(new NitroPoint());
    }, [ roomPreviewer ]);

    return (
        <div className="flex flex-col h-full gap-2">
            <div className="flex-1 min-h-0 overflow-auto">
                <CatalogSpacesWidgetView />
            </div>
        </div>
    );
}
