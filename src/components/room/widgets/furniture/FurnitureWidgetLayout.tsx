import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { AlignGameWindow } from '../../../align-game-ui/AlignGameWindow';
import { cn } from '@/align-ui/utils/cn';

interface FurnitureWidgetWindowProps
{
    uniqueKey?: string;
    title: ReactNode;
    subtitle?: ReactNode;
    icon?: LucideIcon;
    onClose?: () => void;
    children: ReactNode;
    footer?: ReactNode;
    widthClassName?: string;
    bodyClassName?: string;
    className?: string;
}

export function FurnitureWidgetWindow({
    uniqueKey,
    title,
    subtitle,
    icon: Icon,
    onClose,
    children,
    footer,
    widthClassName = 'w-[420px]',
    bodyClassName,
    className,
}: FurnitureWidgetWindowProps)
{
    return (
        <AlignGameWindow
            uniqueKey={ uniqueKey }
            title={ title }
            subtitle={ subtitle }
            icon={ Icon ? <Icon className="size-4" /> : undefined }
            onClose={ onClose }
            footer={ footer }
            widthClassName={ widthClassName }
            bodyClassName={ cn(bodyClassName ?? 'space-y-4') }
            className={ className }
        >
            { children }
        </AlignGameWindow>
    );
}

export function FurnitureWidgetSection({ title, children, className }: { title?: ReactNode; children: ReactNode; className?: string })
{
    return (
        <section className={ cn('rounded-xl border border-stroke-soft-200 bg-bg-white-0 p-3 shadow-regular-xs', className) }>
            { title && <div className="mb-2 text-subheading-xs uppercase tracking-normal text-text-soft-400">{ title }</div> }
            { children }
        </section>
    );
}

export function FurnitureWidgetPreview({ children, className }: { children: ReactNode; className?: string })
{
    return (
        <div className={ cn('flex shrink-0 items-center justify-center rounded-xl bg-bg-weak-50 p-3 ring-1 ring-inset ring-stroke-soft-200', className) }>
            { children }
        </div>
    );
}

export function FurnitureWidgetText({ children, className }: { children: ReactNode; className?: string })
{
    return <p className={ cn('text-paragraph-sm text-text-sub-600', className) }>{ children }</p>;
}

export function FurnitureWidgetActions({ children, className }: { children: ReactNode; className?: string })
{
    return <div className={ cn(className ? 'gap-2' : 'flex items-center justify-end gap-2', className) }>{ children }</div>;
}
