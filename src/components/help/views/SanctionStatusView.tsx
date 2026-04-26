import { FC } from 'react';
import { AlertTriangle, Clock, Lock, ShieldX } from 'lucide-react';
import { LocalizeText } from '../../../api';
import { useHelp } from '../../../hooks';
import { DraggableWindow, DraggableWindowPosition } from '../../../common/draggable-window';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignDivider from '@/align-ui/components/ui/divider';
import * as AlignProgress from '@/align-ui/components/ui/progress-bar';
import * as AlignSurface from '@/align-ui/components/ui/surface';

export const SanctionSatusView: FC<{}> = () =>
{
    const { sanctionInfo = null, setSanctionInfo = null } = useHelp();

    const sanctionLocalization = (param: string, sanctionName: string, length?: number) =>
    {
        let localizationName = `help.sanction.${ param }`;

        switch(sanctionName)
        {
            case 'ALERT':
                localizationName = (localizationName + '.alert');
                break;
            case 'MUTE':
                localizationName = (localizationName + '.mute');
                break;
            case 'BAN_PERMANENT':
                localizationName = (localizationName + '.permban');
                break;
            default:
                localizationName = (localizationName + '.ban');
                if(length > 24)
                {
                    localizationName = (localizationName + '.days');
                    return LocalizeText(localizationName, [ 'days' ], [ (length / 24).toString() ]);
                }
        }

        return LocalizeText(localizationName, [ 'hours' ], [ length.toString() ]);
    };

    if(!sanctionInfo) return null;

    const hasActiveSanction = sanctionInfo.sanctionReason !== 'cfh.reason.EMPTY';
    const isOnProbation = sanctionInfo.probationHoursLeft > 0 || sanctionInfo.isSanctionActive;

    return (
        <DraggableWindow handleSelector=".drag-handler" windowPosition={ DraggableWindowPosition.CENTER }>
            <div className="w-[420px] max-w-[calc(100vw-32px)]">
                <AlignSurface.Panel className="overflow-hidden">
                    <AlignSurface.Header
                        className="drag-handler cursor-grab select-none active:cursor-grabbing"
                        title={
                            <div className="flex min-w-0 items-center gap-2">
                                <span className="flex size-8 items-center justify-center rounded-lg bg-warning-lighter text-warning-base ring-1 ring-inset ring-warning-light">
                                    <ShieldX className="size-4" />
                                </span>
                                <span className="truncate">{ LocalizeText('help.sanction.info.title') }</span>
                            </div>
                        }
                        description="Moderationsstatus"
                        onClose={ () => setSanctionInfo(null) }
                    />
                    <div className="space-y-3 p-4">
                        { !hasActiveSanction ? (
                            <div className="rounded-xl bg-success-lighter px-4 py-5 text-center text-success-base ring-1 ring-inset ring-success-light">
                                <p className="text-label-sm">{ LocalizeText('help.sanction.current.none') }</p>
                            </div>
                        ) : (
                            <>
                                { isOnProbation && (
                                    <div className="flex items-start gap-2 rounded-xl bg-warning-lighter p-3 text-warning-base ring-1 ring-inset ring-warning-light">
                                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                                        <p className="text-paragraph-xs leading-relaxed">{ LocalizeText('help.sanction.probation.reminder') }</p>
                                    </div>
                                ) }
                                <div className={ `rounded-xl p-3 ring-1 ring-inset ${ sanctionInfo.isSanctionNew ? 'bg-error-lighter text-error-base ring-error-light' : 'bg-bg-weak-50 text-text-strong-950 ring-stroke-soft-200' }` }>
                                    <div className="mb-1 flex items-center justify-between gap-2">
                                        <p className="text-subheading-2xs uppercase text-text-soft-400">Aktuelle Sanktion</p>
                                        { sanctionInfo.isSanctionNew && <AlignBadge.Root color="red" variant="light" size="small">Neu</AlignBadge.Root> }
                                    </div>
                                    <p className="text-label-sm">
                                        { sanctionLocalization('current', sanctionInfo.sanctionName, sanctionInfo.sanctionLengthHours) }
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="rounded-xl bg-bg-weak-50 px-3 py-2.5 ring-1 ring-inset ring-stroke-soft-200">
                                        <div className="mb-1 flex items-center gap-1.5 text-text-soft-400">
                                            <Clock className="size-3" />
                                            <p className="text-subheading-2xs uppercase">Startzeit</p>
                                        </div>
                                        <p className="text-paragraph-xs text-text-sub-600">{ sanctionInfo.sanctionCreationTime }</p>
                                    </div>
                                    <div className="rounded-xl bg-bg-weak-50 px-3 py-2.5 ring-1 ring-inset ring-stroke-soft-200">
                                        <div className="mb-1 flex items-center gap-1.5 text-text-soft-400">
                                            <AlertTriangle className="size-3" />
                                            <p className="text-subheading-2xs uppercase">Grund</p>
                                        </div>
                                        <p className="text-paragraph-xs text-text-sub-600">{ sanctionInfo.sanctionReason }</p>
                                    </div>
                                </div>
                                <div className="space-y-2 rounded-xl bg-bg-weak-50 px-3 py-2.5 ring-1 ring-inset ring-stroke-soft-200">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-subheading-2xs uppercase text-text-soft-400">Bewährung verbleibend</p>
                                        <p className="text-paragraph-xs font-medium text-text-sub-600">{ Math.trunc((sanctionInfo.probationHoursLeft / 24)) + 1 } Tage</p>
                                    </div>
                                    <AlignProgress.Root value={ Math.max(0, sanctionInfo.probationHoursLeft) } max={ Math.max(1, sanctionInfo.probationHoursLeft) } color="orange" />
                                </div>
                            </>
                        ) }
                        { sanctionInfo.hasCustomMute && !sanctionInfo.isSanctionActive && (
                            <div className="flex items-center gap-2.5 rounded-xl bg-error-lighter px-3.5 py-2.5 text-error-base ring-1 ring-inset ring-error-light">
                                <Lock className="size-4 shrink-0" />
                                <p className="text-paragraph-xs">{ LocalizeText('help.sanction.custom.mute') }</p>
                            </div>
                        ) }
                        { sanctionInfo.tradeLockExpiryTime && sanctionInfo.tradeLockExpiryTime.length > 0 && (
                            <div className="flex items-center gap-2.5 rounded-xl bg-warning-lighter px-3.5 py-2.5 text-warning-base ring-1 ring-inset ring-warning-light">
                                <Lock className="size-4 shrink-0" />
                                <p className="text-paragraph-xs">{ LocalizeText('trade.locked.until') } { sanctionInfo.tradeLockExpiryTime }</p>
                            </div>
                        ) }
                        { hasActiveSanction && (
                            <div className="rounded-xl bg-bg-weak-50 px-3.5 py-2.5 ring-1 ring-inset ring-stroke-soft-200">
                                <p className="mb-1 text-subheading-2xs uppercase text-text-soft-400">Nächste Sanktion bei Verstoß</p>
                                <p className="text-paragraph-xs text-text-sub-600">
                                    { sanctionLocalization('next', sanctionInfo.nextSanctionName, sanctionInfo.nextSanctionLengthHours) }
                                </p>
                            </div>
                        ) }
                        <AlignDivider.Root />
                        <AlignButton.Root className="w-full" size="small" variant="primary" mode="filled" onClick={ () => setSanctionInfo(null) }>
                            Verstanden
                        </AlignButton.Root>
                    </div>
                </AlignSurface.Panel>
            </div>
        </DraggableWindow>
    );
};
