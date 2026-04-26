import { RedeemItemClothingComposer, RoomObjectCategory, UserFigureComposer } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { Check, Shirt, X } from 'lucide-react';
import { FigureData, FurniCategory, GetAvatarRenderManager, GetConnection, GetFurnitureDataForRoomObject, GetSessionDataManager, LocalizeText } from '../../../../../api';
import { Base, LayoutAvatarImageView } from '../../../../../common';
import { useRoom } from '../../../../../hooks';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as FancyButton from '@/align-ui/components/ui/fancy-button';
import { FurnitureWidgetActions, FurnitureWidgetPreview, FurnitureWidgetSection, FurnitureWidgetText, FurnitureWidgetWindow } from '../FurnitureWidgetLayout';

interface PurchasableClothingConfirmViewProps
{
    objectId: number;
    onClose: () => void;
}

const MODE_DEFAULT: number = -1;
const MODE_PURCHASABLE_CLOTHING: number = 0;

export const PurchasableClothingConfirmView: FC<PurchasableClothingConfirmViewProps> = props =>
{
    const { objectId = -1, onClose = null } = props;
    const [ mode, setMode ] = useState(MODE_DEFAULT);
    const [ gender, setGender ] = useState<string>(FigureData.MALE);
    const [ newFigure, setNewFigure ] = useState<string>(null);
    const { roomSession = null } = useRoom();

    const useProduct = () =>
    {
        GetConnection().send(new RedeemItemClothingComposer(objectId));
        GetConnection().send(new UserFigureComposer(gender, newFigure));

        onClose();
    }

    useEffect(() =>
    {
        let mode = MODE_DEFAULT;

        const figure = GetSessionDataManager().figure;
        const gender = GetSessionDataManager().gender;
        const validSets: number[] = [];

        if(roomSession && (objectId >= 0))
        {
            const furniData = GetFurnitureDataForRoomObject(roomSession.roomId, objectId, RoomObjectCategory.FLOOR);

            if(furniData)
            {
                switch(furniData.specialType)
                {
                    case FurniCategory.FIGURE_PURCHASABLE_SET:
                        mode = MODE_PURCHASABLE_CLOTHING;

                        const setIds = furniData.customParams.split(',').map(part => parseInt(part));

                        for(const setId of setIds)
                        {
                            if(GetAvatarRenderManager().isValidFigureSetForGender(setId, gender)) validSets.push(setId);
                        }

                        break;
                }
            }
        }

        if(mode === MODE_DEFAULT)
        {
            onClose();

            return;
        }
        
        setGender(gender);
        setNewFigure(GetAvatarRenderManager().getFigureStringWithFigureIds(figure, gender, validSets));

        // if owns clothing, change to it

        setMode(mode);
    }, [ roomSession, objectId, onClose ]);

    if(mode === MODE_DEFAULT) return null;
    
    return (
        <FurnitureWidgetWindow
            uniqueKey="clothing-confirm"
            title={ LocalizeText('useproduct.widget.title.bind_clothing') }
            subtitle={ LocalizeText('useproduct.widget.info.bind_clothing') }
            icon={ Shirt }
            onClose={ onClose }
            widthClassName="w-[440px]"
            footer={
                <FurnitureWidgetActions className="grid grid-cols-2">
                    <AlignButton.Root variant="neutral" mode="stroke" size="small" onClick={ onClose }>
                        <AlignButton.Icon as={ X } className="size-4" />
                        { LocalizeText('useproduct.widget.cancel') }
                    </AlignButton.Root>
                    <FancyButton.Root variant="primary" size="small" onClick={ useProduct }>
                        <FancyButton.Icon as={ Check } />
                        { LocalizeText('useproduct.widget.bind_clothing') }
                    </FancyButton.Root>
                </FurnitureWidgetActions>
            }
        >
            <FurnitureWidgetSection className="grid grid-cols-[120px_1fr] gap-4">
                <FurnitureWidgetPreview className="min-h-[140px]">
                    <Base className="mannequin-preview !bg-transparent">
                        <LayoutAvatarImageView figure={ newFigure } direction={ 2 } />
                    </Base>
                </FurnitureWidgetPreview>
                <div className="flex min-w-0 flex-col justify-center gap-2">
                    <FurnitureWidgetText className="text-text-strong-950">{ LocalizeText('useproduct.widget.text.bind_clothing') }</FurnitureWidgetText>
                    <FurnitureWidgetText>{ LocalizeText('useproduct.widget.info.bind_clothing') }</FurnitureWidgetText>
                </div>
            </FurnitureWidgetSection>
        </FurnitureWidgetWindow>
    );
}
