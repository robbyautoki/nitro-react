import React, { useCallback, useEffect, useState, type JSX } from 'react'
import Autoplay from 'embla-carousel-autoplay'
import {
    AnimatePresence,
    motion,
    MotionProps,
    useAnimation,
    Variants,
} from 'motion/react'

import { cn } from '@/lib/utils'
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    type CarouselApi,
} from '@/components/ui/carousel'

interface Tip {
    text: string
    image: string
    url?: string
}

interface LoadingCarouselProps {
    tips?: Tip[]
    className?: string
    autoplayInterval?: number
    showNavigation?: boolean
    showIndicators?: boolean
    showProgress?: boolean
    aspectRatio?: 'video' | 'square' | 'wide'
    textPosition?: 'top' | 'bottom'
    onTipChange?: (index: number) => void
    onSlideClick?: (index: number) => void
    backgroundTips?: boolean
    backgroundGradient?: boolean
    shuffleTips?: boolean
    animateText?: boolean
}

function shuffleArray<T>(array: T[]): T[]
{
    const shuffled = [...array]
    for(let i = shuffled.length - 1; i > 0; i--)
    {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
}

const carouselVariants: Variants = {
    enter: (direction: number) => ({
        x: direction > 0 ? '100%' : '-100%',
        opacity: 0,
    }),
    center: {
        x: 0,
        opacity: 1,
    },
    exit: (direction: number) => ({
        x: direction < 0 ? '100%' : '-100%',
        opacity: 0,
    }),
}

const textVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { delay: 0.3, duration: 0.5 } },
}

const aspectRatioClasses = {
    video: 'aspect-video',
    square: 'aspect-square',
    wide: 'aspect-[2/1]',
}

export function LoadingCarousel({
    onTipChange,
    onSlideClick,
    className,
    tips = [],
    showProgress = true,
    aspectRatio = 'video',
    showNavigation = false,
    showIndicators = true,
    backgroundTips = false,
    textPosition = 'bottom',
    autoplayInterval = 4500,
    backgroundGradient = false,
    shuffleTips = false,
    animateText = true,
}: LoadingCarouselProps)
{
    const [progress, setProgress] = useState(0)
    const [api, setApi] = useState<CarouselApi>()
    const [current, setCurrent] = useState(0)
    const [direction, setDirection] = useState(0)
    const controls = useAnimation()
    const [displayTips] = useState(() =>
        shuffleTips ? shuffleArray(tips) : tips
    )

    const autoplay = Autoplay({
        delay: autoplayInterval,
        stopOnInteraction: false,
    })

    useEffect(() =>
    {
        if(!api) return

        setCurrent(api.selectedScrollSnap())
        setDirection(
            api.scrollSnapList().indexOf(api.selectedScrollSnap()) - current
        )

        const onSelect = () =>
        {
            const newIndex = api.selectedScrollSnap()
            setCurrent(newIndex)
            setDirection(api.scrollSnapList().indexOf(newIndex) - current)
            onTipChange?.(newIndex)
        }

        api.on('select', onSelect)

        return () =>
        {
            api.off('select', onSelect)
        }
    }, [api, current, onTipChange])

    useEffect(() =>
    {
        if(!showProgress) return

        const timer = setInterval(() =>
        {
            setProgress((oldProgress) =>
            {
                if(oldProgress === 100) return 0

                const diff = 2
                return Math.min(oldProgress + diff, 100)
            })
        }, autoplayInterval / 50)

        return () =>
        {
            clearInterval(timer)
        }
    }, [showProgress, autoplayInterval])

    useEffect(() =>
    {
        if(progress === 100)
        {
            controls.start({ scaleX: 0 }).then(() =>
            {
                setProgress(0)
                controls.set({ scaleX: 1 })
            })
        }
        else
        {
            controls.start({ scaleX: progress / 100 })
        }
    }, [progress, controls])

    const handleSelect = useCallback(
        (index: number) =>
        {
            api?.scrollTo(index)
        },
        [api]
    )

    if(!displayTips.length) return null

    return (
        <motion.div
            initial={ { opacity: 0, y: 20 } }
            animate={ { opacity: 1, y: 0 } }
            transition={ { duration: 0.8, ease: 'easeOut' } }
            className={ cn(
                'w-full h-full rounded-lg overflow-hidden',
                className
            ) }
        >
            <div className="w-full h-full overflow-hidden rounded-lg flex flex-col">
                <div className="flex-1 min-h-0 overflow-hidden">
                <Carousel
                    setApi={ setApi }
                    plugins={ [autoplay] }
                    className="w-full h-full relative"
                    opts={ { loop: true } }
                >
                    <CarouselContent>
                        <AnimatePresence initial={ false } custom={ direction }>
                            { (displayTips || []).map((tip, index) => (
                                <CarouselItem key={ index }>
                                    <motion.div
                                        variants={ carouselVariants }
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        custom={ direction }
                                        transition={ { duration: 0.8, ease: 'easeInOut' } }
                                        className="relative w-full h-full overflow-hidden cursor-pointer"
                                        onClick={ () => onSlideClick?.(index) }
                                    >
                                        <div
                                            className="absolute inset-0 bg-cover bg-center"
                                            style={ { backgroundImage: `url(${ tip.image })` } }
                                        />
                                        { backgroundGradient && (
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                                        ) }

                                        { backgroundTips ? (
                                            <motion.div
                                                variants={ textVariants }
                                                initial="hidden"
                                                animate="visible"
                                                className={ `absolute ${ textPosition === 'top' ? 'top-0' : 'bottom-0' } left-0 right-0 p-4 sm:p-6` }
                                            >
                                                <p className="text-white text-left text-base sm:text-lg font-semibold tracking-tight leading-relaxed drop-shadow-lg">
                                                    { animateText ? (
                                                        <TextScramble
                                                            key={ tip.text }
                                                            duration={ 1.2 }
                                                            characterSet=". "
                                                        >
                                                            { tip.text }
                                                        </TextScramble>
                                                    ) : (
                                                        tip.text
                                                    ) }
                                                </p>
                                            </motion.div>
                                        ) : null }
                                    </motion.div>
                                </CarouselItem>
                            )) }
                        </AnimatePresence>
                    </CarouselContent>
                    { showNavigation && (
                        <>
                            <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2" />
                            <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2" />
                        </>
                    ) }
                </Carousel>
                </div>
                <div
                    className={ cn(
                        'shrink-0 bg-black/40 backdrop-blur-sm px-4 py-2',
                        showIndicators && !backgroundTips ? 'py-2 px-4' : ''
                    ) }
                >
                    <div
                        className={ cn(
                            'flex items-center justify-between',
                            showIndicators && !backgroundTips
                                ? 'flex-col items-start gap-2'
                                : ''
                        ) }
                    >
                        { showIndicators && (
                            <div className="flex space-x-2 overflow-x-auto w-full sm:w-auto">
                                { (displayTips || []).map((_, index) => (
                                    <motion.button
                                        key={ index }
                                        className={ `h-1 w-8 flex-shrink-0 rounded-full ${ index === current ? 'bg-white' : 'bg-white/30' }` }
                                        initial={ false }
                                        animate={ {
                                            backgroundColor:
                                                index === current ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)',
                                        } }
                                        transition={ { duration: 0.5 } }
                                        onClick={ () => handleSelect(index) }
                                        aria-label={ `Go to slide ${ index + 1 }` }
                                    />
                                )) }
                            </div>
                        ) }
                        <div className="flex items-center space-x-2 text-white/70 whitespace-nowrap">
                            { backgroundTips ? (
                                <span className="text-sm font-medium">
                                    { current + 1 }/{ displayTips?.length || 0 }
                                </span>
                            ) : (
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold tracking-tight text-white/90">
                                        { animateText ? (
                                            <TextScramble
                                                key={ displayTips[current]?.text }
                                                duration={ 1.2 }
                                                characterSet=". "
                                            >
                                                { displayTips[current]?.text }
                                            </TextScramble>
                                        ) : (
                                            displayTips[current]?.text
                                        ) }
                                    </span>
                                </div>
                            ) }
                        </div>
                    </div>
                    { showProgress && (
                        <motion.div
                            initial={ { scaleX: 0 } }
                            animate={ controls }
                            transition={ { duration: 0.5, ease: 'linear' } }
                            className="h-0.5 bg-white/30 origin-left mt-2 rounded-full"
                        />
                    ) }
                </div>
            </div>
        </motion.div>
    )
}

// Credit -> https://motion-primitives.com/docs/text-scramble
type TextScrambleProps = {
    children: string
    duration?: number
    speed?: number
    characterSet?: string
    as?: React.ElementType
    className?: string
    trigger?: boolean
    onScrambleComplete?: () => void
} & MotionProps

const defaultChars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

function TextScramble({
    children,
    duration = 0.8,
    speed = 0.04,
    characterSet = defaultChars,
    className,
    as: Component = 'p',
    trigger = true,
    onScrambleComplete,
    ...props
}: TextScrambleProps)
{
    const MotionComponent = motion.create(
        Component as keyof JSX.IntrinsicElements
    )
    const [displayText, setDisplayText] = useState(children)
    const [isAnimating, setIsAnimating] = useState(false)
    const text = children

    const scramble = async () =>
    {
        if(isAnimating) return
        setIsAnimating(true)

        const steps = duration / speed
        let step = 0

        const interval = setInterval(() =>
        {
            let scrambled = ''
            const progress = step / steps

            for(let i = 0; i < text.length; i++)
            {
                if(text[i] === ' ')
                {
                    scrambled += ' '
                    continue
                }

                if(progress * text.length > i)
                {
                    scrambled += text[i]
                }
                else
                {
                    scrambled +=
                        characterSet[Math.floor(Math.random() * characterSet.length)]
                }
            }

            setDisplayText(scrambled)
            step++

            if(step > steps)
            {
                clearInterval(interval)
                setDisplayText(text)
                setIsAnimating(false)
                onScrambleComplete?.()
            }
        }, speed * 1000)
    }

    useEffect(() =>
    {
        if(!trigger) return

        scramble()
    }, [trigger])

    return (
        <MotionComponent className={ className } { ...props }>
            { displayText }
        </MotionComponent>
    )
}

export default LoadingCarousel
