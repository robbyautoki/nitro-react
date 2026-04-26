import { FC, useState } from 'react';
import { NotificationDialogMessageEvent } from '@nitrots/nitro-renderer';
import { Coins, KeyRound, Shield, Swords, Wrench } from 'lucide-react';
import { GetRoomSession } from '../../api';
import { useMessageEvent } from '../../hooks';
import { AlignGameWindow, MetricTile, SelectableCard } from '../align-game-ui';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as FancyButton from '@/align-ui/components/ui/fancy-button';

interface WeaponInfo {
    name: string;
    displayName: string;
    damage: number;
    cost: number;
    owned: boolean;
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

const WEAPON_META: Record<string, { icon: typeof Swords; desc: string; displayName: string; colorClassName: string }> = {
    bat: { icon: Wrench, desc: 'Basis-Waffe', displayName: 'Schläger', colorClassName: 'text-warning-base' },
    lockpick: { icon: KeyRound, desc: 'Tool für Crime', displayName: 'Lockpick', colorClassName: 'text-text-sub-600' },
    axe: { icon: Swords, desc: 'Mittlere Waffe', displayName: 'Axt', colorClassName: 'text-error-base' },
    sword: { icon: Swords, desc: 'Stärkste Waffe', displayName: 'Schwert', colorClassName: 'text-feature-base' },
};

export const CombatShopView: FC<{}> = () =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ data, setData ] = useState<ShopData | null>(null);
    const [ bought, setBought ] = useState<string | null>(null);

    useMessageEvent<NotificationDialogMessageEvent>(NotificationDialogMessageEvent, event =>
    {
        const parser = event.getParser();
        if (parser.type !== 'combat.shop') return;

        const p = parser.parameters;
        const weaponsList: WeaponInfo[] = [];

        for (const [ key, meta ] of Object.entries(WEAPON_META))
        {
            const damage = parseInt(p?.get(`weapon.${ key }.damage`) || '0');
            const cost = parseInt(p?.get(`weapon.${ key }.cost`) || '0');
            const owned = p?.get(`weapon.${ key }.owned`) === '1';
            weaponsList.push({
                name: key,
                displayName: meta.displayName,
                damage,
                cost,
                owned,
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

    const handleBuy = (itemName: string) =>
    {
        const session = GetRoomSession();
        if (session)
        {
            session.sendChatMessage(`:combat buy ${ itemName }`, 0);
            setBought(itemName);
            setTimeout(() => setIsVisible(false), 1200);
        }
    };

    const handleEquip = (itemName: string) =>
    {
        const session = GetRoomSession();
        if (session)
        {
            session.sendChatMessage(`:combat equip ${ itemName }`, 0);
            setTimeout(() => setIsVisible(false), 500);
        }
    };

    if (!isVisible || !data) return null;

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-overlay backdrop-blur-[10px] pointer-events-auto" onClick={ () => setIsVisible(false) }>
            <div onClick={ event => event.stopPropagation() }>
                <AlignGameWindow
                    title="Waffen-Shop"
                    subtitle="Ausrüstung kaufen und anlegen"
                    icon={ <Swords className="size-4" /> }
                    widthClassName="w-[440px] max-w-[94vw]"
                    onClose={ () => setIsVisible(false) }
                >
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            <MetricTile icon={ <Coins className="size-4 text-warning-base" /> } value={ data.credits.toLocaleString() } label="Credits" />
                            <MetricTile icon={ <Swords className="size-4 text-error-base" /> } value={ WEAPON_META[data.equippedWeapon]?.displayName || 'Fäuste' } label="Ausgerüstet" />
                        </div>
                        <div className="space-y-2">
                            { data.weapons.map(weapon =>
                            {
                                const justBought = bought === weapon.name;
                                const canAfford = data.credits >= weapon.cost;
                                const isEquipped = data.equippedWeapon === weapon.name;
                                const meta = WEAPON_META[weapon.name];
                                const Icon = meta.icon;

                                return (
                                    <SelectableCard key={ weapon.name } as="div" selected={ isEquipped || justBought }>
                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-bg-weak-50 ring-1 ring-inset ring-stroke-soft-200">
                                            <Icon className={ `size-5 ${ meta.colorClassName }` } />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <div className="truncate text-label-sm text-text-strong-950">{ weapon.displayName }</div>
                                                { isEquipped && <AlignBadge.Root color="green" variant="lighter" size="small">Ausgerüstet</AlignBadge.Root> }
                                            </div>
                                            <div className="truncate text-paragraph-xs text-text-sub-600">{ weapon.desc }</div>
                                            <div className="mt-1 flex flex-wrap items-center gap-2 text-subheading-2xs">
                                                { weapon.damage > 0 && <span className="text-error-base">{ weapon.damage } Schaden</span> }
                                                <span className="text-warning-base">{ weapon.cost } Credits</span>
                                            </div>
                                        </div>
                                        { weapon.owned ? (
                                            <FancyButton.Root type="button" size="xsmall" variant={ isEquipped ? 'primary' : 'basic' } disabled={ isEquipped } onClick={ () => handleEquip(weapon.name) }>
                                                { isEquipped ? 'OK' : 'Anlegen' }
                                            </FancyButton.Root>
                                        ) : (
                                            <FancyButton.Root type="button" size="xsmall" variant="basic" disabled={ !canAfford || !!bought } onClick={ () => handleBuy(weapon.name) }>
                                                { justBought ? 'OK' : 'Kaufen' }
                                            </FancyButton.Root>
                                        ) }
                                    </SelectableCard>
                                );
                            }) }
                            <SelectableCard as="div" selected={ data.armourEquipped }>
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-bg-weak-50 ring-1 ring-inset ring-stroke-soft-200">
                                    <Shield className="size-5 text-information-base" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <div className="truncate text-label-sm text-text-strong-950">Rüstung</div>
                                        { data.armourEquipped && <AlignBadge.Root color="blue" variant="lighter" size="small">Angelegt</AlignBadge.Root> }
                                    </div>
                                    <div className="truncate text-paragraph-xs text-text-sub-600">Reduziert eingehenden Schaden</div>
                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-subheading-2xs">
                                        <span className="text-information-base">-{ data.armourReduction }% Schaden</span>
                                        <span className="text-warning-base">{ data.armourCost } Credits</span>
                                    </div>
                                </div>
                                { data.armourOwned ? (
                                    <FancyButton.Root type="button" size="xsmall" variant={ data.armourEquipped ? 'primary' : 'basic' } disabled={ data.armourEquipped } onClick={ () => handleEquip('armour') }>
                                        { data.armourEquipped ? 'OK' : 'Anlegen' }
                                    </FancyButton.Root>
                                ) : (
                                    <FancyButton.Root type="button" size="xsmall" variant="basic" disabled={ data.credits < data.armourCost || !!bought } onClick={ () => handleBuy('armour') }>
                                        { bought === 'armour' ? 'OK' : 'Kaufen' }
                                    </FancyButton.Root>
                                ) }
                            </SelectableCard>
                        </div>
                        <div className="rounded-xl bg-bg-weak-50 px-3 py-2 text-center text-paragraph-xs text-text-sub-600">
                            Nutze :combat equip/unequip zum Ausrüsten.
                        </div>
                    </div>
                </AlignGameWindow>
            </div>
        </div>
    );
};
