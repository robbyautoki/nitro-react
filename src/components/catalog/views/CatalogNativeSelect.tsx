import { FC, SelectHTMLAttributes } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { cn } from '../../../lib/utils';

export const CatalogNativeSelect: FC<SelectHTMLAttributes<HTMLSelectElement>> = ({ className, children, ...props }) =>
{
    return (
        <div className="relative">
            <select
                className={ cn(
                    'appearance-none h-8 w-full rounded-md border border-black/[0.06] bg-black/[0.04] pl-2.5 pr-8 text-xs text-black/85 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black/20',
                    className
                ) }
                { ...props }
            >
                { children }
            </select>
            <FaChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-black/40 pointer-events-none" />
        </div>
    );
};
