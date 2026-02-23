import { FC, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { NotificationDialogMessageEvent } from '@nitrots/nitro-renderer';
import { GetRoomSession } from '../../api';
import { useMessageEvent } from '../../hooks';

const BG_CARD = 'rgba(0,0,0,0.2)';
const WHITE40 = 'rgba(255,255,255,0.4)';
const GREEN = '#22c55e';
const YELLOW = '#facc15';
const RED = '#ef4444';
const CYAN = '#06b6d4';
const ORANGE = '#fb923c';
const PURPLE = '#a855f7';

interface WeaponInfo {
    name: string;
    displayName: string;
    emoji: string;
    damage: number;
    cost: number;
    owned: boolean;
    color: string;
    desc: string;
}

interface ShopData {
    credits: number;
    weapons: WeaponInfo[];
    armourCost: number;
    armourOwned: boolean;
    armourReduction: number;
    equippedWeapon: string;
    armourEquipped: boolean;
}

const WEAPON_META: Record<string, { emoji: string; color: string; desc: string; displayName: string }> = {
    bat: { emoji: '🏏', color: ORANGE, desc: 'Basis-Waffe', displayName: 'Schläger' },
    lockpick: { emoji: '🔑', color: WHITE40, desc: 'Tool für Crime', displayName: 'Lockpick' },
    axe: { emoji: '🪓', color: RED, desc: 'Mittlere Waffe', displayName: 'Axt' },
    sword: { emoji: '⚔️', color: PURPLE, desc: 'Stärkste Waffe', displayName: 'Schwert' },
};

export const CombatShopView: FC<{}> = () =>
{
    const [isVisible, setIsVisible] = useState(false);
    const [data, setData] = useState<ShopData | null>(null);
    const [bought, setBought] = useState<string | null>(null);

    useMessageEvent<NotificationDialogMessageEvent>(NotificationDialogMessageEvent, event =>
    {
        const parser = event.getParser();
        if (parser.type !== 'combat.shop') return;

        const p = parser.parameters;
        const weaponsList: WeaponInfo[] = [];

        for (const [key, meta] of Object.entries(WEAPON_META)) {
            const damage = parseInt(p?.get(`weapon.${key}.damage`) || '0');
            const cost = parseInt(p?.get(`weapon.${key}.cost`) || '0');
            const owned = p?.get(`weapon.${key}.owned`) === '1';
            weaponsList.push({
                name: key,
                displayName: meta.displayName,
                emoji: meta.emoji,
                damage,
                cost,
                owned,
                color: meta.color,
                desc: meta.desc,
            });
        }

        setData({
            credits: parseInt(p?.get('credits') || '0'),
            weapons: weaponsList,
            armourCost: parseInt(p?.get('armour.cost') || '150'),
            armourOwned: p?.get('armour.owned') === '1',
            armourReduction: parseInt(p?.get('armour.reduction') || '30'),
            equippedWeapon: p?.get('equipped_weapon') || 'fist',
            armourEquipped: p?.get('armour_equipped') === '1',
        });
        setBought(null);
        setIsVisible(true);
    });

    const handleBuy = (itemName: string) => {
        const session = GetRoomSession();
        if (session) {
            session.sendChatMessage(`:combat buy ${itemName}`, 0);
            setBought(itemName);
            setTimeout(() => {
                setIsVisible(false);
            }, 1200);
        }
    };

    const handleEquip = (itemName: string) => {
        const session = GetRoomSession();
        if (session) {
            session.sendChatMessage(`:combat equip ${itemName}`, 0);
            setTimeout(() => setIsVisible(false), 500);
        }
    };

    if (!isVisible || !data) return null;

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center pointer-events-auto">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsVisible(false)} />

            <div className="relative w-[440px] max-h-[85vh] rounded-2xl border border-white/[0.08] bg-white/[0.04] p-0.5 shadow-2xl">
                <div className="relative flex flex-col overflow-hidden rounded-[14px] border border-white/[0.06] bg-[rgba(12,12,16,0.97)] max-h-[calc(85vh-4px)]">

                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-gradient-to-b from-red-500/[0.08] to-transparent shrink-0">
                        <div className="flex items-center gap-2.5">
                            <span className="text-lg">⚔️</span>
                            <span className="text-sm font-semibold text-white/90 tracking-tight">Waffen-Shop</span>
                        </div>
                        <button className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.08] transition-all"
                            onClick={() => setIsVisible(false)}>
                            <FaTimes className="size-3" />
                        </button>
                    </div>

                    <div className="flex-1 min-h-0 overflow-auto px-5 pb-5 pt-4 flex flex-col gap-4">

                        {/* Balance */}
                        <div className="flex items-center justify-center gap-4 text-xs">
                            <div className="flex items-center gap-1.5">
                                <span>💰</span>
                                <span className="font-bold" style={{ color: YELLOW }}>{data.credits.toLocaleString()}</span>
                                <span style={{ color: WHITE40 }}>Credits</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span>⚔️</span>
                                <span className="font-bold text-white/90">{WEAPON_META[data.equippedWeapon]?.displayName || 'Fäuste'}</span>
                                <span style={{ color: WHITE40 }}>ausgerüstet</span>
                            </div>
                        </div>

                        {/* Weapons */}
                        <div className="flex flex-col gap-2">
                            {data.weapons.map(weapon => {
                                const justBought = bought === weapon.name;
                                const canAfford = data.credits >= weapon.cost;
                                const isEquipped = data.equippedWeapon === weapon.name;

                                return (
                                    <div key={weapon.name}
                                        className="flex items-center gap-3 p-3 rounded-xl border transition-all"
                                        style={{
                                            background: BG_CARD,
                                            borderColor: isEquipped ? `${GREEN}40` : justBought ? `${GREEN}40` : 'rgba(255,255,255,0.06)',
                                        }}>
                                        <span className="text-2xl">{weapon.emoji}</span>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-white/90">{weapon.displayName}</span>
                                                {isEquipped && <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">Ausgerüstet</span>}
                                            </div>
                                            <div className="text-[11px]" style={{ color: WHITE40 }}>{weapon.desc}</div>
                                            <div className="flex items-center gap-3 mt-1 text-[11px]">
                                                {weapon.damage > 0 && <span style={{ color: RED }}>⚔️ {weapon.damage} Schaden</span>}
                                                <span style={{ color: YELLOW }}>💰 {weapon.cost} Credits</span>
                                            </div>
                                        </div>
                                        {weapon.owned ? (
                                            <button
                                                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                                style={{
                                                    background: isEquipped ? `${GREEN}20` : 'rgba(255,255,255,0.05)',
                                                    color: isEquipped ? GREEN : 'rgba(255,255,255,0.6)',
                                                    border: `1px solid ${isEquipped ? `${GREEN}30` : 'rgba(255,255,255,0.1)'}`,
                                                    cursor: isEquipped ? 'default' : 'pointer',
                                                }}
                                                disabled={isEquipped}
                                                onClick={() => handleEquip(weapon.name)}>
                                                {isEquipped ? '✓' : 'Anlegen'}
                                            </button>
                                        ) : (
                                            <button
                                                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                                style={{
                                                    background: justBought ? GREEN : canAfford ? `${weapon.color}20` : 'rgba(255,255,255,0.03)',
                                                    color: justBought ? '#fff' : canAfford ? weapon.color : 'rgba(255,255,255,0.2)',
                                                    border: `1px solid ${justBought ? GREEN : canAfford ? `${weapon.color}30` : 'rgba(255,255,255,0.06)'}`,
                                                    cursor: canAfford && !bought ? 'pointer' : 'not-allowed',
                                                }}
                                                disabled={!canAfford || !!bought}
                                                onClick={() => handleBuy(weapon.name)}>
                                                {justBought ? '✓' : 'Kaufen'}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Armour */}
                            <div className="flex items-center gap-3 p-3 rounded-xl border transition-all"
                                style={{
                                    background: BG_CARD,
                                    borderColor: data.armourEquipped ? `${CYAN}40` : 'rgba(255,255,255,0.06)',
                                }}>
                                <span className="text-2xl">🛡️</span>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-white/90">Rüstung</span>
                                        {data.armourEquipped && <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400">Angelegt</span>}
                                    </div>
                                    <div className="text-[11px]" style={{ color: WHITE40 }}>Reduziert eingehenden Schaden</div>
                                    <div className="flex items-center gap-3 mt-1 text-[11px]">
                                        <span style={{ color: CYAN }}>🛡️ -{data.armourReduction}% Schaden</span>
                                        <span style={{ color: YELLOW }}>💰 {data.armourCost} Credits</span>
                                    </div>
                                </div>
                                {data.armourOwned ? (
                                    <button
                                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                        style={{
                                            background: data.armourEquipped ? `${CYAN}20` : 'rgba(255,255,255,0.05)',
                                            color: data.armourEquipped ? CYAN : 'rgba(255,255,255,0.6)',
                                            border: `1px solid ${data.armourEquipped ? `${CYAN}30` : 'rgba(255,255,255,0.1)'}`,
                                            cursor: data.armourEquipped ? 'default' : 'pointer',
                                        }}
                                        disabled={data.armourEquipped}
                                        onClick={() => handleEquip('armour')}>
                                        {data.armourEquipped ? '✓' : 'Anlegen'}
                                    </button>
                                ) : (
                                    <button
                                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                        style={{
                                            background: bought === 'armour' ? GREEN : data.credits >= data.armourCost ? `${CYAN}20` : 'rgba(255,255,255,0.03)',
                                            color: bought === 'armour' ? '#fff' : data.credits >= data.armourCost ? CYAN : 'rgba(255,255,255,0.2)',
                                            border: `1px solid ${bought === 'armour' ? GREEN : data.credits >= data.armourCost ? `${CYAN}30` : 'rgba(255,255,255,0.06)'}`,
                                            cursor: data.credits >= data.armourCost && !bought ? 'pointer' : 'not-allowed',
                                        }}
                                        disabled={data.credits < data.armourCost || !!bought}
                                        onClick={() => handleBuy('armour')}>
                                        {bought === 'armour' ? '✓' : 'Kaufen'}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="text-center text-[10px]" style={{ color: WHITE40 }}>
                            Nutze :combat equip/unequip zum Ausrüsten
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
