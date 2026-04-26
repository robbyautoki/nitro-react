import * as React from 'react';
import { cn } from '../../utils/cn';
import * as Divider from './divider';

export const Root = React.forwardRef<HTMLTableElement, React.TableHTMLAttributes<HTMLTableElement>>(({ className, ...props }, ref) => (
    <div className={ cn('w-full overflow-x-auto', className) }>
        <table ref={ ref } className="w-full" { ...props } />
    </div>
));
Root.displayName = 'AlignTableRoot';

export const Header = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>((props, ref) => (
    <thead ref={ ref } { ...props } />
));
Header.displayName = 'AlignTableHeader';

export const Head = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(({ className, ...props }, ref) => (
    <th
        ref={ ref }
        className={ cn('bg-bg-weak-50 px-3 py-2 text-left text-paragraph-sm text-text-sub-600 first:rounded-l-lg last:rounded-r-lg', className) }
        { ...props }
    />
));
Head.displayName = 'AlignTableHead';

export const Body = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement> & { spacing?: number }>(({ spacing = 8, ...props }, ref) => (
    <>
        <tbody aria-hidden="true" className="table-row" style={ { height: spacing } } />
        <tbody ref={ ref } { ...props } />
    </>
));
Body.displayName = 'AlignTableBody';

export const Row = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(({ className, ...props }, ref) => (
    <tr ref={ ref } className={ cn('group/row', className) } { ...props } />
));
Row.displayName = 'AlignTableRow';

export function RowDivider({ className, dividerClassName, ...props }: React.ComponentPropsWithoutRef<typeof Divider.Root> & { dividerClassName?: string })
{
    return (
        <tr aria-hidden="true" className={ className }>
            <td colSpan={ 999 } className="py-1">
                <Divider.Root className={ dividerClassName } { ...props } />
            </td>
        </tr>
    );
}

export const Cell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(({ className, ...props }, ref) => (
    <td
        ref={ ref }
        className={ cn('h-16 px-3 transition duration-200 ease-out first:rounded-l-xl last:rounded-r-xl group-hover/row:bg-bg-weak-50', className) }
        { ...props }
    />
));
Cell.displayName = 'AlignTableCell';

export const Caption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(({ className, ...props }, ref) => (
    <caption ref={ ref } className={ cn('mt-4 text-paragraph-sm text-text-sub-600', className) } { ...props } />
));
Caption.displayName = 'AlignTableCaption';
