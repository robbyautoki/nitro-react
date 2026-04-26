import { FC } from 'react';
import { Gift, PackageOpen, ShoppingBag } from 'lucide-react';
import { attemptItemPlacement, CreateLinkEvent, LocalizeText } from '../../../../api';
import { LayoutGiftTagView, LayoutImage } from '../../../../common';
import { useFurniturePresentWidget, useInventoryFurni } from '../../../../hooks';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as FancyButton from '@/align-ui/components/ui/fancy-button';
import { FurnitureWidgetActions, FurnitureWidgetPreview, FurnitureWidgetSection, FurnitureWidgetText, FurnitureWidgetWindow } from './FurnitureWidgetLayout';

export const FurnitureGiftOpeningView: FC<{}> = props =>
{
    const { objectId = -1, classId = -1, itemType = null, text = null, isOwnerOfFurniture = false, senderName = null, senderFigure = null, placedItemId = -1, placedItemType = null, placedInRoom = false, imageUrl = null, openPresent = null, onClose = null } = useFurniturePresentWidget();
    const { groupItems = [] } = useInventoryFurni();

    if(objectId === -1) return null;

    const place = (itemId: number) =>
    {
        const groupItem = groupItems.find(group => (group.getItemById(itemId)?.id === itemId));

        if(groupItem) attemptItemPlacement(groupItem);

        onClose();
    }

    return (
        <FurnitureWidgetWindow
            uniqueKey="furniture-gift-opening"
            title={ LocalizeText(senderName ? 'widget.furni.present.window.title_from' : 'widget.furni.present.window.title', [ 'name' ], [ senderName ]) }
            subtitle={ placedItemId === -1 ? LocalizeText('widget.furni.present.open_gift') : LocalizeText('widget.furni.present.message_opened') }
            icon={ Gift }
            onClose={ onClose }
            widthClassName="w-[440px]"
            footer={
                <>
                    { (placedItemId === -1) && isOwnerOfFurniture &&
                        <FurnitureWidgetActions className={ senderName ? 'grid grid-cols-2' : '' }>
                            { senderName &&
                                <AlignButton.Root variant="neutral" mode="stroke" size="small" onClick={ event => CreateLinkEvent('catalog/open') }>
                                    <AlignButton.Icon as={ ShoppingBag } className="size-4" />
                                    { LocalizeText('widget.furni.present.give_gift', [ 'name' ], [ senderName ]) }
                                </AlignButton.Root> }
                            <FancyButton.Root variant="primary" size="small" className={ senderName ? '' : 'w-full' } onClick={ openPresent }>
                                <FancyButton.Icon as={ PackageOpen } />
                                { LocalizeText('widget.furni.present.open_gift') }
                            </FancyButton.Root>
                        </FurnitureWidgetActions> }
                    { (placedItemId > -1) &&
                        <div className="space-y-2">
                            <FurnitureWidgetActions className="grid grid-cols-2">
                                { placedInRoom &&
                                    <AlignButton.Root variant="neutral" mode="stroke" size="small" disabled>
                                        { LocalizeText('widget.furni.present.put_in_inventory') }
                                    </AlignButton.Root> }
                                <FancyButton.Root variant="primary" size="small" className={ placedInRoom ? '' : 'col-span-2' } onClick={ event => place(placedItemId) }>
                                    { LocalizeText(placedInRoom ? 'widget.furni.present.keep_in_room' : 'widget.furni.present.place_in_room') }
                                </FancyButton.Root>
                            </FurnitureWidgetActions>
                            { (senderName && senderName.length) &&
                                <AlignButton.Root variant="neutral" mode="stroke" size="small" className="w-full" onClick={ event => CreateLinkEvent('catalog/open') }>
                                    <AlignButton.Icon as={ ShoppingBag } className="size-4" />
                                    { LocalizeText('widget.furni.present.give_gift', [ 'name' ], [ senderName ]) }
                                </AlignButton.Root> }
                        </div> }
                </>
            }
        >
            { (placedItemId === -1) &&
                <FurnitureWidgetSection>
                    <div className="flex justify-center overflow-auto">
                        <LayoutGiftTagView userName={ senderName } figure={ senderFigure } message={ text } />
                    </div>
                </FurnitureWidgetSection> }
            { (placedItemId > -1) &&
                <FurnitureWidgetSection className="grid grid-cols-[120px_1fr] gap-4">
                    <FurnitureWidgetPreview className="min-h-[120px]">
                        <LayoutImage imageUrl={ imageUrl } />
                    </FurnitureWidgetPreview>
                    <div className="flex min-w-0 flex-col justify-center gap-2">
                        <FurnitureWidgetText>{ LocalizeText('widget.furni.present.message_opened') }</FurnitureWidgetText>
                        <div className="break-words text-label-md text-text-strong-950">{ text }</div>
                    </div>
                </FurnitureWidgetSection> }
        </FurnitureWidgetWindow>
    );
}
