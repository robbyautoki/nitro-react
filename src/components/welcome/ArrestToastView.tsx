import { NotificationDialogMessageEvent } from '@nitrots/nitro-renderer';
import { FC, useEffect, useRef, useState } from 'react';
import { useMessageEvent } from '../../hooks';

export const ArrestToastView: FC<{}> = props =>
{
    // Arrest toast state (no auto-dismiss, dismissed by server)
    const [ arrestVisible, setArrestVisible ] = useState(false);
    const [ arrestFading, setArrestFading ] = useState(false);
    const [ arrestMessage, setArrestMessage ] = useState('');
    const [ reasonText, setReasonText ] = useState('');

    // Timer toast state
    const [ timerVisible, setTimerVisible ] = useState(false);
    const [ timerFading, setTimerFading ] = useState(false);
    const [ timerUntil, setTimerUntil ] = useState(0);
    const [ timerText, setTimerText ] = useState('');
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Listen for jail notification events
    useMessageEvent<NotificationDialogMessageEvent>(NotificationDialogMessageEvent, event =>
    {
        const parser = event.getParser();

        switch(parser.type)
        {
            case 'jail.arrest':
            {
                const msg = parser.parameters?.get('message') || 'Du wirst verhaftet!';
                const reason = parser.parameters?.get('reason') || '';
                setArrestMessage(msg);
                setReasonText(reason);
                setArrestFading(false);
                setArrestVisible(true);
                break;
            }
            case 'jail.arrest.end':
            {
                setArrestFading(true);
                setTimeout(() => setArrestVisible(false), 600);
                break;
            }
            case 'jail.timer':
            {
                const until = parseInt(parser.parameters?.get('until') || '0', 10);
                const reason = parser.parameters?.get('reason') || '';
                if(until > 0)
                {
                    setTimerUntil(until);
                    if(reason) setReasonText(reason);
                    setTimerFading(false);
                    setTimerVisible(true);
                }
                break;
            }
            case 'jail.timer.end':
            {
                setTimerFading(true);
                setTimeout(() =>
                {
                    setTimerVisible(false);
                    setTimerUntil(0);
                }, 600);
                break;
            }
        }
    });

    // Timer countdown interval
    useEffect(() =>
    {
        if(!timerVisible || timerUntil <= 0)
        {
            if(timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
            return;
        }

        const updateTimer = () =>
        {
            const remaining = Math.max(0, timerUntil - Date.now());
            const totalSeconds = Math.ceil(remaining / 1000);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            setTimerText(`${ String(minutes).padStart(2, '0') }:${ String(seconds).padStart(2, '0') }`);

            // No auto-dismiss: only server's jail.timer.end can hide the toast
        };

        updateTimer();
        timerRef.current = setInterval(updateTimer, 1000);

        return () => { if(timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
    }, [ timerVisible, timerUntil ]);

    return (
        <>
            { arrestVisible && (
                <div className={ `fixed top-20 left-1/2 -translate-x-1/2 z-[100] pointer-events-none transition-all duration-500 ${ arrestFading ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0' }` }>
                    <div className="px-6 py-3 rounded-2xl backdrop-blur-2xl bg-black/60 border border-white/[0.08] shadow-lg">
                        <p className="text-sm text-white/90 font-medium tracking-wide">
                            <span className="text-red-400 font-bold">{ arrestMessage }</span>
                        </p>
                        { reasonText && (
                            <p className="text-xs text-white/60 mt-1 tracking-wide">
                                Grund: <span className="text-white/80">{ reasonText }</span>
                            </p>
                        ) }
                    </div>
                </div>
            ) }
            { timerVisible && (
                <div className={ `fixed ${ arrestVisible ? 'top-32' : 'top-20' } left-1/2 -translate-x-1/2 z-[100] pointer-events-none transition-all duration-500 ${ timerFading ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0' }` }>
                    <div className="px-6 py-3 rounded-2xl backdrop-blur-2xl bg-black/60 border border-white/[0.08] shadow-lg">
                        <p className="text-sm text-white/90 font-medium tracking-wide">
                            { reasonText
                                ? <>Du bist inhaftiert wegen: <span className="text-white/80">{ reasonText }</span>. Noch <span className="text-amber-300 font-bold">{ timerText }</span> Minuten.</>
                                : <>Du bist inhaftiert. Noch <span className="text-amber-300 font-bold">{ timerText }</span> Minuten.</>
                            }
                        </p>
                    </div>
                </div>
            ) }
        </>
    );
}
