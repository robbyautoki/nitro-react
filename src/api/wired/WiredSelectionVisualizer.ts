import { IRoomObject, IRoomObjectSprite, IRoomObjectSpriteVisualization, NitroFilter, RoomObjectCategory } from '@nitrots/nitro-renderer';
import { WiredSelectionFilter } from '.';
import { GetRoomEngine } from '..';

export class WiredSelectionVisualizer
{
    private static _selectionShader: NitroFilter = new WiredSelectionFilter([ 1, 1, 1 ], [ 0.6, 0.6, 0.6 ]);
    private static _areaSelectionOpacity: number = 0.35;
    private static _areaSelectionSprites: Array<{ sprite: IRoomObjectSprite, alpha: number }> = [];
    private static _areaSelectionActive: boolean = false;

    public static applyAreaSelectionTransparency(): void
    {
        if(WiredSelectionVisualizer._areaSelectionActive) return;

        const roomEngine = GetRoomEngine();

        if(!roomEngine) return;

        const roomId = roomEngine.activeRoomId;

        if(roomId < 0) return;

        WiredSelectionVisualizer._areaSelectionActive = true;
        WiredSelectionVisualizer._areaSelectionSprites = [];

        WiredSelectionVisualizer.applyAreaSelectionTransparencyToObjects(roomEngine.getRoomObjects(roomId, RoomObjectCategory.FLOOR));
        WiredSelectionVisualizer.applyAreaSelectionTransparencyToObjects(roomEngine.getRoomObjects(roomId, RoomObjectCategory.WALL));
    }

    public static clearAreaSelectionTransparency(): void
    {
        if(!WiredSelectionVisualizer._areaSelectionSprites.length)
        {
            WiredSelectionVisualizer._areaSelectionActive = false;

            return;
        }

        for(const entry of WiredSelectionVisualizer._areaSelectionSprites)
        {
            if(!entry.sprite) continue;

            entry.sprite.alpha = entry.alpha;
        }

        WiredSelectionVisualizer._areaSelectionSprites = [];
        WiredSelectionVisualizer._areaSelectionActive = false;
    }

    public static show(furniId: number): void
    {
        WiredSelectionVisualizer.applySelectionShader(WiredSelectionVisualizer.getRoomObject(furniId));
    }

    public static hide(furniId: number): void
    {
        WiredSelectionVisualizer.clearSelectionShader(WiredSelectionVisualizer.getRoomObject(furniId));
    }

    public static clearSelectionShaderFromFurni(furniIds: number[]): void
    {
        for(const furniId of furniIds)
        {
            WiredSelectionVisualizer.clearSelectionShader(WiredSelectionVisualizer.getRoomObject(furniId));
        }
    }

    public static applySelectionShaderToFurni(furniIds: number[]): void
    {
        for(const furniId of furniIds)
        {
            WiredSelectionVisualizer.applySelectionShader(WiredSelectionVisualizer.getRoomObject(furniId));
        }
    }

    private static applyAreaSelectionTransparencyToObjects(roomObjects: IRoomObject[]): void
    {
        if(!roomObjects || !roomObjects.length) return;

        for(const roomObject of roomObjects)
        {
            if(!roomObject) continue;

            const visualization = (roomObject.visualization as IRoomObjectSpriteVisualization);

            if(!visualization) continue;

            for(const sprite of visualization.sprites)
            {
                if(!sprite) continue;

                WiredSelectionVisualizer._areaSelectionSprites.push({ sprite, alpha: sprite.alpha });
                sprite.alpha = Math.max(0, Math.round(sprite.alpha * WiredSelectionVisualizer._areaSelectionOpacity));
            }
        }
    }

    private static getRoomObject(objectId: number): IRoomObject
    {
        const roomEngine = GetRoomEngine();

        return roomEngine.getRoomObject(roomEngine.activeRoomId, objectId, RoomObjectCategory.FLOOR);
    }

    private static applySelectionShader(roomObject: IRoomObject): void
    {
        if(!roomObject) return;

        const visualization = (roomObject.visualization as IRoomObjectSpriteVisualization);

        if(!visualization) return;

        for(const sprite of visualization.sprites)
        {
            if(sprite.blendMode === 1) continue; // BLEND_MODE: ADD

            sprite.filters = [ WiredSelectionVisualizer._selectionShader ];
        }
    }

    private static clearSelectionShader(roomObject: IRoomObject): void
    {
        if(!roomObject) return;

        const visualization = (roomObject.visualization as IRoomObjectSpriteVisualization);

        if(!visualization) return;

        for(const sprite of visualization.sprites) sprite.filters = [];
    }
}
