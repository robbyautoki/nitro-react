import { FC, useState } from 'react';
import { NotificationDialogMessageEvent } from '@nitrots/nitro-renderer';
import { GetRoomSession } from '../../api';
import { useMessageEvent } from '../../hooks';
import { DraggableWindow, DraggableWindowPosition } from '../../common/draggable-window';
import { Frame, FramePanel } from '../ui/frame';
import { Button } from '../ui/button';
import { Swords, Shield, X } from 'lucide-react';

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
    bat: { emoji: '🏏', color: 'text-orange-500', desc: 'Basis-Waffe', displayName: 'Schläger' },
    lockpick: { emoji: '🔑', color: 'text-muted-foreground', desc: 'Tool für Crime', displayName: 'Lockpick' },
    axe: { emoji: '🪓', color: 'text-red-500', desc: 'Mittlere Waffe', displayName: 'Axt' },
    sword: { emoji: '⚔️', color: 'text-purple-500', desc: 'Stärkste Waffe', displayName: 'Schwert' },
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
            setTimeout(() => setIsVisible(false), 1200);
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
            <DraggableWindow handleSelector=".drag-handler" windowPosition={ DraggableWindowPosition.CENTER }>
                <div className="w-[440px]">
                    <Frame className="relative">
                        <div className="drag-handler absolute inset-0 cursor-move" />
                        <FramePanel className="overflow-hidden p-0! relative z-10">
                            <div className="flex items-center justify-between px-4 py-2.5 border-b">
                                <div className="flex items-center gap-2">
                                    <Swords className="size-4 text-red-500" />
                                    <span className="text-sm font-semibold">Waffen-Shop</span>
                                </div>
                                <button className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" onClick={() => setIsVisible(false)}>
                                    <X className="size-3.5" />
                                </button>
                            </div>

                            <div className="px-4 py-3 space-y-3 max-h-[70vh] overflow-auto">
                                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                                    <span>💰 <span className="font-semibold text-foreground">{data.credits.toLocaleString()}</span> Credits</span>
                                    <span>⚔️ <span className="font-semibold text-foreground">{WEAPON_META[data.equippedWeapon]?.displayName || 'Fäuste'}</span> ausgerüstet</span>
                                </div>

                                <div className="space-y-2">
                                    {data.weapons.map(weapon => {
                                        const justBought = bought === weapon.name;
                                        const canAfford = data.credits >= weapon.cost;
                                        const isEquipped = data.equippedWeapon === weapon.name;

                                        return (
                                            <div key={weapon.name} className={ `flex items-center gap-3 p-3 rounded-lg border transition-all ${ isEquipped ? 'border-emerald-500/30' : justBought ? 'border-emerald-500/30' : 'border-border' }` }>
                                                <span className="text-2xl">{weapon.emoji}</span>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-semibold text-foreground">{weapon.displayName}</span>
                                                        {isEquipped && <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-500">Ausgerüstet</span>}
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground">{weapon.desc}</div>
                                                    <div className="flex items-center gap-3 mt-1 text-[11px]">
                                                        {weapon.damage > 0 && <span className="text-red-500">⚔️ {weapon.damage} Schaden</span>}
                                                        <span className="text-amber-500">💰 {weapon.cost} Credits</span>
                                                    </div>
                                                </div>
                                                {weapon.owned ? (
                                                    <Button size="sm" variant={ isEquipped ? 'default' : 'outline' } disabled={ isEquipped } onClick={ () => handleEquip(weapon.name) }>
                                                        { isEquipped ? '✓' : 'Anlegen' }
                                                    </Button>
                                                ) : (
                                                    <Button size="sm" variant="outline" disabled={ !canAfford || !!bought } onClick={ () => handleBuy(weapon.name) }>
                                                        { justBought ? '✓' : 'Kaufen' }
                                                    </Button>
                                                )}
                                            </div>
                                        );
                                    })}

                                    <div className={ `flex items-center gap-3 p-3 rounded-lg border transition-all ${ data.armourEquipped ? 'border-cyan-500/30' : 'border-border' }` }>
                                        <span className="text-2xl">🛡️</span>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-foreground">Rüstung</span>
                                                {data.armourEquipped && <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-500">Angelegt</span>}
                                            </div>
                                            <div className="text-[11px] text-muted-foreground">Reduziert eingehenden Schaden</div>
                                            <div className="flex items-center gap-3 mt-1 text-[11px]">
                                                <span className="text-cyan-500">🛡️ -{data.armourReduction}% Schaden</span>
                                                <span className="text-amber-500">💰 {data.armourCost} Credits</span>
                                            </div>
                                        </div>
                                        {data.armourOwned ? (
                                            <Button size="sm" variant={ data.armourEquipped ? 'default' : 'outline' } disabled={ data.armourEquipped } onClick={ () => handleEquip('armour') }>
                                                { data.armourEquipped ? '✓' : 'Anlegen' }
                                            </Button>
                                        ) : (
                                            <Button size="sm" variant="outline" disabled={ data.credits < data.armourCost || !!bought } onClick={ () => handleBuy('armour') }>
                                                { bought === 'armour' ? '✓' : 'Kaufen' }
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="text-center text-[10px] text-muted-foreground">
                                    Nutze :combat equip/unequip zum Ausrüsten
                                </div>
                            </div>
                        </FramePanel>
                    </Frame>
                </div>
            </DraggableWindow>
        </div>
    );
};
