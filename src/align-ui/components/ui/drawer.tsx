import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

import { cn } from '../../utils/cn';
import * as AlignButton from './button';

// Tracks how many AlignDrawer.Root components are currently open. Used to set the
// CSS variable `--drawer-open` on <html>, which the toast stack consumes to slide
// out of the way of an open drawer instead of overlapping it.
let openDrawerCount = 0;

const updateDrawerOpenVar = () =>
{
    if(typeof document === 'undefined') return;
    document.documentElement.style.setProperty('--drawer-open', openDrawerCount > 0 ? '1' : '0');
}

const Root: React.FC<React.ComponentProps<typeof DialogPrimitive.Root>> = ({ open, defaultOpen, onOpenChange, ...rest }) =>
{
    const previousOpenRef = React.useRef<boolean>(false);

    React.useEffect(() => () =>
    {
        if(previousOpenRef.current)
        {
            openDrawerCount = Math.max(0, openDrawerCount - 1);
            updateDrawerOpenVar();
            previousOpenRef.current = false;
        }
    }, []);

    const handleOpenChange = React.useCallback((next: boolean) =>
    {
        if(next !== previousOpenRef.current)
        {
            openDrawerCount = Math.max(0, openDrawerCount + (next ? 1 : -1));
            previousOpenRef.current = next;
            updateDrawerOpenVar();
        }
        onOpenChange?.(next);
    }, [ onOpenChange ]);

    // Wenn `open` als Prop kontrolliert ist, müssen wir die Counter selbst tracken
    React.useEffect(() =>
    {
        if(open === undefined) return;
        if(open !== previousOpenRef.current)
        {
            openDrawerCount = Math.max(0, openDrawerCount + (open ? 1 : -1));
            previousOpenRef.current = open;
            updateDrawerOpenVar();
        }
    }, [ open ]);

    return <DialogPrimitive.Root open={ open } defaultOpen={ defaultOpen } onOpenChange={ handleOpenChange } { ...rest } />;
}
Root.displayName = 'AlignDrawerRoot';

const Trigger = DialogPrimitive.Trigger;
const Portal = DialogPrimitive.Portal;
const Close = DialogPrimitive.Close;

const Overlay = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Overlay>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Overlay
        ref={ ref }
        className={ cn(
            'fixed inset-0 z-[78] overflow-hidden bg-transparent',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            className,
        ) }
        { ...props }
    />
));
Overlay.displayName = DialogPrimitive.Overlay.displayName;

type ContentProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    overlayClassName?: string;
};

const Content = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Content>,
    ContentProps
>(({ className, overlayClassName, children, ...props }, ref) => (
    <Portal>
        <Overlay className={ overlayClassName } />
        <DialogPrimitive.Content
            ref={ ref }
            className={ cn(
                'fixed bottom-3 right-3 top-[calc(var(--topbar-height,60px)+24px)] z-[79]',
                'flex max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-20 bg-bg-white-0 text-text-strong-950 outline-none shadow-custom-md',
                'data-[state=open]:duration-200 data-[state=open]:ease-out data-[state=open]:animate-in data-[state=open]:slide-in-from-right-full',
                'data-[state=closed]:duration-200 data-[state=closed]:ease-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right-full',
                className,
            ) }
            { ...props }
        >
            { children }
        </DialogPrimitive.Content>
    </Portal>
));
Content.displayName = DialogPrimitive.Content.displayName;

const Header = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ ref }
            className={ cn('flex shrink-0 flex-col gap-1 p-5', className) }
            { ...props }
        />
    ),
);
Header.displayName = 'AlignDrawerHeader';

const Body = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ ref }
            className={ cn('min-h-0 flex-1 overflow-y-auto', className) }
            { ...props }
        />
    ),
);
Body.displayName = 'AlignDrawerBody';

const Footer = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ ref }
            className={ cn('flex shrink-0 gap-3 p-5', className) }
            { ...props }
        />
    ),
);
Footer.displayName = 'AlignDrawerFooter';

const Title = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Title>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Title
        ref={ ref }
        className={ cn('text-label-lg text-text-strong-950', className) }
        { ...props }
    />
));
Title.displayName = DialogPrimitive.Title.displayName;

const Description = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Description>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Description
        ref={ ref }
        className={ cn('text-paragraph-sm text-text-sub-600', className) }
        { ...props }
    />
));
Description.displayName = DialogPrimitive.Description.displayName;

function CloseButton({ className, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Close>) {
    return (
        <DialogPrimitive.Close asChild { ...props }>
            <AlignButton.Root
                type="button"
                variant="neutral"
                mode="ghost"
                size="xxsmall"
                className={ cn('size-8 px-0', className) }
            >
                <AlignButton.Icon as={ X } className="size-4" />
            </AlignButton.Root>
        </DialogPrimitive.Close>
    );
}

export {
    Root,
    Trigger,
    Portal,
    Overlay,
    Close,
    Content,
    Header,
    Body,
    Footer,
    Title,
    Description,
    CloseButton,
};
