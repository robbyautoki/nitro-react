import { WiredActionDefinition } from '@nitrots/nitro-renderer';
import { FC, PropsWithChildren, useEffect } from 'react';
import { Timer } from 'lucide-react';
import { GetWiredTimeLocale, LocalizeText, WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import * as AlignDivider from '@/align-ui/components/ui/divider';
import * as AlignSlider from '@/align-ui/components/ui/slider';
import { WiredBaseView } from '../WiredBaseView';

export interface WiredActionBaseViewProps
{
    hasSpecialInput: boolean;
    requiresFurni: number;
    save: () => void;
}

export const WiredActionBaseView: FC<PropsWithChildren<WiredActionBaseViewProps>> = props =>
{
    const { requiresFurni = WiredFurniType.STUFF_SELECTION_OPTION_NONE, save = null, hasSpecialInput = false, children = null } = props;
    const { trigger = null, actionDelay = 0, setActionDelay = null } = useWired();

    useEffect(() =>
    {
        setActionDelay((trigger as WiredActionDefinition).delayInPulses);
    }, [ trigger, setActionDelay ]);

    return (
        <WiredBaseView wiredType="action" requiresFurni={ requiresFurni } save={ save } hasSpecialInput={ hasSpecialInput }>
            <div className="space-y-4">
                { children }
                { !!children && <AlignDivider.Root /> }
                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <span className="inline-flex min-w-0 items-center gap-2 text-label-sm text-text-strong-950">
                            <Timer className="size-4 shrink-0 text-text-sub-600" />
                            { LocalizeText('wiredfurni.params.delay', [ 'seconds' ], [ GetWiredTimeLocale(actionDelay) ]) }
                        </span>
                        <span className="rounded-md bg-bg-weak-50 px-2 py-1 text-paragraph-xs tabular-nums text-text-sub-600 ring-1 ring-inset ring-stroke-soft-200">
                            { GetWiredTimeLocale(actionDelay) }
                        </span>
                    </div>
                    <AlignSlider.Root
                        min={ 0 }
                        max={ 20 }
                        step={ 1 }
                        value={ [ actionDelay ] }
                        onValueChange={ value => setActionDelay(value[0] ?? 0) }
                    >
                        <AlignSlider.Thumb />
                    </AlignSlider.Root>
                </div>
            </div>
        </WiredBaseView>
    );
}
