import { FC } from 'react';
import { Check, Sparkles, X } from 'lucide-react';
import { LocalizeText } from '../../../../../api';
import { useRoom } from '../../../../../hooks';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as FancyButton from '@/align-ui/components/ui/fancy-button';
import { FurnitureWidgetActions, FurnitureWidgetSection, FurnitureWidgetText, FurnitureWidgetWindow } from '../FurnitureWidgetLayout';

interface EffectBoxConfirmViewProps
{
    objectId: number;
    onClose: () => void;
}

export const EffectBoxConfirmView: FC<EffectBoxConfirmViewProps> = props =>
{
    const { objectId = -1, onClose = null } = props;
    const { roomSession = null } = useRoom();

    const useProduct = () =>
    {
        roomSession.useMultistateItem(objectId);

        onClose();
    }
    
    return (
        <FurnitureWidgetWindow
            uniqueKey="effect-box-confirm"
            title={ LocalizeText('effectbox.header.title') }
            subtitle={ LocalizeText('effectbox.header.description') }
            icon={ Sparkles }
            onClose={ onClose }
            widthClassName="w-[380px]"
            footer={
                <FurnitureWidgetActions className="grid grid-cols-2">
                    <AlignButton.Root variant="neutral" mode="stroke" size="small" onClick={ onClose }>
                        <AlignButton.Icon as={ X } className="size-4" />
                        { LocalizeText('generic.cancel') }
                    </AlignButton.Root>
                    <FancyButton.Root variant="primary" size="small" onClick={ useProduct }>
                        <FancyButton.Icon as={ Check } />
                        { LocalizeText('generic.ok') }
                    </FancyButton.Root>
                </FurnitureWidgetActions>
            }
        >
            <FurnitureWidgetSection>
                <FurnitureWidgetText>{ LocalizeText('effectbox.header.description') }</FurnitureWidgetText>
            </FurnitureWidgetSection>
        </FurnitureWidgetWindow>
    );
}
