import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

const Tabs = TabsPrimitive.Root;

// ─── Default (Pill) Style ────────────────────────────────────────────────────

const TabsList = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.List>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
    <TabsPrimitive.List
        ref={ ref }
        className={ cn(
            'inline-flex h-9 items-center justify-center rounded-lg bg-white/[0.06] p-1 text-white/50',
            className
        ) }
        { ...props }
    />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
    <TabsPrimitive.Trigger
        ref={ ref }
        className={ cn(
            'appearance-none border-0 bg-transparent inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-transparent transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow',
            className
        ) }
        { ...props }
    />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
    <TabsPrimitive.Content
        ref={ ref }
        className={ cn(
            'mt-2 ring-offset-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2',
            className
        ) }
        { ...props }
    />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

// ─── Underline Style ─────────────────────────────────────────────────────────

const TabsListUnderline = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.List>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
    <TabsPrimitive.List
        ref={ ref }
        className={ cn(
            'w-full inline-flex items-center justify-start gap-0 roundehidden border-b border-white/10 bg-transparent px-10 h-auto py-0',
            className
        ) }
        { ...props }
    />
));
TabsListUnderline.displayName = 'TabsListUnderline';

const TabsTriggerUnderline = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
    <TabsPrimitive.Trigger
        ref={ ref }
        className={ cn(
            'appearance-none border-0 border-b-2 border-transparent bg-transparent inline-flex items-center justify-center gap-1.5 whitespace-nowrap roundehidden px-4 py-2.5 text-xs font-medium text-white/50 transition-colors hover:text-white focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-white data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:font-semibold',
            className
        ) }
        { ...props }
    />
));
TabsTriggerUnderline.displayName = 'TabsTriggerUnderline';

export {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
    TabsListUnderline,
    TabsTriggerUnderline,
};
