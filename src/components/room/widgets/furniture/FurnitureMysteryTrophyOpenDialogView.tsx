import { OpenMysteryTrophyMessageComposer } from '@nitrots/nitro-renderer';
import { FC, useState } from 'react';
import { Check, PencilLine, Trophy, X } from 'lucide-react';
import { LocalizeText, SendMessageComposer } from '../../../../api';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignTextarea from '@/align-ui/components/ui/textarea';
import * as FancyButton from '@/align-ui/components/ui/fancy-button';
import { FurnitureWidgetActions, FurnitureWidgetPreview, FurnitureWidgetSection, FurnitureWidgetText, FurnitureWidgetWindow } from './FurnitureWidgetLayout';

interface FurnitureMysteryTrophyOpenDialogViewProps
{
    objectId: number;
    onClose: () => void;
}

export const FurnitureMysteryTrophyOpenDialogView: FC<FurnitureMysteryTrophyOpenDialogViewProps> = props =>
{
    const { objectId = -1, onClose = null } = props;
    const [ description, setDescription ] = useState<string>('');

    const onConfirm = () =>
    {
        SendMessageComposer(new OpenMysteryTrophyMessageComposer(objectId, description));
        onClose();
    }
    
    if(objectId === -1) return null;

    return (
        <FurnitureWidgetWindow
            uniqueKey="furniture-mystery-trophy"
            title={ LocalizeText('mysterytrophy.header.title') }
            subtitle={ LocalizeText('mysterytrophy.header.description') }
            icon={ Trophy }
            onClose={ onClose }
            widthClassName="w-[440px]"
            footer={
                <FurnitureWidgetActions className="grid grid-cols-2">
                    <AlignButton.Root variant="neutral" mode="stroke" size="small" onClick={ onClose }>
                        <AlignButton.Icon as={ X } className="size-4" />
                        { LocalizeText('cancel') }
                    </AlignButton.Root>
                    <FancyButton.Root variant="primary" size="small" onClick={ onConfirm }>
                        <FancyButton.Icon as={ Check } />
                        { LocalizeText('generic.ok') }
                    </FancyButton.Root>
                </FurnitureWidgetActions>
            }
        >
            <FurnitureWidgetSection className="grid grid-cols-[96px_1fr] gap-4">
                <FurnitureWidgetPreview className="size-24">
                    <div className="mysterytrophy-image shrink-0" />
                </FurnitureWidgetPreview>
                <div className="flex min-w-0 flex-col justify-center gap-2">
                    <div className="text-label-sm text-text-strong-950">{ LocalizeText('mysterytrophy.header.title') }</div>
                    <FurnitureWidgetText>{ LocalizeText('mysterytrophy.header.description') }</FurnitureWidgetText>
                </div>
            </FurnitureWidgetSection>
            <FurnitureWidgetSection title={ LocalizeText('mysterytrophy.header.description') }>
                <div className="relative">
                    <AlignTextarea.Root simple value={ description } onChange={ event => setDescription(event.target.value) } className="min-h-[96px] pr-10" />
                    <PencilLine className="pointer-events-none absolute right-3 top-3 size-4 text-text-soft-400" />
                </div>
            </FurnitureWidgetSection>
        </FurnitureWidgetWindow>
    );
}
