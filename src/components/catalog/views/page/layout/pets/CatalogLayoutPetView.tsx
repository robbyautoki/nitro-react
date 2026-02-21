import { ApproveNameMessageComposer, ApproveNameMessageEvent, ColorConverter, GetSellablePetPalettesComposer, PurchaseFromCatalogComposer, SellablePetPaletteData } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { FaFillDrip } from 'react-icons/fa';
import { DispatchUiEvent, GetPetAvailableColors, GetPetIndexFromLocalization, LocalizeText, SendMessageComposer } from '../../../../../../api';
import { LayoutPetImageView } from '../../../../../../common';
import { CatalogPurchaseFailureEvent } from '../../../../../../events';
import { useCatalog, useMessageEvent } from '../../../../../../hooks';
import { Input } from '../../../../../ui/input';
import { CatalogAddOnBadgeWidgetView } from '../../widgets/CatalogAddOnBadgeWidgetView';
import { CatalogPurchaseWidgetView } from '../../widgets/CatalogPurchaseWidgetView';
import { CatalogTotalPriceWidget } from '../../widgets/CatalogTotalPriceWidget';
import { CatalogViewProductWidgetView } from '../../widgets/CatalogViewProductWidgetView';
import { CatalogLayoutProps } from '../CatalogLayout.types';

export const CatalogLayoutPetView: FC<CatalogLayoutProps> = props =>
{
    const { page = null } = props;
    const [ petIndex, setPetIndex ] = useState(-1);
    const [ sellablePalettes, setSellablePalettes ] = useState<SellablePetPaletteData[]>([]);
    const [ selectedPaletteIndex, setSelectedPaletteIndex ] = useState(-1);
    const [ sellableColors, setSellableColors ] = useState<number[][]>([]);
    const [ selectedColorIndex, setSelectedColorIndex ] = useState(-1);
    const [ colorsShowing, setColorsShowing ] = useState(false);
    const [ petName, setPetName ] = useState('');
    const [ approvalPending, setApprovalPending ] = useState(true);
    const [ approvalResult, setApprovalResult ] = useState(-1);
    const { currentOffer = null, setCurrentOffer = null, setPurchaseOptions = null, catalogOptions = null, roomPreviewer = null } = useCatalog();
    const { petPalettes = null } = catalogOptions;

    const getColor = useMemo(() =>
    {
        if(!sellableColors.length || (selectedColorIndex === -1)) return 0xFFFFFF;

        return sellableColors[selectedColorIndex][0];
    }, [ sellableColors, selectedColorIndex ]);

    const petBreedName = useMemo(() =>
    {
        if((petIndex === -1) || !sellablePalettes.length || (selectedPaletteIndex === -1)) return '';

        return LocalizeText(`pet.breed.${ petIndex }.${ sellablePalettes[selectedPaletteIndex].breedId }`);
    }, [ petIndex, sellablePalettes, selectedPaletteIndex ]);

    const petPurchaseString = useMemo(() =>
    {
        if(!sellablePalettes.length || (selectedPaletteIndex === -1)) return '';

        const paletteId = sellablePalettes[selectedPaletteIndex].paletteId;

        let color = 0xFFFFFF;

        if(petIndex <= 7)
        {
            if(selectedColorIndex === -1) return '';

            color = sellableColors[selectedColorIndex][0];
        }

        let colorString = color.toString(16).toUpperCase();

        while(colorString.length < 6) colorString = ('0' + colorString);

        return `${ paletteId }\n${ colorString }`;
    }, [ sellablePalettes, selectedPaletteIndex, petIndex, sellableColors, selectedColorIndex ]);

    const validationErrorMessage = useMemo(() =>
    {
        let key: string = '';

        switch(approvalResult)
        {
            case 1:
                key = 'catalog.alert.petname.long';
                break;
            case 2:
                key = 'catalog.alert.petname.short';
                break;
            case 3:
                key = 'catalog.alert.petname.chars';
                break;
            case 4:
                key = 'catalog.alert.petname.bobba';
                break;
        }

        if(!key || !key.length) return '';

        return LocalizeText(key);
    }, [ approvalResult ]);

    const purchasePet = useCallback(() =>
    {
        if(approvalResult === -1)
        {
            SendMessageComposer(new ApproveNameMessageComposer(petName, 1));

            return;
        }

        if(approvalResult === 0)
        {
            SendMessageComposer(new PurchaseFromCatalogComposer(page.pageId, currentOffer.offerId, `${ petName }\n${ petPurchaseString }`, 1));

            return;
        }
    }, [ page, currentOffer, petName, petPurchaseString, approvalResult ]);

    useMessageEvent<ApproveNameMessageEvent>(ApproveNameMessageEvent, event =>
    {
        const parser = event.getParser();

        setApprovalResult(parser.result);

        if(parser.result === 0) purchasePet();
        else DispatchUiEvent(new CatalogPurchaseFailureEvent(-1));
    });

    useEffect(() =>
    {
        if(!page || !page.offers.length) return;

        const offer = page.offers[0];

        setCurrentOffer(offer);
        setPetIndex(GetPetIndexFromLocalization(offer.localizationId));
        setColorsShowing(false);
    }, [ page, setCurrentOffer ]);

    useEffect(() =>
    {
        if(!currentOffer) return;

        const productData = currentOffer.product.productData;

        if(!productData) return;

        if(petPalettes)
        {
            for(const paletteData of petPalettes)
            {
                if(paletteData.breed !== productData.type) continue;

                const palettes: SellablePetPaletteData[] = [];

                for(const palette of paletteData.palettes)
                {
                    if(!palette.sellable) continue;

                    palettes.push(palette);
                }

                setSelectedPaletteIndex((palettes.length ? 0 : -1));
                setSellablePalettes(palettes);

                return;
            }
        }

        setSelectedPaletteIndex(-1);
        setSellablePalettes([]);

        SendMessageComposer(new GetSellablePetPalettesComposer(productData.type));
    }, [ currentOffer, petPalettes ]);

    useEffect(() =>
    {
        if(petIndex === -1) return;

        const colors = GetPetAvailableColors(petIndex, sellablePalettes);

        setSelectedColorIndex((colors.length ? 0 : -1));
        setSellableColors(colors);
    }, [ petIndex, sellablePalettes ]);

    useEffect(() =>
    {
        if(!roomPreviewer) return;

        roomPreviewer.reset(false);

        if((petIndex === -1) || !sellablePalettes.length || (selectedPaletteIndex === -1)) return;

        let petFigureString = `${ petIndex } ${ sellablePalettes[selectedPaletteIndex].paletteId }`;

        if(petIndex <= 7) petFigureString += ` ${ getColor.toString(16) }`;

        roomPreviewer.addPetIntoRoom(petFigureString);
    }, [ roomPreviewer, petIndex, sellablePalettes, selectedPaletteIndex, getColor ]);

    useEffect(() =>
    {
        setApprovalResult(-1);
    }, [ petName ]);

    if(!currentOffer) return (
        <div className="flex flex-col h-full gap-2">
            { !!page.localization.getImage(1) && <img alt="" src={ page.localization.getImage(1) } /> }
            <div className="catalog-page-text">
                { /* Server localization text (trusted content from game server) */ }
                <div className="text-center" dangerouslySetInnerHTML={ { __html: page.localization.getText(0) } } />
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full gap-2">
            <div className="grid grid-cols-[repeat(auto-fill,68px)] gap-1 flex-1 min-h-0 overflow-y-auto p-1">
                { !colorsShowing && (sellablePalettes.length > 0) && sellablePalettes.map((palette, index) =>
                {
                    return (
                        <div key={ index } className={ `flex items-center justify-center p-1 rounded-lg border cursor-pointer transition-colors ${ selectedPaletteIndex === index ? 'border-indigo-400/80 bg-indigo-500/10 shadow-sm' : 'border-white/[0.07] bg-white/[0.04] hover:border-white/[0.15]' }` } onClick={ event => setSelectedPaletteIndex(index) }>
                            <LayoutPetImageView typeId={ petIndex } paletteId={ palette.paletteId } direction={ 2 } headOnly={ true } />
                        </div>
                    );
                }) }
                { colorsShowing && (sellableColors.length > 0) && sellableColors.map((colorSet, index) => <div key={ index } className={ `w-full aspect-square rounded-lg border-2 cursor-pointer transition-all ${ selectedColorIndex === index ? 'border-primary shadow-sm scale-105' : 'border-border hover:border-border' }` } style={ { backgroundColor: ColorConverter.int2rgb(colorSet[0]) } } onClick={ event => setSelectedColorIndex(index) } />) }
            </div>
            <div className="flex flex-col gap-2 p-2.5 bg-white/[0.05] rounded-lg border border-white/[0.07] shrink-0">
                <div className="relative overflow-hidden">
                    <CatalogViewProductWidgetView />
                    <CatalogAddOnBadgeWidgetView position="absolute" className="bg-white/[0.05] rounded bottom-1 right-1" />
                    { ((petIndex > -1) && (petIndex <= 7)) &&
                        <button className="appearance-none border-0 absolute bottom-1 left-1 p-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors" onClick={ event => setColorsShowing(!colorsShowing) }>
                            <FaFillDrip className="text-xs" />
                        </button> }
                </div>
                <div className="flex flex-col flex-1 gap-1">
                    <span className="truncate">{ petBreedName }</span>
                    <div className="flex flex-col flex-1 gap-1">
                        <Input type="text" className="h-8 w-full text-xs" placeholder={ LocalizeText('widgets.petpackage.name.title') } value={ petName } onChange={ event => setPetName(event.target.value) } />
                        { (approvalResult > 0) &&
                            <div className="text-xs text-red-400">{ validationErrorMessage }</div> }
                    </div>
                    <div className="flex justify-end">
                        <CatalogTotalPriceWidget justifyContent="end" alignItems="end" />
                    </div>
                    <CatalogPurchaseWidgetView purchaseCallback={ purchasePet } />
                </div>
            </div>
        </div>
    );
}
