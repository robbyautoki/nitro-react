import { FC, useState } from 'react';
import { NotificationDialogMessageEvent } from '@nitrots/nitro-renderer';
import { useMessageEvent } from '../../hooks';

interface TrainingData {
    xp: number;
    xpMax: number;
    elapsed: number;
    tickSeconds: number;
}

export const GymProgressView: FC<{}> = () =>
{
    const [training, setTraining] = useState<TrainingData | null>(null);

    useMessageEvent<NotificationDialogMessageEvent>(NotificationDialogMessageEvent, event =>
    {
        const parser = event.getParser();

        if (parser.type === 'gym.progress') {
            const p = parser.parameters;
            setTraining({
                xp: parseInt(p?.get('xp') || '0'),
                xpMax: parseInt(p?.get('xp_max') || '100'),
                elapsed: parseInt(p?.get('elapsed') || '0'),
                tickSeconds: parseInt(p?.get('tick_seconds') || '180'),
            });
        }

        if (parser.type === 'gym.progress.stop') {
            setTraining(null);
        }
    });

    if (!training) return null;

    const tickPercent = Math.min((training.elapsed / training.tickSeconds) * 100, 100);

    return (
        <div style={{
            position: 'fixed', bottom: 85, left: '50%', transform: 'translateX(-50%)',
            zIndex: 100, display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(0,0,0,0.8)', borderRadius: 10, padding: '8px 16px',
            border: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#06b6d4', whiteSpace: 'nowrap' }}>
                Training...
            </div>
            <div style={{
                width: 120, height: 8, borderRadius: 4, overflow: 'hidden',
                background: 'rgba(255,255,255,0.1)',
            }}>
                <div style={{
                    height: '100%', borderRadius: 4,
                    width: `${tickPercent}%`,
                    background: 'linear-gradient(90deg, #06b6d4, #3b82f6)',
                    transition: 'width 9.5s linear',
                }} />
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>
                {training.xp}/{training.xpMax} XP
            </div>
        </div>
    );
};
