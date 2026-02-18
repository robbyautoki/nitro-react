import { FC } from 'react';
import { FaSearch } from 'react-icons/fa';
import { LocalizeText, ProductTypeEnum } from '../../../api';
import { useCatalog } from '../../../hooks';
import { Button } from '../../ui/button';
import { CatalogAddOnBadgeWidgetView } from './page/widgets/CatalogAddOnBadgeWidgetView';
import { CatalogLimitedItemWidgetView } from './page/widgets/CatalogLimitedItemWidgetView';
import { CatalogPurchaseWidgetView } from './page/widgets/CatalogPurchaseWidgetView';
import { CatalogSpinnerWidgetView } from './page/widgets/CatalogSpinnerWidgetView';
import { CatalogViewProductWidgetView } from './page/widgets/CatalogViewProductWidgetView';

export const CatalogInspectorView: FC<{}> = props =>
{
    const { currentOffer = null, setPurchaseOptions = null } = useCatalog();

    if(!currentOffer)
    {
        const t = LocalizeText('catalog.inspector.select_item');
        const label = (t === 'catalog.inspector.select_item') ? 'Select an item' : t;

        return (
            <div className="flex flex-col items-center justify-center flex-1 gap-3 p-4 text-center">
                <div className="w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center">
                    <FaSearch className="w-3.5 h-3.5 text-white/20" />
                </div>
                <span className="text-[11px] text-white/30">{ label }</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1">
            {/* Hero Preview */}
            <div className="relative w-full shrink-0 catalog-inspector-hero bg-black/50 overflow-hidden rounded-t-xl" style={ { height: 200 } }>
                { (currentOffer.product.productType !== ProductTypeEnum.BADGE) ? (
                    <>
                        <CatalogViewProductWidgetView height={ 200 } />
                        <CatalogAddOnBadgeWidgetView className="absolute bottom-2 right-2 bg-black/40 rounded" />
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <CatalogAddOnBadgeWidgetView className="scale-[2]" />
                    </div>
                ) }
                {/* Bottom fade into inspector bg */}
                <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
            </div>

            {/* Info + Purchase */}
            <div className="flex flex-col gap-3 p-3 flex-1">
                {/* Name + Limited */}
                <div className="flex flex-col gap-1">
                    <h3 className="text-[13px] font-semibold text-white/90 leading-tight">
                        { currentOffer.localizationName }
                    </h3>
                    <CatalogLimitedItemWidgetView fullWidth />
                </div>

                {/* Divider */}
                <div className="h-px bg-white/[0.06]" />

                {/* Price — inline, no badge */}
                <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase tracking-widest text-white/30 font-semibold">Preis</span>
                    <div className="flex items-center gap-2 flex-wrap">
                        { (currentOffer.priceInCredits > 0) &&
                            <span className="text-sm font-bold text-amber-300">
                                { currentOffer.priceInCredits } Credits
                            </span> }
                        { (currentOffer.priceInCredits > 0) && (currentOffer.priceInActivityPoints > 0) &&
                            <span className="text-white/30 text-xs">+</span> }
                        { (currentOffer.priceInActivityPoints > 0) &&
                            <span className="text-sm font-bold text-cyan-300">
                                { currentOffer.priceInActivityPoints } Diamonds
                            </span> }
                        { (currentOffer.priceInCredits === 0) && (currentOffer.priceInActivityPoints === 0) &&
                            <span className="text-sm font-bold text-emerald-300">Kostenlos</span> }
                    </div>
                </div>

                {/* Quantity Spinner */}
                <CatalogSpinnerWidgetView />

                {/* Quick-amount buttons */}
                { currentOffer.bundlePurchaseAllowed &&
                    <div className="flex gap-1.5">
                        <Button variant="outline" size="sm" className="flex-1 text-xs"
                            onClick={ () => setPurchaseOptions(prev => ({ ...prev, quantity: 50 })) }>
                            ×50
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 text-xs"
                            onClick={ () => setPurchaseOptions(prev => ({ ...prev, quantity: 100 })) }>
                            ×100
                        </Button>
                    </div> }

                {/* Purchase actions */}
                <CatalogPurchaseWidgetView />
            </div>
        </div>
    );
}
