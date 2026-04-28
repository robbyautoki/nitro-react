import { NotificationDialogMessageEvent } from '@nitrots/nitro-renderer';
import { FC, useState } from 'react';
import { useAntiCheatToasts, useMessageEvent } from '../../hooks';
import { Diamond, ShoppingBag, Cigarette, Lock } from 'lucide-react';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignSurface from '@/align-ui/components/ui/surface';
import * as Modal from '@/align-ui/components/ui/modal';

type BailQuotePayload = {
    username: string;
    priceDiamonds: number;
    remainingMinutes: number;
    multiplier: number;
    escalationLevel: number;
    isSelfPayment: boolean;
};

type ShopItem = {
    key: string;
    label: string;
    description: string;
    category: string;
    price: number;
    minRank: string;
    cooldown: number;
};

type ShopPayload = {
    balance: number;
    currentRank: string;
    items: ShopItem[];
};

const RANK_LABEL: Record<string, string> = {
    rookie: 'Rookie',
    regular: 'Regular',
    veteran: 'Veteran',
    boss: 'Boss',
    legend: 'Legende'
};

const RANK_ORDER: Record<string, number> = {
    rookie: 0, regular: 1, veteran: 2, boss: 3, legend: 4
};

function decodePayload<T>(payload: string): T | null {
    try {
        const bytes = Uint8Array.from(atob(payload), c => c.charCodeAt(0));
        return JSON.parse(new TextDecoder().decode(bytes)) as T;
    } catch {
        return null;
    }
}

// ─── BAIL QUOTE INFO MODAL (read-only — user runs :bail to confirm) ──
const BailModal: FC<{ data: BailQuotePayload | null; onClose: () => void }> = ({ data, onClose }) => {
    if (!data) return null;

    const cmd = data.isSelfPayment ? ':bail self' : `:bail ${ data.username }`;

    return (
        <Modal.Root open={ !!data } onOpenChange={ (open) => { if (!open) onClose(); } }>
            <Modal.Content className="max-w-[420px]" showClose>
                <div className="p-6">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-information-lighter text-information-base">
                            <Diamond className="size-6" />
                        </div>
                        <div>
                            <div className="text-lg font-bold text-text-strong-950">Bail-Angebot</div>
                            <div className="text-sm text-text-sub-600">
                                { data.isSelfPayment ? 'Freikauf für dich selbst' : `Für ${ data.username }` }
                            </div>
                        </div>
                    </div>

                    <AlignSurface.Panel className="space-y-2 rounded-lg p-4">
                        <Stat label="Verbleibende Haft" value={ `${ data.remainingMinutes } Minuten` } />
                        <Stat label="Eskalations-Level" value={ String(data.escalationLevel) } />
                        <Stat label="Multiplikator" value={ `${ data.multiplier.toFixed(1) }x` } />
                        <div className="my-2 h-px bg-stroke-soft-200" />
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-text-strong-950">Endpreis</span>
                            <span className="flex items-center gap-1.5 text-xl font-black text-information-base">
                                <Diamond className="size-5" /> { data.priceDiamonds }
                            </span>
                        </div>
                    </AlignSurface.Panel>

                    <div className="mt-4 rounded-md bg-bg-weak-50 p-3 text-center font-mono text-sm text-text-strong-950">
                        Tippe in den Chat: <span className="font-bold text-information-base">{ cmd }</span>
                    </div>

                    <div className="mt-4 flex justify-end">
                        <AlignButton.Root variant="neutral" size="small" onClick={ onClose }>
                            Schließen
                        </AlignButton.Root>
                    </div>
                </div>
            </Modal.Content>
        </Modal.Root>
    );
};

const Stat: FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="flex items-center justify-between text-sm">
        <span className="text-text-sub-600">{ label }</span>
        <span className="font-medium text-text-strong-950">{ value }</span>
    </div>
);

// ─── SHOP MODAL (Knast-Shop für Zigaretten) ────────────────────
const ShopModal: FC<{ data: ShopPayload | null; onClose: () => void }> = ({ data, onClose }) => {
    if (!data) return null;
    const userRankIdx = RANK_ORDER[data.currentRank] ?? 0;

    return (
        <Modal.Root open={ !!data } onOpenChange={ (open) => { if (!open) onClose(); } }>
            <Modal.Content className="max-w-[640px]" showClose>
                <div className="p-6">
                    {/* Header */}
                    <div className="mb-4 flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-warning-lighter text-warning-base">
                            <ShoppingBag className="size-6" />
                        </div>
                        <div className="flex-1">
                            <div className="text-lg font-bold text-text-strong-950">Bahhos Knast-Shop</div>
                            <div className="text-sm text-text-sub-600">
                                Rang: <span className="font-semibold">{ RANK_LABEL[data.currentRank] ?? data.currentRank }</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-md bg-bg-weak-50 px-3 py-1.5 text-sm font-bold text-text-strong-950">
                            <Cigarette className="size-4" />
                            { data.balance }
                        </div>
                    </div>

                    {/* Items */}
                    <div className="grid max-h-[60vh] grid-cols-1 gap-2 overflow-y-auto pr-1">
                        { data.items.map(item => {
                            const reqIdx = RANK_ORDER[item.minRank] ?? 0;
                            const rankLocked = userRankIdx < reqIdx;
                            const tooPoor = data.balance < item.price;

                            return (
                                <AlignSurface.Panel key={ item.key } className="flex items-center gap-3 rounded-lg p-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <div className="font-semibold text-text-strong-950">{ item.label }</div>
                                            <span className="rounded bg-bg-weak-50 px-1.5 py-0.5 text-[10px] uppercase text-text-sub-600">
                                                { item.category }
                                            </span>
                                            { rankLocked && (
                                                <span className="inline-flex items-center gap-0.5 rounded bg-error-lighter px-1.5 py-0.5 text-[10px] text-error-base">
                                                    <Lock className="size-2.5" /> { RANK_LABEL[item.minRank] }
                                                </span>
                                            ) }
                                        </div>
                                        <div className="mt-1 text-xs text-text-sub-600">{ item.description }</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-1 text-base font-bold text-warning-base">
                                            <Cigarette className="size-4" />
                                            { item.price }
                                        </div>
                                        <div className="mt-1 font-mono text-[10px] text-text-sub-600">
                                            :knast_shop buy { item.key }
                                        </div>
                                    </div>
                                </AlignSurface.Panel>
                            );
                        }) }
                        { data.items.length === 0 && (
                            <div className="rounded-md bg-bg-weak-50 p-4 text-center text-sm text-text-sub-600">
                                Aktuell sind keine Items verfügbar.
                            </div>
                        ) }
                    </div>

                    {/* Footer */}
                    <div className="mt-4 flex items-center justify-between gap-2 border-t border-stroke-soft-200 pt-3">
                        <div className="text-xs text-text-sub-600">
                            Tippe Befehl im Chat. Tagesbonus: <span className="font-mono">:knast_shop bonus</span>
                        </div>
                        <AlignButton.Root variant="neutral" size="small" onClick={ onClose }>
                            Schließen
                        </AlignButton.Root>
                    </div>
                </div>
            </Modal.Content>
        </Modal.Root>
    );
};

// ─── MAIN VIEW ─────────────────────────────────────────────────
// jail.siren + jail.mugshot werden in useNotification.ts als MOTD-Toasts
// (Unified-Stack rechts oben) gerendert — nicht mehr hier als Fullscreen-Overlay.
// Anti-Cheat-Toasts laufen jetzt durch den geteilten `useAntiCheatToasts`
// Hook — gerendert in `NotificationCenterView` im Unified-Stack.
export const JailEnterpriseEffectsView: FC<{}> = () => {
    const [ bailQuote, setBailQuote ] = useState<BailQuotePayload | null>(null);
    const [ shop, setShop ] = useState<ShopPayload | null>(null);

    // Anti-Cheat-Listener mounten (geteilter State über useBetween)
    useAntiCheatToasts();

    useMessageEvent<NotificationDialogMessageEvent>(NotificationDialogMessageEvent, event => {
        const parser = event.getParser();

        switch (parser.type) {
            case 'jail.bail.quote': {
                const payload = parser.parameters?.get('payload') || '';
                const decoded = decodePayload<BailQuotePayload>(payload);
                if (decoded) setBailQuote(decoded);
                break;
            }
            case 'jail.bail.paid': {
                setBailQuote(null);
                break;
            }
            case 'jail.shop.catalog': {
                const payload = parser.parameters?.get('payload') || '';
                const decoded = decodePayload<ShopPayload>(payload);
                if (decoded) setShop(decoded);
                break;
            }
        }
    });

    return (
        <>
            <BailModal data={ bailQuote } onClose={ () => setBailQuote(null) } />
            <ShopModal data={ shop } onClose={ () => setShop(null) } />
        </>
    );
};
