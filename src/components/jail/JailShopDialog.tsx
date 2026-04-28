import { FC, useEffect, useMemo, useState } from 'react';
import { Cigarette, Gift, Lock, Package, ShoppingBag } from 'lucide-react';
import { GetRoomSession } from '../../api';
import { useJailShopSnapshot } from '../../hooks';
import { JailDraggableDialog } from './JailDraggableDialog';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignBadge from '@/align-ui/components/ui/badge';

function sendChat(command: string): boolean {
    const session = GetRoomSession();
    if (!session) return false;
    session.sendChatMessage(command, 0);
    return true;
}

function formatCooldown(seconds: number): string {
    if (seconds <= 0) return '';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${ s }s`;
    return `${ m }m ${ s }s`;
}

const RANK_LABEL: Record<string, string> = {
    rookie: 'Frischling',
    regular: 'Stammgast',
    veteran: 'Veteran',
    boss: 'Boss',
    legend: 'Legende'
};

type Tab = 'shop' | 'inventory';

export const JailShopDialog: FC = () => {
    const { snapshot, onResult } = useJailShopSnapshot();
    const [ tab, setTab ] = useState<Tab>('shop');
    const [ feedback, setFeedback ] = useState<{ ok: boolean; message: string } | null>(null);
    const [ pendingKey, setPendingKey ] = useState<string | null>(null);

    useEffect(() => {
        const off = onResult(result => {
            setFeedback(result);
            setPendingKey(null);
            window.setTimeout(() => setFeedback(null), 2800);
        });
        return off;
    }, [ onResult ]);

    const items = snapshot?.items ?? [];
    const owned = snapshot?.owned ?? [];
    const balance = snapshot?.balance ?? 0;
    const dailyAvail = snapshot?.dailyBonusAvailable ?? false;

    const ownedByKey = useMemo(() => {
        const map: Record<string, number> = {};
        for (const o of owned) map[o.key] = (map[o.key] ?? 0) + (o.quantity || 1);
        return map;
    }, [ owned ]);

    const buy = (key: string) => {
        if (pendingKey) return;
        setPendingKey(key);
        sendChat(`:_jail_buy ${ key }`);
    };

    const claimBonus = () => {
        if (pendingKey) return;
        setPendingKey('daily_bonus');
        sendChat(':_jail_buy daily_bonus');
    };

    return (
        <JailDraggableDialog
            id="shop"
            title="Knast-Shop"
            description={ `${ owned.length } Item${ owned.length === 1 ? '' : 's' } im Besitz` }
            icon={ ShoppingBag }
            width={ 440 }
            bodyClassName="flex flex-col gap-4"
            footer={
                <>
                    <div className="flex items-center gap-2">
                        <Cigarette className="size-4 text-text-sub-600" />
                        <span className="text-label-sm tabular-nums text-text-strong-950">{ balance }</span>
                        <span className="text-paragraph-xs text-text-sub-600">Zigaretten</span>
                    </div>
                    <AlignButton.Root
                        variant="primary"
                        mode="lighter"
                        size="small"
                        disabled={ !dailyAvail || pendingKey === 'daily_bonus' }
                        onClick={ claimBonus }
                    >
                        <AlignButton.Icon as={ Gift } className="size-4" />
                        { dailyAvail ? 'Tagesbonus abholen' : 'Tagesbonus erhalten' }
                    </AlignButton.Root>
                </>
            }
        >
            { /* Tabs */ }
            <div className="flex items-center gap-1 rounded-10 bg-bg-weak-50 p-1">
                <TabButton active={ tab === 'shop' } onClick={ () => setTab('shop') } icon={ ShoppingBag }>
                    Kaufen
                </TabButton>
                <TabButton active={ tab === 'inventory' } onClick={ () => setTab('inventory') } icon={ Package }>
                    Mein Besitz ({ owned.length })
                </TabButton>
            </div>

            { feedback && (
                <div className={ `rounded-lg px-3 py-2 text-paragraph-xs ${
                    feedback.ok
                        ? 'bg-success-lighter text-success-base'
                        : 'bg-error-lighter text-error-base'
                }` }>
                    { feedback.message }
                </div>
            ) }

            { tab === 'shop' ? (
                <div className="flex flex-col gap-2">
                    { items.length === 0 && (
                        <div className="rounded-xl bg-bg-weak-50 p-6 text-center text-paragraph-sm text-text-sub-600">
                            Shop wird geladen...
                        </div>
                    ) }
                    { items.map(item => {
                        const cd = snapshot?.cooldownRemaining?.[item.key] ?? 0;
                        const canAfford = snapshot?.canAfford?.[item.key] ?? false;
                        const rankOk = snapshot?.rankOk?.[item.key] ?? false;
                        const ownedQty = ownedByKey[item.key] ?? 0;
                        const disabled = cd > 0 || !canAfford || !rankOk || pendingKey === item.key;
                        return (
                            <div
                                key={ item.key }
                                className="rounded-xl ring-1 ring-inset ring-stroke-soft-200 p-4 transition hover:ring-stroke-sub-300"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <div className="text-label-sm text-text-strong-950">{ item.name }</div>
                                            { ownedQty > 0 && (
                                                <AlignBadge.Root size="small" variant="lighter" color="green">
                                                    x{ ownedQty }
                                                </AlignBadge.Root>
                                            ) }
                                        </div>
                                        <div className="mt-1 line-clamp-2 text-paragraph-sm text-text-sub-600">
                                            { item.description }
                                        </div>
                                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                            <AlignBadge.Root size="small" variant="lighter" color="orange">
                                                <AlignBadge.Icon as={ Cigarette } className="size-3" />
                                                { item.price }
                                            </AlignBadge.Root>
                                            { item.minRank && item.minRank !== 'rookie' && (
                                                <AlignBadge.Root size="small" variant="lighter" color={ rankOk ? 'blue' : 'gray' }>
                                                    { !rankOk && <AlignBadge.Icon as={ Lock } className="size-3" /> }
                                                    Ab { RANK_LABEL[item.minRank] || item.minRank }
                                                </AlignBadge.Root>
                                            ) }
                                            { cd > 0 && (
                                                <AlignBadge.Root size="small" variant="lighter" color="red">
                                                    { formatCooldown(cd) }
                                                </AlignBadge.Root>
                                            ) }
                                        </div>
                                    </div>
                                    <AlignButton.Root
                                        variant={ canAfford && rankOk && cd <= 0 ? 'primary' : 'neutral' }
                                        mode={ canAfford && rankOk && cd <= 0 ? 'filled' : 'stroke' }
                                        size="xsmall"
                                        disabled={ disabled }
                                        onClick={ () => buy(item.key) }
                                    >
                                        Kaufen
                                    </AlignButton.Root>
                                </div>
                            </div>
                        );
                    }) }
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    { owned.length === 0 ? (
                        <div className="rounded-xl bg-bg-weak-50 p-6 text-center text-paragraph-sm text-text-sub-600">
                            <Package className="mx-auto mb-2 size-7 text-text-soft-400" />
                            Noch keine Items gekauft.
                        </div>
                    ) : (
                        owned.map((entry, i) => {
                            const item = items.find(x => x.key === entry.key);
                            return (
                                <div key={ `${ entry.key }-${ i }` } className="flex items-center gap-3 rounded-lg bg-bg-weak-50 p-3">
                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-bg-white-0 ring-1 ring-inset ring-stroke-soft-200">
                                        <Package className="size-4 text-text-sub-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-label-sm text-text-strong-950">
                                            { item?.name || entry.key }
                                        </div>
                                        <div className="mt-0.5 text-paragraph-xs text-text-sub-600">
                                            { entry.quantity > 1 ? `${ entry.quantity }x · ` : '' }Gekauft am { new Date(entry.purchasedAt).toLocaleDateString() }
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) }
                </div>
            ) }
        </JailDraggableDialog>
    );
};

const TabButton: FC<{ active: boolean; onClick: () => void; icon?: typeof ShoppingBag; children: React.ReactNode }> = ({ active, onClick, icon: Icon, children }) => (
    <button
        type="button"
        onClick={ onClick }
        className={ `flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-label-sm transition ${
            active
                ? 'bg-bg-white-0 text-text-strong-950 shadow-regular-xs'
                : 'text-text-sub-600 hover:text-text-strong-950'
        }` }
    >
        { Icon && <Icon className="size-4" /> }
        <span>{ children }</span>
    </button>
);
