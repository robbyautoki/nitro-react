import { FC } from 'react';
import {
    ArrowDownRight, ArrowUpRight, Cigarette, Footprints, Hammer, History,
    Lock, Sparkles
} from 'lucide-react';
import { useJailCigaretteSnapshot } from '../../hooks';
import { JailDraggableDialog } from './JailDraggableDialog';
import * as AlignDivider from '@/align-ui/components/ui/divider';

function formatRelative(timestamp: number): string {
    const diff = Date.now() - timestamp;
    if (diff < 0) return 'gerade eben';
    if (diff < 60_000) return 'vor wenigen Sekunden';
    if (diff < 3_600_000) return `vor ${ Math.floor(diff / 60_000) } Min`;
    if (diff < 86_400_000) return `vor ${ Math.floor(diff / 3_600_000) } Std`;
    return `vor ${ Math.floor(diff / 86_400_000) } Tagen`;
}

export const JailCigaretteDialog: FC = () => {
    const snap = useJailCigaretteSnapshot();

    return (
        <JailDraggableDialog
            id="cigarettes"
            title="Zigaretten-Konto"
            description="Knast-Währung & Verlauf"
            icon={ Cigarette }
            width={ 400 }
            bodyClassName="flex flex-col gap-5"
        >
            { !snap ? (
                <div className="rounded-xl bg-bg-weak-50 p-6 text-center text-paragraph-sm text-text-sub-600">
                    Konto-Daten werden geladen...
                </div>
            ) : (
                <>
                    { /* Hero — Saldo */ }
                    <div className="rounded-xl bg-bg-weak-50 p-5 text-center">
                        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-bg-white-0 ring-1 ring-inset ring-stroke-soft-200">
                            <Cigarette className="size-6 text-text-sub-600" />
                        </div>
                        <div className="mt-3 text-paragraph-xs uppercase tracking-wide text-text-sub-600">Aktueller Kontostand</div>
                        <div className="mt-1 text-title-h3 font-medium tabular-nums text-text-strong-950">
                            { snap.balance }
                        </div>
                        <div className="text-paragraph-sm text-text-sub-600">Zigaretten</div>
                    </div>

                    { /* Earned / Spent */ }
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-bg-weak-50 p-4">
                            <div className="flex items-center gap-2 text-paragraph-xs uppercase tracking-wide text-text-sub-600">
                                <ArrowUpRight className="size-3.5" />
                                Verdient
                            </div>
                            <div className="mt-2 text-label-md tabular-nums text-text-strong-950">
                                { snap.earnedLifetime }
                            </div>
                        </div>
                        <div className="rounded-xl bg-bg-weak-50 p-4">
                            <div className="flex items-center gap-2 text-paragraph-xs uppercase tracking-wide text-text-sub-600">
                                <ArrowDownRight className="size-3.5" />
                                Ausgegeben
                            </div>
                            <div className="mt-2 text-label-md tabular-nums text-text-strong-950">
                                { snap.spentLifetime }
                            </div>
                        </div>
                    </div>

                    { /* History */ }
                    <div>
                        <div className="flex items-center gap-2 text-paragraph-xs uppercase tracking-wide text-text-sub-600">
                            <History className="size-3.5" />
                            Letzte Bewegungen
                        </div>
                        <div className="mt-3 flex flex-col gap-2">
                            { snap.recent.length === 0 ? (
                                <div className="rounded-lg bg-bg-weak-50 p-4 text-center text-paragraph-sm text-text-sub-600">
                                    Noch keine Bewegungen.
                                </div>
                            ) : (
                                snap.recent.map((tx, i) => (
                                    <div key={ i } className="flex items-center gap-3 rounded-lg ring-1 ring-inset ring-stroke-soft-200 px-3 py-2.5">
                                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-bg-white-0 ring-1 ring-inset ring-stroke-soft-200 text-text-sub-600">
                                            { tx.amount >= 0 ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" /> }
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-label-sm text-text-strong-950">{ tx.reason }</div>
                                            <div className="truncate text-paragraph-xs text-text-sub-600">{ formatRelative(tx.timestamp) }</div>
                                        </div>
                                        <div className={ `text-label-sm tabular-nums ${
                                            tx.amount >= 0 ? 'text-success-base' : 'text-error-base'
                                        }` }>
                                            { tx.amount >= 0 ? '+' : '' }{ tx.amount }
                                        </div>
                                    </div>
                                ))
                            ) }
                        </div>
                    </div>

                    <AlignDivider.Root variant="line-text">So verdienst du Zigaretten</AlignDivider.Root>

                    { /* Earn-Wege */ }
                    <div className="flex flex-col gap-2">
                        <EarnRow
                            icon={ Hammer }
                            title="Stein klopfen"
                            detail="+3 Cigs · -90s Strafzeit · max 5×"
                        />
                        <EarnRow
                            icon={ Footprints }
                            title="Hofgang-Lauf"
                            detail="+2 Cigs · -60s Strafzeit · max 4×"
                        />
                        <EarnRow
                            icon={ Lock }
                            title="Lockpick-Master"
                            detail="+5 Cigs · -120s Strafzeit · 3 Versuche"
                        />
                        <EarnRow
                            icon={ Sparkles }
                            title="Tagesbonus"
                            detail="5 Cigs + Streak-Bonus (bis +20)"
                        />
                    </div>
                </>
            ) }
        </JailDraggableDialog>
    );
};

const EarnRow: FC<{ icon: typeof Hammer; title: string; detail: string }> = ({ icon: Icon, title, detail }) => (
    <div className="flex items-center gap-3 rounded-lg bg-bg-weak-50 px-3 py-2.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-bg-white-0 ring-1 ring-inset ring-stroke-soft-200">
            <Icon className="size-4 text-text-sub-600" />
        </div>
        <div className="min-w-0 flex-1">
            <div className="text-label-sm text-text-strong-950">{ title }</div>
            <div className="text-paragraph-xs text-text-sub-600">{ detail }</div>
        </div>
    </div>
);
