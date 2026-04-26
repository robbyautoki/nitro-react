import { FC } from 'react';
import { GetRendererVersion, GetUIVersion, LocalizeText, NotificationAlertItem } from '../../../../api';
import { DraggableWindow, DraggableWindowPosition } from '../../../../common/draggable-window';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignCompactButton from '@/align-ui/components/ui/compact-button';
import { RiBugLine, RiCloseLine, RiDiscordLine, RiGitBranchLine, RiInformation2Fill } from '@remixicon/react';

interface NitroSystemAlertViewProps
{
    item: NotificationAlertItem;
    onClose: () => void;
}

const safeLocalize = (key: string, fallback: string): string =>
{
    const value = LocalizeText(key);
    return (!value || value === key) ? fallback : value;
};

export const NitroSystemAlertView: FC<NitroSystemAlertViewProps> = props =>
{
    const { onClose = null } = props;

    const eyebrow = safeLocalize('notifications.nitro.eyebrow', 'Nitro · System');

    return (
        <DraggableWindow handleSelector=".drag-handler" windowPosition={ DraggableWindowPosition.CENTER }>
            <div className="w-[440px]">
                <div className="overflow-hidden rounded-20 bg-bg-white-0 shadow-regular-md">
                    <div className="drag-handler relative flex cursor-move select-none flex-col gap-1.5 px-5 pb-4 pt-5 pr-14 before:absolute before:inset-x-0 before:bottom-0 before:border-b before:border-stroke-soft-200">
                        <div className="flex items-center gap-1.5 text-subheading-2xs uppercase tracking-wider text-information-base">
                            <RiInformation2Fill className="size-3.5 shrink-0" />
                            <span>{ eyebrow }</span>
                        </div>
                        <div className="text-title-h6 font-medium leading-snug text-text-strong-950">Nitro React Client</div>
                        <AlignCompactButton.Root
                            variant="ghost"
                            size="large"
                            className="absolute right-4 top-4"
                            onClick={ onClose }
                            onMouseDown={ (e) => e.stopPropagation() }
                        >
                            <AlignCompactButton.Icon as={ RiCloseLine } />
                        </AlignCompactButton.Root>
                    </div>
                    <div className="px-5 py-5">
                        <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-4">
                            <div className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-bg-weak-50 ring-1 ring-inset ring-stroke-soft-200">
                                <span className="text-[2rem] font-black leading-none text-primary-base">N</span>
                            </div>
                            <div className="flex min-w-0 flex-col gap-1.5 pt-1">
                                <div className="text-paragraph-xs uppercase tracking-wider text-text-soft-400">Version</div>
                                <div className="flex flex-col gap-0.5 text-paragraph-sm text-text-sub-600">
                                    <div><span className="text-text-strong-950">Client</span> · v{ GetUIVersion() }</div>
                                    <div><span className="text-text-strong-950">Renderer</span> · v{ GetRendererVersion() }</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 border-t border-stroke-soft-200 px-5 py-4">
                        <AlignButton.Root variant="neutral" mode="stroke" size="xsmall" onClick={ () => window.open('https://discord.nitrodev.co') }>
                            <AlignButton.Icon as={ RiDiscordLine } />
                            Discord
                        </AlignButton.Root>
                        <AlignButton.Root variant="neutral" mode="stroke" size="xsmall" onClick={ () => window.open('https://git.krews.org/nitro/nitro-react') }>
                            <AlignButton.Icon as={ RiGitBranchLine } />
                            Git
                        </AlignButton.Root>
                        <AlignButton.Root variant="neutral" mode="stroke" size="xsmall" onClick={ () => window.open('https://git.krews.org/nitro/nitro-react/-/issues') }>
                            <AlignButton.Icon as={ RiBugLine } />
                            Bug Report
                        </AlignButton.Root>
                    </div>
                </div>
            </div>
        </DraggableWindow>
    );
}
