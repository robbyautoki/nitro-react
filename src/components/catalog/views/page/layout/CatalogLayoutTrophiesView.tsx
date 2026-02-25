import { FC, useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { Separator } from '../../../../ui/separator';
import { Textarea } from '../../../../ui/textarea';
import { useCatalog } from '../../../../../hooks';
import { CatalogPageHeaderBanner } from '../../shared/CatalogPageHeaderBanner';
import { CatalogPriceDisplay } from '../../shared/CatalogPriceDisplay';
import { CatalogPurchaseWidgetView } from '../widgets/CatalogPurchaseWidgetView';
import { CatalogViewProductWidgetView } from '../widgets/CatalogViewProductWidgetView';
import { CatalogItemGridWidgetView } from '../widgets/CatalogItemGridWidgetView';
import { CatalogFirstProductSelectorWidgetView } from '../widgets/CatalogFirstProductSelectorWidgetView';
import { CatalogLayoutProps } from './CatalogLayout.types';

const ROOM_BG_SVG = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="280" height="160" viewBox="0 0 280 160"><rect fill="#f0f1f3" width="280" height="160"/><polygon points="140,40 280,100 140,160 0,100" fill="#e2e4e8"/></svg>`)}`;

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
            {/* Grid */}
            <div className="flex-1 min-w-0 flex flex-col">
                <CatalogPageHeaderBanner />
                <div className="flex-1 min-h-0 overflow-y-auto p-3" style={ { scrollbarWidth: 'thin' } }>
                    <CatalogItemGridWidgetView />
                </div>
            </div>
            {/* Gravur Panel */}
            { currentOffer && (
                <div className="w-[280px] shrink-0 border-l border-border/40 flex flex-col bg-muted/5">
                    <div className="relative h-[160px] shrink-0 overflow-hidden" style={ { backgroundImage: `url('${ ROOM_BG_SVG }')`, backgroundColor: 'hsl(var(--muted) / 0.3)' } }>
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                        <div className="flex items-center justify-center h-full p-4">
                            <CatalogViewProductWidgetView height={ 120 } />
                        </div>
                    </div>
                    <div className="flex flex-col gap-3 p-4 flex-1 overflow-y-auto" style={ { scrollbarWidth: 'thin' } }>
                        <h3 className="text-base font-bold">{ currentOffer.localizationName }</h3>
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold flex items-center gap-1.5">
                                    <Trophy className="w-3 h-3 text-amber-500/60" />Gravur
                                </span>
                                <span className="text-[10px] text-muted-foreground/40 tabular-nums">{ trophyText.length }/100</span>
                            </div>
                            <Textarea
                                placeholder="Text für die Trophäe eingeben..."
                                value={ trophyText }
                                onChange={ e => setTrophyText(e.target.value.slice(0, 100)) }
                                className="h-20 text-xs resize-none"
                            />
                        </div>
                        <Separator />
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
