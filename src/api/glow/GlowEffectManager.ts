import { IRoomObject, IRoomObjectSpriteVisualization, RoomObjectCategory } from '@nitrots/nitro-renderer';
import { GetRoomEngine } from '..';
import { GlowFilter } from './GlowFilter';

interface ActiveGlow
{
    filter: GlowFilter;
    intervalId: number | null;
    furniId: number;
}

export class GlowEffectManager
{
    private static _activeGlows: Map<number, ActiveGlow> = new Map();

    public static apply(furniId: number, color: [number, number, number], pulse: boolean = false): void
    {
        GlowEffectManager.remove(furniId);

        const obj = GlowEffectManager.getRoomObject(furniId);
        if(!obj) return;

        const filter = new GlowFilter(color, 0.8, 2.0);
        const vis = obj.visualization as IRoomObjectSpriteVisualization;
        if(!vis) return;

        for(const sprite of vis.sprites)
        {
            if(!sprite || sprite.blendMode === 1) continue;

            sprite.filters = [filter];
        }

        let intervalId: number | null = null;

        if(pulse)
        {
            intervalId = window.setInterval(() =>
            {
                filter.glowStrength = 0.5 + 0.4 * Math.sin(Date.now() / 400);
            }, 50);
        }

        GlowEffectManager._activeGlows.set(furniId, { filter, intervalId, furniId });
    }

    public static remove(furniId: number): void
    {
        const entry = GlowEffectManager._activeGlows.get(furniId);
        if(!entry) return;

        if(entry.intervalId !== null) clearInterval(entry.intervalId);

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

    private static getRoomObject(objectId: number): IRoomObject
    {
        const engine = GetRoomEngine();

        return engine.getRoomObject(engine.activeRoomId, objectId, RoomObjectCategory.FLOOR);
    }
}
