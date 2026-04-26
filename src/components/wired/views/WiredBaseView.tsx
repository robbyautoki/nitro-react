import { FC, PropsWithChildren, useEffect, useState } from 'react';
import { Check, CircuitBoard, X } from 'lucide-react';
import { GetSessionDataManager, LocalizeText, WiredFurniType, WiredSelectionVisualizer } from '../../../api';
import { DraggableWindow } from '../../../common';
import { useWired } from '../../../hooks';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignDivider from '@/align-ui/components/ui/divider';
import * as AlignSurface from '@/align-ui/components/ui/surface';
import { WiredFurniSelectorView } from './WiredFurniSelectorView';

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
    const { trigger = null, setTrigger = null, setIntParams = null, setStringParam = null, setFurniIds = null, setAllowsFurni = null, saveWired = null } = useWired();

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

    return (
        <DraggableWindow uniqueKey="nitro-wired">
            <AlignSurface.Panel className="nitro-wired w-[420px] max-w-[calc(100vw-32px)] overflow-hidden">
                <div className="drag-handler flex cursor-grab items-center gap-3 border-b border-stroke-soft-200 px-4 py-3 active:cursor-grabbing">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-10 bg-primary-alpha-10 text-primary-base">
                        <CircuitBoard className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-label-md text-text-strong-950">{ LocalizeText('wiredfurni.title') }</div>
                        <div className="truncate text-paragraph-xs text-text-sub-600">{ wiredName }</div>
                    </div>
                    <AlignButton.Root variant="neutral" mode="ghost" size="xxsmall" className="size-8 p-0" onClick={ onClose }>
                        <AlignButton.Icon as={ X } className="size-4" />
                    </AlignButton.Root>
                </div>

                <div className="space-y-4 bg-bg-weak-50 p-4">
                    <div className="rounded-2xl bg-bg-white-0 p-3 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
                        <div className="flex items-start gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-bg-weak-50 ring-1 ring-inset ring-stroke-soft-200">
                                <i className={ `icon icon-wired-${ wiredType }` } />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-label-sm text-text-strong-950">{ wiredName }</div>
                                <p className="mt-1 text-paragraph-xs leading-5 text-text-sub-600">{ wiredDescription }</p>
                            </div>
                        </div>
                    </div>

                    { !!children &&
                        <div className="wired-align-section rounded-2xl bg-bg-white-0 p-3 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
                            { children }
                        </div> }

                    { (requiresFurni > WiredFurniType.STUFF_SELECTION_OPTION_NONE) &&
                        <div className="rounded-2xl bg-bg-white-0 p-3 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
                            <WiredFurniSelectorView />
                        </div> }

                    <AlignDivider.Root />

                    <div className="grid grid-cols-2 gap-2">
                        <AlignButton.Root variant="primary" mode="filled" size="small" onClick={ onSave }>
                            <AlignButton.Icon as={ Check } className="size-4" />
                            { LocalizeText('wiredfurni.ready') }
                        </AlignButton.Root>
                        <AlignButton.Root variant="neutral" mode="stroke" size="small" onClick={ onClose }>
                            { LocalizeText('cancel') }
                        </AlignButton.Root>
                    </div>
                </div>
            </AlignSurface.Panel>
        </DraggableWindow>
    );
}
