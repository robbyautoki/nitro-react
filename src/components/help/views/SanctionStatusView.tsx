import { FC } from 'react';
import { AlertTriangle, Clock, Lock, ShieldX, X } from 'lucide-react';
import { LocalizeText } from '../../../api';
import { useHelp } from '../../../hooks';
import { DraggableWindow, DraggableWindowPosition } from '../../../common/draggable-window';
import { Frame, FramePanel } from '../../ui/frame';
import { Button } from '../../ui/button';
import { Alert, AlertTitle, AlertDescription } from '../../ui/alert';
import { Separator } from '../../ui/separator';

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
            <div className="w-[420px]">
                <Frame className="relative">
                    <div className="drag-handler absolute inset-0 cursor-move" />
                    <FramePanel className="overflow-hidden p-0! relative z-10">
                        <div className="flex items-center justify-between px-4 py-2.5 border-b">
                            <div className="flex items-center gap-2">
                                <ShieldX className="size-4 text-amber-500" />
                                <span className="text-sm font-semibold">{ LocalizeText('help.sanction.info.title') }</span>
                            </div>
                            <button className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" onClick={ () => setSanctionInfo(null) }>
                                <X className="size-3.5" />
                            </button>
                        </div>

                        <div className="px-4 py-3 space-y-3">
                            { !hasActiveSanction ? (
                                <div className="px-4 py-5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-center">
                                    <p className="text-sm font-medium text-emerald-500">{ LocalizeText('help.sanction.current.none') }</p>
                                </div>
                            ) : (
                                <>
                                    { isOnProbation && (
                                        <Alert variant="destructive" className="border-amber-500/20 bg-amber-500/5">
                                            <AlertTriangle className="size-4 text-amber-500" />
                                            <AlertDescription className="text-amber-500/80">
                                                { LocalizeText('help.sanction.probation.reminder') }
                                            </AlertDescription>
                                        </Alert>
                                    ) }

                                    <div className={ `px-3.5 py-3 rounded-lg border ${ sanctionInfo.isSanctionNew ? 'border-red-500/20 bg-red-500/5' : 'border-border' }` }>
                                        <p className="text-[11px] text-muted-foreground/50 mb-1">Aktuelle Sanktion</p>
                                        <p className={ `text-sm font-medium ${ sanctionInfo.isSanctionNew ? 'text-red-500' : 'text-foreground' }` }>
                                            { sanctionLocalization('current', sanctionInfo.sanctionName, sanctionInfo.sanctionLengthHours) }
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="px-3.5 py-2.5 rounded-lg border">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <Clock className="size-3 text-muted-foreground/50" />
                                                <p className="text-[11px] text-muted-foreground/50">Startzeit</p>
                                            </div>
                                            <p className="text-xs text-muted-foreground">{ sanctionInfo.sanctionCreationTime }</p>
                                        </div>
                                        <div className="px-3.5 py-2.5 rounded-lg border">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <AlertTriangle className="size-3 text-muted-foreground/50" />
                                                <p className="text-[11px] text-muted-foreground/50">Grund</p>
                                            </div>
                                            <p className="text-xs text-muted-foreground">{ sanctionInfo.sanctionReason }</p>
                                        </div>
                                    </div>

                                    <div className="px-3.5 py-2.5 rounded-lg border">
                                        <p className="text-[11px] text-muted-foreground/50 mb-1">Bewährung verbleibend</p>
                                        <p className="text-xs text-muted-foreground">{ Math.trunc((sanctionInfo.probationHoursLeft / 24)) + 1 } Tage</p>
                                    </div>
                                </>
                            ) }

                            { sanctionInfo.hasCustomMute && !sanctionInfo.isSanctionActive && (
                                <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border border-red-500/20 bg-red-500/5">
                                    <Lock className="size-4 text-red-500 shrink-0" />
                                    <p className="text-xs text-red-500/80">{ LocalizeText('help.sanction.custom.mute') }</p>
                                </div>
                            ) }

                            { sanctionInfo.tradeLockExpiryTime && sanctionInfo.tradeLockExpiryTime.length > 0 && (
                                <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5">
                                    <Lock className="size-4 text-amber-500 shrink-0" />
                                    <p className="text-xs text-amber-500/80">{ LocalizeText('trade.locked.until') } { sanctionInfo.tradeLockExpiryTime }</p>
                                </div>
                            ) }

                            { hasActiveSanction && (
                                <div className="px-3.5 py-2.5 rounded-lg border">
                                    <p className="text-[11px] text-muted-foreground/50 mb-1">Nächste Sanktion bei Verstoß</p>
                                    <p className="text-xs text-muted-foreground">
                                        { sanctionLocalization('next', sanctionInfo.nextSanctionName, sanctionInfo.nextSanctionLengthHours) }
                                    </p>
                                </div>
                            ) }

                            <Button className="w-full" size="sm" onClick={ () => setSanctionInfo(null) }>
                                Verstanden
                            </Button>
                        </div>
                    </FramePanel>
                </Frame>
            </div>
        </DraggableWindow>
    );
};
