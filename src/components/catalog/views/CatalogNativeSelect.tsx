import { FC, SelectHTMLAttributes } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { cn } from '../../../lib/utils';

export const CatalogNativeSelect: FC<SelectHTMLAttributes<HTMLSelectElement>> = ({ className, children, ...props }) =>
{
    return (
        <div className="relative">
            <select
                className={ cn(
                    'appearance-none h-8 w-full rounded-md border border-zinc-200 bg-white pl-2.5 pr-8 text-xs text-zinc-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950',
                    className
                ) }
                { ...props }
            >
                { children }
            </select>
            <FaChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-zinc-400 pointer-events-none" />
        </div>
    );
};
