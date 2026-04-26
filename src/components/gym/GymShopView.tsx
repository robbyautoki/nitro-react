import { FC, useState } from 'react';
import { NotificationDialogMessageEvent } from '@nitrots/nitro-renderer';
import { Coins, Droplets, Store, Zap } from 'lucide-react';
import { GetRoomSession } from '../../api';
import { useMessageEvent } from '../../hooks';
import { AlignGameWindow, MetricTile, SelectableCard } from '../align-game-ui';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as FancyButton from '@/align-ui/components/ui/fancy-button';

interface ShopData {
    waterCost: number; waterEnergy: number;
    energyCost: number; energyEnergy: number;
    proteinCost: number; proteinEnergy: number;
    credits: number; pixels: number;
}

const drinks = [
    { key: 'water', cmd: 'water', icon: Droplets, name: 'Wasser', desc: 'Leichte Erfrischung', colorClassName: 'text-information-base' },
    { key: 'energy', cmd: 'energy', icon: Zap, name: 'Energy-Drink', desc: 'Starker Boost', colorClassName: 'text-warning-base' },
    { key: 'protein', cmd: 'protein', icon: Store, name: 'Protein-Shake', desc: 'Maximale Energie', colorClassName: 'text-success-base' },
];

export const GymShopView: FC<{}> = () =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ data, setData ] = useState<ShopData | null>(null);
    const [ bought, setBought ] = useState<string | null>(null);

    useMessageEvent<NotificationDialogMessageEvent>(NotificationDialogMessageEvent, event =>
    {
        const parser = event.getParser();
        if (parser.type !== 'gym.shop') return;

        const p = parser.parameters;
        setData({
            waterCost: parseInt(p?.get('water_cost') || '5'),
            waterEnergy: parseInt(p?.get('water_energy') || '10'),
            energyCost: parseInt(p?.get('energy_cost') || '15'),
            energyEnergy: parseInt(p?.get('energy_energy') || '30'),
            proteinCost: parseInt(p?.get('protein_cost') || '30'),
            proteinEnergy: parseInt(p?.get('protein_energy') || '75'),
            credits: parseInt(p?.get('credits') || '0'),
            pixels: parseInt(p?.get('pixels') || '0'),
        });
        setBought(null);
        setIsVisible(true);
    });

    const handleBuy = (drinkCmd: string) =>
    {
        const session = GetRoomSession();
        if (session)
        {
            session.sendChatMessage(`:gym buy ${ drinkCmd }`, 0);
            setBought(drinkCmd);
            setTimeout(() => setIsVisible(false), 1200);
        }
    };

    if (!isVisible || !data) return null;

    const getDrinkData = (key: string) =>
    {
        switch (key)
        {
            case 'water': return { cost: data.waterCost, energy: data.waterEnergy };
            case 'energy': return { cost: data.energyCost, energy: data.energyEnergy };
            case 'protein': return { cost: data.proteinCost, energy: data.proteinEnergy };
            default: return { cost: 0, energy: 0 };
        }
    };

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-overlay backdrop-blur-[10px] pointer-events-auto" onClick={ () => setIsVisible(false) }>
            <div onClick={ event => event.stopPropagation() }>
                <AlignGameWindow
                    title="Energie-Shop"
                    subtitle="Boosts für das Training"
                    icon={ <Store className="size-4" /> }
                    widthClassName="w-[420px] max-w-[94vw]"
                    onClose={ () => setIsVisible(false) }
                >
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            <MetricTile icon={ <Coins className="size-4 text-warning-base" /> } value={ data.credits.toLocaleString() } label="Credits" />
                            <MetricTile icon={ <Zap className="size-4 text-success-base" /> } value={ data.pixels.toLocaleString() } label="Energie" />
                        </div>
                        <div className="space-y-2">
                            { drinks.map(drink =>
                            {
                                const drinkData = getDrinkData(drink.key);
                                const canAfford = data.credits >= drinkData.cost;
                                const justBought = bought === drink.cmd;
                                const Icon = drink.icon;

                                return (
                                    <SelectableCard key={ drink.key } as="div" selected={ justBought }>
                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-bg-weak-50 ring-1 ring-inset ring-stroke-soft-200">
                                            <Icon className={ `size-5 ${ drink.colorClassName }` } />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <div className="truncate text-label-sm text-text-strong-950">{ drink.name }</div>
                                                { justBought && <AlignBadge.Root color="green" variant="lighter" size="small">Gekauft</AlignBadge.Root> }
                                            </div>
                                            <div className="truncate text-paragraph-xs text-text-sub-600">{ drink.desc }</div>
                                            <div className="mt-1 flex flex-wrap items-center gap-2 text-subheading-2xs">
                                                <span className="text-warning-base">{ drinkData.cost } Credits</span>
                                                <span className="text-success-base">+{ drinkData.energy } Energie</span>
                                            </div>
                                        </div>
                                        <FancyButton.Root
                                            type="button"
                                            size="xsmall"
                                            variant={ justBought ? 'primary' : 'basic' }
                                            disabled={ !canAfford || !!bought }
                                            onClick={ () => handleBuy(drink.cmd) }
                                        >
                                            { justBought ? 'OK' : 'Kaufen' }
                                        </FancyButton.Root>
                                    </SelectableCard>
                                );
                            }) }
                        </div>
                        <div className="rounded-xl bg-bg-weak-50 px-3 py-2 text-center text-paragraph-xs text-text-sub-600">
                            Energie wird für das Training auf Gym-Geräten verbraucht.
                        </div>
                    </div>
                </AlignGameWindow>
            </div>
        </div>
    );
};
