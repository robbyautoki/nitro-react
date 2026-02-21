import { ColorConverter } from '@nitrots/nitro-renderer';
import { FC, useMemo, useState } from 'react';
import { FaFillDrip } from 'react-icons/fa';
import { IPurchasableOffer } from '../../../../../api';
import { cn } from '../../../../../lib/utils';
import { useCatalog } from '../../../../../hooks';
import { Button } from '../../../../ui/button';
import { CatalogGridOfferView } from '../common/CatalogGridOfferView';
import { CatalogLayoutProps } from './CatalogLayout.types';

export interface CatalogLayoutColorGroupViewProps extends CatalogLayoutProps
{

}

export const CatalogLayoutColorGroupingView : FC<CatalogLayoutColorGroupViewProps> = props =>
{
    const { page = null } = props;
    const [ colorableItems, setColorableItems ] = useState<Map<string, number[]>>(new Map<string, number[]>());
    const { currentOffer = null, setCurrentOffer = null } = useCatalog();
    const [ colorsShowing, setColorsShowing ] = useState<boolean>(false);

    const sortByColorIndex = (a: IPurchasableOffer, b: IPurchasableOffer) =>
    {
        if (((!(a.product.furnitureData.colorIndex)) || (!(b.product.furnitureData.colorIndex))))
        {
            return 1;
        }
        if (a.product.furnitureData.colorIndex > b.product.furnitureData.colorIndex)
        {
            return 1;
        }
        if (a == b)
        {
            return 0;
        }
        return -1;
    }

    const sortyByFurnitureClassName = (a: IPurchasableOffer, b: IPurchasableOffer) =>
    {
        if (a.product.furnitureData.className > b.product.furnitureData.className)
        {
            return 1;
        }
        if (a == b)
        {
            return 0;
        }
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
        if (index > -1)
        {
            selectOffer(page.offers[index]);
        }
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

                if(!updatedColorableItems.has(name))
                {
                    updatedColorableItems.set(name, []);
                }

                let selectedColor = 0xFFFFFF;

                if(furniData.colors)
                {
                    for(let color of furniData.colors)
                    {
                        if(color !== 0xFFFFFF) // skip the white colors
                        {
                            selectedColor = color;
                        }
                    }

                    if(updatedColorableItems.get(name).indexOf(selectedColor) === -1)
                    {
                        updatedColorableItems.get(name)[colorIndex] = selectedColor;
                    }

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
        <div className="flex flex-col h-full gap-2">
            { currentOffer && currentOffer.product.furnitureData.hasIndexedColor &&
                <div className="shrink-0">
                    <Button variant="outline" size="sm" onClick={ event => setColorsShowing(prev => !prev) }>
                        <FaFillDrip className="text-xs" />
                    </Button>
                </div> }
            <div className="flex-1 min-h-0 overflow-auto">
                <div className="grid grid-cols-[repeat(auto-fill,68px)] gap-1">
                    { (!colorsShowing || !currentOffer || !colorableItems.has(currentOffer.product.furnitureData.className)) &&
                        offers.map((offer, index) => <CatalogGridOfferView key={ index } itemActive={ (currentOffer && (currentOffer.product.furnitureData.hasIndexedColor ? currentOffer.product.furnitureData.className === offer.product.furnitureData.className : currentOffer.offerId === offer.offerId)) } offer={ offer } selectOffer={ selectOffer }/>) }
                    { (colorsShowing && currentOffer && colorableItems.has(currentOffer.product.furnitureData.className)) &&
                        colorableItems.get(currentOffer.product.furnitureData.className).map((color, index) =>
                        {
                            const isActive = currentOffer.product.furnitureData.colorIndex === index;

                            return (
                                <div
                                    key={ index }
                                    className={ cn(
                                        'aspect-square rounded-lg border-2 cursor-pointer transition-all',
                                        isActive ? 'border-indigo-400/80 ring-1 ring-indigo-400/40 scale-105' : 'border-white/[0.12] hover:border-white/[0.25]'
                                    ) }
                                    style={ { backgroundColor: ColorConverter.int2rgb(color) } }
                                    onClick={ event => selectColor(index, currentOffer.product.furnitureData.className) }
                                />
                            );
                        }) }
                </div>
            </div>
        </div>
    );
}
