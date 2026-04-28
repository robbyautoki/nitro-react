import { FC, PropsWithChildren, useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { GetSessionDataManager, LocalizeText, WiredFurniType, WiredSelectionVisualizer } from '../../../api';
import { DraggableWindow } from '../../../common';
import { useWired } from '../../../hooks';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignSurface from '@/align-ui/components/ui/surface';
import { cn } from '@/lib/utils';
import settingsCogUrl from '@/assets/images/toolbar/icons/me-menu/cog.png';
import { WiredFurniSelectorView } from './WiredFurniSelectorView';

const WIRED_TYPE_LABEL: Record<string, string> = {
    trigger: 'Trigger',
    action: 'Effekt',
    condition: 'Bedingung',
};

const WIRED_TYPE_PILL_CLASSES: Record<string, string> = {
    trigger: 'bg-warning-lighter text-warning-base',
    action: 'bg-information-lighter text-information-base',
    condition: 'bg-feature-lighter text-feature-base',
};

export interface WiredBaseViewProps
{
    wiredType: string;
    requiresFurni: number;
    hasSpecialInput: boolean;
    save: () => void;
    validate?: () => boolean;
}

export const WiredBaseView: FC<PropsWithChildren<WiredBaseViewProps>> = props =>
{
    const { wiredType = '', requiresFurni = WiredFurniType.STUFF_SELECTION_OPTION_NONE, save = null, validate = null, children = null, hasSpecialInput = false } = props;
    const [ wiredName, setWiredName ] = useState<string>(null);
    const [ wiredDescription, setWiredDescription ] = useState<string>(null);
    const [ needsSave, setNeedsSave ] = useState<boolean>(false);
    const { trigger = null, setTrigger = null, setIntParams = null, setStringParam = null, setFurniIds = null, setAllowsFurni = null, saveWired = null, furniIds = [] } = useWired();

    const onClose = () => setTrigger(null);
    
    const onSave = () =>
    {
        if(validate && !validate()) return;

        if(save) save();

        setNeedsSave(true);
    }

    useEffect(() =>
    {
        if(!needsSave) return;

        saveWired();

        setNeedsSave(false);
    }, [ needsSave, saveWired ]);

    useEffect(() =>
    {
        if(!trigger) return;

        const spriteId = (trigger.spriteId || -1);
        const furniData = GetSessionDataManager().getFloorItemData(spriteId);

        if(!furniData)
        {
            setWiredName(('NAME: ' + spriteId));
            setWiredDescription(('NAME: ' + spriteId));
        }
        else
        {
            const DESC_OVERRIDES: Record<string, string> = {
                'wf_trg_recv_signal desc': 'Wird ausgelöst, wenn ein Signal an die ausgewählten Möbel gesendet wird.',
                'wf_act_send_signal desc': 'Sendet ein Signal an die ausgewählten Möbel.',
            };
            setWiredName(furniData.name);
            setWiredDescription(DESC_OVERRIDES[furniData.description] || furniData.description);
        }

        if(hasSpecialInput)
        {
            setIntParams(trigger.intData);
            setStringParam(trigger.stringData);
        }
        
        if(requiresFurni > WiredFurniType.STUFF_SELECTION_OPTION_NONE)
        {
            setFurniIds(prevValue =>
            {
                if(prevValue && prevValue.length) WiredSelectionVisualizer.clearSelectionShaderFromFurni(prevValue);

                if(trigger.selectedItems && trigger.selectedItems.length)
                {
                    WiredSelectionVisualizer.applySelectionShaderToFurni(trigger.selectedItems);

                    return trigger.selectedItems;
                }

                return [];
            });
        }

        setAllowsFurni(requiresFurni);
    }, [ trigger, hasSpecialInput, requiresFurni, setIntParams, setStringParam, setFurniIds, setAllowsFurni ]);

    const typeLabel = WIRED_TYPE_LABEL[wiredType] ?? wiredType;
    const pillClasses = WIRED_TYPE_PILL_CLASSES[wiredType] ?? 'bg-bg-weak-50 text-text-sub-600';

    const requiresFurniSelection = requiresFurni > WiredFurniType.STUFF_SELECTION_OPTION_NONE;
    const furniReady = !requiresFurniSelection || furniIds.length > 0;
    const isReady = furniReady;
    const statusText = !furniReady
        ? 'Wähle erst Möbel im Raum aus.'
        : 'Bereit zum Speichern.';

    return (
        <DraggableWindow uniqueKey="nitro-wired">
            <AlignSurface.Panel className="nitro-wired flex w-[380px] max-w-[calc(100vw-32px)] flex-col overflow-hidden">
                <div className="drag-handler flex cursor-grab items-center gap-3 border-b border-stroke-soft-200 px-3.5 py-2.5 active:cursor-grabbing">
                    <div
                        className="size-7 shrink-0"
                        style={ {
                            backgroundImage: `url(${ settingsCogUrl })`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'center',
                            backgroundSize: 'contain',
                            imageRendering: 'pixelated',
                        } }
                        aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                        <div className="text-paragraph-xs uppercase tracking-wider text-text-soft-400">
                            Wired-Einstellungen
                        </div>
                        <div className="truncate text-label-md text-text-strong-950">{ wiredName }</div>
                    </div>
                    { !!typeLabel && (
                        <span className={ cn('shrink-0 rounded-full px-2 py-0.5 text-paragraph-xs font-medium', pillClasses) }>
                            { typeLabel }
                        </span>
                    ) }
                    <AlignButton.Root variant="neutral" mode="ghost" size="xxsmall" className="size-7 p-0" onClick={ onClose }>
                        <AlignButton.Icon as={ X } className="size-4" />
                    </AlignButton.Root>
                </div>

                { wiredDescription && (
                    <p className="bg-bg-weak-50 px-3.5 py-2 text-paragraph-xs leading-5 text-text-sub-600 line-clamp-2">
                        { wiredDescription }
                    </p>
                ) }

                <div className="flex-1 space-y-3 overflow-y-auto p-3.5">
                    { !!children && children }

                    { requiresFurniSelection && (
                        <div className="rounded-xl bg-bg-white-0 p-3 ring-1 ring-inset ring-stroke-soft-200">
                            <WiredFurniSelectorView />
                        </div>
                    ) }
                </div>

                <div className="border-t border-stroke-soft-200 bg-bg-weak-50 px-3.5 py-2.5">
                    <div className="mb-2 flex items-center gap-2 text-paragraph-xs text-text-sub-600">
                        <span className={ cn(
                            'size-1.5 rounded-full',
                            isReady ? 'bg-success-base' : 'bg-warning-base'
                        ) } />
                        { statusText }
                    </div>
                    <div className="grid grid-cols-[1fr_auto] gap-2">
                        <AlignButton.Root variant="primary" mode="filled" size="xsmall" onClick={ onSave }>
                            <AlignButton.Icon as={ Check } className="size-4" />
                            { LocalizeText('wiredfurni.ready') }
                        </AlignButton.Root>
                        <AlignButton.Root variant="neutral" mode="ghost" size="xsmall" onClick={ onClose }>
                            { LocalizeText('cancel') }
                        </AlignButton.Root>
                    </div>
                </div>
            </AlignSurface.Panel>
        </DraggableWindow>
    );
}
