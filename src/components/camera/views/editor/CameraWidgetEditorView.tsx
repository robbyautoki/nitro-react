import { IRoomCameraWidgetEffect, IRoomCameraWidgetSelectedEffect, RoomCameraWidgetSelectedEffect } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Download, Layers, Maximize2, Move, Palette, RotateCcw, ShoppingBag, Sparkles, Trash2, X, ZoomIn } from 'lucide-react';
import { applyEffectsCustom, CameraEditorTabs, CameraPicture, CameraPictureThumbnail, CustomCameraEffect, GetRoomCameraWidgetManager, LocalizeText } from '../../../../api';
import { DraggableWindow } from '../../../../common';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignSlider from '@/align-ui/components/ui/slider';
import * as AlignSurface from '@/align-ui/components/ui/surface';
import { CameraWidgetEffectListView } from './effect-list/CameraWidgetEffectListView';

export interface CameraWidgetEditorViewProps
{
    picture: CameraPicture;
    availableEffects: IRoomCameraWidgetEffect[];
    myLevel: number;
    onClose: () => void;
    onCancel: () => void;
    onCheckout: (pictureUrl: string) => void;
}

const TABS: string[] = [ CameraEditorTabs.COLORMATRIX, CameraEditorTabs.COMPOSITE ];

export const CameraWidgetEditorView: FC<CameraWidgetEditorViewProps> = props =>
{
    const { picture = null, availableEffects = null, myLevel = 1, onClose = null, onCancel = null, onCheckout = null } = props;
    const [ currentTab, setCurrentTab ] = useState(TABS[0]);
    const [ selectedEffectName, setSelectedEffectName ] = useState<string>(null);
    const [ selectedEffects, setSelectedEffects ] = useState<CustomCameraEffect[]>([]);
    const [ effectsThumbnails, setEffectsThumbnails ] = useState<CameraPictureThumbnail[]>([]);
    const [ blackThumbs, setBlackThumbs ] = useState<Set<string>>(new Set());
    const [ zoomLevel, setZoomLevel ] = useState(1);
    const [ panOffset, setPanOffset ] = useState({ x: 0, y: 0 });
    const isPanning = useRef(false);
    const panStart = useRef({ x: 0, y: 0 });
    const panStartOffset = useRef({ x: 0, y: 0 });

    const getColorMatrixEffects = useMemo(() =>
    {
        return (availableEffects || []).filter(effect => effect.colorMatrix);
    }, [ availableEffects ]);

    const getCompositeEffects = useMemo(() =>
    {
        return (availableEffects || []).filter(effect => effect.texture);
    }, [ availableEffects ]);

    const getEffectList = useCallback(() =>
    {
        if(currentTab === CameraEditorTabs.COLORMATRIX)
        {
            return getColorMatrixEffects;
        }

        return getCompositeEffects;
    }, [ currentTab, getColorMatrixEffects, getCompositeEffects ]);

    const getSelectedEffectIndex = useCallback((name: string) =>
    {
        if(!name || !name.length || !selectedEffects || !selectedEffects.length) return -1;

        return selectedEffects.findIndex(effect => (effect.effect.name === name));
    }, [ selectedEffects ])

    const getCurrentEffectIndex = useMemo(() =>
    {
        return getSelectedEffectIndex(selectedEffectName)
    }, [ selectedEffectName, getSelectedEffectIndex ])

    const getCurrentEffect = useMemo(() =>
    {
        if(!selectedEffectName) return null;

        return (selectedEffects[getCurrentEffectIndex] || null);
    }, [ selectedEffectName, getCurrentEffectIndex, selectedEffects ]);

    const updateCurrentEffect = useCallback((patch: Partial<CustomCameraEffect>) =>
    {
        const index = getCurrentEffectIndex;

        if(index === -1) return;

        setSelectedEffects(prevValue =>
        {
            const clone = [ ...prevValue ];
            clone[index] = { ...clone[index], ...patch };
            return clone;
        });
    }, [ getCurrentEffectIndex, setSelectedEffects ]);

    const setSelectedEffectAlpha = useCallback((alpha: number) =>
    {
        updateCurrentEffect({ alpha });
    }, [ updateCurrentEffect ]);

    const setSelectedEffectScale = useCallback((scale: number) =>
    {
        updateCurrentEffect({ scale });
    }, [ updateCurrentEffect ]);

    const setSelectedEffectOffsetX = useCallback((offsetX: number) =>
    {
        updateCurrentEffect({ offsetX });
    }, [ updateCurrentEffect ]);

    const setSelectedEffectOffsetY = useCallback((offsetY: number) =>
    {
        updateCurrentEffect({ offsetY });
    }, [ updateCurrentEffect ]);

    const getCurrentPictureUrl = useMemo(() =>
    {
        return applyEffectsCustom(picture.texture, selectedEffects).src;
    }, [ picture, selectedEffects ]);

    const getCroppedUrl = useCallback(() =>
    {
        if(zoomLevel <= 1 && panOffset.x === 0 && panOffset.y === 0) return getCurrentPictureUrl;

        const size = 320;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.src = getCurrentPictureUrl;

        const srcSize = size / zoomLevel;
        const cx = (size / 2) - (panOffset.x / zoomLevel);
        const cy = (size / 2) - (panOffset.y / zoomLevel);
        ctx.drawImage(img, cx - srcSize / 2, cy - srcSize / 2, srcSize, srcSize, 0, 0, size, size);

        return canvas.toDataURL('image/png');
    }, [ getCurrentPictureUrl, zoomLevel, panOffset ]);

    const onPanMouseDown = useCallback((e: React.MouseEvent) =>
    {
        if(zoomLevel <= 1) return;
        isPanning.current = true;
        panStart.current = { x: e.clientX, y: e.clientY };
        panStartOffset.current = { ...panOffset };
    }, [ zoomLevel, panOffset ]);

    const onPanMouseMove = useCallback((e: React.MouseEvent) =>
    {
        if(!isPanning.current) return;
        const dx = e.clientX - panStart.current.x;
        const dy = e.clientY - panStart.current.y;
        const maxPan = (zoomLevel - 1) * 190;
        setPanOffset({
            x: Math.max(-maxPan, Math.min(maxPan, panStartOffset.current.x + dx)),
            y: Math.max(-maxPan, Math.min(maxPan, panStartOffset.current.y + dy))
        });
    }, [ zoomLevel ]);

    const onPanMouseUp = useCallback(() =>
    {
        isPanning.current = false;
    }, []);

    useEffect(() =>
    {
        if(zoomLevel <= 1) setPanOffset({ x: 0, y: 0 });
    }, [ zoomLevel ]);

    const processAction = useCallback((type: string, effectName: string = null) =>
    {
        switch(type)
        {
            case 'close':
                onClose();
                return;
            case 'cancel':
                onCancel();
                return;
            case 'checkout':
                onCheckout(getCroppedUrl());
                return;
            case 'change_tab':
                setCurrentTab(String(effectName));
                return;
            case 'select_effect': {
                let existingIndex = getSelectedEffectIndex(effectName);

                if(existingIndex >= 0) return;
                
                const effect = (availableEffects || []).find(effect => (effect.name === effectName));

                if(!effect) return;

                setSelectedEffects(prevValue =>
                {
                    return [ ...prevValue, { effect, alpha: 1, scale: 1, offsetX: 0, offsetY: 0 } ];
                });

                setSelectedEffectName(effect.name);
                return;
            }
            case 'remove_effect': {
                let existingIndex = getSelectedEffectIndex(effectName);

                if(existingIndex === -1) return;

                setSelectedEffects(prevValue =>
                {
                    const clone = [ ...prevValue ];

                    clone.splice(existingIndex, 1);

                    return clone;
                });

                if(selectedEffectName === effectName) setSelectedEffectName(null);
                return;
            }
            case 'clear_effects':
                setSelectedEffectName(null);
                setSelectedEffects([]);
                return;
            case 'download': {
                const image = new Image();
                            
                image.src = getCroppedUrl();
                            
                const newWindow = window.open('');
                if(!newWindow) return;
                newWindow.document.write(image.outerHTML);
                return;
            }
        }
    }, [ availableEffects, selectedEffectName, getCurrentPictureUrl, getCroppedUrl, getSelectedEffectIndex, onCancel, onCheckout, onClose, setSelectedEffects ]);

    useEffect(() =>
    {
        const thumbnails: CameraPictureThumbnail[] = [];

        for(const effect of (availableEffects || []))
        {
            thumbnails.push(new CameraPictureThumbnail(effect.name, GetRoomCameraWidgetManager().applyEffects(picture.texture, [ new RoomCameraWidgetSelectedEffect(effect, 1) ], false).src));
        }

        setEffectsThumbnails(thumbnails);
    }, [ picture, availableEffects ]);

    useEffect(() =>
    {
        if(!effectsThumbnails || !effectsThumbnails.length) return;

        let cancelled = false;
        const detected = new Set<string>();
        let pending = effectsThumbnails.length;

        const finalize = () =>
        {
            if(cancelled) return;
            setBlackThumbs(detected);
        };

        for(const thumb of effectsThumbnails)
        {
            const url = thumb.thumbnailUrl;
            if(!url || !url.length) { if(--pending === 0) finalize(); continue; }

            const img = new Image();
            img.onload = () =>
            {
                try
                {
                    const canvas = document.createElement('canvas');
                    canvas.width = 16;
                    canvas.height = 16;
                    const ctx = canvas.getContext('2d');
                    if(!ctx) { if(--pending === 0) finalize(); return; }
                    ctx.drawImage(img, 0, 0, 16, 16);
                    const data = ctx.getImageData(0, 0, 16, 16).data;
                    let sum = 0;
                    for(let i = 0; i < data.length; i += 4) sum += data[i] + data[i + 1] + data[i + 2];
                    const max = 16 * 16 * 3 * 255;
                    if(sum < max * 0.05) detected.add(thumb.effectName);
                }
                catch(e) { /* ignore CORS / decode errors */ }
                if(--pending === 0) finalize();
            };
            img.onerror = () => { if(--pending === 0) finalize(); };
            img.src = url;
        }

        return () => { cancelled = true; };
    }, [ effectsThumbnails ]);

    const visibleThumbnails = useMemo(() =>
    {
        if(!blackThumbs.size) return effectsThumbnails;
        return effectsThumbnails.map(t => blackThumbs.has(t.effectName)
            ? new CameraPictureThumbnail(t.effectName, null)
            : t);
    }, [ effectsThumbnails, blackThumbs ]);

    return (
        <DraggableWindow uniqueKey="nitro-camera-editor">
            <AlignSurface.Panel className="nitro-camera-window nitro-camera-editor">
                <div className="nitro-camera-header drag-handler">
                    <div className="nitro-camera-title">
                        <div className="nitro-camera-title-icon">
                            <Sparkles className="size-4" />
                        </div>
                        <div className="min-w-0">
                            <div className="truncate text-label-sm text-text-strong-950">{ LocalizeText('camera.editor.button.text') }</div>
                            <div className="truncate text-paragraph-xs text-text-sub-600">Ausschnitt und Effekte</div>
                        </div>
                    </div>
                    <AlignButton.Root type="button" variant="neutral" mode="ghost" size="xxsmall" className="size-7 p-0" onClick={ event => processAction('close') }>
                        <AlignButton.Icon as={ X } className="size-4" />
                    </AlignButton.Root>
                </div>
                <div className="nitro-camera-tabs">
                    { TABS.map(tab =>
                    {
                        const isColor = tab === CameraEditorTabs.COLORMATRIX;
                        const Icon = isColor ? Palette : Layers;

                        return (
                            <button key={ tab } type="button" className={ currentTab === tab ? 'active' : '' } onClick={ event => processAction('change_tab', tab) }>
                                <Icon className="size-4" />
                                <span>{ isColor ? 'Farbe' : 'Effekte' }</span>
                            </button>
                        );
                    }) }
                </div>
                <div className="nitro-camera-editor-body">
                    <div className="nitro-camera-effect-panel">
                        <CameraWidgetEffectListView
                            myLevel={ myLevel }
                            selectedEffects={ selectedEffects as unknown as IRoomCameraWidgetSelectedEffect[] }
                            effects={ getEffectList() }
                            thumbnails={ visibleThumbnails }
                            emptyLabel={ currentTab === CameraEditorTabs.COLORMATRIX ? 'Keine Farben verfügbar' : 'Keine Effekte verfügbar' }
                            processAction={ processAction }
                        />
                    </div>
                    <div className="nitro-camera-editor-stage">
                        <div className="picture-preview-container"
                            onMouseDown={ onPanMouseDown }
                            onMouseMove={ onPanMouseMove }
                            onMouseUp={ onPanMouseUp }
                            onMouseLeave={ onPanMouseUp }
                            style={{ cursor: zoomLevel > 1 ? (isPanning.current ? 'grabbing' : 'grab') : 'default' }}>
                            <img
                                alt=""
                                src={ getCurrentPictureUrl }
                                className="picture-preview"
                                draggable={ false }
                                style={{
                                    transform: `translate(${ panOffset.x }px, ${ panOffset.y }px) scale(${ zoomLevel })`,
                                    transformOrigin: 'center center',
                                    transition: isPanning.current ? 'none' : 'transform 0.15s ease'
                                }} />
                        </div>
                        { selectedEffectName && getCurrentEffect &&
                            <div className="nitro-camera-adjust-row">
                                <span className="truncate text-label-xs text-text-sub-600">{ LocalizeText('camera.effect.name.' + selectedEffectName) }</span>
                                <div className="flex flex-1 items-center gap-3 min-w-0">
                                    <AlignSlider.Root
                                        min={ 0 }
                                        max={ 1 }
                                        step={ 0.01 }
                                        value={ [ getCurrentEffect.alpha ] }
                                        onValueChange={ (val: number[]) => setSelectedEffectAlpha(val[0]) }>
                                        <AlignSlider.Thumb />
                                    </AlignSlider.Root>
                                    <span className="w-10 shrink-0 text-right text-label-xs text-text-sub-600 tabular-nums">{ getCurrentEffect.alpha.toFixed(2) }</span>
                                </div>
                            </div> }
                        { selectedEffectName && getCurrentEffect && getCurrentEffect.effect && getCurrentEffect.effect.texture && <>
                            <div className="nitro-camera-adjust-row">
                                <span className="inline-flex items-center gap-1 text-label-xs text-text-sub-600"><Maximize2 className="size-3.5" /> Größe</span>
                                <div className="flex flex-1 items-center gap-3 min-w-0">
                                    <AlignSlider.Root
                                        min={ 0.5 }
                                        max={ 3 }
                                        step={ 0.05 }
                                        value={ [ getCurrentEffect.scale ?? 1 ] }
                                        onValueChange={ (val: number[]) => setSelectedEffectScale(val[0]) }>
                                        <AlignSlider.Thumb />
                                    </AlignSlider.Root>
                                    <span className="w-10 shrink-0 text-right text-label-xs text-text-sub-600 tabular-nums">{ (getCurrentEffect.scale ?? 1).toFixed(2) }x</span>
                                </div>
                            </div>
                            <div className="nitro-camera-adjust-row">
                                <span className="inline-flex items-center gap-1 text-label-xs text-text-sub-600"><Move className="size-3.5" /> Position X</span>
                                <div className="flex flex-1 items-center gap-3 min-w-0">
                                    <AlignSlider.Root
                                        min={ -150 }
                                        max={ 150 }
                                        step={ 1 }
                                        value={ [ getCurrentEffect.offsetX ?? 0 ] }
                                        onValueChange={ (val: number[]) => setSelectedEffectOffsetX(val[0]) }>
                                        <AlignSlider.Thumb />
                                    </AlignSlider.Root>
                                    <span className="w-10 shrink-0 text-right text-label-xs text-text-sub-600 tabular-nums">{ getCurrentEffect.offsetX ?? 0 }</span>
                                </div>
                            </div>
                            <div className="nitro-camera-adjust-row">
                                <span className="inline-flex items-center gap-1 text-label-xs text-text-sub-600"><Move className="size-3.5" /> Position Y</span>
                                <div className="flex flex-1 items-center gap-3 min-w-0">
                                    <AlignSlider.Root
                                        min={ -150 }
                                        max={ 150 }
                                        step={ 1 }
                                        value={ [ getCurrentEffect.offsetY ?? 0 ] }
                                        onValueChange={ (val: number[]) => setSelectedEffectOffsetY(val[0]) }>
                                        <AlignSlider.Thumb />
                                    </AlignSlider.Root>
                                    <span className="w-10 shrink-0 text-right text-label-xs text-text-sub-600 tabular-nums">{ getCurrentEffect.offsetY ?? 0 }</span>
                                </div>
                            </div>
                        </> }
                        <div className="nitro-camera-adjust-row">
                            <span className="inline-flex items-center gap-1 text-label-xs text-text-sub-600"><ZoomIn className="size-3.5" /> Zoom</span>
                            <div className="flex flex-1 items-center gap-3 min-w-0">
                                <AlignSlider.Root
                                    min={ 1 }
                                    max={ 3 }
                                    step={ 0.05 }
                                    value={ [ zoomLevel ] }
                                    onValueChange={ (val: number[]) => setZoomLevel(val[0]) }>
                                    <AlignSlider.Thumb />
                                </AlignSlider.Root>
                                <span className="w-10 shrink-0 text-right text-label-xs text-text-sub-600 tabular-nums">{ zoomLevel.toFixed(2) }x</span>
                            </div>
                        </div>
                        <div className="nitro-camera-editor-footer">
                            <div className="flex items-center gap-2">
                                <AlignButton.Root type="button" variant="neutral" mode="stroke" size="xxsmall" className="size-8 p-0" title="Effekte zurücksetzen" onClick={ event => processAction('clear_effects') }>
                                    <AlignButton.Icon as={ Trash2 } className="size-4" />
                                </AlignButton.Root>
                                <AlignButton.Root type="button" variant="neutral" mode="stroke" size="xxsmall" className="size-8 p-0" title="Bild öffnen" onClick={ event => processAction('download') }>
                                    <AlignButton.Icon as={ Download } className="size-4" />
                                </AlignButton.Root>
                            </div>
                            <div className="flex items-center gap-2">
                                <AlignButton.Root type="button" variant="neutral" mode="stroke" size="small" onClick={ event => processAction('cancel') }>
                                    <AlignButton.Icon as={ RotateCcw } className="size-4" />
                                    { LocalizeText('generic.cancel') }
                                </AlignButton.Root>
                                <AlignButton.Root type="button" variant="primary" mode="filled" size="small" onClick={ event => processAction('checkout') }>
                                    <AlignButton.Icon as={ ShoppingBag } className="size-4" />
                                    { LocalizeText('camera.preview.button.text') }
                                </AlignButton.Root>
                            </div>
                        </div>
                    </div>
                </div>
            </AlignSurface.Panel>
        </DraggableWindow>
    );
}
