import { AdjustmentFilter } from '@nitrots/nitro-renderer';
import { Container } from '@pixi/display';
import { FC, useEffect, useRef } from 'react';
import { GetRoomEngine } from '../../api';
import { useRoom } from '../../hooks';

interface DayNightPreset
{
    hour: number;
    brightness: number;
    saturation: number;
    red: number;
    green: number;
    blue: number;
    gamma: number;
}

const PRESETS: DayNightPreset[] = [
    { hour: 0,  brightness: 0.55, saturation: 0.7,  red: 0.7,  green: 0.75, blue: 1.2,  gamma: 0.85 },
    { hour: 5,  brightness: 0.55, saturation: 0.7,  red: 0.7,  green: 0.75, blue: 1.2,  gamma: 0.85 },
    { hour: 7,  brightness: 0.85, saturation: 0.95, red: 1.1,  green: 0.95, blue: 0.85, gamma: 1.0  },
    { hour: 8,  brightness: 1.0,  saturation: 1.0,  red: 1.0,  green: 1.0,  blue: 1.0,  gamma: 1.0  },
    { hour: 17, brightness: 1.0,  saturation: 1.0,  red: 1.0,  green: 1.0,  blue: 1.0,  gamma: 1.0  },
    { hour: 19, brightness: 0.85, saturation: 0.9,  red: 1.15, green: 0.9,  blue: 0.8,  gamma: 0.95 },
    { hour: 21, brightness: 0.7,  saturation: 0.8,  red: 0.85, green: 0.8,  blue: 1.1,  gamma: 0.9  },
    { hour: 22, brightness: 0.55, saturation: 0.7,  red: 0.7,  green: 0.75, blue: 1.2,  gamma: 0.85 },
    { hour: 24, brightness: 0.55, saturation: 0.7,  red: 0.7,  green: 0.75, blue: 1.2,  gamma: 0.85 },
];

const FILTER_KEYS: (keyof DayNightPreset)[] = ['brightness', 'saturation', 'red', 'green', 'blue', 'gamma'];

function lerp(a: number, b: number, t: number): number
{
    return a + (b - a) * t;
}

function getValuesForTime(hourFraction: number): Omit<DayNightPreset, 'hour'>
{
    const h = ((hourFraction % 24) + 24) % 24;

    let lower = PRESETS[0];
    let upper = PRESETS[1];

    for(let i = 0; i < PRESETS.length - 1; i++)
    {
        if(h >= PRESETS[i].hour && h < PRESETS[i + 1].hour)
        {
            lower = PRESETS[i];
            upper = PRESETS[i + 1];
            break;
        }
    }

    const range = upper.hour - lower.hour;
    const t = range > 0 ? (h - lower.hour) / range : 0;

    return {
        brightness: lerp(lower.brightness, upper.brightness, t),
        saturation: lerp(lower.saturation, upper.saturation, t),
        red: lerp(lower.red, upper.red, t),
        green: lerp(lower.green, upper.green, t),
        blue: lerp(lower.blue, upper.blue, t),
        gamma: lerp(lower.gamma, upper.gamma, t),
    };
}

export const DayNightView: FC<{}> = () =>
{
    const { roomSession = null } = useRoom();
    const filterRef = useRef<AdjustmentFilter | null>(null);
    const containerRef = useRef<Container | null>(null);
    const overrideRef = useRef<Partial<DayNightPreset> | null>(null);

    useEffect(() =>
    {
        if(!roomSession) return;

        const canvas = GetRoomEngine().getRoomInstanceRenderingCanvas(roomSession.roomId, 1);
        if(!canvas) return;

        // Filter auf _zoomWrapper setzen (= display.parent), NICHT auf display direkt.
        // display hat cacheAsBitmap — PixiJS deaktiviert cacheAsBitmap wenn filters gesetzt sind.
        const display = canvas.display as Container;
        const zoomWrapper = display.parent as Container;
        if(!zoomWrapper) return;

        const filter = new AdjustmentFilter();
        filterRef.current = filter;
        containerRef.current = zoomWrapper;
        zoomWrapper.filters = [...(zoomWrapper.filters || []), filter];

        const update = () =>
        {
            if(!filterRef.current) return;

            const now = new Date();
            const hourFraction = now.getHours() + now.getMinutes() / 60;
            const values = overrideRef.current || getValuesForTime(hourFraction);

            for(const key of FILTER_KEYS)
            {
                if(values[key] !== undefined)
                {
                    (filterRef.current as any)[key] = values[key];
                }
            }
        };

        update();
        const interval = setInterval(update, 60000);

        return () =>
        {
            clearInterval(interval);
            if(containerRef.current)
            {
                containerRef.current.filters = (containerRef.current.filters || []).filter(f => f !== filterRef.current);
            }
            filterRef.current = null;
            containerRef.current = null;
        };
    }, [roomSession?.roomId]);

    useEffect(() =>
    {
        const handler = (e: Event) =>
        {
            const { preset } = (e as CustomEvent).detail;

            if(preset === 'auto')
            {
                overrideRef.current = null;
            }
            else
            {
                overrideRef.current = preset;
            }

            // Sofort Filter updaten
            if(filterRef.current)
            {
                const now = new Date();
                const hourFraction = now.getHours() + now.getMinutes() / 60;
                const values = overrideRef.current || getValuesForTime(hourFraction);

                for(const key of FILTER_KEYS)
                {
                    if(values[key] !== undefined)
                    {
                        (filterRef.current as any)[key] = values[key];
                    }
                }
            }
        };

        window.addEventListener('daynight_override', handler);

        return () => window.removeEventListener('daynight_override', handler);
    }, []);

    return null;
};
