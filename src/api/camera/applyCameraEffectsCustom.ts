import { IRoomCameraWidgetEffect, NitroContainer, NitroSprite, TextureUtils } from '@nitrots/nitro-renderer';
import { ColorMatrixFilter } from '@pixi/filter-color-matrix';
import { Texture } from '@pixi/core';

export interface CustomCameraEffect
{
    effect: IRoomCameraWidgetEffect;
    alpha: number;
    scale?: number;
    offsetX?: number;
    offsetY?: number;
}

export function applyEffectsCustom(texture: Texture, effects: CustomCameraEffect[]): HTMLImageElement
{
    const W = texture.width;
    const H = texture.height;

    const container = new NitroContainer();
    const baseSprite = new NitroSprite(texture);

    container.addChild(baseSprite);

    for(const sel of effects)
    {
        const e = sel.effect;
        if(!e) continue;

        if(e.colorMatrix)
        {
            const filter = new ColorMatrixFilter();
            (filter as any).matrix = e.colorMatrix;
            filter.alpha = sel.alpha;
            if(!baseSprite.filters) baseSprite.filters = [];
            baseSprite.filters.push(filter);
        }
        else if(e.texture)
        {
            const fxSprite = new NitroSprite(e.texture);
            fxSprite.alpha = sel.alpha;
            fxSprite.blendMode = e.blendMode;

            const scale = sel.scale ?? 1;
            fxSprite.scale.set(scale);

            const fxW = (e.texture.width ?? W) * scale;
            const fxH = (e.texture.height ?? H) * scale;

            fxSprite.position.set(
                (W - fxW) / 2 + (sel.offsetX ?? 0),
                (H - fxH) / 2 + (sel.offsetY ?? 0),
            );

            container.addChild(fxSprite);
        }
    }

    // Auf Original-Größe croppen, sonst wachsen die Bounds bei skalierten FX-Sprites
    const renderTexture = TextureUtils.createRenderTexture(W, H);
    TextureUtils.writeToRenderTexture(container, renderTexture, true);
    return TextureUtils.generateImage(renderTexture);
}
