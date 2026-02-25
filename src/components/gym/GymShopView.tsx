import { FC, useState } from 'react';
import { NotificationDialogMessageEvent } from '@nitrots/nitro-renderer';
import { GetRoomSession } from '../../api';
import { useMessageEvent } from '../../hooks';
import { DraggableWindow, DraggableWindowPosition } from '../../common/draggable-window';
import { Frame, FramePanel } from '../ui/frame';
import { Button } from '../ui/button';
import { Store, X } from 'lucide-react';

interface ShopData {
    waterCost: number; waterEnergy: number;
    energyCost: number; energyEnergy: number;
    proteinCost: number; proteinEnergy: number;
    credits: number; pixels: number;
}

const drinks = [
    { key: 'water', cmd: 'water', emoji: '💧', name: 'Wasser', desc: 'Leichte Erfrischung', color: 'text-cyan-500', borderActive: 'border-cyan-500/30' },
    { key: 'energy', cmd: 'energy', emoji: '⚡', name: 'Energy-Drink', desc: 'Starker Boost', color: 'text-orange-500', borderActive: 'border-orange-500/30' },
    { key: 'protein', cmd: 'protein', emoji: '🥤', name: 'Protein-Shake', desc: 'Maximale Energie', color: 'text-emerald-500', borderActive: 'border-emerald-500/30' },
];

export const GymShopView: FC<{}> = () =>
{
    const [isVisible, setIsVisible] = useState(false);
    const [data, setData] = useState<ShopData | null>(null);
    const [bought, setBought] = useState<string | null>(null);

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

    const handleBuy = (drinkCmd: string) => {
        const session = GetRoomSession();
        if (session) {
            session.sendChatMessage(`:gym buy ${drinkCmd}`, 0);
            setBought(drinkCmd);
            setTimeout(() => setIsVisible(false), 1200);
        }
    };

    if (!isVisible || !data) return null;

    const getDrinkData = (key: string) => {
        switch (key) {
            case 'water': return { cost: data.waterCost, energy: data.waterEnergy };
            case 'energy': return { cost: data.energyCost, energy: data.energyEnergy };
            case 'protein': return { cost: data.proteinCost, energy: data.proteinEnergy };
            default: return { cost: 0, energy: 0 };
        }
    };

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center pointer-events-auto">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsVisible(false)} />
            <DraggableWindow handleSelector=".drag-handler" windowPosition={ DraggableWindowPosition.CENTER }>
                <div className="w-[420px]">
                    <Frame className="relative">
                        <div className="drag-handler absolute inset-0 cursor-move" />
                        <FramePanel className="overflow-hidden p-0! relative z-10">
                            <div className="flex items-center justify-between px-4 py-2.5 border-b">
                                <div className="flex items-center gap-2">
                                    <Store className="size-4 text-emerald-500" />
                                    <span className="text-sm font-semibold">Energie-Shop</span>
                                </div>
                                <button className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" onClick={() => setIsVisible(false)}>
                                    <X className="size-3.5" />
                                </button>
                            </div>

                            <div className="px-4 py-3 space-y-3">
                                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                                    <span>💰 <span className="font-semibold text-foreground">{data.credits.toLocaleString()}</span> Credits</span>
                                    <span>⚡ <span className="font-semibold text-foreground">{data.pixels.toLocaleString()}</span> Energie</span>
                                </div>

                                <div className="space-y-2">
                                    {drinks.map(drink => {
                                        const d = getDrinkData(drink.key);
                                        const canAfford = data.credits >= d.cost;
                                        const justBought = bought === drink.cmd;

                                        return (
                                            <div key={drink.key} className={ `flex items-center gap-3 p-3 rounded-lg border transition-all ${ justBought ? 'border-emerald-500/30' : 'border-border' }` }>
                                                <span className="text-2xl">{drink.emoji}</span>
                                                <div className="flex-1">
                                                    <div className="text-sm font-semibold text-foreground">{drink.name}</div>
                                                    <div className="text-[11px] text-muted-foreground">{drink.desc}</div>
                                                    <div className="flex items-center gap-3 mt-1 text-[11px]">
                                                        <span className="text-amber-500">💰 {d.cost} Credits</span>
                                                        <span className={ drink.color }>⚡ +{d.energy} Energie</span>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant={ justBought ? 'default' : 'outline' }
                                                    disabled={ !canAfford || !!bought }
                                                    onClick={ () => handleBuy(drink.cmd) }>
                                                    { justBought ? '✓' : 'Kaufen' }
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="text-center text-[10px] text-muted-foreground">
                                    Energie wird für das Training auf Gym-Geräten verbraucht
                                </div>
                            </div>
                        </FramePanel>
                    </Frame>
                </div>
            </DraggableWindow>
        </div>
    );
};
