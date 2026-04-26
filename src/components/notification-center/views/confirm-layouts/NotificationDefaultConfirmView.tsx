import { FC } from 'react';
import { LocalizeText, NotificationConfirmItem } from '../../../../api';
import { DraggableWindow, DraggableWindowPosition } from '../../../../common/draggable-window';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignCompactButton from '@/align-ui/components/ui/compact-button';
import { RiCloseLine, RiQuestionFill } from '@remixicon/react';

export interface NotificationDefaultConfirmViewProps
{
    item: NotificationConfirmItem;
    onClose: () => void;
}

const safeLocalize = (key: string, fallback: string): string =>
{
    const value = LocalizeText(key);
    return (!value || value === key) ? fallback : value;
};

export const NotificationDefaultConfirmView: FC<NotificationDefaultConfirmViewProps> = props =>
{
    const { item = null, onClose = null } = props;
    const { message = null, onConfirm = null, onCancel = null, confirmText = null, cancelText = null, title = null } = item;

    const eyebrow = safeLocalize('notifications.confirm.eyebrow', 'Aktion · Bestätigen');
    const headerTitle = title || safeLocalize('notifications.confirm.subtitle', 'Bestätigung erforderlich');

    const confirm = () =>
    {
        if(onConfirm) onConfirm();
        onClose();
    };

    const cancel = () =>
    {
        if(onCancel) onCancel();
        onClose();
    };

    return (
        <DraggableWindow handleSelector=".drag-handler" windowPosition={ DraggableWindowPosition.CENTER }>
            <div className="w-[460px]">
                <div className="overflow-hidden rounded-20 bg-bg-white-0 shadow-regular-md">
                    <div className="drag-handler relative flex cursor-move select-none flex-col gap-1.5 px-5 pb-4 pt-5 pr-14 before:absolute before:inset-x-0 before:bottom-0 before:border-b before:border-stroke-soft-200">
                        <div className="flex items-center gap-1.5 text-subheading-2xs uppercase tracking-wider text-information-base">
                            <RiQuestionFill className="size-3.5 shrink-0" />
                            <span>{ eyebrow }</span>
                        </div>
                        <div className="text-title-h6 font-medium leading-snug text-text-strong-950">{ headerTitle }</div>
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
                        <div className="grid grid-cols-[56px_minmax(0,1fr)] gap-4">
                            <div className="flex h-[56px] w-[56px] items-center justify-center rounded-2xl bg-information-lighter text-information-base">
                                <RiQuestionFill className="size-7" />
                            </div>
                            <div className="min-w-0 max-w-prose pt-1 text-paragraph-sm leading-relaxed text-text-sub-600">
                                { message }
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 border-t border-stroke-soft-200 px-5 py-4">
                        <AlignButton.Root variant="neutral" mode="stroke" size="small" className="min-w-[120px]" onClick={ cancel }>
                            { cancelText }
                        </AlignButton.Root>
                        <AlignButton.Root variant="primary" mode="filled" size="small" className="min-w-[120px]" onClick={ confirm }>
                            { confirmText }
                        </AlignButton.Root>
                    </div>
                </div>
            </div>
        </DraggableWindow>
    );
}
