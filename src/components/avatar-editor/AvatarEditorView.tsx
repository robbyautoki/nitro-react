import { AvatarEditorFigureCategory, FigureSetIdsMessageEvent, GetWardrobeMessageComposer, IAvatarFigureContainer, ILinkEventTracker, UserFigureComposer, UserWardrobePageEvent } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Dice5, RotateCcw, Trash2, X } from 'lucide-react';
import { AddEventLinkTracker, AvatarEditorAction, AvatarEditorUtilities, BodyModel, FigureData, generateRandomFigure, GetAvatarRenderManager, GetClubMemberLevel, GetConfiguration, GetSessionDataManager, HeadModel, IAvatarEditorCategoryModel, LegModel, LocalizeText, RemoveLinkEventTracker, SendMessageComposer, TorsoModel } from '../../api';
import { DraggableWindow, DraggableWindowPosition } from '../../common/draggable-window';
import { useMessageEvent } from '../../hooks';
import { cn } from '../../align-ui/utils/cn';
import * as AlignButton from '@/align-ui/components/ui/button';
import { AvatarEditorFigurePreviewView } from './views/AvatarEditorFigurePreviewView';
import { AvatarEditorModelView } from './views/AvatarEditorModelView';
import { AvatarEditorWardrobeView } from './views/AvatarEditorWardrobeView';

const DEFAULT_MALE_FIGURE: string = 'hr-100.hd-180-7.ch-215-66.lg-270-79.sh-305-62.ha-1002-70.wa-2007';
const DEFAULT_FEMALE_FIGURE: string = 'hr-515-33.hd-600-1.ch-635-70.lg-716-66-62.sh-735-68';
const DEFAULT_EDITOR_SIZE = { width: 920, height: 700 };
const MIN_EDITOR_SIZE = { width: 720, height: 580 };

export const AvatarEditorView: FC<{}> = props =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ figures, setFigures ] = useState<Map<string, FigureData>>(null);
    const [ figureData, setFigureData ] = useState<FigureData>(null);
    const [ categories, setCategories ] = useState<Map<string, IAvatarEditorCategoryModel>>(null);
    const [ activeCategory, setActiveCategory ] = useState<IAvatarEditorCategoryModel>(null);
    const [ figureSetIds, setFigureSetIds ] = useState<number[]>([]);
    const [ boundFurnitureNames, setBoundFurnitureNames ] = useState<string[]>([]);
    const [ savedFigures, setSavedFigures ] = useState<[ IAvatarFigureContainer, string ][]>([]);
    const [ isWardrobeVisible, setIsWardrobeVisible ] = useState(false);
    const [ lastFigure, setLastFigure ] = useState<string>(null);
    const [ lastGender, setLastGender ] = useState<string>(null);
    const [ needsReset, setNeedsReset ] = useState(true);
    const [ isInitalized, setIsInitalized ] = useState(false);
    const [ editorSize, setEditorSize ] = useState(DEFAULT_EDITOR_SIZE);

    const resizingRef = useRef(false);
    const resizeStartRef = useRef({ x: 0, y: 0, w: 0, h: 0 });
    const resizeListenersRef = useRef<{ move: ((ev: MouseEvent) => void) | null, up: (() => void) | null }>({ move: null, up: null });

    const onResizeStart = useCallback((e: React.MouseEvent) =>
    {
        e.preventDefault();
        e.stopPropagation();
        resizingRef.current = true;
        resizeStartRef.current = { x: e.clientX, y: e.clientY, w: editorSize.width, h: editorSize.height };

        const onMouseMove = (ev: MouseEvent) =>
        {
            if(!resizingRef.current) return;
            const newW = Math.max(MIN_EDITOR_SIZE.width, Math.min(1280, resizeStartRef.current.w + (ev.clientX - resizeStartRef.current.x)));
            const newH = Math.max(MIN_EDITOR_SIZE.height, Math.min(window.innerHeight - 32, resizeStartRef.current.h + (ev.clientY - resizeStartRef.current.y)));
            setEditorSize({ width: newW, height: newH });
        };

        const onMouseUp = () =>
        {
            resizingRef.current = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            resizeListenersRef.current = { move: null, up: null };
        };

        resizeListenersRef.current = { move: onMouseMove, up: onMouseUp };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }, [ editorSize ]);

    const maxWardrobeSlots = useMemo(() => GetConfiguration<number>('avatar.wardrobe.max.slots', 10), []);

    useMessageEvent<FigureSetIdsMessageEvent>(FigureSetIdsMessageEvent, event =>
    {
        const parser = event.getParser();

        setFigureSetIds(parser.figureSetIds);
        setBoundFurnitureNames(parser.boundsFurnitureNames);
    });

    useMessageEvent<UserWardrobePageEvent>(UserWardrobePageEvent, event =>
    {
        const parser = event.getParser();
        const savedFigures: [ IAvatarFigureContainer, string ][] = [];

        let i = 0;

        while(i < maxWardrobeSlots)
        {
            savedFigures.push([ null, null ]);

            i++;
        }

        for(let [ index, [ look, gender ] ] of parser.looks.entries())
        {
            const container = GetAvatarRenderManager().createFigureContainer(look);

            savedFigures[(index - 1)] = [ container, gender ];
        }

        setSavedFigures(savedFigures);
    });

    const selectCategory = useCallback((name: string) =>
    {
        if(!categories) return;

        setActiveCategory(categories.get(name));
    }, [ categories ]);

    const resetCategories = useCallback(() =>
    {
        const categories = new Map();

        categories.set(AvatarEditorFigureCategory.GENERIC, new BodyModel());
        categories.set(AvatarEditorFigureCategory.HEAD, new HeadModel());
        categories.set(AvatarEditorFigureCategory.TORSO, new TorsoModel());
        categories.set(AvatarEditorFigureCategory.LEGS, new LegModel());

        setCategories(categories);
    }, []);

    const setupFigures = useCallback(() =>
    {
        const figures: Map<string, FigureData> = new Map();

        const maleFigure = new FigureData();
        const femaleFigure = new FigureData();

        maleFigure.loadAvatarData(DEFAULT_MALE_FIGURE, FigureData.MALE);
        femaleFigure.loadAvatarData(DEFAULT_FEMALE_FIGURE, FigureData.FEMALE);

        figures.set(FigureData.MALE, maleFigure);
        figures.set(FigureData.FEMALE, femaleFigure);

        setFigures(figures);
        setFigureData(figures.get(FigureData.MALE));
    }, []);

    const loadAvatarInEditor = useCallback((figure: string, gender: string, reset: boolean = true) =>
    {
        gender = AvatarEditorUtilities.getGender(gender);

        let newFigureData = figureData;

        if(gender !== newFigureData.gender) newFigureData = figures.get(gender);

        if(figure !== newFigureData.getFigureString()) newFigureData.loadAvatarData(figure, gender);

        if(newFigureData !== figureData) setFigureData(newFigureData);

        if(reset)
        {
            setLastFigure(figureData.getFigureString());
            setLastGender(figureData.gender);
        }
    }, [ figures, figureData ]);

    const processAction = useCallback((action: string) =>
    {
        switch(action)
        {
            case AvatarEditorAction.ACTION_CLEAR:
                loadAvatarInEditor(figureData.getFigureStringWithFace(0, false), figureData.gender, false);
                resetCategories();
                return;
            case AvatarEditorAction.ACTION_RESET:
                loadAvatarInEditor(lastFigure, lastGender);
                resetCategories();
                return;
            case AvatarEditorAction.ACTION_RANDOMIZE:
                const figure = generateRandomFigure(figureData, figureData.gender, GetClubMemberLevel(), figureSetIds, [ FigureData.FACE ]);

                loadAvatarInEditor(figure, figureData.gender, false);
                resetCategories();
                return;
            case AvatarEditorAction.ACTION_SAVE:
                SendMessageComposer(new UserFigureComposer(figureData.gender, figureData.getFigureString()));
                setIsVisible(false);
                return;
        }
    }, [ figureData, lastFigure, lastGender, figureSetIds, loadAvatarInEditor, resetCategories ])

    const setGender = useCallback((gender: string) =>
    {
        gender = AvatarEditorUtilities.getGender(gender);

        setFigureData(figures.get(gender));
    }, [ figures ]);

    useEffect(() =>
    {
        return () =>
        {
            const { move, up } = resizeListenersRef.current;
            if(move) document.removeEventListener('mousemove', move);
            if(up) document.removeEventListener('mouseup', up);
        };
    }, []);

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');

                if(parts.length < 2) return;

                switch(parts[1])
                {
                    case 'show':
                        setIsVisible(true);
                        return;
                    case 'hide':
                        setIsVisible(false);
                        return;
                    case 'toggle':
                        setIsVisible(prevValue => !prevValue);
                        return;
                }
            },
            eventUrlPrefix: 'avatar-editor/'
        };

        AddEventLinkTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    useEffect(() =>
    {
        setSavedFigures(new Array(maxWardrobeSlots));
    }, [ maxWardrobeSlots ]);

    useEffect(() =>
    {
        if(!isWardrobeVisible) return;

        setActiveCategory(null);
        SendMessageComposer(new GetWardrobeMessageComposer());
    }, [ isWardrobeVisible ]);

    useEffect(() =>
    {
        if(!activeCategory) return;

        setIsWardrobeVisible(false);
    }, [ activeCategory ]);

    useEffect(() =>
    {
        if(!categories) return;

        selectCategory(AvatarEditorFigureCategory.GENERIC);
    }, [ categories, selectCategory ]);

    useEffect(() =>
    {
        if(!figureData) return;

        AvatarEditorUtilities.CURRENT_FIGURE = figureData;

        resetCategories();

        return () => AvatarEditorUtilities.CURRENT_FIGURE = null;
    }, [ figureData, resetCategories ]);

    useEffect(() =>
    {
        AvatarEditorUtilities.FIGURE_SET_IDS = figureSetIds;
        AvatarEditorUtilities.BOUND_FURNITURE_NAMES = boundFurnitureNames;

        resetCategories();

        return () =>
        {
            AvatarEditorUtilities.FIGURE_SET_IDS = null;
            AvatarEditorUtilities.BOUND_FURNITURE_NAMES = null;
        }
    }, [ figureSetIds, boundFurnitureNames, resetCategories ]);

    useEffect(() =>
    {
        if(!isVisible) return;

        if(!figures)
        {
            setupFigures();

            setIsInitalized(true);

            return;
        }
    }, [ isVisible, figures, setupFigures ]);

    useEffect(() =>
    {
        if(!isVisible || !isInitalized || !needsReset) return;

        loadAvatarInEditor(GetSessionDataManager().figure, GetSessionDataManager().gender);
        setNeedsReset(false);
    }, [ isVisible, isInitalized, needsReset, loadAvatarInEditor ]);

    useEffect(() =>
    {
        if(isVisible) return;

        return () =>
        {
            setNeedsReset(true);
        }
    }, [ isVisible ]);

    if(!isVisible || !figureData) return null;

    const tabKeys = categories ? Array.from(categories.keys()) : [];

    return (
        <DraggableWindow uniqueKey="avatar-editor-v2" windowPosition={ DraggableWindowPosition.CENTER }>
            <div
                className="nitro-avatar-editor relative flex flex-col overflow-hidden rounded-20 border border-stroke-soft-200 bg-bg-white-0 text-text-strong-950 shadow-regular-md"
                style={ { width: `${ editorSize.width }px`, height: `${ editorSize.height }px` } }
            >
                { /* Header */ }
                <div className="drag-handler flex h-12 shrink-0 cursor-move select-none items-center gap-3 border-b border-stroke-soft-200 bg-bg-white-0 px-5 shadow-regular-xs">
                    <span className="text-label-md font-semibold tracking-tight text-text-strong-950">
                        { LocalizeText('avatareditor.title') }
                    </span>
                    <div className="flex-1" />
                    <AlignButton.Root
                        variant="neutral"
                        mode="ghost"
                        size="xsmall"
                        className="size-8 shrink-0 p-0"
                        onMouseDown={ e => e.stopPropagation() }
                        onClick={ () => setIsVisible(false) }
                    >
                        <AlignButton.Icon as={ X } className="size-4" />
                    </AlignButton.Root>
                </div>
                { /* Tabs — Align-UI underlined style */ }
                <div className="flex shrink-0 items-end gap-0.5 border-b border-stroke-soft-200 bg-bg-white-0 px-5">
                    { tabKeys.map(category =>
                    {
                        const isActive = (activeCategory && !isWardrobeVisible && (activeCategory.name === category));

                        return (
                            <button
                                key={ category }
                                type="button"
                                className={ cn(
                                    'relative flex h-11 cursor-pointer items-center px-4 text-label-sm font-medium transition-colors',
                                    'after:pointer-events-none after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-t-full after:transition-all',
                                    isActive
                                        ? 'text-text-strong-950 after:bg-primary-base'
                                        : 'text-text-sub-600 after:bg-transparent hover:text-text-strong-950'
                                ) }
                                onMouseDown={ e => e.stopPropagation() }
                                onClick={ () => selectCategory(category) }
                            >
                                { LocalizeText(`avatareditor.category.${ category }`) }
                            </button>
                        );
                    }) }
                    <div className="flex-1" />
                    <button
                        type="button"
                        className={ cn(
                            'relative flex h-11 cursor-pointer items-center px-4 text-label-sm font-medium transition-colors',
                            'after:pointer-events-none after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-t-full after:transition-all',
                            isWardrobeVisible
                                ? 'text-text-strong-950 after:bg-primary-base'
                                : 'text-text-sub-600 after:bg-transparent hover:text-text-strong-950'
                        ) }
                        onMouseDown={ e => e.stopPropagation() }
                        onClick={ () => setIsWardrobeVisible(true) }
                    >
                        { LocalizeText('avatareditor.category.wardrobe') }
                    </button>
                </div>
                { /* Content: Left Preview | Right Editor */ }
                <div className="flex min-h-0 flex-1">
                    { /* Left Panel: Preview + Buttons */ }
                    <div className="flex w-[240px] min-w-[240px] flex-col border-r border-stroke-soft-200 bg-bg-weak-50/30">
                        <AvatarEditorFigurePreviewView figureData={ figureData } />
                        <div className="flex shrink-0 flex-col gap-1.5 border-t border-stroke-soft-200 bg-bg-white-0 p-3">
                            <AlignButton.Root
                                variant="neutral"
                                mode="stroke"
                                size="xsmall"
                                className="w-full justify-start"
                                onClick={ () => processAction(AvatarEditorAction.ACTION_RESET) }
                            >
                                <AlignButton.Icon as={ RotateCcw } className="size-3.5" />
                                Zurücksetzen
                            </AlignButton.Root>
                            <AlignButton.Root
                                variant="neutral"
                                mode="stroke"
                                size="xsmall"
                                className="w-full justify-start"
                                onClick={ () => processAction(AvatarEditorAction.ACTION_CLEAR) }
                            >
                                <AlignButton.Icon as={ Trash2 } className="size-3.5" />
                                Leeren
                            </AlignButton.Root>
                            <AlignButton.Root
                                variant="neutral"
                                mode="stroke"
                                size="xsmall"
                                className="w-full justify-start"
                                onClick={ () => processAction(AvatarEditorAction.ACTION_RANDOMIZE) }
                            >
                                <AlignButton.Icon as={ Dice5 } className="size-3.5" />
                                Zufällig
                            </AlignButton.Root>
                            <div className="my-1 h-px bg-stroke-soft-200" />
                            <AlignButton.Root
                                variant="primary"
                                mode="filled"
                                size="small"
                                className="w-full"
                                onClick={ () => processAction(AvatarEditorAction.ACTION_SAVE) }
                            >
                                <AlignButton.Icon as={ Check } className="size-4" />
                                { LocalizeText('avatareditor.save') }
                            </AlignButton.Root>
                        </div>
                    </div>
                    { /* Right Panel: Editor */ }
                    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                        { (activeCategory && !isWardrobeVisible) &&
                            <AvatarEditorModelView model={ activeCategory } gender={ figureData.gender } setGender={ setGender } /> }
                        { isWardrobeVisible &&
                            <div className="min-h-0 flex-1 overflow-y-auto p-3">
                                <AvatarEditorWardrobeView figureData={ figureData } savedFigures={ savedFigures } setSavedFigures={ setSavedFigures } loadAvatarInEditor={ loadAvatarInEditor } />
                            </div> }
                    </div>
                </div>
                <div className="avatar-editor-resize-handle" onMouseDown={ onResizeStart } />
            </div>
        </DraggableWindow>
    );
}
