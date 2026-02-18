import { NotificationDialogMessageEvent } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { useMessageEvent } from '../../hooks';

type LotteryMode = 'idle' | 'countdown' | 'result' | 'no_winner';

export const LotteryView: FC<{}> = () =>
{
    const [ mode, setMode ] = useState<LotteryMode>('idle');
    const [ visible, setVisible ] = useState(false);
    const [ fading, setFading ] = useState(false);

    // Countdown state
    const [ secondsLeft, setSecondsLeft ] = useState(0);
    const [ jackpot, setJackpot ] = useState('0');
    const [ tickets, setTickets ] = useState('0');
    const [ price, setPrice ] = useState('10');

    // Result state
    const [ winner, setWinner ] = useState('');
    const [ prize, setPrize ] = useState('0');
    const [ nextDraw, setNextDraw ] = useState('20:00');

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearTimers = useCallback(() =>
    {
        if(timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        if(hideTimerRef.current) { clearTimeout(hideTimerRef.current); hideTimerRef.current = null; }
    }, []);

    const showView = useCallback((newMode: LotteryMode, autoHideSeconds: number = 0) =>
    {
        clearTimers();
        setFading(false);
        setMode(newMode);
        setVisible(true);

        if(autoHideSeconds > 0)
        {
            hideTimerRef.current = setTimeout(() =>
            {
                setFading(true);
                setTimeout(() => { setVisible(false); setMode('idle'); }, 600);
            }, autoHideSeconds * 1000);
        }
    }, [ clearTimers ]);

    // Listen for lottery notification events
    useMessageEvent<NotificationDialogMessageEvent>(NotificationDialogMessageEvent, event =>
    {
        const parser = event.getParser();
        const type = parser.type;

        if(type === 'lottery.countdown')
        {
            const params = parser.parameters;
            const mins = parseInt(params.get('minutes') || '5');
            setJackpot(params.get('jackpot') || '0');
            setTickets(params.get('tickets') || '0');
            setPrice(params.get('price') || '10');
            setSecondsLeft(mins * 60);

            showView('countdown');

            // Start countdown timer
            timerRef.current = setInterval(() =>
            {
                setSecondsLeft(prev =>
                {
                    if(prev <= 1)
                    {
                        if(timerRef.current) clearInterval(timerRef.current);
                        // Don't hide — the result event will replace it
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        else if(type === 'lottery.result')
        {
            const params = parser.parameters;
            setWinner(params.get('winner') || '???');
            setPrize(params.get('prize') || '0');
            setNextDraw(params.get('next_draw') || '20:00');

            showView('result', 15);
        }
        else if(type === 'lottery.no_winner')
        {
            const params = parser.parameters;
            setJackpot(params.get('jackpot') || '0');
            setNextDraw(params.get('next_draw') || '20:00');

            showView('no_winner', 10);
        }
    });

    // Cleanup on unmount
    useEffect(() => () => clearTimers(), [ clearTimers ]);

    if(!visible || mode === 'idle') return null;

    const formatTime = (secs: number): string =>
    {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${ m }:${ s.toString().padStart(2, '0') }`;
    };

    const formatCredits = (val: string): string =>
    {
        return parseInt(val).toLocaleString('de-DE');
    };

    return (
        <div className={ `fixed top-20 left-1/2 -translate-x-1/2 z-[100] pointer-events-none transition-all duration-500 ${ fading ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0' }` }>
            <div className="px-6 py-4 rounded-2xl backdrop-blur-2xl bg-black/70 border border-white/[0.08] shadow-lg min-w-[320px]">
                { mode === 'countdown' && (
                    <div className="text-center space-y-1.5">
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-lg">🎰</span>
                            <span className="text-sm font-bold text-amber-300 uppercase tracking-wider">
                                Lotto Ziehung in { formatTime(secondsLeft) }
                            </span>
                        </div>
                        <div className="text-xs text-white/70">
                            Jackpot: <span className="text-emerald-400 font-semibold">{ formatCredits(jackpot) } Credits</span>
                            <span className="mx-2 text-white/30">|</span>
                            { tickets } Tickets
                        </div>
                        <div className="text-xs text-white/50">
                            :lotto buy — Jetzt Ticket kaufen! ({ price } Credits)
                        </div>
                    </div>
                ) }

                { mode === 'result' && (
                    <div className="text-center space-y-1.5">
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-lg">🎉</span>
                            <span className="text-sm font-bold text-amber-300 uppercase tracking-wider">
                                Lotto Gewinner!
                            </span>
                            <span className="text-lg">🎉</span>
                        </div>
                        <div className="text-sm text-white/90">
                            <span className="text-amber-200 font-bold">{ winner }</span> hat{' '}
                            <span className="text-emerald-400 font-bold">{ formatCredits(prize) } Credits</span> gewonnen!
                        </div>
                        <div className="text-xs text-white/50">
                            Naechste Ziehung: { nextDraw } Uhr
                        </div>
                    </div>
                ) }

                { mode === 'no_winner' && (
                    <div className="text-center space-y-1.5">
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-lg">🎰</span>
                            <span className="text-sm font-bold text-white/80 uppercase tracking-wider">
                                Kein Gewinner heute
                            </span>
                        </div>
                        <div className="text-xs text-white/70">
                            Niemand hat teilgenommen. Naechste Ziehung: { nextDraw } Uhr
                        </div>
                    </div>
                ) }
            </div>
        </div>
    );
}
