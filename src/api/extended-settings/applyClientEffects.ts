import { ExtendedSettings } from './ExtendedSettings';

const ROOT_DATA_ATTRS: Array<keyof HTMLElement | string> = [
    'data-bahhos-bubble-shape',
    'data-bahhos-font-size',
    'data-bahhos-hotelview',
    'data-bahhos-render-quality',
    'data-bahhos-cursor',
    'data-bahhos-walk-speed',
    'data-bahhos-tile-hover',
    'data-bahhos-pet-bubbles',
    'data-bahhos-silent',
    'data-bahhos-hide-repeat',
];

export function applyClientEffects(settings: ExtendedSettings): void
{
    if(typeof document === 'undefined') return;

    const html = document.documentElement;

    // Reset old attributes first to keep things clean.
    for(const attr of ROOT_DATA_ATTRS)
    {
        html.removeAttribute(attr as string);
    }

    html.setAttribute('data-bahhos-bubble-shape', String(settings.bubbleShape));
    html.setAttribute('data-bahhos-font-size', settings.fontSize);
    html.setAttribute('data-bahhos-hotelview', settings.hotelviewVariant);
    html.setAttribute('data-bahhos-render-quality', settings.renderQuality);
    html.setAttribute('data-bahhos-cursor', settings.cursorStyle);
    html.setAttribute('data-bahhos-walk-speed', settings.walkSpeed);
    html.setAttribute('data-bahhos-tile-hover', settings.showTileHover ? 'on' : 'off');
    html.setAttribute('data-bahhos-pet-bubbles', settings.showPetBubbles ? 'on' : 'off');
    html.setAttribute('data-bahhos-silent', settings.silentMode ? 'on' : 'off');
    html.setAttribute('data-bahhos-hide-repeat', settings.hideRepeatMsgs ? 'on' : 'off');
}
