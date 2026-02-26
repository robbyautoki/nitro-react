import { IRoomObject, IRoomObjectSpriteVisualization, NitroFilter, RoomObjectCategory } from '@nitrots/nitro-renderer';
import { Ticker } from '@pixi/ticker';
import { GetRoomEngine } from '..';
import { NeonGlowFilter } from './filters/NeonGlowFilter';
import { RainbowGlowFilter } from './filters/RainbowGlowFilter';
import { FireGlowFilter } from './filters/FireGlowFilter';
import { SparkleFilter } from './filters/SparkleFilter';
import { HologramFilter } from './filters/HologramFilter';
import { ShadowGlowFilter } from './filters/ShadowGlowFilter';

export type GlowType = 'neon' | 'rainbow' | 'fire' | 'sparkle' | 'hologram' | 'shadow';

interface ActiveGlow
{
    filter: NitroFilter;
    furniId: number;
}

export class GlowEffectManager
{
    private static _activeGlows: Map<number, ActiveGlow> = new Map();
    private static _tickerAdded: boolean = false;
    private static _startTime: number = performance.now();

    private static ensureTicker(): void
    {
        if(GlowEffectManager._tickerAdded) return;

        Ticker.shared.add(() =>
        {
            const time = (performance.now() - GlowEffectManager._startTime) / 1000.0;

            for(const [, entry] of GlowEffectManager._activeGlows)
            {
                if(entry.filter.uniforms.uTime !== undefined)
                {
                    entry.filter.uniforms.uTime = time;
                }
            }
        });

        GlowEffectManager._tickerAdded = true;
    }

    public static apply(furniId: number, type: GlowType, color?: [number, number, number]): void
    {
        GlowEffectManager.remove(furniId);

        const obj = GlowEffectManager.getRoomObject(furniId);
        if(!obj) return;

        const filter = GlowEffectManager.createFilter(type, color);
        if(!filter) return;

        const vis = obj.visualization as IRoomObjectSpriteVisualization;
        if(!vis) return;

        for(const sprite of vis.sprites)
        {
            if(!sprite || sprite.blendMode === 1) continue;

            sprite.filters = [filter];
        }

        GlowEffectManager._activeGlows.set(furniId, { filter, furniId });
        GlowEffectManager.ensureTicker();
    }

    public static remove(furniId: number): void
    {
        const entry = GlowEffectManager._activeGlows.get(furniId);
        if(!entry) return;

        const obj = GlowEffectManager.getRoomObject(furniId);

        if(obj)
        {
            const vis = obj.visualization as IRoomObjectSpriteVisualization;

            if(vis)
            {
                for(const sprite of vis.sprites) sprite.filters = [];
            }
        }

        GlowEffectManager._activeGlows.delete(furniId);
    }

    public static clearAll(): void
    {
        for(const [furniId] of GlowEffectManager._activeGlows)
        {
            GlowEffectManager.remove(furniId);
        }
    }

    private static createFilter(type: GlowType, color?: [number, number, number]): NitroFilter | null
    {
        const c = color || [1.0, 0.2, 0.2];

        switch(type)
        {
            case 'neon': return new NeonGlowFilter(c);
            case 'rainbow': return new RainbowGlowFilter();
            case 'fire': return new FireGlowFilter(c);
            case 'sparkle': return new SparkleFilter(c);
            case 'hologram': return new HologramFilter();
            case 'shadow': return new ShadowGlowFilter(color);
            default: return new NeonGlowFilter(c);
        }
    }

    private static getRoomObject(objectId: number): IRoomObject
    {
        const engine = GetRoomEngine();

        return engine.getRoomObject(engine.activeRoomId, objectId, RoomObjectCategory.FLOOR);
    }
}
