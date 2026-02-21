import { FC, useEffect, useState } from 'react';
import { useCatalog } from '../../../../hooks';

export const MultiPlaceCounterView: FC<{}> = () =>
{
    const { multiPlaceCount = 0, objectMoverRequested = false } = useCatalog();
    const [ mousePos, setMousePos ] = useState({ x: 0, y: 0 });

    useEffect(() =>
    {
        if(!objectMoverRequested || multiPlaceCount <= 0) return;

        const onMouseMove = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });

        document.addEventListener('mousemove', onMouseMove);

        return () => document.removeEventListener('mousemove', onMouseMove);
    }, [ objectMoverRequested, multiPlaceCount ]);

    if(!objectMoverRequested || multiPlaceCount <= 0) return null;

    return (
        <div
            className="fixed pointer-events-none z-[9999]"
            style={{ left: mousePos.x + 16, top: mousePos.y - 8 }}
        >
            <div className="bg-black/80 text-white text-xs font-bold px-2 py-1 rounded-full border border-white/20 shadow-lg backdrop-blur-sm">
                ×{ multiPlaceCount }
            </div>
        </div>
    );
};
