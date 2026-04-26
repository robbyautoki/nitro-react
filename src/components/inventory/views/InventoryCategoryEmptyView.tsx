import { ComponentType, FC, HTMLAttributes, ReactNode } from 'react';
import { Package } from 'lucide-react';
import * as AlignButton from '@/align-ui/components/ui/button';
import { cn } from '@/align-ui/utils/cn';

export interface InventoryCategoryEmptyViewProps extends HTMLAttributes<HTMLDivElement>
{
    title: string;
    desc: string;
    icon?: ComponentType<{ className?: string }>;
    cta?: { label: string; onClick: () => void };
    showImage?: boolean;
    children?: ReactNode;
}

export const InventoryCategoryEmptyView: FC<InventoryCategoryEmptyViewProps> = props =>
{
    const { title = '', desc = '', icon: Icon = Package, cta = null, showImage = false, children = null, className, ...rest } = props;

    return (
        <div
            className={ cn('flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center', className) }
            { ...rest }
        >
            { showImage
                ? <div className="empty-image opacity-70" />
                : <Icon className="size-12 text-text-soft-400" /> }
            <div className="flex flex-col gap-1">
                <span className="text-label-md font-medium text-text-strong-950">{ title }</span>
                { desc && <span className="text-paragraph-sm text-text-sub-600">{ desc }</span> }
            </div>
            { cta && (
                <AlignButton.Root type="button" variant="neutral" mode="stroke" size="xsmall" onClick={ cta.onClick }>
                    { cta.label }
                </AlignButton.Root>
            ) }
            { children }
        </div>
    );
}
