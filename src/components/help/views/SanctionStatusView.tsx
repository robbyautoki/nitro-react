import { FC } from 'react';
import { FaTimes } from 'react-icons/fa';
import { AlertTriangle, Clock, Lock, ShieldX } from 'lucide-react';
import { LocalizeText } from '../../../api';
import { useHelp } from '../../../hooks';

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
        <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-auto">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={ () => setSanctionInfo(null) } />

            <div className="relative w-[420px] rounded-2xl border border-white/[0.08] bg-white/[0.04] p-0.5 shadow-2xl">
                <div className="relative flex flex-col overflow-hidden rounded-[14px] border border-white/[0.06] bg-[rgba(12,12,16,0.97)]">

                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-gradient-to-b from-white/[0.06] to-transparent">
                        <div className="flex items-center gap-2.5">
                            <ShieldX className="size-4 text-amber-400/80" />
                            <span className="text-sm font-semibold text-white/90 tracking-tight">
                                { LocalizeText('help.sanction.info.title') }
                            </span>
                        </div>
                        <button
                            className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.08] transition-all"
                            onClick={ () => setSanctionInfo(null) }
                        >
                            <FaTimes className="size-3" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-5 py-4 space-y-3">
                        { !hasActiveSanction ? (
                            <div className="px-4 py-5 rounded-xl border border-green-500/10 bg-green-500/[0.04] text-center">
                                <p className="text-sm font-medium text-green-400/80">{ LocalizeText('help.sanction.current.none') }</p>
                            </div>
                        ) : (
                            <>
                                { isOnProbation && (
                                    <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-amber-500/15 bg-amber-500/[0.06]">
                                        <AlertTriangle className="size-4 text-amber-400 shrink-0" />
                                        <p className="text-xs text-amber-400/80">{ LocalizeText('help.sanction.probation.reminder') }</p>
                                    </div>
                                ) }

                                <div className={ `px-3.5 py-3 rounded-xl border ${ sanctionInfo.isSanctionNew ? 'border-red-500/20 bg-red-500/[0.06]' : 'border-white/[0.06] bg-white/[0.03]' }` }>
                                    <p className="text-[11px] text-white/30 mb-1">Aktuelle Sanktion</p>
                                    <p className={ `text-sm font-medium ${ sanctionInfo.isSanctionNew ? 'text-red-400' : 'text-white/80' }` }>
                                        { sanctionLocalization('current', sanctionInfo.sanctionName, sanctionInfo.sanctionLengthHours) }
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="px-3.5 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03]">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <Clock className="size-3 text-white/30" />
                                            <p className="text-[11px] text-white/30">Startzeit</p>
                                        </div>
                                        <p className="text-xs text-white/60">{ sanctionInfo.sanctionCreationTime }</p>
                                    </div>
                                    <div className="px-3.5 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03]">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <AlertTriangle className="size-3 text-white/30" />
                                            <p className="text-[11px] text-white/30">Grund</p>
                                        </div>
                                        <p className="text-xs text-white/60">{ sanctionInfo.sanctionReason }</p>
                                    </div>
                                </div>

                                <div className="px-3.5 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03]">
                                    <p className="text-[11px] text-white/30 mb-1">Bewährung verbleibend</p>
                                    <p className="text-xs text-white/60">{ Math.trunc((sanctionInfo.probationHoursLeft / 24)) + 1 } Tage</p>
                                </div>
                            </>
                        ) }

                        { sanctionInfo.hasCustomMute && !sanctionInfo.isSanctionActive && (
                            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-red-500/15 bg-red-500/[0.06]">
                                <Lock className="size-4 text-red-400 shrink-0" />
                                <p className="text-xs text-red-400/80">{ LocalizeText('help.sanction.custom.mute') }</p>
                            </div>
                        ) }

                        { sanctionInfo.tradeLockExpiryTime && sanctionInfo.tradeLockExpiryTime.length > 0 && (
                            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-amber-500/15 bg-amber-500/[0.06]">
                                <Lock className="size-4 text-amber-400 shrink-0" />
                                <p className="text-xs text-amber-400/80">{ LocalizeText('trade.locked.until') } { sanctionInfo.tradeLockExpiryTime }</p>
                            </div>
                        ) }

                        { hasActiveSanction && (
                            <div className="px-3.5 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03]">
                                <p className="text-[11px] text-white/30 mb-1">Naechste Sanktion bei Verstoss</p>
                                <p className="text-xs text-white/60">
                                    { sanctionLocalization('next', sanctionInfo.nextSanctionName, sanctionInfo.nextSanctionLengthHours) }
                                </p>
                            </div>
                        ) }

                        <button
                            className="w-full py-2.5 rounded-xl text-sm font-medium transition-all bg-white/[0.06] text-white/70 border border-white/[0.08] hover:bg-white/[0.1] hover:text-white/90"
                            onClick={ () => setSanctionInfo(null) }
                        >
                            Verstanden
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
