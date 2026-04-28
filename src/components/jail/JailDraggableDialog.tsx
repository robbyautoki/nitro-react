import { FC, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { LucideIcon, X } from 'lucide-react';
import { useJailDialogManager, useJailPrisonerState, JailDialogId } from '../../hooks';
import * as CompactButton from '@/align-ui/components/ui/compact-button';

type Props = {
    id: JailDialogId;
    title: string;
    description?: string;
    icon?: LucideIcon;
    width?: number;
    bodyClassName?: string;
    children: ReactNode;
    footer?: ReactNode;
};

/**
 * Draggable dialog wrapper that matches the canonical AlignUI Modal pattern
 * (Header / Body / Footer with icon-in-ring, neutral surface, clean dividers).
 *
 * No gradient headers, no custom shadows — uses AlignUI tokens only.
 */
export const JailDraggableDialog: FC<Props> = ({
    id,
    title,
    description,
    icon: Icon,
    width = 400,
    bodyClassName,
    children,
    footer
}) => {
    const { open, zIndex, position, closeDialog, bringToFront, setPosition } = useJailDialogManager();
    const prisoner = useJailPrisonerState();
    const isOpen = open[id];
    const containerRef = useRef<HTMLDivElement | null>(null);

    // Defensive Sicherung: sobald der Spieler nicht mehr inhaftiert ist,
    // Dialog automatisch schliessen.
    useEffect(() => {
        if (isOpen && !prisoner) closeDialog(id);
    }, [ isOpen, prisoner, id, closeDialog ]);

    const [ dragState, setDragState ] = useState<{
        active: boolean;
        offsetX: number;
        offsetY: number;
    }>({ active: false, offsetX: 0, offsetY: 0 });

    const pos = position[id] ?? { x: 80, y: 60 };

    const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        if (e.button !== 0) return;
        const target = e.target as HTMLElement;
        if (target.closest('button')) return;

        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        bringToFront(id);
        setDragState({
            active: true,
            offsetX: e.clientX - rect.left,
            offsetY: e.clientY - rect.top
        });
        e.currentTarget.setPointerCapture?.(e.pointerId);
    }, [ id, bringToFront ]);

    const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        if (!dragState.active) return;
        const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
        const vh = typeof window !== 'undefined' ? window.innerHeight : 720;
        const rect = containerRef.current?.getBoundingClientRect();
        const w = rect?.width ?? width;

        let nextX = e.clientX - dragState.offsetX;
        let nextY = e.clientY - dragState.offsetY;

        const buffer = 24;
        nextX = Math.max(-w + 80, Math.min(vw - buffer, nextX));
        nextY = Math.max(0, Math.min(vh - 40, nextY));

        setPosition(id, { x: nextX, y: nextY });
    }, [ dragState, id, setPosition, width ]);

    const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        if (!dragState.active) return;
        setDragState({ active: false, offsetX: 0, offsetY: 0 });
        e.currentTarget.releasePointerCapture?.(e.pointerId);
    }, [ dragState ]);

    useEffect(() => {
        if (!isOpen) {
            setDragState({ active: false, offsetX: 0, offsetY: 0 });
        }
    }, [ isOpen ]);

    if (!isOpen) return null;

    return (
        <div
            ref={ containerRef }
            className="fixed pointer-events-auto select-none"
            style={ {
                left: pos.x,
                top: pos.y,
                width,
                zIndex: zIndex[id]
            } }
            onMouseDown={ () => bringToFront(id) }
        >
            <div className="relative overflow-hidden rounded-20 bg-bg-white-0 shadow-regular-md">
                { /* Header — canonical AlignUI Modal Header (icon-in-ring) with drag handle */ }
                <div
                    className="relative flex cursor-grab items-start gap-3.5 py-4 pl-5 pr-14 active:cursor-grabbing before:absolute before:inset-x-0 before:bottom-0 before:border-b before:border-stroke-soft-200"
                    onPointerDown={ onPointerDown }
                    onPointerMove={ onPointerMove }
                    onPointerUp={ onPointerUp }
                    onPointerCancel={ onPointerUp }
                >
                    { Icon && (
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-bg-white-0 ring-1 ring-inset ring-stroke-soft-200">
                            <Icon className="size-5 text-text-sub-600" />
                        </div>
                    ) }
                    <div className="flex-1 space-y-1">
                        <div className="text-label-sm text-text-strong-950">{ title }</div>
                        { description && (
                            <div className="text-paragraph-xs text-text-sub-600">{ description }</div>
                        ) }
                    </div>
                    <CompactButton.Root
                        variant="ghost"
                        size="large"
                        className="absolute right-4 top-4"
                        onClick={ () => closeDialog(id) }
                        aria-label="Schliessen"
                    >
                        <CompactButton.Icon as={ X } />
                    </CompactButton.Root>
                </div>

                { /* Body */ }
                <div className={ `max-h-[60vh] overflow-y-auto p-5 ${ bodyClassName ?? '' }` }>
                    { children }
                </div>

                { /* Footer */ }
                { footer && (
                    <div className="flex items-center justify-between gap-3 border-t border-stroke-soft-200 px-5 py-4">
                        { footer }
                    </div>
                ) }
            </div>
        </div>
    );
};
