import { FC, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Marquee } from '../ui/marquee';
import { SlidingNumber } from '../ui/sliding-number';
import bahhosSvg from '@/assets/images/bahhos.svg';

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

function PhotoCard({ url }: { url: string })
{
    return (
        <div className="relative w-[200px] h-[150px] rounded-xl overflow-hidden border border-white/10 shadow-lg shrink-0">
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
            .catch(() => {});
    }, []);

    useEffect(() =>
    {
        if(isError) return;
        const interval = setInterval(() => setTipIndex(prev => (prev + 1) % LOADING_TIPS.length), 3500);
        return () => clearInterval(interval);
    }, [ isError ]);

    const cards = ensureMinCards(photoUrls, 24);
    const col1 = cards.filter((_, i) => i % 6 === 0);
    const col2 = cards.filter((_, i) => i % 6 === 1);
    const col3 = cards.filter((_, i) => i % 6 === 2);
    const col4 = cards.filter((_, i) => i % 6 === 3);
    const col5 = cards.filter((_, i) => i % 6 === 4);
    const col6 = cards.filter((_, i) => i % 6 === 5);

    return (
        <div className="nitro-loading">
            { /* 3D Gallery Background */ }
            { cards.length > 0 && (
                <div className="absolute inset-0 overflow-hidden flex items-center justify-center">
                    <div
                        className="flex flex-row gap-4 h-full w-[200vw]"
                        style={ {
                            transform: 'rotateX(15deg) rotateY(-8deg) rotateZ(15deg)',
                            opacity: 0.35,
                        } }
                    >
                        <Marquee vertical pauseOnHover={ false } repeat={ 3 } className="[--duration:35s] h-full flex-1">
                            { col1.map((url, i) => <PhotoCard key={ `c1-${ i }` } url={ url } />) }
                        </Marquee>
                        <Marquee vertical pauseOnHover={ false } reverse repeat={ 3 } className="[--duration:40s] h-full flex-1">
                            { col2.map((url, i) => <PhotoCard key={ `c2-${ i }` } url={ url } />) }
                        </Marquee>
                        <Marquee vertical pauseOnHover={ false } repeat={ 3 } className="[--duration:32s] h-full flex-1">
                            { col3.map((url, i) => <PhotoCard key={ `c3-${ i }` } url={ url } />) }
                        </Marquee>
                        <Marquee vertical pauseOnHover={ false } reverse repeat={ 3 } className="[--duration:45s] h-full flex-1">
                            { col4.map((url, i) => <PhotoCard key={ `c4-${ i }` } url={ url } />) }
                        </Marquee>
                        <Marquee vertical pauseOnHover={ false } repeat={ 3 } className="[--duration:37s] h-full flex-1">
                            { col5.map((url, i) => <PhotoCard key={ `c5-${ i }` } url={ url } />) }
                        </Marquee>
                        <Marquee vertical pauseOnHover={ false } reverse repeat={ 3 } className="[--duration:42s] h-full flex-1">
                            { col6.map((url, i) => <PhotoCard key={ `c6-${ i }` } url={ url } />) }
                        </Marquee>
                    </div>
                </div>
            ) }

            { /* Gradient Overlays */ }
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/90 to-transparent z-[1]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/90 to-transparent z-[1]" />
            <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-black/80 to-transparent z-[1]" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-black/80 to-transparent z-[1]" />

            { /* Center Content */ }
            <div className="relative z-[2] flex flex-col items-center justify-center h-full gap-6">
                <motion.img
                    src={ bahhosSvg }
                    alt="Bahhos"
                    className="max-w-[280px] w-[60vw] object-contain drop-shadow-2xl"
                    initial={ { opacity: 0, scale: 0.8 } }
                    animate={ { opacity: 1, scale: 1 } }
                    transition={ { duration: 0.8, ease: 'easeOut' } }
                />

                { isError ? (
                    <motion.div
                        className="text-red-400 text-lg font-semibold drop-shadow-lg"
                        initial={ { opacity: 0 } }
                        animate={ { opacity: 1 } }
                    >
                        { message }
                    </motion.div>
                ) : (
                    <>
                        <motion.div
                            className="flex items-center gap-1 text-white text-2xl font-mono font-bold drop-shadow-lg"
                            initial={ { opacity: 0, y: 10 } }
                            animate={ { opacity: 1, y: 0 } }
                            transition={ { delay: 0.3, duration: 0.5 } }
                        >
                            <SlidingNumber value={ Math.round(percent) } />
                            <span>%</span>
                        </motion.div>

                        <motion.div
                            className="w-[240px] h-[4px] rounded-full bg-white/10 overflow-hidden"
                            initial={ { opacity: 0 } }
                            animate={ { opacity: 1 } }
                            transition={ { delay: 0.4 } }
                        >
                            <motion.div
                                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                                initial={ { width: '0%' } }
                                animate={ { width: `${ Math.min(percent, 100) }%` } }
                                transition={ { duration: 0.5, ease: 'easeOut' } }
                            />
                        </motion.div>

                        <motion.p
                            key={ tipIndex }
                            className="text-white/60 text-sm font-medium mt-2 drop-shadow"
                            initial={ { opacity: 0, y: 8 } }
                            animate={ { opacity: 1, y: 0 } }
                            exit={ { opacity: 0, y: -8 } }
                            transition={ { duration: 0.4 } }
                        >
                            { LOADING_TIPS[tipIndex] }
                        </motion.p>
                    </>
                ) }
            </div>
        </div>
    );
}
