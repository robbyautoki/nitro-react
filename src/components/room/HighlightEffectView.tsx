import { NitroPoint, RoomObjectCategory } from '@nitrots/nitro-renderer';
import { FC, useEffect, useRef, useState } from 'react';
import { GetRoomEngine, GetRoomObjectScreenLocation } from '../../api';
import { useRoom } from '../../hooks';
import { Frame, FramePanel } from '../ui/frame';

const MAX_HIGHLIGHT_SCALE = 3;
const LERP_SPEED = 0.1;
const LERP_THRESHOLD = 0.01;

type HighlightPhase = 'idle' | 'zoom-in' | 'hold' | 'zoom-out' | 'fade-out';

export const HighlightEffectView: FC<{}> = () =>
{
    const { roomSession = null } = useRoom();
    const [ phase, setPhase ] = useState<HighlightPhase>('idle');
    const phaseRef = useRef<HighlightPhase>('idle');
    const senderIndexRef = useRef<number>(0);
    const originalScaleRef = useRef<number>(1);
    const targetScaleRef = useRef<number>(1);
    const holdDurationRef = useRef<number>(5000);
    const rafRef = useRef<number | null>(null);
    const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const roomSessionRef = useRef(roomSession);

    // Use ref for animate function to avoid stale closures in rAF chains
    const animateRef = useRef<() => void>();

    useEffect(() => { roomSessionRef.current = roomSession; }, [ roomSession ]);

    const updatePhase = (newPhase: HighlightPhase) =>
    {
        phaseRef.current = newPhase;
        setPhase(newPhase);
    };

    const cleanup = () =>
    {
        if(rafRef.current) cancelAnimationFrame(rafRef.current);
        if(holdTimerRef.current) clearTimeout(holdTimerRef.current);
        if(fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
        rafRef.current = null;
        holdTimerRef.current = null;
        fadeTimerRef.current = null;
    };

    // Keep animate ref up to date — avoids stale closure in rAF chain
    animateRef.current = () =>
    {
        const session = roomSessionRef.current;
        if(!session) { cleanup(); updatePhase('idle'); return; }

        const roomId = session.roomId;
        const current = GetRoomEngine().getRoomInstanceRenderingCanvasScale(roomId, 1);
        const target = targetScaleRef.current;
        const diff = target - current;

        if(Math.abs(diff) < LERP_THRESHOLD)
        {
            GetRoomEngine().setRoomInstanceRenderingCanvasScale(roomId, 1, target);

            if(phaseRef.current === 'zoom-in')
            {
                // Zoom-in done -> hold (rAF keeps running to track sender)
                updatePhase('hold');
                holdTimerRef.current = setTimeout(() =>
                {
                    // Hold done -> zoom-out + fade overlay
                    targetScaleRef.current = originalScaleRef.current;
                    updatePhase('zoom-out');
                }, holdDurationRef.current);
            }
            else if(phaseRef.current === 'zoom-out')
            {
                // Zoom-out done -> fade overlay then idle
                updatePhase('fade-out');
                fadeTimerRef.current = setTimeout(() => updatePhase('idle'), 600);
                return;
            }

            if(phaseRef.current === 'hold')
            {
                // During hold: keep tracking sender position so camera follows movement
                const senderPos = GetRoomObjectScreenLocation(
                    roomId, senderIndexRef.current, RoomObjectCategory.UNIT
                );
                if(senderPos)
                {
                    GetRoomEngine().setRoomInstanceRenderingCanvasScale(
                        roomId, 1, target, new NitroPoint(senderPos.x, senderPos.y)
                    );
                }
                rafRef.current = requestAnimationFrame(() => animateRef.current?.());
            }

            return;
        }

        const newScale = current + diff * LERP_SPEED;

        // Re-query sender position each frame so zoom tracks them during scale change
        const senderPos = GetRoomObjectScreenLocation(
            roomId, senderIndexRef.current, RoomObjectCategory.UNIT
        );
        const centerPoint = senderPos
            ? new NitroPoint(senderPos.x, senderPos.y)
            : null;

        GetRoomEngine().setRoomInstanceRenderingCanvasScale(roomId, 1, newScale, centerPoint);
        rafRef.current = requestAnimationFrame(() => animateRef.current?.());
    };

    // Listen for highlight_effect CustomEvents
    useEffect(() =>
    {
        const handleHighlight = (e: Event) =>
        {
            const customEvent = e as CustomEvent;
            const session = roomSessionRef.current;
            if(!session) return;
            if(phaseRef.current !== 'idle') return; // ignore while active

            const { senderIndex, durationMs } = customEvent.detail;
            senderIndexRef.current = senderIndex;
            holdDurationRef.current = durationMs || 5000;

            // Save current zoom level
            originalScaleRef.current = GetRoomEngine().getRoomInstanceRenderingCanvasScale(
                session.roomId, 1
            );

            // Set target to max zoom
            targetScaleRef.current = MAX_HIGHLIGHT_SCALE;
            updatePhase('zoom-in');

            // Start animation via ref (never stale)
            rafRef.current = requestAnimationFrame(() => animateRef.current?.());
        };

        window.addEventListener('highlight_effect', handleHighlight);

        return () =>
        {
            window.removeEventListener('highlight_effect', handleHighlight);
            cleanup();
        };
    }, []);

    // Cleanup on room change
    useEffect(() =>
    {
        return () =>
        {
            cleanup();
            updatePhase('idle');
        };
    }, [ roomSession?.roomId ]);

    if(phase === 'idle') return null;

    const isFading = phase === 'zoom-out' || phase === 'fade-out';

    // Visual overlay: spotlight vignette + label
    return (
        <>
            <style>{ `
                @keyframes spotlight-glow {
                    0%, 100% { box-shadow: 0 0 8px oklch(0.8 0.15 85), 0 0 20px oklch(0.8 0.15 85 / 0.3); }
                    50% { box-shadow: 0 0 16px oklch(0.8 0.15 85), 0 0 40px oklch(0.8 0.15 85 / 0.5); }
                }
            ` }</style>
            <div
                className="fixed inset-0 z-[200] pointer-events-none"
                style={{
                    opacity: isFading ? 0 : 1,
                    transition: 'opacity 600ms ease-out'
                }}>
                <div
                    className="absolute inset-0"
                    style={{
                        background: 'radial-gradient(circle at center, transparent 25%, oklch(var(--background) / 0.6) 100%)'
                    }}
                />
            </div>
            <div
                className={ `fixed top-20 left-1/2 -translate-x-1/2 z-[200] pointer-events-none transition-all duration-500 ${ isFading ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0' }` }>
                <Frame
                    className="max-w-sm"
                    style={{ animation: 'spotlight-glow 1.5s ease-in-out infinite', '--frame-radius': '9999px' } as React.CSSProperties}>
                    <FramePanel className="!p-0">
                        <div className="px-6 py-2.5 text-center">
                            <span className="text-sm font-bold text-amber-500 tracking-wider uppercase">
                                Spotlight
                            </span>
                        </div>
                    </FramePanel>
                </Frame>
            </div>
        </>
    );
};
