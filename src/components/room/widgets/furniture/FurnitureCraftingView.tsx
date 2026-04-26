import { RoomObjectCategory } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo, useState } from 'react';
import { Check, FlaskConical } from 'lucide-react';
import { GetRoomEngine, IsOwnerOfFurniture, LocalizeText } from '../../../../api';
import { LayoutLoadingSpinnerView } from '../../../../common';
import { useFurnitureCraftingWidget, useRoom } from '../../../../hooks';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as FancyButton from '@/align-ui/components/ui/fancy-button';
import { cn } from '@/align-ui/utils/cn';
import { FurnitureWidgetPreview, FurnitureWidgetSection, FurnitureWidgetText, FurnitureWidgetWindow } from './FurnitureWidgetLayout';

interface CraftItemTileProps
{
    image?: string;
    label?: string;
    count?: number;
    active?: boolean;
    muted?: boolean;
    onClick?: () => void;
}

const CraftItemTile: FC<CraftItemTileProps> = ({ image, label, count, active, muted, onClick }) =>
{
    const content = (
        <>
            { image && <img className="max-h-12 max-w-12 object-contain" src={ image } alt="" /> }
            { label && <span className="w-full truncate text-center text-subheading-2xs text-text-sub-600">{ label }</span> }
            { (typeof count === 'number') && <AlignBadge.Root color="gray" variant="light" size="small" className="absolute right-1 top-1">{ count }</AlignBadge.Root> }
        </>
    );

    const className = cn(
        'relative flex min-h-20 min-w-0 flex-col items-center justify-center gap-1 rounded-xl border p-2 transition duration-200 ease-out',
        active ? 'border-primary-base bg-primary-alpha-10 shadow-regular-xs' : 'border-stroke-soft-200 bg-bg-white-0',
        muted && 'opacity-45',
        onClick && 'cursor-pointer hover:bg-bg-weak-50',
    );

    if(onClick)
    {
        return (
            <button type="button" className={ className } onClick={ onClick }>
                { content }
            </button>
        );
    }

    return <div className={ className }>{ content }</div>;
};

export const FurnitureCraftingView: FC<{}> = props =>
{
    const { objectId = -1, recipes = [], ingredients = [], selectedRecipe = null, requiredIngredients = null, isCrafting = false, craft = null, selectRecipe = null, onClose = null } = useFurnitureCraftingWidget();
    const { roomSession = null } = useRoom();
    const [ waitingToConfirm, setWaitingToConfirm ] = useState(false);

    const isOwner = useMemo(() =>
    {
        if(!roomSession) return false;

        const roomObject = GetRoomEngine().getRoomObject(roomSession.roomId, objectId, RoomObjectCategory.FLOOR);
        return IsOwnerOfFurniture(roomObject);
    }, [ objectId, roomSession ]);

    const canCraft = useMemo(() =>
    {
        if(!requiredIngredients || !requiredIngredients.length) return false;

        for (const ingredient of requiredIngredients) 
        {
            const ingredientData = ingredients.find(data => (data.name === ingredient.itemName));


            if (!ingredientData || ingredientData.count < ingredient.count) return false;
        }

        return true;
    }, [ ingredients, requiredIngredients ]);

    const tryCraft = () =>
    {
        if (!waitingToConfirm) 
        {
            setWaitingToConfirm(true);

            return;
        }

        craft();
        setWaitingToConfirm(false);
    };

    useEffect(() =>
    {
        setWaitingToConfirm(false);
    }, [ selectedRecipe ]);

    if(objectId === -1) return null;

    return (
        <FurnitureWidgetWindow
            uniqueKey="furniture-crafting"
            title={ LocalizeText('crafting.title') }
            subtitle={ selectedRecipe ? selectedRecipe.localizedName : LocalizeText('crafting.info.start') }
            icon={ FlaskConical }
            onClose={ onClose }
            widthClassName="w-[720px]"
            bodyClassName="grid max-h-[560px] grid-cols-[1fr_1fr] gap-4 !overflow-hidden"
        >
            <div className="flex min-h-0 flex-col gap-4">
                <FurnitureWidgetSection title={ LocalizeText('crafting.title.products') } className="min-h-0 flex-1 overflow-hidden">
                    <div className="grid max-h-52 grid-cols-5 gap-2 overflow-auto pr-1">
                        { recipes.map(item => (
                            <CraftItemTile
                                key={ item.name }
                                image={ item.iconUrl }
                                active={ selectedRecipe && selectedRecipe.name === item.name }
                                onClick={ () => selectRecipe(item) }
                            />
                        )) }
                    </div>
                </FurnitureWidgetSection>
                <FurnitureWidgetSection title={ LocalizeText('crafting.title.mixer') } className="min-h-0 flex-1 overflow-hidden">
                    <div className="grid max-h-52 grid-cols-5 gap-2 overflow-auto pr-1">
                        { ingredients.map(item => (
                            <CraftItemTile key={ item.name } image={ item.iconUrl } count={ item.count } muted={ !item.count } />
                        )) }
                    </div>
                </FurnitureWidgetSection>
            </div>
            <div className="min-h-0">
                { !selectedRecipe &&
                    <FurnitureWidgetSection className="flex h-full items-center justify-center text-center">
                        <FurnitureWidgetText>{ LocalizeText('crafting.info.start') }</FurnitureWidgetText>
                    </FurnitureWidgetSection> }
                { selectedRecipe &&
                    <div className="flex h-full min-h-0 flex-col gap-4">
                        <FurnitureWidgetSection title={ LocalizeText('crafting.current_recipe') } className="min-h-0 flex-1 overflow-hidden">
                            <div className="grid max-h-52 grid-cols-5 gap-2 overflow-auto pr-1">
                                { !!requiredIngredients && requiredIngredients.flatMap(ingredient =>
                                {
                                    const ingredientData = ingredients.find(item => item.name === ingredient.itemName);

                                    return Array.from({ length: ingredient.count }, (_, index) => (
                                        <CraftItemTile
                                            key={ `${ ingredient.itemName }-${ index }` }
                                            image={ ingredientData?.iconUrl }
                                            muted={ !ingredientData || ((ingredientData.count - index) <= 0) }
                                        />
                                    ));
                                }) }
                            </div>
                        </FurnitureWidgetSection>
                        <FurnitureWidgetSection title={ LocalizeText('crafting.result') } className="space-y-3">
                            <FurnitureWidgetPreview className="mx-auto size-28">
                                <img className="max-h-20 max-w-20 object-contain" src={ selectedRecipe.iconUrl } alt="" />
                            </FurnitureWidgetPreview>
                            <div className="truncate text-center text-label-sm text-text-strong-950">{ selectedRecipe.localizedName }</div>
                            <FancyButton.Root variant={ waitingToConfirm ? 'neutral' : 'primary' } size="small" className="w-full" disabled={ !isOwner || !canCraft || isCrafting } onClick={ tryCraft }>
                                { !isCrafting && (canCraft && isOwner) && <FancyButton.Icon as={ Check } /> }
                                { !isCrafting && LocalizeText(!isOwner ? 'crafting.btn.notowner' : !canCraft ? 'crafting.status.recipe.incomplete' : waitingToConfirm ? 'generic.confirm' : 'crafting.btn.craft') }
                                { isCrafting && <LayoutLoadingSpinnerView /> }
                            </FancyButton.Root>
                        </FurnitureWidgetSection>
                    </div> }
            </div>
        </FurnitureWidgetWindow>
    );
}
