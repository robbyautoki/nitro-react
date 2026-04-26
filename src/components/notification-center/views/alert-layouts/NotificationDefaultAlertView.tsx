import { FC, useMemo, useState } from 'react';
import { LocalizeText, NotificationAlertItem, NotificationAlertType, OpenUrl, parseNotificationMessages } from '../../../../api';
import { LayoutAvatarImageView } from '../../../../common';
import { DraggableWindow, DraggableWindowPosition } from '../../../../common/draggable-window';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignCompactButton from '@/align-ui/components/ui/compact-button';
import {
    RiAlertFill,
    RiCloseLine,
    RiExternalLinkLine,
    RiNotification3Fill,
    RiShieldFlashFill,
    type RemixiconComponentType,
} from '@remixicon/react';

interface NotificationDefaultAlertViewProps
{
    item: NotificationAlertItem;
    onClose: () => void;
}

const safeLocalize = (key: string, fallback: string): string =>
{
    const value = LocalizeText(key);
    return (!value || value === key) ? fallback : value;
};

interface AlertHeaderConfig
{
    eyebrow: string | null;
    fallbackTitle: string;
    placeholderIcon: RemixiconComponentType;
    placeholderTone: 'neutral' | 'error' | 'warning' | 'information';
    accentBar: string;
}

const TONE_TO_PLACEHOLDER: Record<AlertHeaderConfig['placeholderTone'], string> = {
    neutral: 'bg-bg-weak-50 text-text-sub-600 ring-1 ring-inset ring-stroke-soft-200',
    error: 'bg-error-lighter text-error-base',
    warning: 'bg-warning-lighter text-warning-base',
    information: 'bg-information-lighter text-information-base',
};

const TONE_TO_ACCENT: Record<AlertHeaderConfig['placeholderTone'], string> = {
    neutral: 'bg-stroke-soft-200',
    error: 'bg-error-base',
    warning: 'bg-warning-base',
    information: 'bg-information-base',
};

export const NotificationDefaultAlertView: FC<NotificationDefaultAlertViewProps> = props =>
{
    const { item = null, onClose = null } = props;
    const [ imageFailed, setImageFailed ] = useState(false);

    const isAlert = (item.alertType === NotificationAlertType.ALERT);
    const isModeration = (item.alertType === NotificationAlertType.MODERATION);

    const config: AlertHeaderConfig = useMemo(() =>
    {
        if(isAlert)
        {
            return {
                eyebrow: safeLocalize('notifications.alert.eyebrow', 'Wichtiger Hinweis'),
                fallbackTitle: safeLocalize('notifications.alert.subtitle', 'Wichtiger Hinweis'),
                placeholderIcon: RiAlertFill,
                placeholderTone: 'error',
                accentBar: TONE_TO_ACCENT.error,
            };
        }
        if(isModeration)
        {
            return {
                eyebrow: safeLocalize('notifications.moderation.eyebrow', 'Moderation'),
                fallbackTitle: safeLocalize('notifications.message_from_moderator', 'Nachricht vom Moderator'),
                placeholderIcon: RiShieldFlashFill,
                placeholderTone: 'error',
                accentBar: TONE_TO_ACCENT.error,
            };
        }
        return {
            // Default-Alerts: kein Eyebrow — Title trägt die Hierarchie alleine
            eyebrow: null,
            fallbackTitle: safeLocalize('notifications.broadcast.title', 'Nachricht vom Habbo Hotel'),
            placeholderIcon: RiNotification3Fill,
            placeholderTone: 'neutral',
            accentBar: TONE_TO_ACCENT.neutral,
        };
    }, [ isAlert, isModeration ]);

    const title = (item.title && item.title.length > 0) ? item.title : config.fallbackTitle;

    const { body, sender } = useMemo(() => parseNotificationMessages(item.messages || []), [ item.messages ]);

    const visitUrl = () =>
    {
        OpenUrl(item.clickUrl);
        onClose();
    };

    const renderBodyText = () =>
    {
        if(body.length === 0) return null;

        return (
            <div className="space-y-1.5 text-paragraph-sm leading-relaxed text-text-sub-600">
                { body.map((line, index) =>
                {
                    const html = line.replace(/\r\n|\r|\n/g, '<br />');
                    return <div key={ index } dangerouslySetInnerHTML={ { __html: html } } />;
                }) }
            </div>
        );
    };

    const hasFigure = !!item.figure;
    const hasImage = !!item.imageUrl && !imageFailed;
    const showSideColumn = hasFigure || hasImage || isAlert || isModeration;

    const PlaceholderIcon = config.placeholderIcon;

    return (
        <DraggableWindow handleSelector=".drag-handler" windowPosition={ DraggableWindowPosition.CENTER }>
            <div className="w-[460px]">
                <div className="relative overflow-hidden rounded-20 bg-bg-white-0 shadow-regular-md">
                    {/* Accent bar nur bei Moderation/Alert */}
                    { (isAlert || isModeration) && (
                        <div className={ `absolute inset-x-0 top-0 h-0.5 ${ config.accentBar }` } aria-hidden="true" />
                    ) }

                    {/* Header */}
                    <div className="drag-handler relative flex cursor-move select-none flex-col gap-1 px-6 pt-5 pb-4 pr-14">
                        { config.eyebrow && (
                            <div className="text-paragraph-xs uppercase tracking-[0.08em] text-text-soft-400">
                                { config.eyebrow }
                            </div>
                        ) }
                        <div className="text-title-h6 font-medium leading-snug text-text-strong-950">{ title }</div>
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

                    {/* Body */}
                    <div className="px-6 pb-5">
                        { showSideColumn ? (
                            <div className="grid grid-cols-[80px_minmax(0,1fr)] gap-5">
                                <div className={ `relative flex h-[80px] w-[80px] items-center justify-center overflow-hidden rounded-2xl ${ (hasFigure || hasImage) ? 'bg-bg-weak-50 ring-1 ring-inset ring-stroke-soft-200' : TONE_TO_PLACEHOLDER[config.placeholderTone] }` }>
                                    { hasImage ? (
                                        <img
                                            src={ item.imageUrl }
                                            alt=""
                                            onError={ () => setImageFailed(true) }
                                            className="h-full w-full object-cover"
                                        />
                                    ) : hasFigure ? (
                                        <div className="flex h-full w-full items-end justify-center">
                                            <LayoutAvatarImageView figure={ item.figure } direction={ 4 } scale={ 0.9 } />
                                        </div>
                                    ) : (
                                        <PlaceholderIcon className="size-9" />
                                    ) }
                                </div>
                                <div className="flex min-w-0 flex-col gap-2 pt-1">
                                    { renderBodyText() }
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                { renderBodyText() }
                            </div>
                        ) }
                    </div>

                    {/* Sender Signatur */}
                    { sender && (
                        <div className="flex items-center justify-end px-6 pb-4 text-paragraph-xs italic text-text-soft-400">
                            — { sender }
                        </div>
                    ) }

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-2 border-t border-stroke-soft-200 px-6 py-4">
                        { (!item.clickUrl || item.clickUrl.length === 0) ? (
                            <AlignButton.Root variant="neutral" mode="stroke" size="small" className="min-w-[120px]" onClick={ onClose }>
                                { LocalizeText('generic.close') }
                            </AlignButton.Root>
                        ) : (
                            <>
                                <AlignButton.Root variant="neutral" mode="stroke" size="small" className="min-w-[120px]" onClick={ onClose }>
                                    { LocalizeText('generic.close') }
                                </AlignButton.Root>
                                { isModeration ? (
                                    <AlignButton.Root variant="neutral" mode="filled" size="small" className="min-w-[120px]" onClick={ visitUrl }>
                                        <AlignButton.Icon as={ RiExternalLinkLine } />
                                        { LocalizeText(item.clickUrlText) }
                                    </AlignButton.Root>
                                ) : (
                                    <AlignButton.Root variant="primary" mode="filled" size="small" className="min-w-[120px]" onClick={ visitUrl }>
                                        { LocalizeText(item.clickUrlText) }
                                    </AlignButton.Root>
                                ) }
                            </>
                        ) }
                    </div>
                </div>
            </div>
        </DraggableWindow>
    );
}
