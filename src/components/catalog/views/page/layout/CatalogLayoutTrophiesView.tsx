import { FC, useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import * as Divider from '@/align-ui/components/ui/divider';
import * as Textarea from '@/align-ui/components/ui/textarea';
import { useCatalog } from '../../../../../hooks';
import { CatalogPageHeaderBanner } from '../../shared/CatalogPageHeaderBanner';
import { CatalogPriceDisplay } from '../../shared/CatalogPriceDisplay';
import { CatalogPurchaseWidgetView } from '../widgets/CatalogPurchaseWidgetView';
import { CatalogViewProductWidgetView } from '../widgets/CatalogViewProductWidgetView';
import { CatalogItemGridWidgetView } from '../widgets/CatalogItemGridWidgetView';
import { CatalogFirstProductSelectorWidgetView } from '../widgets/CatalogFirstProductSelectorWidgetView';
import { CatalogLayoutProps } from './CatalogLayout.types';

const ROOM_BG_PATTERN = 'linear-gradient(135deg, hsl(var(--align-bg-weak-50)) 0%, hsl(var(--align-bg-soft-200)) 100%)';

export const CatalogLayoutTrophiesView: FC<CatalogLayoutProps> = props =>
{
    const [ trophyText, setTrophyText ] = useState<string>('');
    const { currentOffer = null, setPurchaseOptions = null } = useCatalog();

    useEffect(() =>
    {
        if(!currentOffer) return;
        setPurchaseOptions(prev => ({ ...prev, extraData: trophyText }));
    }, [ currentOffer, trophyText, setPurchaseOptions ]);

    return (
        <div className="flex h-full overflow-hidden">
            <CatalogFirstProductSelectorWidgetView />
            { /* Grid */ }
            <div className="flex-1 min-w-0 flex flex-col">
                <CatalogPageHeaderBanner />
                <div className="flex-1 min-h-0 overflow-y-auto p-3" style={ { scrollbarWidth: 'thin' } }>
                    <CatalogItemGridWidgetView />
                </div>
            </div>
            { /* Gravur Panel */ }
            { currentOffer && (
                <div className="w-[300px] shrink-0 border-l border-stroke-soft-200 flex flex-col bg-bg-weak-50">
                    <div className="relative h-[160px] shrink-0 overflow-hidden" style={ { backgroundImage: ROOM_BG_PATTERN } }>
                        <div className="absolute inset-0 bg-gradient-to-t from-bg-white-0/80 via-transparent to-transparent" />
                        <div className="flex items-center justify-center h-full p-4">
                            <CatalogViewProductWidgetView height={ 120 } />
                        </div>
                    </div>
                    <div className="flex flex-col gap-3 p-4 flex-1 overflow-y-auto" style={ { scrollbarWidth: 'thin' } }>
                        <h3 className="text-label-md text-text-strong-950">{ currentOffer.localizationName }</h3>
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-subheading-2xs uppercase text-text-soft-400 flex items-center gap-1.5">
                                    <Trophy className="w-3 h-3 text-warning-base" />Gravur
                                </span>
                                <span className="text-subheading-2xs text-text-soft-400 tabular-nums">{ trophyText.length }/100</span>
                            </div>
                            <Textarea.Root
                                simple
                                placeholder="Text für die Trophäe eingeben..."
                                value={ trophyText }
                                onChange={ e => setTrophyText(e.target.value.slice(0, 100)) }
                                className="h-20 resize-none text-paragraph-xs"
                            />
                        </div>
                        <Divider.Root />
                        <CatalogPriceDisplay
                            credits={ currentOffer.priceInCredits }
                            points={ currentOffer.priceInActivityPoints }
                            pointsType={ currentOffer.activityPointType }
                        />
                        <CatalogPurchaseWidgetView />
                    </div>
                </div>
            ) }
        </div>
    );
}
