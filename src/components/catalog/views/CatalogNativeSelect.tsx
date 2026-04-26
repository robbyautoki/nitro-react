import { FC, SelectHTMLAttributes } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { cn } from '../../../lib/utils';

export const CatalogNativeSelect: FC<SelectHTMLAttributes<HTMLSelectElement>> = ({ className, children, ...props }) =>
{
    return (
        <div className="relative">
            <select
                className={ cn(
                    'h-8 w-full appearance-none rounded-lg bg-bg-weak-50 pl-2.5 pr-8 text-paragraph-xs text-text-strong-950 outline-none ring-1 ring-inset ring-stroke-soft-200 transition focus-visible:shadow-button-important-focus',
                    className
                ) }
                { ...props }
            >
                { children }
            </select>
            <FaChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-subheading-2xs text-text-soft-400" />
        </div>
    );
};
