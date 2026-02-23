import { FC, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { NotificationDialogMessageEvent } from '@nitrots/nitro-renderer';
import { GetRoomSession } from '../../api';
import { useMessageEvent } from '../../hooks';

const BG_CARD = 'rgba(0,0,0,0.2)';
const WHITE40 = 'rgba(255,255,255,0.4)';
const GREEN = '#22c55e';
const YELLOW = '#facc15';
const CYAN = '#06b6d4';
const ORANGE = '#fb923c';

interface ShopData {
    waterCost: number; waterEnergy: number;
    energyCost: number; energyEnergy: number;
    proteinCost: number; proteinEnergy: number;
    credits: number; pixels: number;
}

const drinks = [
    { key: 'water', cmd: 'water', emoji: '💧', name: 'Wasser', desc: 'Leichte Erfrischung', color: CYAN },
    { key: 'energy', cmd: 'energy', emoji: '⚡', name: 'Energy-Drink', desc: 'Starker Boost', color: ORANGE },
    { key: 'protein', cmd: 'protein', emoji: '🥤', name: 'Protein-Shake', desc: 'Maximale Energie', color: GREEN },
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

            <div className="relative w-[420px] max-h-[85vh] rounded-2xl border border-white/[0.08] bg-white/[0.04] p-0.5 shadow-2xl">
                <div className="relative flex flex-col overflow-hidden rounded-[14px] border border-white/[0.06] bg-[rgba(12,12,16,0.97)] max-h-[calc(85vh-4px)]">

                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-gradient-to-b from-green-500/[0.08] to-transparent shrink-0">
                        <div className="flex items-center gap-2.5">
                            <span className="text-lg">🏪</span>
                            <span className="text-sm font-semibold text-white/90 tracking-tight">Energie-Shop</span>
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
                                <span>⚡</span>
                                <span className="font-bold" style={{ color: ORANGE }}>{data.pixels.toLocaleString()}</span>
                                <span style={{ color: WHITE40 }}>Energie</span>
                            </div>
                        </div>

                        {/* Drinks */}
                        <div className="flex flex-col gap-2">
                            {drinks.map(drink => {
                                const d = getDrinkData(drink.key);
                                const canAfford = data.credits >= d.cost;
                                const justBought = bought === drink.cmd;

                                return (
                                    <div key={drink.key}
                                        className="flex items-center gap-3 p-3 rounded-xl border transition-all"
                                        style={{
                                            background: BG_CARD,
                                            borderColor: justBought ? `${GREEN}40` : 'rgba(255,255,255,0.06)',
                                        }}>
                                        <span className="text-2xl">{drink.emoji}</span>
                                        <div className="flex-1">
                                            <div className="text-sm font-semibold text-white/90">{drink.name}</div>
                                            <div className="text-[11px]" style={{ color: WHITE40 }}>{drink.desc}</div>
                                            <div className="flex items-center gap-3 mt-1 text-[11px]">
                                                <span style={{ color: YELLOW }}>💰 {d.cost} Credits</span>
                                                <span style={{ color: drink.color }}>⚡ +{d.energy} Energie</span>
                                            </div>
                                        </div>
                                        <button
                                            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                            style={{
                                                background: justBought ? GREEN : canAfford ? `${drink.color}20` : 'rgba(255,255,255,0.03)',
                                                color: justBought ? '#fff' : canAfford ? drink.color : 'rgba(255,255,255,0.2)',
                                                border: `1px solid ${justBought ? GREEN : canAfford ? `${drink.color}30` : 'rgba(255,255,255,0.06)'}`,
                                                cursor: canAfford && !bought ? 'pointer' : 'not-allowed',
                                            }}
                                            disabled={!canAfford || !!bought}
                                            onClick={() => handleBuy(drink.cmd)}>
                                            {justBought ? '✓' : 'Kaufen'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Info */}
                        <div className="text-center text-[10px]" style={{ color: WHITE40 }}>
                            Energie wird für das Training auf Gym-Geräten verbraucht
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
