import { FC, useEffect, useState } from 'react';
import { useCatalog } from '../../../../../hooks';
import { Textarea } from '../../../../ui/textarea';
import { CatalogItemGridWidgetView } from '../widgets/CatalogItemGridWidgetView';
import { CatalogLayoutProps } from './CatalogLayout.types';

export const CatalogLayoutTrophiesView: FC<CatalogLayoutProps> = props =>
{
    const { page = null } = props;
    const [ trophyText, setTrophyText ] = useState<string>('');
    const { currentOffer = null, setPurchaseOptions = null } = useCatalog();

    useEffect(() =>
    {
        if(!currentOffer) return;

        setPurchaseOptions(prevValue =>
        {
            const newValue = { ...prevValue };
            newValue.extraData = trophyText;
            return newValue;
        });
    }, [ currentOffer, trophyText, setPurchaseOptions ]);

    return (
        <div className="flex flex-col h-full gap-2">
            { currentOffer &&
                <Textarea className="w-full h-20 text-xs shrink-0 resize-none" defaultValue={ trophyText || '' } onChange={ event => setTrophyText(event.target.value) } /> }
            <div className="flex-1 min-h-0 overflow-auto">
                <CatalogItemGridWidgetView />
            </div>
        </div>
    );
}
