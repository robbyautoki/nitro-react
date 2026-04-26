import { FC, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Marquee } from '../ui/marquee';
import { SlidingNumber } from '../ui/sliding-number';
import bahhosLogo from '@/assets/images/brand/bahhos-logo.png';

interface LoadingViewProps
{
    isError: boolean;
    message: string;
    percent: number;
}

const LOADING_TIPS = [
    'Willkommen bei Bahhos!',
    'Gestalte deinen eigenen Raum',
    'Triff neue Freunde im Hotel',
    'Sammle seltene Möbel',
    'Erstelle deine eigene Gruppe',
    'Entdecke Events und Spiele',
    'Handle mit anderen Habbos',
    'Werde kreativ mit Wired',
];

function ensureMinCards(urls: string[], min: number): string[]
{
    if(urls.length === 0) return [];
    const result = [ ...urls ];
    while(result.length < min) result.push(...urls);
    return result.slice(0, min);
}

function shuffleArray(arr: string[]): string[]
{
    const a = [ ...arr ];
    for(let i = a.length - 1; i > 0; i--)
    {
        const j = Math.floor(Math.random() * (i + 1));
        [ a[i], a[j] ] = [ a[j], a[i] ];
    }
    return a;
}

function PhotoCard({ url }: { url: string })
{
    return (
        <div className="relative w-[320px] h-[240px] rounded-2xl overflow-hidden shadow-2xl shrink-0">
            <img
                src={ url }
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                loading="eager"
            />
        </div>
    );
}

export const LoadingView: FC<LoadingViewProps> = props =>
{
    const { isError = false, message = '', percent = 0 } = props;
    const [ tipIndex, setTipIndex ] = useState(0);
    const [ photoUrls, setPhotoUrls ] = useState<string[]>([]);

    useEffect(() =>
    {
        const url = '/api/photos/public';
        fetch(url)
            .then(res => res.json())
            .then((data: { url: string }[]) =>
            {
                if(Array.isArray(data) && data.length > 0)
                {
                    setPhotoUrls(data.map(p => p.url));
                }
            })
            .catch(() =>
            {});
    }, []);

    useEffect(() =>
    {
        if(isError) return;
        const interval = setInterval(() => setTipIndex(prev => (prev + 1) % LOADING_TIPS.length), 3500);
        return () => clearInterval(interval);
    }, [ isError ]);

    const columns = useMemo(() =>
    {
        if(!photoUrls.length) return [];
        return Array.from({ length: 6 }, () => shuffleArray(ensureMinCards(photoUrls, 4)));
    }, [ photoUrls ]);

    const clampedPercent = Math.min(Math.max(percent, 0), 100);

    return (
        <div className="nitro-loading">
            { /* Animated mesh gradient background (always visible, even without photos) */ }
            <div className="nitro-loading-mesh" aria-hidden="true" />
            <div className="nitro-loading-noise" aria-hidden="true" />

            { /* Optional 3D photo gallery layer */ }
            { columns.length > 0 && (
                <div className="absolute inset-0 overflow-hidden flex items-center justify-center z-[1]">
                    <div
                        className="flex flex-row gap-5 h-full w-[250vw] blur-[2px]"
                        style={ {
                            transform: 'scale(1.5) rotateX(15deg) rotateY(-8deg) rotateZ(15deg)',
                            opacity: 0.22,
                        } }
                    >
                        { columns.map((col, ci) => (
                            <Marquee
                                key={ ci }
                                vertical
                                pauseOnHover={ false }
                                reverse={ ci % 2 === 1 }
                                repeat={ 3 }
                                className={ `h-full flex-1 ${ [ '[--duration:32s]', '[--duration:40s]', '[--duration:35s]', '[--duration:45s]', '[--duration:37s]', '[--duration:42s]' ][ci] }` }
                            >
                                { col.map((url, i) => <PhotoCard key={ `c${ ci }-${ i }` } url={ url } />) }
                            </Marquee>
                        )) }
                    </div>
                </div>
            ) }

            { /* Vignette */ }
            <div className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.55)_75%,_rgba(0,0,0,0.85)_100%)]" />

            { /* Center Content */ }
            <div className="relative z-[3] flex flex-col items-center justify-center h-full gap-8 px-6">
                <motion.div
                    className="relative"
                    initial={ { opacity: 0, scale: 0.85, y: 8 } }
                    animate={ { opacity: 1, scale: 1, y: 0 } }
                    transition={ { duration: 0.9, ease: [ 0.16, 1, 0.3, 1 ] } }
                >
                    { /* Glow halo behind logo */ }
                    <div
                        className="absolute inset-0 -z-10 blur-3xl opacity-70"
                        style={ {
                            background: 'radial-gradient(closest-side, rgba(255,166,71,0.55), rgba(78,131,255,0.35) 60%, transparent 80%)',
                        } }
                    />
                    <motion.img
                        src={ bahhosLogo }
                        alt="Bahhos.de"
                        draggable={ false }
                        className="nitro-loading-logo"
                        style={ { imageRendering: 'pixelated' } }
                        animate={ { y: [ 0, -6, 0 ] } }
                        transition={ { duration: 4.2, repeat: Infinity, ease: 'easeInOut' } }
                    />
                </motion.div>

                { isError ? (
                    <motion.div
                        className="flex flex-col items-center gap-4 max-w-[360px] text-center"
                        initial={ { opacity: 0, y: 12 } }
                        animate={ { opacity: 1, y: 0 } }
                        transition={ { duration: 0.5, delay: 0.2 } }
                    >
                        <div className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 px-6 py-5 shadow-2xl">
                            <p className="text-white/95 text-base font-semibold drop-shadow-lg">
                                { message }
                            </p>
                            <p className="text-white/50 text-xs mt-2">
                                Falls das Problem bestehen bleibt, schau auf unseren Discord.
                            </p>
                        </div>
                        <button
                            onClick={ () => window.location.reload() }
                            className="px-7 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 active:scale-[0.97] border border-white/15 text-white text-sm font-semibold backdrop-blur-md transition-all duration-200 cursor-pointer shadow-lg"
                        >
                            Erneut versuchen
                        </button>
                    </motion.div>
                ) : (
                    <motion.div
                        className="flex flex-col items-center gap-5 w-full max-w-sm"
                        initial={ { opacity: 0, y: 12 } }
                        animate={ { opacity: 1, y: 0 } }
                        transition={ { duration: 0.6, delay: 0.25 } }
                    >
                        { /* Big percentage */ }
                        <div className="flex items-baseline gap-1 text-white tabular-nums">
                            <span className="text-5xl font-bold tracking-tight drop-shadow-[0_2px_20px_rgba(255,166,71,0.45)]">
                                <SlidingNumber value={ Math.round(clampedPercent) } />
                            </span>
                            <span className="text-2xl font-semibold text-white/60">%</span>
                        </div>

                        { /* Progress bar with brand gradient */ }
                        <div className="relative w-[280px] h-[6px] rounded-full bg-white/10 overflow-hidden ring-1 ring-white/5">
                            <motion.div
                                className="h-full rounded-full"
                                style={ {
                                    background: 'linear-gradient(90deg, #ffa647 0%, #ff7a47 35%, #4e83ff 100%)',
                                    boxShadow: '0 0 18px rgba(255,166,71,0.55), 0 0 36px rgba(78,131,255,0.35)',
                                } }
                                initial={ { width: '0%' } }
                                animate={ { width: `${ clampedPercent }%` } }
                                transition={ { duration: 0.6, ease: [ 0.16, 1, 0.3, 1 ] } }
                            />
                        </div>

                        { /* Tip text */ }
                        <div className="h-5 mt-1 flex items-center justify-center">
                            <AnimatePresence mode="wait">
                                <motion.p
                                    key={ tipIndex }
                                    className="text-white/75 text-sm font-medium drop-shadow"
                                    initial={ { opacity: 0, y: 6 } }
                                    animate={ { opacity: 1, y: 0 } }
                                    exit={ { opacity: 0, y: -6 } }
                                    transition={ { duration: 0.35, ease: 'easeOut' } }
                                >
                                    { LOADING_TIPS[tipIndex] }
                                </motion.p>
                            </AnimatePresence>
                        </div>
                    </motion.div>
                ) }
            </div>
        </div>
    );
}
