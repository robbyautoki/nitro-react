import { IFurnitureData, RoomObjectCategory } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { Check, Leaf, X } from 'lucide-react';
import { FurniCategory, GetFurnitureDataForRoomObject, LocalizeText } from '../../../../../api';
import { Base } from '../../../../../common';
import { useRoom } from '../../../../../hooks';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as FancyButton from '@/align-ui/components/ui/fancy-button';
import { FurnitureWidgetActions, FurnitureWidgetPreview, FurnitureWidgetSection, FurnitureWidgetText, FurnitureWidgetWindow } from '../FurnitureWidgetLayout';

interface MonsterPlantSeedConfirmViewProps
{
    objectId: number;
    onClose: () => void;
}

const MODE_DEFAULT: number = -1;
const MODE_MONSTERPLANT_SEED: number = 0;

export const MonsterPlantSeedConfirmView: FC<MonsterPlantSeedConfirmViewProps> = props =>
{
    const { objectId = -1, onClose = null } = props;
    const [ furniData, setFurniData ] = useState<IFurnitureData>(null);
    const [ mode, setMode ] = useState(MODE_DEFAULT);
    const { roomSession = null } = useRoom();

    const useProduct = () =>
    {
        roomSession.useMultistateItem(objectId);

        onClose();
    }

    useEffect(() =>
    {
        if(!roomSession || (objectId === -1)) return;

        const furniData = GetFurnitureDataForRoomObject(roomSession.roomId, objectId, RoomObjectCategory.FLOOR);

        if(!furniData) return;

        setFurniData(furniData);

        let mode = MODE_DEFAULT;

        switch(furniData.specialType)
        {
            case FurniCategory.MONSTERPLANT_SEED:
                mode = MODE_MONSTERPLANT_SEED;
                break;
        }

        if(mode === MODE_DEFAULT)
        {
            onClose();

            return;
        }

        setMode(mode);
    }, [ roomSession, objectId, onClose ]);

    if(mode === MODE_DEFAULT) return null;
    
    return (
        <FurnitureWidgetWindow
            uniqueKey="monster-plant-seed-confirm"
            title={ LocalizeText('useproduct.widget.title.plant_seed', [ 'name' ], [ furniData.name ]) }
            subtitle={ LocalizeText('useproduct.widget.info.plant_seed') }
            icon={ Leaf }
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
                        { LocalizeText('widget.monsterplant_seed.button.use') }
                    </FancyButton.Root>
                </FurnitureWidgetActions>
            }
        >
            <FurnitureWidgetSection className="grid grid-cols-[112px_1fr] gap-4">
                <FurnitureWidgetPreview className="size-28">
                    <Base className="product-preview">
                        <Base className="monsterplant-image" />
                    </Base>
                </FurnitureWidgetPreview>
                <div className="flex min-w-0 flex-col justify-center gap-2">
                    <FurnitureWidgetText className="text-text-strong-950">{ LocalizeText('useproduct.widget.text.plant_seed', [ 'productName' ], [ furniData.name ] ) }</FurnitureWidgetText>
                    <FurnitureWidgetText>{ LocalizeText('useproduct.widget.info.plant_seed') }</FurnitureWidgetText>
                </div>
            </FurnitureWidgetSection>
        </FurnitureWidgetWindow>
    );
}
