import { IRoomCameraWidgetEffect, IRoomCameraWidgetSelectedEffect, RoomCameraWidgetSelectedEffect } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaSave, FaTrash } from 'react-icons/fa';
import ReactSlider from 'react-slider';
import { CameraEditorTabs, CameraPicture, CameraPictureThumbnail, GetRoomCameraWidgetManager, LocalizeText } from '../../../../api';
import { Button, ButtonGroup, Column, Flex, Grid, NitroCardContentView, NitroCardHeaderView, NitroCardTabsItemView, NitroCardTabsView, NitroCardView, Text } from '../../../../common';
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
    const [ selectedEffects, setSelectedEffects ] = useState<IRoomCameraWidgetSelectedEffect[]>([]);
    const [ effectsThumbnails, setEffectsThumbnails ] = useState<CameraPictureThumbnail[]>([]);
    const [ zoomLevel, setZoomLevel ] = useState(1);
    const [ panOffset, setPanOffset ] = useState({ x: 0, y: 0 });
    const isPanning = useRef(false);
    const panStart = useRef({ x: 0, y: 0 });
    const panStartOffset = useRef({ x: 0, y: 0 });

    const getColorMatrixEffects = useMemo(() =>
    {
        return availableEffects.filter(effect => effect.colorMatrix);
    }, [ availableEffects ]);

    const getCompositeEffects = useMemo(() =>
    {
        return availableEffects.filter(effect => effect.texture);
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

    const setSelectedEffectAlpha = useCallback((alpha: number) =>
    {
        const index = getCurrentEffectIndex;

        if(index === -1) return;

        setSelectedEffects(prevValue =>
        {
            const clone = [ ...prevValue ];
            const currentEffect = clone[index];

            clone[getCurrentEffectIndex] = new RoomCameraWidgetSelectedEffect(currentEffect.effect, alpha);

            return clone;
        });
    }, [ getCurrentEffectIndex, setSelectedEffects ]);

    const getCurrentPictureUrl = useMemo(() =>
    {
        return GetRoomCameraWidgetManager().applyEffects(picture.texture, selectedEffects, false).src;
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
                
                const effect = availableEffects.find(effect => (effect.name === effectName));

                if(!effect) return;

                setSelectedEffects(prevValue =>
                {
                    return [ ...prevValue, new RoomCameraWidgetSelectedEffect(effect, 1) ];
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
                newWindow.document.write(image.outerHTML);
                return;
            }
        }
    }, [ availableEffects, selectedEffectName, getCurrentPictureUrl, getCroppedUrl, getSelectedEffectIndex, onCancel, onCheckout, onClose, setSelectedEffects ]);

    useEffect(() =>
    {
        const thumbnails: CameraPictureThumbnail[] = [];

        for(const effect of availableEffects)
        {
            thumbnails.push(new CameraPictureThumbnail(effect.name, GetRoomCameraWidgetManager().applyEffects(picture.texture, [ new RoomCameraWidgetSelectedEffect(effect, 1) ], false).src));
        }

        setEffectsThumbnails(thumbnails);
    }, [ picture, availableEffects ]);

    return (
        <NitroCardView className="nitro-camera-editor">
            <NitroCardHeaderView headerText={ LocalizeText('camera.editor.button.text') } onCloseClick={ event => processAction('close') } />
            <NitroCardTabsView>
                { TABS.map(tab =>
                {
                    return <NitroCardTabsItemView key={ tab } isActive={ currentTab === tab } onClick={ event => processAction('change_tab', tab) }><i className={ 'icon icon-camera-' + tab }></i></NitroCardTabsItemView>
                }) }
            </NitroCardTabsView>
            <NitroCardContentView>
                <Grid className="h-100">
                    <Column size={ 5 } overflow="hidden">
                        <CameraWidgetEffectListView myLevel={ myLevel } selectedEffects={ selectedEffects } effects={ getEffectList() } thumbnails={ effectsThumbnails } processAction={ processAction } />
                    </Column>
                    <Column size={ 7 } className="d-flex flex-column" overflow="hidden">
                        <Column center className="flex-grow-1">
                            <div className="picture-preview-container"
                                onMouseDown={ onPanMouseDown }
                                onMouseMove={ onPanMouseMove }
                                onMouseUp={ onPanMouseUp }
                                onMouseLeave={ onPanMouseUp }
                                style={{ cursor: zoomLevel > 1 ? (isPanning.current ? 'grabbing' : 'grab') : 'default' }}>
                                <img
                                    src={ getCurrentPictureUrl }
                                    className="picture-preview"
                                    draggable={ false }
                                    style={{
                                        transform: `translate(${ panOffset.x }px, ${ panOffset.y }px) scale(${ zoomLevel })`,
                                        transformOrigin: 'center center',
                                        transition: isPanning.current ? 'none' : 'transform 0.15s ease'
                                    }} />
                            </div>
                            { selectedEffectName &&
                                <Column center fullWidth gap={ 1 } className="mt-1">
                                    <Text>{ LocalizeText('camera.effect.name.' + selectedEffectName) }</Text>
                                    <ReactSlider
                                        className={ 'nitro-slider' }
                                        min={ 0 }
                                        max={ 1 }
                                        step={ 0.01 }
                                        value={ getCurrentEffect.alpha }
                                        onChange={ event => setSelectedEffectAlpha(event) }
                                        renderThumb={ (props, state) => <div { ...props }>{ state.valueNow }</div> } />
                                </Column> }
                        </Column>
                        <div className="camera-footer mt-2">
                            <Flex alignItems="center" gap={ 1 } className="mb-2">
                                <Text variant="muted" small>Zoom</Text>
                                <ReactSlider
                                    className={ 'nitro-slider flex-grow-1' }
                                    min={ 1 }
                                    max={ 3 }
                                    step={ 0.05 }
                                    value={ zoomLevel }
                                    onChange={ (val: number) => setZoomLevel(val) }
                                    renderThumb={ (props, state) => <div { ...props }>{ (state.valueNow as number).toFixed(1) }x</div> } />
                            </Flex>
                            <Flex justifyContent="between">
                                <ButtonGroup>
                                    <Button onClick={ event => processAction('clear_effects') }>
                                        <FaTrash className="fa-icon" />
                                    </Button>
                                    <Button onClick={ event => processAction('download') }>
                                        <FaSave className="fa-icon" />
                                    </Button>
                                </ButtonGroup>
                                <Flex gap={ 1 }>
                                    <Button onClick={ event => processAction('cancel') }>
                                        { LocalizeText('generic.cancel') }
                                    </Button>
                                    <Button onClick={ event => processAction('checkout') }>
                                        { LocalizeText('camera.preview.button.text') }
                                    </Button>
                                </Flex>
                            </Flex>
                        </div>
                    </Column>
                </Grid>
            </NitroCardContentView>
        </NitroCardView>
    );
}
