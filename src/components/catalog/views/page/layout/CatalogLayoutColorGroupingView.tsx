import { ColorConverter } from '@nitrots/nitro-renderer';
import { FC, useMemo, useState } from 'react';
import { Palette } from 'lucide-react';
import { IPurchasableOffer } from '../../../../../api';
import { cn } from '../../../../../lib/utils';
import { useCatalog } from '../../../../../hooks';
import * as AlignButton from '@/align-ui/components/ui/button';
import { CatalogPageHeaderBanner } from '../../shared/CatalogPageHeaderBanner';
import { CatalogGridOfferView } from '../common/CatalogGridOfferView';
import { CATALOG_GRID_CLASSES } from '../common/CatalogGridStyles';
import { CatalogLayoutProps } from './CatalogLayout.types';

export const CatalogLayoutColorGroupingView: FC<CatalogLayoutProps> = props =>
{
    const { page = null } = props;
    const [ colorableItems, setColorableItems ] = useState<Map<string, number[]>>(new Map<string, number[]>());
    const { currentOffer = null, setCurrentOffer = null } = useCatalog();
    const [ colorsShowing, setColorsShowing ] = useState<boolean>(false);

    const sortByColorIndex = (a: IPurchasableOffer, b: IPurchasableOffer) =>
    {
        if((!a.product.furnitureData.colorIndex) || (!b.product.furnitureData.colorIndex)) return 1;
        if(a.product.furnitureData.colorIndex > b.product.furnitureData.colorIndex) return 1;
        if(a == b) return 0;
        return -1;
    }

    const sortyByFurnitureClassName = (a: IPurchasableOffer, b: IPurchasableOffer) =>
    {
        if(a.product.furnitureData.className > b.product.furnitureData.className) return 1;
        if(a == b) return 0;
        return -1;
    }

    const selectOffer = (offer: IPurchasableOffer) =>
    {
        offer.activate();
        setCurrentOffer(offer);
    }

    const selectColor = (colorIndex: number, productName: string) =>
    {
        const fullName = `${ productName }*${ colorIndex }`;
        const index = page.offers.findIndex(offer => offer.product.furnitureData.fullName === fullName);
        if(index > -1) selectOffer(page.offers[index]);
    }

    const offers = useMemo(() =>
    {
        const offers: IPurchasableOffer[] = [];
        const addedColorableItems = new Map<string, boolean>();
        const updatedColorableItems = new Map<string, number[]>();

        page.offers.sort(sortByColorIndex);

        page.offers.forEach(offer =>
        {
            if(!offer.product) return;
            const furniData = offer.product.furnitureData;

            if(!furniData || !furniData.hasIndexedColor)
            {
                offers.push(offer);
            }
            else
            {
                const name = furniData.className;
                const colorIndex = furniData.colorIndex;

                if(!updatedColorableItems.has(name)) updatedColorableItems.set(name, []);

                let selectedColor = 0xFFFFFF;
                if(furniData.colors)
                {
                    for(let color of furniData.colors)
                    {
                        if(color !== 0xFFFFFF) selectedColor = color;
                    }
                    if(updatedColorableItems.get(name).indexOf(selectedColor) === -1)
                        updatedColorableItems.get(name)[colorIndex] = selectedColor;
                }

                if(!addedColorableItems.has(name))
                {
                    offers.push(offer);
                    addedColorableItems.set(name, true);
                }
            }
        });
        offers.sort(sortyByFurnitureClassName);
        setColorableItems(updatedColorableItems);
        return offers;
    }, [ page.offers ]);

    return (
        <div className="flex flex-col h-full overflow-y-auto" style={ { scrollbarWidth: 'thin' } }>
            <CatalogPageHeaderBanner />
            { currentOffer && currentOffer.product.furnitureData.hasIndexedColor && (
                <div className="shrink-0 border-b border-stroke-soft-200 bg-bg-weak-50 px-4 py-2 flex items-center gap-2">
                    <AlignButton.Root variant="neutral" mode="stroke" size="xxsmall" className="gap-1.5 text-label-xs" onClick={ () => setColorsShowing(prev => !prev) }>
                        <Palette className="w-3 h-3" /> { colorsShowing ? 'Möbel anzeigen' : 'Farben anzeigen' }
                    </AlignButton.Root>
                    { colorsShowing && colorableItems.has(currentOffer.product.furnitureData.className) && (
                        <div className="flex gap-1 ml-auto">
                            { colorableItems.get(currentOffer.product.furnitureData.className).map((color, i) => (
                                <div key={ i } className="w-4 h-4 rounded-full cursor-pointer ring-1 ring-stroke-soft-200 hover:ring-2 hover:ring-primary-base transition-all"
                                    style={ { backgroundColor: ColorConverter.int2rgb(color) } }
                                    onClick={ () => selectColor(i, currentOffer.product.furnitureData.className) }
                                />
                            )) }
                        </div>
                    ) }
                </div>
            ) }
            <div className="flex-1 p-2 min-h-0 overflow-auto">
                <div className={ CATALOG_GRID_CLASSES }>
                    { (!colorsShowing || !currentOffer || !colorableItems.has(currentOffer.product.furnitureData.className)) &&
                        offers.map((offer, index) => <CatalogGridOfferView key={ index } itemActive={ (currentOffer && (currentOffer.product.furnitureData.hasIndexedColor ? currentOffer.product.furnitureData.className === offer.product.furnitureData.className : currentOffer.offerId === offer.offerId)) } offer={ offer } selectOffer={ selectOffer } />) }
                    { (colorsShowing && currentOffer && colorableItems.has(currentOffer.product.furnitureData.className)) &&
                        colorableItems.get(currentOffer.product.furnitureData.className).map((color, index) => (
                            <div
                                key={ index }
                                className={ cn(
                                    'aspect-square cursor-pointer rounded-12 ring-2 transition-all',
                                    currentOffer.product.furnitureData.colorIndex === index ? 'scale-105 ring-primary-base' : 'ring-stroke-soft-200 hover:ring-primary-base'
                                ) }
                                style={ { backgroundColor: ColorConverter.int2rgb(color) } }
                                onClick={ () => selectColor(index, currentOffer.product.furnitureData.className) }
                            />
                        )) }
                </div>
            </div>
        </div>
    );
}
