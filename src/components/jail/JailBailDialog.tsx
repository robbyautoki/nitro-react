import { FC, useEffect, useState } from 'react';
import { AlertTriangle, Diamond, Flame, Gavel, Skull } from 'lucide-react';
import { GetRoomSession } from '../../api';
import { useJailBailSnapshot } from '../../hooks';
import { JailDraggableDialog } from './JailDraggableDialog';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignBadge from '@/align-ui/components/ui/badge';

function sendChat(command: string): boolean {
    const session = GetRoomSession();
    if (!session) return false;
    session.sendChatMessage(command, 0);
    return true;
}

export const JailBailDialog: FC = () => {
    const { snapshot, onResult } = useJailBailSnapshot();
    const [ confirm, setConfirm ] = useState(false);
    const [ feedback, setFeedback ] = useState<{ ok: boolean; message: string } | null>(null);
    const [ pending, setPending ] = useState(false);

    useEffect(() => {
        const off = onResult(result => {
            setFeedback(result);
            setPending(false);
            setConfirm(false);
            window.setTimeout(() => setFeedback(null), 3500);
        });
        return off;
    }, [ onResult ]);

    const handlePay = () => {
        if (pending) return;
        setPending(true);
        sendChat(':_jail_bail_pay');
    };

    const error = snapshot?.error;
    const canAfford = snapshot?.canAfford ?? false;
    const price = snapshot?.priceDiamonds ?? 0;
    const balance = snapshot?.diamondsBalance ?? 0;
    const remainingMins = snapshot?.remainingMinutes ?? 0;
    const escalation = snapshot?.escalationLevel ?? 0;
    const mostWanted = snapshot?.isMostWanted ?? false;
    const multiplier = snapshot?.multiplier ?? 1;

    const renderFooter = () => {
        if (!snapshot || error || mostWanted) return null;

        if (!confirm) {
            return (
                <>
                    <AlignButton.Root
                        variant="neutral"
                        mode="stroke"
                        size="small"
                        className="w-full"
                        onClick={ () => sendChat(':_jail_open bail') }
                        disabled={ pending }
                    >
                        Aktualisieren
                    </AlignButton.Root>
                    <AlignButton.Root
                        variant="primary"
                        mode="filled"
                        size="small"
                        className="w-full"
                        disabled={ !canAfford || pending }
                        onClick={ () => setConfirm(true) }
                    >
                        { canAfford ? `${ price } Diamanten zahlen` : 'Nicht genug Diamanten' }
                    </AlignButton.Root>
                </>
            );
        }

        return (
            <>
                <AlignButton.Root
                    variant="neutral"
                    mode="stroke"
                    size="small"
                    className="w-full"
                    onClick={ () => setConfirm(false) }
                    disabled={ pending }
                >
                    Abbrechen
                </AlignButton.Root>
                <AlignButton.Root
                    variant="error"
                    mode="filled"
                    size="small"
                    className="w-full"
                    onClick={ handlePay }
                    disabled={ pending }
                >
                    { pending ? 'Wird verarbeitet...' : 'Ja, jetzt zahlen' }
                </AlignButton.Root>
            </>
        );
    };

    return (
        <JailDraggableDialog
            id="bail"
            title="Kaution zahlen"
            description={ mostWanted ? 'Most Wanted — Kaution gesperrt' : 'Sofortige Freilassung gegen Diamanten' }
            icon={ mostWanted ? Skull : Gavel }
            width={ 400 }
            bodyClassName="flex flex-col gap-5"
            footer={ renderFooter() }
        >
            { feedback && (
                <div className={ `rounded-lg px-3 py-2 text-paragraph-xs ${
                    feedback.ok
                        ? 'bg-success-lighter text-success-base'
                        : 'bg-error-lighter text-error-base'
                }` }>
                    { feedback.message }
                </div>
            ) }

            { !snapshot ? (
                <div className="rounded-xl bg-bg-weak-50 p-6 text-center text-paragraph-sm text-text-sub-600">
                    Kautions-Daten werden geladen...
                </div>
            ) : error ? (
                <div className="flex items-start gap-3 rounded-xl bg-error-lighter p-4">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-bg-white-0 text-error-base">
                        <AlertTriangle className="size-5" />
                    </div>
                    <div>
                        <div className="text-label-sm text-text-strong-950">Kaution nicht möglich</div>
                        <div className="mt-1 text-paragraph-sm text-text-sub-600">{ error }</div>
                    </div>
                </div>
            ) : (
                <>
                    { /* Hero — Preis */ }
                    <div className="rounded-xl bg-bg-weak-50 p-5 text-center">
                        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-bg-white-0 ring-1 ring-inset ring-stroke-soft-200">
                            <Diamond className="size-6 text-text-sub-600" />
                        </div>
                        <div className="mt-3 text-paragraph-xs uppercase tracking-wide text-text-sub-600">Kautionspreis</div>
                        <div className="mt-1 text-title-h3 font-medium tabular-nums text-text-strong-950">
                            { price }
                        </div>
                        <div className="text-paragraph-sm text-text-sub-600">Diamanten</div>
                        <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
                            <AlignBadge.Root size="small" variant="lighter" color="blue">
                                Restzeit { remainingMins } Min
                            </AlignBadge.Root>
                            { multiplier > 1 && (
                                <AlignBadge.Root size="small" variant="lighter" color="orange">
                                    <AlignBadge.Icon as={ Flame } className="size-3" />
                                    { multiplier.toFixed(1) }x
                                </AlignBadge.Root>
                            ) }
                            { escalation > 0 && (
                                <AlignBadge.Root size="small" variant="lighter" color="red">
                                    Stufe { escalation }
                                </AlignBadge.Root>
                            ) }
                        </div>
                    </div>

                    { /* Saldo-Zeile */ }
                    <div className="flex items-center justify-between rounded-lg bg-bg-weak-50 px-4 py-3">
                        <div className="flex items-center gap-2 text-paragraph-sm text-text-sub-600">
                            <Diamond className="size-4 text-text-sub-600" />
                            Dein Diamanten-Saldo
                        </div>
                        <span className={ `text-label-md tabular-nums ${
                            canAfford ? 'text-text-strong-950' : 'text-error-base'
                        }` }>
                            { balance }
                        </span>
                    </div>

                    { /* Stat-Tiles */ }
                    <div className="grid grid-cols-3 gap-2">
                        <StatTile label="24h" value={ snapshot.arrests24h } />
                        <StatTile label="7 Tage" value={ snapshot.arrests7d } />
                        <StatTile label="Gesamt" value={ snapshot.totalArrests } />
                    </div>

                    { mostWanted && (
                        <div className="flex items-start gap-3 rounded-xl bg-error-lighter p-4">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-bg-white-0 text-error-base">
                                <Skull className="size-5" />
                            </div>
                            <div>
                                <div className="text-label-sm text-text-strong-950">Most-Wanted-Status</div>
                                <div className="mt-1 text-paragraph-sm text-text-sub-600">
                                    Kaution für diese Inhaftierung gesperrt. Sitz die Strafe ab oder warte auf Begnadigung.
                                </div>
                            </div>
                        </div>
                    ) }

                    { confirm && (
                        <div className="flex items-start gap-3 rounded-xl bg-warning-lighter p-4">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-bg-white-0 text-warning-base">
                                <AlertTriangle className="size-5" />
                            </div>
                            <div>
                                <div className="text-label-sm text-text-strong-950">Bist du sicher?</div>
                                <div className="mt-1 text-paragraph-sm text-text-sub-600">
                                    Du zahlst <span className="font-medium text-text-strong-950">{ price }</span> Diamanten und wirst sofort freigelassen. Diese Aktion kann nicht rückgängig gemacht werden.
                                </div>
                            </div>
                        </div>
                    ) }
                </>
            ) }
        </JailDraggableDialog>
    );
};

const StatTile: FC<{ label: string; value: number }> = ({ label, value }) => (
    <div className="rounded-xl bg-bg-weak-50 p-4 text-center">
        <div className="text-label-md tabular-nums text-text-strong-950">{ value }</div>
        <div className="mt-1 text-paragraph-xs text-text-sub-600">{ label }</div>
    </div>
);
