import { NotificationDialogMessageEvent } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { GetRoomSession } from '../../api';
import { useMessageEvent } from '../../hooks';
import { TopbarBannerStack } from '../../hooks/notification/useTopbarBannerStack';
import * as AlignBadge from '@/align-ui/components/ui/badge';
import * as AlignButton from '@/align-ui/components/ui/button';
import * as AlignSurface from '@/align-ui/components/ui/surface';
import { Ticket, PartyPopper, Frown } from 'lucide-react';

type LotteryMode = 'idle' | 'countdown' | 'result' | 'no_winner';

const formatTime = (secs: number): string =>
{
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${ m }:${ s.toString().padStart(2, '0') }`;
};

const formatCredits = (val: string): string =>
{
    const n = parseInt(val, 10);
    if(isNaN(n)) return val;
    return n.toLocaleString('de-DE');
};

const handleBuyTicket = () =>
{
    try
    {
        const session = GetRoomSession();
        if(session) session.sendChatMessage(':lotto buy', 0);
    }
    catch {}
};

interface LotteryCardProps {
    mode: LotteryMode;
    secondsLeft: number;
    jackpot: string;
    tickets: string;
    price: string;
    winner: string;
    prize: string;
    nextDraw: string;
    fading: boolean;
}

const LotteryCard: FC<LotteryCardProps> = ({ mode, secondsLeft, jackpot, tickets, price, winner, prize, nextDraw, fading }) =>
{
    return (
        <AlignSurface.Panel className={ `min-w-[320px] max-w-[420px] overflow-hidden transition-opacity duration-300 ${ fading ? 'opacity-0' : 'opacity-100' }` }>
            { mode === 'countdown' && (
                <div className="space-y-1.5 px-5 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                        <Ticket className="size-4 text-warning-base" />
                        <span className="text-label-sm font-bold uppercase tracking-normal text-warning-base">
                            Lotto Ziehung in { formatTime(secondsLeft) }
                        </span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-paragraph-xs text-text-sub-600">
                        <span>Jackpot:</span>
                        <AlignBadge.Root color="green" variant="lighter" size="small">{ formatCredits(jackpot) } Credits</AlignBadge.Root>
                        <span className="text-text-soft-400">|</span>
                        <span>{ tickets } Tickets</span>
                    </div>
                    <div className="flex items-center justify-center pt-1 pointer-events-auto">
                        <AlignButton.Root
                            type="button"
                            variant="primary"
                            mode="filled"
                            size="xxsmall"
                            className="px-3 text-paragraph-xs"
                            onClick={ handleBuyTicket }
                        >
                            <Ticket className="size-3.5" />
                            <span>Ticket kaufen ({ price } Credits)</span>
                        </AlignButton.Root>
                    </div>
                </div>
            ) }
            { mode === 'result' && (
                <div className="space-y-1.5 px-5 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                        <PartyPopper className="size-4 text-warning-base" />
                        <span className="text-label-sm font-bold uppercase tracking-normal text-warning-base">
                            Lotto Gewinner!
                        </span>
                        <PartyPopper className="size-4 text-warning-base" />
                    </div>
                    <div className="text-paragraph-sm text-text-sub-600">
                        <span className="font-bold text-warning-base">{ winner }</span> hat{ ' ' }
                        <span className="font-bold text-success-base">{ formatCredits(prize) } Credits</span> gewonnen!
                    </div>
                    <div className="text-paragraph-xs text-text-soft-400">
                        Nächste Ziehung: { nextDraw } Uhr
                    </div>
                </div>
            ) }
            { mode === 'no_winner' && (
                <div className="space-y-1 px-5 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                        <Frown className="size-4 text-text-sub-600" />
                        <span className="text-label-sm font-semibold uppercase tracking-normal text-text-sub-600">
                            Kein Gewinner heute
                        </span>
                    </div>
                    <div className="text-paragraph-xs text-text-soft-400">
                        Niemand hat teilgenommen. Nächste Ziehung: { nextDraw } Uhr
                    </div>
                </div>
            ) }
        </AlignSurface.Panel>
    );
};

export const LotteryView: FC<{}> = () =>
{
    const [ mode, setMode ] = useState<LotteryMode>('idle');
    const [ visible, setVisible ] = useState(false);
    const [ fading, setFading ] = useState(false);

    const [ secondsLeft, setSecondsLeft ] = useState(0);
    const [ jackpot, setJackpot ] = useState('0');
    const [ tickets, setTickets ] = useState('0');
    const [ price, setPrice ] = useState('10');

    const [ winner, setWinner ] = useState('');
    const [ prize, setPrize ] = useState('0');
    const [ nextDraw, setNextDraw ] = useState('20:00');

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearTimers = useCallback(() =>
    {
        if(timerRef.current)
        {
            clearInterval(timerRef.current); timerRef.current = null;
        }
        if(hideTimerRef.current)
        {
            clearTimeout(hideTimerRef.current); hideTimerRef.current = null;
        }
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
                setTimeout(() =>
                {
                    setVisible(false); setMode('idle');
                }, 600);
            }, autoHideSeconds * 1000);
        }
    }, [ clearTimers ]);

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

            timerRef.current = setInterval(() =>
            {
                setSecondsLeft(prev =>
                {
                    if(prev <= 1)
                    {
                        if(timerRef.current) clearInterval(timerRef.current);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        else if(type === 'lottery.tickets_update')
        {
            // Live-Update beim Ticket-Kauf: nur State aktualisieren, kein Mode-Wechsel,
            // kein erneutes Anzeigen wenn Banner aktuell nicht sichtbar ist.
            const params = parser.parameters;
            const newTickets = params.get('tickets');
            const newJackpot = params.get('jackpot');
            const newPrice = params.get('price');
            if(newTickets !== null && newTickets !== undefined) setTickets(newTickets);
            if(newJackpot !== null && newJackpot !== undefined) setJackpot(newJackpot);
            if(newPrice !== null && newPrice !== undefined) setPrice(newPrice);
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

    useEffect(() => () => clearTimers(), [ clearTimers ]);

    // Push / update / remove the lottery banner inside the central TopbarBannerStack
    // so it stacks under wallet/floatbar together with other top-level toasts
    // (room-entry, arrest, jail-timer, broadcast) without overlapping.
    useEffect(() =>
    {
        if(!visible || mode === 'idle')
        {
            TopbarBannerStack.remove('lottery');
            return;
        }

        TopbarBannerStack.push({
            id: 'lottery',
            kind: 'broadcast',
            priority: 20, // unter arrest(5), jail-timer(10), über generic broadcasts
            content: (
                <LotteryCard
                    mode={ mode }
                    secondsLeft={ secondsLeft }
                    jackpot={ jackpot }
                    tickets={ tickets }
                    price={ price }
                    winner={ winner }
                    prize={ prize }
                    nextDraw={ nextDraw }
                    fading={ fading }
                />
            )
        });
    }, [ visible, mode, secondsLeft, jackpot, tickets, price, winner, prize, nextDraw, fading ]);

    // Cleanup on unmount
    useEffect(() => () => TopbarBannerStack.remove('lottery'), []);

    return null;
}
