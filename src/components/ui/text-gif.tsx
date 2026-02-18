import { FC } from 'react';
import { cn } from '@/lib/utils';

const sizeMap = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
    xxl: 'text-6xl',
};

const weightMap = {
    normal: 'font-normal',
    medium: 'font-medium',
    semi: 'font-semibold',
    bold: 'font-bold',
};

interface TextGifProps
{
    gifUrl: string;
    text: string;
    size?: keyof typeof sizeMap;
    weight?: keyof typeof weightMap;
    className?: string;
}

export const TextGif: FC<TextGifProps> = ({ gifUrl, text, size = 'xl', weight = 'bold', className }) =>
{
    return (
        <span
            className={ cn(sizeMap[size], weightMap[weight], 'inline-block leading-none select-none', className) }
            style={ {
                backgroundImage: `url(${gifUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
            } }
        >
            { text }
        </span>
    );
};
