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
    { text: 'Willkommen bei Bahhos!', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop' },
    { text: 'Gestalte deinen eigenen Raum', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop' },
    { text: 'Triff neue Freunde im Hotel', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop' },
    { text: 'Sammle seltene Möbel', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=300&fit=crop' },
    { text: 'Erstelle deine eigene Gruppe', image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&h=300&fit=crop' },
    { text: 'Entdecke Events und Spiele', image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=300&fit=crop' },
    { text: 'Handle mit anderen Habbos', image: 'https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?w=400&h=300&fit=crop' },
    { text: 'Werde kreativ mit Wired', image: 'https://images.unsplash.com/photo-1535223289827-42f1e9919769?w=400&h=300&fit=crop' },
];

function ensureMinCards(tips: typeof LOADING_TIPS, min: number)
{
    if(tips.length >= min) return tips;
    const result = [ ...tips ];
    while(result.length < min) result.push(...tips);
    return result.slice(0, min);
}

function TipCard({ text, image }: { text: string; image: string })
{
    return (
        <div className="relative w-[220px] h-[160px] rounded-xl overflow-hidden border border-white/10 shadow-lg shrink-0">
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={ { backgroundImage: `url(${ image })` } }
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white text-xs font-semibold leading-tight drop-shadow-lg">{ text }</p>
            </div>
        </div>
    );
}

export const LoadingView: FC<LoadingViewProps> = props =>
{
    const { isError = false, message = '', percent = 0 } = props;
    const [ tipIndex, setTipIndex ] = useState(0);
    const cards = ensureMinCards(LOADING_TIPS, 12);

    useEffect(() =>
    {
        if(isError) return;
        const interval = setInterval(() => setTipIndex(prev => (prev + 1) % LOADING_TIPS.length), 3500);
        return () => clearInterval(interval);
    }, [ isError ]);

    const col1 = cards.filter((_, i) => i % 4 === 0);
    const col2 = cards.filter((_, i) => i % 4 === 1);
    const col3 = cards.filter((_, i) => i % 4 === 2);
    const col4 = cards.filter((_, i) => i % 4 === 3);

    return (
        <div className="nitro-loading">
            { /* 3D Gallery Background */ }
            <div className="absolute inset-0 overflow-hidden">
                <div
                    className="flex flex-row items-center gap-4 h-full justify-center"
                    style={ {
                        transform: 'translateX(-60px) translateZ(-100px) rotateX(15deg) rotateY(-8deg) rotateZ(15deg)',
                        perspective: '300px',
                        opacity: 0.35,
                    } }
                >
                    <Marquee vertical pauseOnHover={ false } repeat={ 3 } className="[--duration:35s] h-full">
                        { col1.map((tip, i) => <TipCard key={ `c1-${ i }` } { ...tip } />) }
                    </Marquee>
                    <Marquee vertical pauseOnHover={ false } reverse repeat={ 3 } className="[--duration:40s] h-full">
                        { col2.map((tip, i) => <TipCard key={ `c2-${ i }` } { ...tip } />) }
                    </Marquee>
                    <Marquee vertical pauseOnHover={ false } repeat={ 3 } className="[--duration:32s] h-full">
                        { col3.map((tip, i) => <TipCard key={ `c3-${ i }` } { ...tip } />) }
                    </Marquee>
                    <Marquee vertical pauseOnHover={ false } reverse repeat={ 3 } className="[--duration:45s] h-full">
                        { col4.map((tip, i) => <TipCard key={ `c4-${ i }` } { ...tip } />) }
                    </Marquee>
                </div>
            </div>

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
                    className="w-[200px] drop-shadow-2xl"
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
                            { LOADING_TIPS[tipIndex].text }
                        </motion.p>
                    </>
                ) }
            </div>
        </div>
    );
}
