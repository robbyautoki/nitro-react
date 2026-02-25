import { StringDataType } from '@nitrots/nitro-renderer';
import { FC, HTMLAttributes, useEffect, useMemo, useState } from 'react';
import { LayoutBadgeImageView } from '../../../../../common';
import { cn } from '../../../../../lib/utils';
import { useCatalog, useInventoryBadges } from '../../../../../hooks';

const EXCLUDED_BADGE_CODES: string[] = [];

interface CatalogBadgeSelectorWidgetViewProps extends HTMLAttributes<HTMLDivElement>
{

}

export const CatalogBadgeSelectorWidgetView: FC<CatalogBadgeSelectorWidgetViewProps> = props =>
{
    const { className = '', ...rest } = props;
    const [ isVisible, setIsVisible ] = useState(false);
    const [ currentBadgeCode, setCurrentBadgeCode ] = useState<string>(null);
    const { currentOffer = null, setPurchaseOptions = null } = useCatalog();
    const { badgeCodes = [], activate = null, deactivate = null } = useInventoryBadges();

    const previewStuffData = useMemo(() =>
    {
        if(!currentBadgeCode) return null;

        const stuffData = new StringDataType();

        stuffData.setValue([ '0', currentBadgeCode, '', '' ]);

        return stuffData;
    }, [ currentBadgeCode ]);

    useEffect(() =>
    {
        if(!currentOffer) return;

        setPurchaseOptions(prevValue =>
        {
            const newValue = { ...prevValue };

            newValue.extraParamRequired = true;
            newValue.extraData = ((previewStuffData && previewStuffData.getValue(1)) || null);
            newValue.previewStuffData = previewStuffData;

            return newValue;
        });
    }, [ currentOffer, previewStuffData, setPurchaseOptions ]);

    useEffect(() =>
    {
        if(!isVisible) return;

        const id = activate();

        return () => deactivate(id);
    }, [ isVisible, activate, deactivate ]);

    useEffect(() =>
    {
        setIsVisible(true);

        return () => setIsVisible(false);
    }, []);

    return (
        <div className={ `grid grid-cols-5 gap-1.5 overflow-auto ${ className }` } { ...rest }>
            { badgeCodes && (badgeCodes.length > 0) && badgeCodes.map((badgeCode, index) =>
            {
                return (
                    <div
                        key={ index }
                        className={ cn(
                            'relative flex items-center justify-center rounded-lg border bg-black/[0.04] cursor-pointer overflow-hidden transition-all aspect-square',
                            'hover:border-black/[0.08]',
                            (currentBadgeCode === badgeCode) ? 'border-black/20 bg-black/[0.03] ring-1 ring-black/15' : 'border-black/[0.06]'
                        ) }
                        onClick={ event => setCurrentBadgeCode(badgeCode) }
                    >
                        <LayoutBadgeImageView badgeCode={ badgeCode } />
                    </div>
                );
            }) }
        </div>
    );
}
