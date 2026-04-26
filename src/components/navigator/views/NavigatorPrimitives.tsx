import { ButtonHTMLAttributes, ComponentType, HTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import * as AlignInput from '@/align-ui/components/ui/input';
import * as AlignTextarea from '@/align-ui/components/ui/textarea';
import { cn } from '@/align-ui/utils/cn';

export function NavigatorPanelStack({ className, ...props }: HTMLAttributes<HTMLDivElement>)
{
    return <div className={ cn('flex w-full flex-col gap-2', className) } { ...props } />;
}

export function NavigatorPanel({ className, ...props }: HTMLAttributes<HTMLDivElement>)
{
    return (
        <div
            className={ cn(
                'rounded-xl bg-bg-white-0 p-3 text-text-strong-950 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200',
                className
            ) }
            { ...props }
        />
    );
}

export function NavigatorScrollViewport({ className, ...props }: HTMLAttributes<HTMLDivElement>)
{
    return <div className={ cn('min-h-0 overflow-y-auto', className) } { ...props } />;
}

interface NavigatorTextInputProps extends InputHTMLAttributes<HTMLInputElement>
{
    icon?: ComponentType<{ className?: string }>;
    rootClassName?: string;
    wrapperClassName?: string;
}

export function NavigatorTextInput({ icon: Icon, rootClassName, wrapperClassName, className, ...props }: NavigatorTextInputProps)
{
    return (
        <AlignInput.Root size="xsmall" className={ rootClassName }>
            <AlignInput.Wrapper className={ cn('h-8', wrapperClassName) }>
                { Icon && <AlignInput.Icon as={ Icon } className="size-3.5" /> }
                <AlignInput.Input className={ cn('h-8 text-paragraph-xs', className) } { ...props } />
            </AlignInput.Wrapper>
        </AlignInput.Root>
    );
}

export function NavigatorTextarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>)
{
    return <AlignTextarea.Root simple className={ cn('text-paragraph-xs', className) } { ...props } />;
}

interface NavigatorTabButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>
{
    active?: boolean;
    children: ReactNode;
}

export function NavigatorTabButton({ active = false, className, children, ...props }: NavigatorTabButtonProps)
{
    return (
        <button
            type="button"
            className={ cn(
                'inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg px-2.5 text-label-xs transition duration-200 ease-out',
                active
                    ? 'bg-primary-base text-static-white shadow-regular-xs'
                    : 'text-text-sub-600 hover:bg-bg-weak-50 hover:text-text-strong-950',
                className
            ) }
            { ...props }
        >
            { children }
        </button>
    );
}
